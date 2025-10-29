import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';

/**
 * Customer Travel Booking Page - Book Travel Packages with Agencies
 * 
 * Learning Concepts:
 * 1. Dynamic routing with useParams
 * 2. Form handling for travel package booking
 * 3. API integration for travel agency details and packages
 * 4. Date selection and traveler information UI
 * 5. Promo code integration and discount calculation
 * 6. Real-time pricing and availability checking
 */

const BookingPage = () => {
  const params = useParams();
  const agencyId = params.agencyId || params.businessId; // Support both route patterns
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedPackageId = searchParams.get('package');
  
  const [agency, setAgency] = useState(null);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [booking, setBooking] = useState(false);

  const [bookingData, setBookingData] = useState({
    packageId: '',
    departureDate: '',
    numberOfTravelers: 1,
    travelers: [{ name: '', age: '', passportNumber: '' }],
    promoCode: '',
    customerNotes: ''
  });

  const [validationErrors, setValidationErrors] = useState({});
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [promoCodeStatus, setPromoCodeStatus] = useState('');
  const [subtotal, setSubtotal] = useState(0);

  /**
   * Load travel agency details and packages
   */
  useEffect(() => {
    const loadAgencyDetails = async () => {
      if (!agencyId) return;

      setIsLoading(true);
      setError(null);

      try {
        
        const response = await axiosInstance.get(`/customers/agencies/${agencyId}`);
        
        if (response.data.success) {
          setAgency(response.data.agency || response.data.business);
          const loadedPackages = response.data.packages || response.data.services;
          setPackages(loadedPackages);
          
          // Pre-select package if specified in URL
          if (preSelectedPackageId && loadedPackages.some(p => p._id === preSelectedPackageId)) {
            setBookingData(prev => ({
              ...prev,
              packageId: preSelectedPackageId
            }));
          }
          
        } else {
          throw new Error(response.data.message || 'Travel agency not found');
        }
      } catch (error) {
        console.error('❌ Error loading travel agency details:', error);
        setError(error.response?.data?.message || 'Failed to load travel agency details');
      } finally {
        setIsLoading(false);
      }
    };

    loadAgencyDetails();
  }, [agencyId]);

  /**
   * Handle booking form changes
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setBookingData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear validation error when user starts typing
    if (validationErrors[name]) {
      setValidationErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  /**
   * Handle traveler info changes
   */
  const handleTravelerChange = (index, field, value) => {
    const updatedTravelers = [...bookingData.travelers];
    updatedTravelers[index] = {
      ...updatedTravelers[index],
      [field]: value
    };
    setBookingData(prev => ({
      ...prev,
      travelers: updatedTravelers
    }));
  };

  /**
   * Add/remove travelers
   */
  const updateTravelerCount = (count) => {
    const newCount = Math.max(1, Math.min(10, count)); // Limit 1-10 travelers
    const currentTravelers = [...bookingData.travelers];
    
    if (newCount > currentTravelers.length) {
      // Add new traveler slots
      for (let i = currentTravelers.length; i < newCount; i++) {
        currentTravelers.push({ name: '', age: '', passportNumber: '' });
      }
    } else {
      // Remove extra travelers
      currentTravelers.splice(newCount);
    }

    setBookingData(prev => ({
      ...prev,
      numberOfTravelers: newCount,
      travelers: currentTravelers
    }));
  };

  /**
   * Validate promo code
   */
  const validatePromoCode = async (code) => {
    if (!code.trim()) {
      setPromoDiscount(0);
      setPromoCodeStatus('');
      return;
    }

    if (!bookingData.packageId) {
      setPromoCodeStatus('Please select a package first');
      return;
    }

    try {
      // Find the selected package
      const selectedPackage = packages.find(p => p._id === bookingData.packageId);
      
      if (!selectedPackage) {
        setPromoCodeStatus('Package not found');
        return;
      }

      // Check if the package has promo code enabled and matches
      if (selectedPackage.promoCodeActive && 
          selectedPackage.promoCode && 
          selectedPackage.promoCode.toUpperCase() === code.trim().toUpperCase()) {
        
        const discountAmount = (subtotal * selectedPackage.promoDiscount) / 100;
        setPromoDiscount(discountAmount);
        setPromoCodeStatus('valid');
      } else {
        setPromoDiscount(0);
        setPromoCodeStatus('invalid');
      }
    } catch (error) {
      console.error('Error validating promo code:', error);
      setPromoDiscount(0);
      setPromoCodeStatus('invalid');
    }
  };

  /**
   * Calculate pricing
   */
  useEffect(() => {
    const selectedPackage = packages.find(p => p._id === bookingData.packageId);
    if (selectedPackage) {
      const basePrice = selectedPackage.price || 0;
      const newSubtotal = basePrice * bookingData.numberOfTravelers;
      setSubtotal(newSubtotal);
      
      // Re-validate promo code if active
      if (bookingData.promoCode && promoCodeStatus === 'valid') {
        validatePromoCode(bookingData.promoCode);
      }
    }
  }, [bookingData.packageId, bookingData.numberOfTravelers, packages]);

  /**
   * Validate booking form
   */
  const validateBooking = () => {
    const errors = {};

    if (!bookingData.packageId) {
      errors.packageId = 'Please select a travel package';
    }

    if (!bookingData.departureDate) {
      errors.departureDate = 'Please select a departure date';
    } else {
      const selectedDate = new Date(bookingData.departureDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        errors.departureDate = 'Please select a future date';
      }
    }

    // Validate traveler information
    bookingData.travelers.forEach((traveler, index) => {
      if (!traveler.name.trim()) {
        errors[`traveler_${index}_name`] = 'Traveler name is required';
      }
      if (!traveler.age || traveler.age < 1 || traveler.age > 120) {
        errors[`traveler_${index}_age`] = 'Valid age is required';
      }
    });

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Submit travel booking
   */
  const handleBooking = async (e) => {
    e.preventDefault();

    if (!validateBooking()) {
      return;
    }

    setBooking(true);
    setError(null);

    try {
      
      const totalAmount = subtotal - promoDiscount;
      
      const response = await axiosInstance.post('/customers/travel-bookings', {
        agencyId: agencyId,
        packageId: bookingData.packageId,
        departureDate: bookingData.departureDate,
        numberOfTravelers: bookingData.numberOfTravelers,
        travelers: bookingData.travelers,
        promoCode: bookingData.promoCode,
        customerNotes: bookingData.customerNotes,
        subtotal,
        discount: promoDiscount,
        totalAmount
      });

      if (response.data.success) {
        navigate('/customer/bookings', { 
          state: { message: 'Travel package booked successfully!' }
        });
      } else {
        throw new Error(response.data.message || 'Failed to book travel package');
      }
    } catch (error) {
      console.error('❌ Error booking travel package:', error);
      setError(error.response?.data?.message || 'Failed to book travel package. Please try again.');
    } finally {
      setBooking(false);
    }
  };

  /**
   * Get minimum departure date (tomorrow)
   */
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading travel agency details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error && !agency) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Travel Agency Not Found</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/customer/browse')}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Travel Agencies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate(-1)}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          ← Back
        </button>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Book Travel Package
        </h1>
        <p className="text-xl text-gray-600">
          Book your travel package with {agency?.agencyName || agency?.name}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Travel Agency Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 sticky top-8">
            <div className="text-center mb-6">
              <div className="w-24 h-24 mx-auto mb-4 rounded-lg bg-gray-200 flex items-center justify-center">
                {agency?.imageUrl ? (
                  <img
                    src={agency.imageUrl}
                    alt={agency.agencyName || agency.name}
                    className="w-24 h-24 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-4xl">✈️</span>
                )}
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {agency?.agencyName || agency?.name}
              </h3>
              <p className="text-blue-600 mb-2">{agency?.category}</p>
              <div className="flex items-center justify-center text-yellow-500 mb-4">
                <span className="text-sm font-medium">
                  {agency?.stats?.averageRating ? agency.stats.averageRating.toFixed(1) : 'New'}
                </span>
                <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span className="text-gray-600 text-sm ml-1">
                  ({agency?.stats?.totalReviews || 0})
                </span>
              </div>
            </div>

            <div className="text-sm text-gray-600 space-y-2">
              <p><strong>Address:</strong></p>
              <p>{agency?.address?.street}</p>
              <p>{agency?.address?.city}, {agency?.address?.state} {agency?.address?.zipCode}</p>
              
              {agency?.phone && (
                <p className="mt-4"><strong>Phone:</strong> {agency.phone}</p>
              )}
              
              {agency?.website && (
                <p><strong>Website:</strong> 
                  <a href={agency.website} target="_blank" rel="noopener noreferrer" 
                     className="text-blue-600 hover:underline ml-1">
                    Visit
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Booking Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-8">
            <form onSubmit={handleBooking} className="space-y-6">
              {/* Package Selection */}
              <div>
                <label htmlFor="packageId" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Travel Package <span className="text-red-500">*</span>
                </label>
                <select
                  id="packageId"
                  name="packageId"
                  value={bookingData.packageId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.packageId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Choose a travel package...</option>
                  {packages.map(pkg => (
                    <option key={pkg._id} value={pkg._id}>
                      {pkg.packageName || pkg.name} - {pkg.destination} - {pkg.durationDays} days - ${pkg.price}
                    </option>
                  ))}
                </select>
                {validationErrors.packageId && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.packageId}</p>
                )}
                
                {/* Package Details Preview */}
                {bookingData.packageId && packages.find(p => p._id === bookingData.packageId) && (
                  <div className="mt-3 space-y-3">
                    <div className="p-3 bg-blue-50 rounded-lg text-sm">
                      <p className="font-medium text-blue-900">Package Highlights:</p>
                      <p className="text-blue-700">
                        📍 {packages.find(p => p._id === bookingData.packageId).destination}
                      </p>
                      <p className="text-blue-700">
                        📅 {packages.find(p => p._id === bookingData.packageId).durationDays} days / {packages.find(p => p._id === bookingData.packageId).durationDays - 1} nights
                      </p>
                    </div>
                    
                    {/* Promo Code Available */}
                    {(() => {
                      const selectedPackage = packages.find(p => p._id === bookingData.packageId);
                      return selectedPackage?.promoCodeActive && selectedPackage?.promoCode ? (
                        <div className="p-3 bg-green-50 rounded-lg text-sm border border-green-200">
                          <p className="font-medium text-green-900 flex items-center">
                            🎯 Special Offer Available!
                          </p>
                          <p className="text-green-700 mt-1">
                            Use promo code <strong>{selectedPackage.promoCode}</strong> to get {selectedPackage.promoDiscount}% off this package!
                          </p>
                        </div>
                      ) : null;
                    })()}
                  </div>
                )}
              </div>

              {/* Date Selection */}
              <div>
                <label htmlFor="departureDate" className="block text-sm font-medium text-gray-700 mb-2">
                  Departure Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  id="departureDate"
                  name="departureDate"
                  value={bookingData.departureDate}
                  onChange={handleInputChange}
                  min={getMinDate()}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    validationErrors.departureDate ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {validationErrors.departureDate && (
                  <p className="mt-1 text-sm text-red-600">{validationErrors.departureDate}</p>
                )}
              </div>

              {/* Number of Travelers */}
              <div>
                <label htmlFor="numberOfTravelers" className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Travelers <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => updateTravelerCount(bookingData.numberOfTravelers - 1)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    id="numberOfTravelers"
                    name="numberOfTravelers"
                    value={bookingData.numberOfTravelers}
                    onChange={(e) => updateTravelerCount(parseInt(e.target.value) || 1)}
                    min="1"
                    max="10"
                    className="w-20 px-3 py-2 border border-gray-300 rounded-lg text-center focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => updateTravelerCount(bookingData.numberOfTravelers + 1)}
                    className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    +
                  </button>
                  <span className="text-sm text-gray-600">travelers</span>
                </div>
              </div>

              {/* Traveler Information */}
              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Traveler Information</h4>
                {bookingData.travelers.map((traveler, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                    <h5 className="font-medium text-sm text-gray-700">Traveler {index + 1}</h5>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={traveler.name}
                        onChange={(e) => handleTravelerChange(index, 'name', e.target.value)}
                        placeholder="Enter full name"
                        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                          validationErrors[`traveler_${index}_name`] ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {validationErrors[`traveler_${index}_name`] && (
                        <p className="mt-1 text-sm text-red-600">{validationErrors[`traveler_${index}_name`]}</p>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Age <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          value={traveler.age}
                          onChange={(e) => handleTravelerChange(index, 'age', e.target.value)}
                          placeholder="Age"
                          min="1"
                          max="120"
                          className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                            validationErrors[`traveler_${index}_age`] ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {validationErrors[`traveler_${index}_age`] && (
                          <p className="mt-1 text-sm text-red-600">{validationErrors[`traveler_${index}_age`]}</p>
                        )}
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Passport Number
                        </label>
                        <input
                          type="text"
                          value={traveler.passportNumber}
                          onChange={(e) => handleTravelerChange(index, 'passportNumber', e.target.value)}
                          placeholder="Optional"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div>
                <label htmlFor="promoCode" className="block text-sm font-medium text-gray-700 mb-2">
                  Promo Code (Optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    id="promoCode"
                    name="promoCode"
                    value={bookingData.promoCode}
                    onChange={handleInputChange}
                    onBlur={() => validatePromoCode(bookingData.promoCode)}
                    placeholder="Enter promo code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => validatePromoCode(bookingData.promoCode)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Apply
                  </button>
                </div>
                {promoCodeStatus === 'valid' && (
                  <p className="mt-2 text-sm text-green-600 flex items-center">
                    ✓ Promo code applied! You save ${promoDiscount.toFixed(2)}
                  </p>
                )}
                {promoCodeStatus === 'invalid' && (
                  <p className="mt-2 text-sm text-red-600">
                    ✗ Invalid or expired promo code
                  </p>
                )}
              </div>

              {/* Price Summary */}
              {bookingData.packageId && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-gray-900 mb-3">Price Summary</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Package Price per Person:</span>
                      <span>${packages.find(p => p._id === bookingData.packageId)?.price || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Number of Travelers:</span>
                      <span>×{bookingData.numberOfTravelers}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>${subtotal.toFixed(2)}</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>Discount:</span>
                        <span>-${promoDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="border-t border-gray-300 pt-2 flex justify-between text-lg font-bold text-blue-600">
                      <span>Total Amount:</span>
                      <span>${(subtotal - promoDiscount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Notes */}
              <div>
                <label htmlFor="customerNotes" className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  id="customerNotes"
                  name="customerNotes"
                  value={bookingData.customerNotes}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Dietary restrictions, room preferences, special occasions, etc..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={booking}
                  className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
                >
                  {booking ? 'Booking Travel Package...' : 'Confirm Booking & Pay'}
                </button>
                <p className="mt-2 text-xs text-center text-gray-500">
                  By clicking confirm, you agree to our terms and conditions
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';



const MyBookings = () => {
  const [travelBookings, setTravelBookings] = useState([]);
  const [filter, setFilter] = useState('all'); // all, upcoming, past, cancelled
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [cancelling, setCancelling] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);



  // Format price in Indian Rupees
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(price);
  };

  // Format date to Indian format
  const formatDate = (dateString) => {
    const options = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      timeZone: 'Asia/Kolkata'
    };
    return new Date(dateString).toLocaleDateString('en-IN', options);
  };

  // Get status badge color
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  /**
   * Load travel bookings from API
   */
  const loadTravelBookings = async () => {
    setIsLoading(true);
    setError(null);

    try {

      
      const params = new URLSearchParams();
      if (filter !== 'all') {
        if (filter === 'upcoming') {
          params.append('upcoming', 'true');
        } else {
          params.append('status', filter);
        }
      }

      const response = await axiosInstance.get(`/customers/bookings?${params.toString()}`);
      
      if (response.data.success) {
        const bookings = response.data.bookings || response.data.appointments || [];

        // Process bookings without making additional API calls
        const processedBookings = bookings.map((booking) => {
          // Use existing service data from booking
          const serviceData = booking.serviceId || booking.service || {};
          // Use existing business data from booking
          const businessData = booking.businessId || booking.business || {};

          // Normalize service data structure
          const normalizedService = {
            _id: serviceData._id || serviceData.id,
            title: serviceData.title || serviceData.packageName || serviceData.name || "Travel Package",
            packageName: serviceData.packageName || serviceData.title || serviceData.name || "Travel Package",
            destination: serviceData.destination || "Not specified",
            category: serviceData.category || "Travel",
            price: serviceData.price || booking.totalPrice || 0,
            duration: serviceData.duration || serviceData.durationDays,
            durationDays: serviceData.durationDays || serviceData.duration,
            difficulty: serviceData.difficulty || "Not specified",
            maxGroupSize: serviceData.maxGroupSize,
            description: serviceData.description || "",
            images: Array.isArray(serviceData.images) && serviceData.images.length > 0
              ? serviceData.images
              : (serviceData.imageUrl ? [serviceData.imageUrl] : []),
            inclusions: serviceData.inclusions || [],
            exclusions: serviceData.exclusions || []
          };

          // Normalize business/agency data structure
          const normalizedBusiness = {
            _id: businessData._id || businessData.id,
            agencyName: businessData.agencyName || businessData.businessName || businessData.name || "Travel Agency",
            name: businessData.name || businessData.agencyName || businessData.businessName || "Travel Agency",
            imageUrl: businessData.imageUrl || (businessData.images && businessData.images[0]) || "",
            location: businessData.location || (businessData.address && (businessData.address.city || businessData.address.street)) || "",
          };

          return {
            ...booking,
            service: normalizedService,
            serviceId: normalizedService,
            business: normalizedBusiness,
            businessId: normalizedBusiness
          };
        });
        
      
        setTravelBookings(processedBookings);
      } else {
        throw new Error(response.data.message || 'Failed to load travel bookings');
      }
    } catch (error) {
      console.error('❌ Error loading travel bookings:', error);
      setError(error.response?.data?.message || 'Failed to load travel bookings. Please try again.');
      setTravelBookings([]);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    loadTravelBookings();
  }, [filter]);

  /**
   * Filter bookings based on selected filter
   */
  const filteredTravelBookings = travelBookings.filter(booking => {
    if (filter === 'all') return true;
    
    const appointmentDate = new Date(booking.appointmentDate);
    const today = new Date();
    
    switch (filter) {
      case 'upcoming':
        return appointmentDate >= today && booking.status !== 'cancelled' && booking.status !== 'completed';
      case 'past':
        return appointmentDate < today || booking.status === 'completed';
      case 'cancelled':
        return booking.status === 'cancelled';
      default:
        return booking.status === filter;
    }
  });

  const renderBookingCard = (booking) => {
    const service = booking.service || {};
    const agency = booking.business || {};

    return (
      <div key={booking._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image Section */}
        <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 relative">
          {service.images?.[0] ? (
            <img 
              src={service.images[0]} 
              alt={service.packageName || service.name} 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <i className="fas fa-plane text-4xl text-blue-500" />
            </div>
          )}
          <div className={`absolute top-2 right-2 ${getStatusColor(booking.status)} px-3 py-1 rounded-full text-sm font-medium flex items-center gap-1`}>
            <i className={`fas fa-${booking.status === 'confirmed' ? 'check-circle' : booking.status === 'cancelled' ? 'times-circle' : booking.status === 'completed' ? 'check-double' : 'clock'}`} />
            <span>{booking.status}</span>
          </div>
        </div>

        {/* Agency Info */}
        <div className="p-4 border-b bg-gray-50">
          <div className="flex items-center gap-3">
            {agency.imageUrl ? (
              <img 
                src={agency.imageUrl} 
                alt={agency.name} 
                className="w-10 h-10 rounded-full object-cover"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <i className="fas fa-building text-blue-500" />
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900">
                {booking.businessId?.name || booking.businessId?.businessName || booking.businessId?.agencyName || agency.agencyName || agency.name || "Travel Agency"}
              </h4>
              <p className="text-sm text-gray-600">
                {booking.businessId?.address?.city || booking.businessId?.address?.street || booking.businessId?.location || agency.location || "Location not specified"}
              </p>
            </div>
          </div>
        </div>

        {/* Content Section */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                {service.title || service.packageName || service.name || booking.serviceId?.title || "Travel Package"}
              </h3>
              <p className="text-sm text-gray-600">
                {service.category || booking.serviceId?.category || "Travel Package"}
              </p>
            </div>
            <div className="text-right">
              <div className="font-bold text-blue-600">
                {formatPrice(booking.serviceId?.price || service.price || booking.totalPrice || 0)}
              </div>
              <div className="text-sm text-gray-600">per person</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-start">
              <i className="fas fa-map-marker-alt w-5 mt-1 text-blue-500" />
              <div>
                <p className="font-medium">Destination</p>
                <p className="text-gray-600">
                  {service.destination || booking.serviceId?.destination || booking.destination || "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <i className="fas fa-clock w-5 mt-1 text-blue-500" />
              <div>
                <p className="font-medium">Duration</p>
                <p className="text-gray-600">
                  {service.duration || service.durationDays || booking.serviceId?.duration 
                    ? `${service.duration || service.durationDays || booking.serviceId?.duration} days` 
                    : "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <i className="fas fa-calendar w-5 mt-1 text-blue-500" />
              <div>
                <p className="font-medium">Travel Date</p>
                <p className="text-gray-600">
                  {booking.appointmentDate ? formatDate(booking.appointmentDate) : "Not specified"}
                </p>
              </div>
            </div>

            <div className="flex items-start">
              <i className="fas fa-users w-5 mt-1 text-blue-500" />
              <div>
                <p className="font-medium">Booking Details</p>
                <p className="text-gray-600">
                  {booking.numberOfTravelers || 1} traveler(s) • Total: {formatPrice(booking.totalPrice || ((booking.numberOfTravelers || 1) * (booking.serviceId?.price || service.price || 0)))}
                </p>
              </div>
            </div>

            
            

            {service.maxGroupSize && (
              <div className="flex items-start">
                <i className="fas fa-users w-5 mt-1 text-blue-500" />
                <div>
                  <p className="font-medium">Group Size</p>
                  <p className="text-gray-600">Max {service.maxGroupSize} people</p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="mt-6 flex gap-3">
            <button
              onClick={() => setSelectedBooking(booking)}
              className="flex-1 bg-yellow-400 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              <i className="fas fa-eye" />
              View Details
            </button>
            {booking.status !== 'cancelled' && booking.status !== 'completed' && (
              <button
                onClick={() => handleCancelBooking(booking._id)}
                disabled={cancelling === booking._id}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {cancelling === booking._id ? (
                  <>
                    <i className="fas fa-spinner fa-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <i className="fas fa-times" />
                    Cancel
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  /**
   * Handle booking cancellation: call API, update local state and show feedback.
   */
  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking? Please note that cancellation may be subject to cancellation policy.')) return;

    // Ask for cancellation reason
    const reason = prompt('Please provide a reason for cancellation:', 'Change of plans');
    if (!reason) return; // User clicked cancel on the prompt

    setCancelling(bookingId);
    try {
      const response = await axiosInstance.patch(`/customers/appointments/${bookingId}/cancel`, {
        reason: reason
      });
      if (response.data.success) {
        setTravelBookings(prev => 
          prev.map(b => b._id === bookingId ? { ...b, status: 'cancelled' } : b)
        );
        alert('Booking cancelled successfully');
      } else {
        throw new Error(response.data.message || 'Failed to cancel booking');
      }
    } catch (error) {
      console.error('Error cancelling booking:', error);
      alert(error.response?.data?.message || 'Failed to cancel booking. Please try again.');
    } finally {
      setCancelling(null);
    }
  };

  const LoadingSkeleton = () => (
    <div className="space-y-4">
      {[...Array(3)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gray-300 rounded-lg"></div>
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-1/2 mb-1"></div>
              <div className="h-3 bg-gray-300 rounded w-1/4"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          My Bookings 📅
        </h1>
        <p className="text-xl text-gray-600">
          Manage your travel bookings and view travel history.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'all', label: 'All Bookings', count: travelBookings.length },
            { key: 'upcoming', label: 'Upcoming', count: travelBookings.filter(b => {
              const departureDate = new Date(b.appointmentDate);
              const today = new Date();
              return departureDate >= today && b.status !== 'cancelled' && b.status !== 'completed';
            }).length },
            { key: 'past', label: 'Past', count: travelBookings.filter(b => {
              const departureDate = new Date(b.appointmentDate);
              const today = new Date();
              return departureDate < today || b.status === 'completed';
            }).length },
            { key: 'cancelled', label: 'Cancelled', count: travelBookings.filter(b => b.status === 'cancelled').length }
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === tab.key
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Bookings List */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : filteredTravelBookings.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📅</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No bookings found
          </h3>
          <p className="text-gray-600 mb-6">
            {filter === 'all' 
              ? "You haven't made any bookings yet."
              : `No ${filter} bookings to show.`
            }
          </p>
          <Link
            to="/customer/browse"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Travel Packages
          </Link>
        </div>
      ) : (
        <>
          {/* Error State */}
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              <div className="flex">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTravelBookings.map(booking => renderBookingCard(booking))}
          </div>
        </>
      )}

      {/* Quick Actions */}
      <div className="mt-8 bg-blue-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="flex flex-wrap gap-4">
          <Link
            to="/customer/browse"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book New Travel Package
          </Link>
        </div>
      </div>

      {/* Modal */}
      {selectedBooking && (

        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedBooking.service?.packageName || selectedBooking.service?.title || selectedBooking.service?.name || "Travel Package"}
                </h2>
                <button 
                  onClick={() => setSelectedBooking(null)} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              {/* Image Gallery */}
              {selectedBooking.service?.images?.length > 0 && (
                <div className="mb-6">
                  <div className="relative h-[400px] bg-gray-100 rounded-lg overflow-hidden mb-2">
                    <img 
                      src={selectedBooking.service.images[currentImageIndex]} 
                      alt={`Package ${currentImageIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {selectedBooking.service.images.length > 1 && (
                      <>
                        <button 
                          onClick={() => setCurrentImageIndex(prev => prev === 0 ? selectedBooking.service.images.length - 1 : prev - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white w-8 h-8 rounded-full flex items-center justify-center"
                        >
                          ←
                        </button>
                        <button 
                          onClick={() => setCurrentImageIndex(prev => prev === selectedBooking.service.images.length - 1 ? 0 : prev + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 text-white w-8 h-8 rounded-full flex items-center justify-center"
                        >
                          →
                        </button>
                      </>
                    )}
                  </div>
                  {selectedBooking.service.images.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto">
                      {selectedBooking.service.images.map((image, index) => (
                        <button 
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${index === currentImageIndex ? 'border-blue-500' : 'border-transparent'}`}
                        >
                          <img src={image} alt={`Thumbnail ${index + 1}`} className="w-full h-full object-cover" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Package Details */}
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-4 mb-4">
                      {selectedBooking.business?.imageUrl ? (
                        <img 
                          src={selectedBooking.business.imageUrl}
                          alt={selectedBooking.business.agencyName || selectedBooking.business.name}
                          className="w-16 h-16 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
                          <i className="fas fa-building text-2xl text-blue-500" />
                        </div>
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">
                          {selectedBooking.businessId?.name || selectedBooking.businessId?.businessName || selectedBooking.businessId?.agencyName || selectedBooking.business?.name || "Travel Agency"}
                        </h3>
                        <p className="text-gray-600">
                          <i className="fas fa-map-marker-alt mr-1" />
                          {selectedBooking.businessId?.address?.city || selectedBooking.businessId?.address?.street || selectedBooking.businessId?.location || selectedBooking.business?.location || "Location not specified"}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <i className="fas fa-info-circle text-blue-500" />
                      Package Details
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Status</span>
                        <span className={`${getStatusColor(selectedBooking.status)} px-2 py-1 rounded-full text-sm flex items-center gap-1`}>
                          <i className={`fas fa-${selectedBooking.status === 'confirmed' ? 'check-circle' : selectedBooking.status === 'cancelled' ? 'times-circle' : selectedBooking.status === 'completed' ? 'check-double' : 'clock'}`} />
                          {selectedBooking.status}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Package Name</span>
                        <span className="font-medium">{selectedBooking.service?.packageName || selectedBooking.service?.name || "Not specified"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Destination</span>
                        <span>{selectedBooking.service?.destination || "Not specified"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Duration</span>
                        <span>{selectedBooking.service?.durationDays ? `${selectedBooking.service.durationDays} days` : "Not specified"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Category</span>
                        <span>{selectedBooking.service?.category || "Not specified"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Difficulty</span>
                        <span>{selectedBooking.service?.difficulty || "Not specified"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Group Size</span>
                        <span>Max {selectedBooking.service?.maxGroupSize || "Not specified"} people</span>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.service?.description && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                        <i className="fas fa-align-left text-blue-500" />
                        Description
                      </h3>
                      <p className="text-gray-600">{selectedBooking.service.description}</p>
                    </div>
                  )}
                </div>

                {/* Booking Details & Lists */}
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                      <i className="fas fa-ticket-alt text-blue-500" />
                      Booking Details
                    </h3>
                    <div className="space-y-3 bg-gray-50 p-4 rounded-lg">
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Booking ID</span>
                        <span className="font-mono text-sm">{selectedBooking._id}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Travel Date</span>
                        <span> {selectedBooking.appointmentDate ? formatDate(selectedBooking.appointmentDate) : "Not specified"}</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Travelers</span>
                        <span>{selectedBooking.numberOfTravelers || 1} person(s)</span>
                      </div>
                      <div className="flex items-center">
                        <span className="w-32 text-gray-600">Price/Person</span>
                        <span>{formatPrice(selectedBooking.service?.price || 0)}</span>
                      </div>
                      <div className="flex items-center font-semibold">
                        <span className="w-32 text-gray-600">Total Cost</span>
                        <span className="text-blue-600">
                          {formatPrice((selectedBooking.numberOfTravelers || 1) * (selectedBooking.service?.price || 0))}
                        </span>
                      </div>
                    </div>
                  </div>

                  {selectedBooking.service?.inclusions?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">What's Included</h3>
                      <ul className="space-y-1">
                        {selectedBooking.service.inclusions.map((item, index) => (
                          <li key={index} className="flex items-center text-gray-600">
                            <span className="mr-2">✓</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedBooking.service?.exclusions?.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">What's Not Included</h3>
                      <ul className="space-y-1">
                        {selectedBooking.service.exclusions.map((item, index) => (
                          <li key={index} className="flex items-center text-gray-600">
                            <span className="mr-2">×</span> {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4 mt-8 pt-6 border-t">
                <button 
                  onClick={() => setSelectedBooking(null)}
                  className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Close
                </button>
                
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyBookings;
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axiosInstance from '../../axiosInstance';

/**
 * Customer Profile Page - Manage Personal Information and Preferences
 * 
 * Learning Concepts:
 * 1. Form State Management with Validation
 * 2. API Integration with Error Handling
 * 3. User Profile Integration
 * 4. Responsive Form Design
 * 5. Data Persistence Patterns
 */

const CustomerProfile = () => {
  const { user } = useUser();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States'
    },
    preferences: {
      emailNotifications: true,
      smsNotifications: false,
      marketingEmails: true,
      reminderTime: '24', // hours before appointment
      favoriteCategories: []
    },
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    },
    healthInfo: {
      allergies: '',
      medications: '',
      medicalConditions: ''
    },
    marketingPreferences: {
      emailOffers: true,
      smsOffers: false,
      newsletter: true
    }
  });

  const [errors, setErrors] = useState({});

  // Available travel categories for preferences
  const categories = [
    'Adventure Tours',
    'Beach Holidays',
    'City Breaks',
    'Cultural Tours',
    'Cruise Packages',
    'Mountain Expeditions',
    'Safari Tours',
    'Luxury Travel',
    'Budget Travel',
    'Family Packages',
    'Honeymoon Specials',
    'Business Travel'
  ];

  /**
   * Load customer profile data from API
   */
  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        console.log('🔄 Loading customer profile...');
        const response = await axiosInstance.get('/customers/profile');
        
        if (response.data.success && response.data.customer) {
          const customerData = response.data.customer;
          setProfileData({
            firstName: customerData.firstName || user.firstName || '',
            lastName: customerData.lastName || user.lastName || '',
            email: user.emailAddresses[0]?.emailAddress || '',
            phone: customerData.phone || '',
            dateOfBirth: customerData.dateOfBirth ? 
              new Date(customerData.dateOfBirth).toISOString().split('T')[0] : '',
            address: customerData.address || {
              street: '',
              city: '',
              state: '',
              zipCode: '',
              country: 'United States'
            },
            preferences: customerData.preferences || {
              emailNotifications: true,
              smsNotifications: false,
              marketingEmails: true,
              reminderTime: '24',
              favoriteCategories: []
            },
            emergencyContact: customerData.emergencyContact || {
              name: '',
              phone: '',
              relationship: ''
            },
            healthInfo: customerData.healthInfo || {
              allergies: '',
              medications: '',
              medicalConditions: ''
            },
            marketingPreferences: customerData.marketingPreferences || {
              emailOffers: true,
              smsOffers: false,
              newsletter: true
            }
          });
          console.log('✅ Profile loaded successfully');
        } else {
          // New customer - use Clerk data as defaults
          setProfileData(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.emailAddresses[0]?.emailAddress || ''
          }));
          console.log('ℹ️ New customer profile - using Clerk defaults');
        }
      } catch (error) {
        console.error('❌ Error loading profile:', error);
        setError('Failed to load profile data');
        // Use Clerk data as fallback
        setProfileData(prev => ({
          ...prev,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.emailAddresses[0]?.emailAddress || ''
        }));
      } finally {
        setIsLoading(false);
      }
    };

    loadProfile();
  }, [user]);

  /**
   * Form validation
   * 
   * Learning: Client-side validation patterns
   */
  const validateForm = () => {
    const newErrors = {};

    if (!profileData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!profileData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!profileData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(profileData.email)) {
      newErrors.email = 'Email format is invalid';
    }

    if (profileData.phone && !/^[\+]?[(]?[\d\s\-\(\)]{10,}$/.test(profileData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }

    if (profileData.dateOfBirth) {
      const birthDate = new Date(profileData.dateOfBirth);
      const today = new Date();
      const age = today.getFullYear() - birthDate.getFullYear();
      if (age < 13) {
        newErrors.dateOfBirth = 'Must be at least 13 years old';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  /**
   * Handle form input changes
   * 
   * Learning: Nested state updates
   */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setProfileData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent],
          [child]: type === 'checkbox' ? checked : value
        }
      }));
    } else {
      setProfileData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  /**
   * Handle category preferences
   */
  const handleCategoryToggle = (category) => {
    setProfileData(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        favoriteCategories: prev.preferences.favoriteCategories.includes(category)
          ? prev.preferences.favoriteCategories.filter(c => c !== category)
          : [...prev.preferences.favoriteCategories, category]
      }
    }));
  };

  /**
   * Save profile changes to API
   */
  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    setError(null);
    
    try {
      console.log('💾 Saving profile data...', profileData);
      
      const response = await axiosInstance.put('/customers/profile', {
        firstName: profileData.firstName,
        lastName: profileData.lastName,
        phone: profileData.phone,
        dateOfBirth: profileData.dateOfBirth || null,
        address: profileData.address,
        preferences: profileData.preferences,
        emergencyContact: profileData.emergencyContact,
        healthInfo: profileData.healthInfo,
        marketingPreferences: profileData.marketingPreferences
      });
      
      if (response.data.success) {
        console.log('✅ Profile saved successfully');
        setIsEditing(false);
        // Update local state with server response
        const updatedCustomer = response.data.customer;
        setProfileData(prev => ({
          ...prev,
          ...updatedCustomer,
          email: user.emailAddresses[0]?.emailAddress || prev.email
        }));
        // TODO: Show success toast notification
      } else {
        throw new Error(response.data.message || 'Failed to save profile');
      }
    } catch (error) {
      console.error('❌ Error saving profile:', error);
      setError(error.response?.data?.message || 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Input field component with error handling
   */
  const InputField = ({ label, name, type = 'text', required = false, placeholder, ...props }) => (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        value={name.includes('.') ? 
          name.split('.').reduce((obj, key) => obj?.[key], profileData) || '' :
          profileData[name] || ''
        }
        onChange={handleInputChange}
        disabled={!isEditing}
        className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
          !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
        } ${errors[name] ? 'border-red-500' : 'border-gray-300'}`}
        {...props}
      />
      {errors[name] && (
        <p className="mt-1 text-sm text-red-600">{errors[name]}</p>
      )}
    </div>
  );

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your profile...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            My Travel Profile 🧳
          </h1>
          <p className="text-xl text-gray-600">
            Manage your travel preferences and personal information.
          </p>
        </div>
        
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Edit Profile
          </button>
        ) : (
          <div className="flex gap-2">
            <button
              onClick={() => {
                setIsEditing(false);
                setErrors({});
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Photo Section */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Profile Photo</h3>
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden bg-gray-200">
                {user?.imageUrl ? (
                  <img 
                    src={user.imageUrl} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500 text-4xl">
                    👤
                  </div>
                )}
              </div>
              {isEditing && (
                <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                  Change Photo
                </button>
              )}
            </div>
            
            {/* Account Stats */}
            <div className="mt-6 pt-6 border-t">
              <h4 className="font-semibold text-gray-900 mb-3">Account Stats</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Member since:</span>
                  <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total bookings:</span>
                  <span>12</span>
                </div>
                <div className="flex justify-between">
                  <span>Favorite businesses:</span>
                  <span>5</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Profile Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField 
                label="First Name" 
                name="firstName" 
                required 
                placeholder="Enter your first name"
              />
              <InputField 
                label="Last Name" 
                name="lastName" 
                required 
                placeholder="Enter your last name"
              />
              <InputField 
                label="Email Address" 
                name="email" 
                type="email" 
                required 
                placeholder="Enter your email"
              />
              <InputField 
                label="Phone Number" 
                name="phone" 
                type="tel" 
                placeholder="(555) 123-4567"
              />
              <InputField 
                label="Date of Birth" 
                name="dateOfBirth" 
                type="date"
              />
            </div>
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Address</h3>
            <div className="grid grid-cols-1 gap-4">
              <InputField 
                label="Street Address" 
                name="address.street" 
                placeholder="123 Main Street"
              />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <InputField 
                  label="City" 
                  name="address.city" 
                  placeholder="San Francisco"
                />
                <InputField 
                  label="State" 
                  name="address.state" 
                  placeholder="CA"
                />
                <InputField 
                  label="ZIP Code" 
                  name="address.zipCode" 
                  placeholder="94102"
                />
              </div>
              <InputField 
                label="Country" 
                name="address.country"
              />
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <InputField 
                label="Contact Name" 
                name="emergencyContact.name" 
                placeholder="John Doe"
              />
              <InputField 
                label="Phone Number" 
                name="emergencyContact.phone" 
                type="tel" 
                placeholder="(555) 123-4567"
              />
              <div className="md:col-span-2">
                <InputField 
                  label="Relationship" 
                  name="emergencyContact.relationship" 
                  placeholder="Spouse, Parent, Sibling, etc."
                />
              </div>
            </div>
          </div>

          {/* Preferences */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Preferences</h3>
            
            {/* Notification Preferences */}
            <div className="mb-6">
              <h4 className="font-medium text-gray-900 mb-3">Notifications</h4>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="preferences.emailNotifications"
                    checked={profileData.preferences.emailNotifications}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Email notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="preferences.smsNotifications"
                    checked={profileData.preferences.smsNotifications}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">SMS notifications</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    name="preferences.marketingEmails"
                    checked={profileData.preferences.marketingEmails}
                    onChange={handleInputChange}
                    disabled={!isEditing}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="ml-2 text-gray-700">Marketing emails</span>
                </label>
              </div>
            </div>

            {/* Reminder Time */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Appointment Reminder Time
              </label>
              <select
                name="preferences.reminderTime"
                value={profileData.preferences.reminderTime}
                onChange={handleInputChange}
                disabled={!isEditing}
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  !isEditing ? 'bg-gray-50 text-gray-600' : 'bg-white'
                } border-gray-300`}
              >
                <option value="1">1 hour before</option>
                <option value="2">2 hours before</option>
                <option value="24">1 day before</option>
                <option value="48">2 days before</option>
                <option value="168">1 week before</option>
              </select>
            </div>

            {/* Favorite Categories */}
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Favorite Categories</h4>
              <p className="text-sm text-gray-600 mb-3">
                Select your favorite service categories to get personalized recommendations.
              </p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {categories.map(category => (
                  <label key={category} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={profileData.preferences.favoriteCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      disabled={!isEditing}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="ml-2 text-sm text-gray-700">{category}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerProfile;
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axiosInstance from '../../axiosInstance';

const BusinessProfile = () => {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const [profile, setProfile] = useState({
    agencyName: '',
    description: '',
    category: '',
    email: '',
    phone: '',
    website: '',
    imageUrl: '',
    licenseNumber: '',
    yearEstablished: '',
    specializations: [],
    address: {
      street: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    socialMedia: {
      facebook: '',
      twitter: '',
      instagram: '',
      linkedin: ''
    }
  });

  const businessCategories = [
    'Adventure Tours',
    'Beach Holidays',
    'City Tours',
    'Cruise Packages',
    'Cultural Experiences',
    'Eco Tourism',
    'Family Packages',
    'Honeymoon Specials',
    'Luxury Travel',
    'Mountain Expeditions',
    'Pilgrimage Tours',
    'Safari Adventures',
    'Ski Trips',
    'Wildlife Tours',
    'Other'
  ];

  // 🖼️ Handle image upload and preview
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB.');
      return;
    }

    setUploadingImage(true);
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result;
      setProfile((prev) => ({ ...prev, imageUrl: base64String }));
      setImagePreview(base64String);
      setUploadingImage(false);
    };
    reader.readAsDataURL(file);
  };

  // 🧠 Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const response = await axiosInstance.get('/businesses/profile');
          if (response.data.business) {
            setProfile(response.data.business);
            if (response.data.business.imageUrl) {
              setImagePreview(response.data.business.imageUrl);
            }
          }
        } catch (error) {
          console.error('Error loading business profile:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadProfile();
  }, [user]);

  // 📝 Handle input
  const handleInputChange = (field, value, section = null) => {
    setProfile((prev) => {
      if (section) {
        return { ...prev, [section]: { ...prev[section], [field]: value } };
      }
      return { ...prev, [field]: value };
    });
  };

  // 💾 Save profile (with image)
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      let response;
      try {
        response = await axiosInstance.put('/businesses/profile', profile);
      } catch (updateError) {
        if (updateError.response?.status === 404) {
          response = await axiosInstance.post('/businesses/profile', profile);
        } else {
          throw updateError;
        }
      }

      if (response.data.business) {
        setProfile(response.data.business);
        alert('✅ Profile saved successfully!');
      }
    } catch (error) {
      console.error('Error saving business profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading business profile...</p>
        </div>
      </div>
    );
  }

  // 🧩 UI
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold text-gray-900 mb-2">Business Profile 🏢</h1>
      <p className="text-gray-600 mb-8">
        Manage your business information and settings to attract more customers.
      </p>

      <form onSubmit={handleSaveProfile} className="space-y-8">
        {/* 📸 Image Upload Section */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Agency Image</h2>
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden border">
              {imagePreview ? (
                <img src={imagePreview} alt="Agency" className="w-full h-full object-cover" />
              ) : (
                <span className="text-gray-400 text-sm">No image</span>
              )}
            </div>
            <div>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={uploadingImage}
                className="block text-sm text-gray-700"
              />
              <p className="text-xs text-gray-500 mt-1">
                Supported: JPG, PNG (Max 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Basic Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">Business Name *</label>
              <input
                type="text"
                required
                value={profile.agencyName}
                onChange={(e) => handleInputChange('agencyName', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enter your business name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                required
                value={profile.category}
                onChange={(e) => handleInputChange('category', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select a category</option>
                {businessCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-6">
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              rows={4}
              value={profile.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Describe your agency..."
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 bg-green-600 text-white font-medium rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BusinessProfile;

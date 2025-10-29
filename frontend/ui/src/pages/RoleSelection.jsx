import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../axiosInstance';

const RoleSelection = () => {
  const { user } = useUser();
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [userExists, setUserExists] = useState(false);

  // Check if user already has a role selected
  useEffect(() => {
    const checkUserRole = async () => {
      if (user?.id) {
        try {
          // First, sync user to our database
          await axiosInstance.post('/users/sync', {
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            name: user.fullName,
            imageUrl: user.imageUrl
          });

          // Then check if they have a role
          const response = await axiosInstance.get(`/users/${user.id}`);
          if (response.data.user && response.data.user.role) {
            // User already has a role, redirect appropriately
            const redirectPath = response.data.user.role === 'customer' 
              ? '/customer/browse' 
              : `/${response.data.user.role}/dashboard`;
            navigate(redirectPath);
          }
          setUserExists(true);
        } catch (error) {
          console.error('Error checking user role:', error);
          // User doesn't exist yet, that's okay
          setUserExists(false);
        }
      }
    };

    checkUserRole();
  }, [user, navigate]);

  const handleRoleSelection = async (role) => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      // First, sync user if not exists
      if (!userExists) {
        await axiosInstance.post('/users/sync', {
          clerkId:user.id,
          email: user.emailAddresses[0]?.emailAddress,
          name: user.fullName,
          imageUrl: user.imageUrl
        });
      }

      // Update user role
      const response = await axiosInstance.put('/users/role', {
        clerkId: user.id,
        role: role
      });

      if (response.data.user) {
        // Redirect appropriately based on role
        const redirectPath = role === 'customer' 
          ? '/customer/browse' 
          : `/${role}/dashboard`;
        navigate(redirectPath);
      } else {
        alert('Error selecting role. Please try again.');
      }
    } catch (error) {
      console.error('Error updating user role:', error);
      alert('Error selecting role. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center px-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to BookVerse! 🎉
          </h1>
          <p className="text-xl text-gray-600 mb-2">
            Hi {user?.firstName || 'there'}! Let's set up your account.
          </p>
          <p className="text-gray-500">
            Choose how you'd like to use BookVerse:
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Customer Option */}
          <div 
            className={`bg-white p-8 rounded-2xl shadow-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-xl ${
              selectedRole === 'customer' ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-blue-300'
            }`}
            onClick={() => setSelectedRole('customer')}
          >
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">👤</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">I'm a Customer</h3>
            <p className="text-gray-600 mb-4">
              I want to book appointments and services from local businesses.
            </p>
            <ul className="text-left text-gray-600 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Browse local businesses
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Book appointments easily
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Manage your bookings
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-3"></span>
                Get notifications
              </li>
            </ul>
            {selectedRole === 'customer' && (
              <button
                onClick={() => handleRoleSelection('customer')}
                disabled={isLoading}
                className="w-full mt-6 bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Setting up...' : 'Continue as Customer'}
              </button>
            )}
          </div>

          {/* Business Option */}
          <div 
            className={`bg-white p-8 rounded-2xl shadow-lg border-2 cursor-pointer transition-all duration-200 hover:shadow-xl ${
              selectedRole === 'business' ? 'border-green-500 ring-2 ring-green-200' : 'border-gray-200 hover:border-green-300'
            }`}
            onClick={() => setSelectedRole('business')}
          >
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-3xl">🏢</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">I'm a Business Owner</h3>
            <p className="text-gray-600 mb-4">
              I want to manage my business appointments and grow my customer base.
            </p>
            <ul className="text-left text-gray-600 space-y-2">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Set up business profile
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Manage services & pricing
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                Handle appointments
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
                View analytics
              </li>
            </ul>
            {selectedRole === 'business' && (
              <button
                onClick={() => handleRoleSelection('business')}
                disabled={isLoading}
                className="w-full mt-6 bg-green-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {isLoading ? 'Setting up...' : 'Continue as Business'}
              </button>
            )}
          </div>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Don't worry, you can always change this later in your account settings.
          </p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
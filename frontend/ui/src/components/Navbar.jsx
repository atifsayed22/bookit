import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { UserButton, SignedIn, SignedOut } from '@clerk/clerk-react';
import { useAuth } from '../context/AuthContext';
import axiosInstance from '../axiosInstance';

/**
 * Navbar Component with Role-Based Navigation
 * 
 * Learning Concepts:
 * 1. Component Composition - Breaking UI into reusable pieces
 * 2. Conditional Rendering - Show/hide based on user state
 * 3. Responsive Design - Mobile-first approach
 * 4. State Management - Managing navbar state efficiently
 */

const Navbar = () => {
  // State Management
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Hooks for navigation and user data
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoaded } = useAuth();

  /**
   * Effect Hook for User Role Detection
   * 
   * Learning: useEffect patterns
   * - Dependency array [user, isLoaded] ensures this runs when user changes
   * - Cleanup not needed here since we're just fetching data
   */
  useEffect(() => {
    const fetchUserRole = async () => {
      if (isLoaded && user?.id) {
        try {
          // First sync user to our database
          await axiosInstance.post('/users/sync', {
            clerkId: user.id,
            email: user.emailAddresses[0]?.emailAddress,
            name: user.fullName,
            imageUrl: user.imageUrl
          });

          // Then get user role from our backend
          const response = await axiosInstance.get(`/users/${user.id}`);
          setUserRole(response.data.user.role);
        } catch (error) {
          console.error('Error fetching user role:', error);
          // Graceful degradation - if API fails, still show basic navbar
        } finally {
          setIsLoading(false);
        }
      } else if (isLoaded) {
        // User not logged in
        setIsLoading(false);
      }
    };

    fetchUserRole();
  }, [user, isLoaded]);

  /**
   * Navigation Items Based on User Role
   * 
   * Learning: Configuration-driven UI
   * - Instead of hardcoding navigation, we define it as data
   * - Makes it easy to add/remove/modify navigation items
   * - Follows Single Responsibility Principle
   */
  const getNavigationItems = () => {
    if (!userRole) return [];

    const navigationConfig = {
      customer: [
        { name: 'Browse Travel', href: '/customer/browse', icon: '✈️' },
        { name: 'My Bookings', href: '/customer/bookings', icon: '📅' },
        { name: 'Profile', href: '/customer/profile', icon: '👤' },
      ],
      business: [
        { name: 'Dashboard', href: '/business/dashboard', icon: '📊' },
        { name: 'Profile', href: '/business/profile', icon: '🏢' },
        { name: 'Travel Packages', href: '/business/services', icon: '✈️' },
        { name: 'Bookings', href: '/business/appointments', icon: '📅' },
        { name: 'Calendar', href: '/business/calendar', icon: '🗓️' },
      ],
      admin: [
        { name: 'Dashboard', href: '/admin/dashboard', icon: '📊' },
        { name: 'Agencies', href: '/admin/businesses', icon: '🏢' },
        { name: 'Users', href: '/admin/users', icon: '👥' },
        { name: 'Analytics', href: '/admin/analytics', icon: '📈' },
      ]
    };

    return navigationConfig[userRole] || [];
  };

  /**
   * Utility function to check if a link is active
   * 
   * Learning: Pure functions for UI logic
   * - Takes input (pathname, href) and returns output (boolean)
   * - No side effects, easy to test
   * - Reusable across components
   */
  const isActiveLink = (href) => {
    return location.pathname === href;
  };

  /**
   * Event Handler for Mobile Menu Toggle
   * 
   * Learning: Event handling patterns
   * - Use callback pattern for state updates
   * - Keep event handlers simple and focused
   */
  const toggleMobileMenu = () => {
    setIsMenuOpen(prev => !prev);
  };

  /**
   * Theme Colors Based on User Role
   * 
   * Learning: Theme system implementation
   * - Centralized color management
   * - Consistent visual hierarchy
   * - Easy to maintain and modify
   */
  const getThemeColors = () => {
    const themes = {
      customer: {
        primary: 'blue-600',
        primaryHover: 'blue-700',
        light: 'blue-50',
        accent: 'blue-100'
      },
      business: {
        primary: 'green-600',
        primaryHover: 'green-700',
        light: 'green-50',
        accent: 'green-100'
      },
      admin: {
        primary: 'purple-600',
        primaryHover: 'purple-700',
        light: 'purple-50',
        accent: 'purple-100'
      }
    };

    return themes[userRole] || themes.customer;
  };

  const theme = getThemeColors();
  const navigationItems = getNavigationItems();

  /**
   * Loading State Component
   * 
   * Learning: Loading states are crucial for UX
   * - Show users that something is happening
   * - Prevent layout shift with skeleton UI
   * - Keep it simple but informative
   */
  if (isLoading) {
    return (
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <div className="h-8 w-32 bg-gray-200 rounded animate-pulse"></div>
            </div>
            <div className="hidden md:flex space-x-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-6 w-16 bg-gray-200 rounded animate-pulse"></div>
              ))}
            </div>
            <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
          </div>
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center space-x-2 text-2xl font-bold text-gray-900 hover:text-gray-700 transition-colors"
            >
              <span>📚</span>
              <span>BookVerse</span>
              {userRole && (
                <span className={`text-sm px-2 py-1 rounded-full bg-${theme.light} text-${theme.primary} capitalize`}>
                  {userRole}
                </span>
              )}
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1">
            <SignedIn>
              {navigationItems.map((item) => (
                <Link
                  key={item.href}
                  to={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-1 ${
                    isActiveLink(item.href)
                      ? `bg-${theme.accent} text-${theme.primary} border-b-2 border-${theme.primary}`
                      : `text-gray-600 hover:text-${theme.primary} hover:bg-${theme.light}`
                  }`}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              ))}
            </SignedIn>
          </div>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            <SignedOut>
              <Link
                to="/login"
                className={`bg-${theme.primary} text-white px-4 py-2 rounded-lg hover:bg-${theme.primaryHover} transition-colors font-medium`}
              >
                Sign In
              </Link>
            </SignedOut>

            <SignedIn>
              <UserButton 
                afterSignOutUrl="/"
                appearance={{
                  elements: {
                    avatarBox: "w-8 h-8"
                  }
                }}
              />
            </SignedIn>

            {/* Mobile menu button */}
            <SignedIn>
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded="false"
              >
                <span className="sr-only">Open main menu</span>
                {/* Hamburger Icon */}
                <div className="w-6 h-6 flex flex-col justify-center items-center">
                  <span className={`bg-current block h-0.5 w-5 rounded-sm transition-all ${isMenuOpen ? 'rotate-45 translate-y-1' : '-translate-y-0.5'}`}></span>
                  <span className={`bg-current block h-0.5 w-5 rounded-sm transition-all ${isMenuOpen ? 'opacity-0' : 'my-0.5'}`}></span>
                  <span className={`bg-current block h-0.5 w-5 rounded-sm transition-all ${isMenuOpen ? '-rotate-45 -translate-y-1' : 'translate-y-0.5'}`}></span>
                </div>
              </button>
            </SignedIn>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      <SignedIn>
        <div className={`md:hidden transition-all duration-300 ease-in-out ${isMenuOpen ? 'max-h-screen opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="px-2 pt-2 pb-3 space-y-1 bg-gray-50 border-t">
            {navigationItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsMenuOpen(false)} // Close menu when link is clicked
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-colors ${
                  isActiveLink(item.href)
                    ? `bg-${theme.primary} text-white`
                    : `text-gray-700 hover:text-${theme.primary} hover:bg-${theme.light}`
                }`}
              >
                <span>{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </SignedIn>
    </nav>
  );
};

/**
 * Export with React.memo for Performance Optimization
 * 
 * Learning: React.memo prevents unnecessary re-renders
 * - Only re-renders if props change (navbar has no props, so very efficient)
 * - Good practice for components that might render frequently
 * - Don't overuse - only for components with expensive render logic
 */
export default Navbar;
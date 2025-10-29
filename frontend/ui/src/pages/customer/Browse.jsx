import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axiosInstance';

/**
 * Customer Browse Page - Discover Travel Agencies & Packages
 * 
 * Learning Concepts:
 * 1. Search and Filter UI Patterns
 * 2. Card-based Layout for Travel Agency Listings
 * 3. Loading States and Error Handling
 * 4. Responsive Grid Systems
 */

const Browse = () => {
  // State Management for Browse Functionality
  const [travelAgencies, setTravelAgencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    current: 1,
    pages: 1,
    total: 0
  });

  const categories = [
    'all',
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
    'Honeymoon Specials'
  ];

  /**
   * Search travel agencies using API
   */
  const searchTravelAgencies = async (searchParams = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 Searching travel agencies with params:', searchParams);
      
      const params = new URLSearchParams();
      if (searchParams.search) params.append('search', searchParams.search);
      if (searchParams.category && searchParams.category !== 'all') {
        params.append('category', searchParams.category);
      }
      params.append('page', searchParams.page || 1);
      params.append('limit', 20);
      params.append('sortBy', 'name');

      const response = await axiosInstance.get(`/customers/businesses/search?${params.toString()}`);
      
      if (response.data.success) {
        setTravelAgencies(response.data.businesses); // Backend still uses 'businesses' for now
        setPagination(response.data.pagination);
        console.log('✅ Travel agencies loaded:', response.data.businesses.length);
      } else {
        throw new Error(response.data.message || 'Failed to load travel agencies');
      }
    } catch (error) {
      console.error('❌ Error loading travel agencies:', error);
      setError(error.response?.data?.message || 'Failed to load travel agencies. Please try again.');
      setTravelAgencies([]);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Initial load and search on parameter changes
   */
  useEffect(() => {
    searchTravelAgencies({
      search: searchTerm,
      category: selectedCategory,
      page: 1
    });
  }, [searchTerm, selectedCategory]);

  // Use travel agencies directly from API (already filtered)
  const filteredTravelAgencies = travelAgencies;  /**
   * Loading State Component
   * 
   * Learning: Loading UI patterns
   * - Skeleton screens for better UX
   * - Consistent loading indicators
   */
  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[...Array(6)].map((_, index) => (
        <div key={index} className="bg-white rounded-lg shadow-md p-6 animate-pulse">
          <div className="bg-gray-300 h-40 rounded-lg mb-4"></div>
          <div className="h-4 bg-gray-300 rounded mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3 mb-2"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Discover Amazing Businesses 🔍
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Find and book appointments with top-rated local businesses in your area.
        </p>
      </div>

      {/* Search and Filter Section */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1">
            <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
              Search businesses or services
            </label>
            <input
              id="search"
              type="text"
              placeholder="Search for haircuts, dental care, fitness classes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Category Filter */}
          <div className="md:w-64">
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              id="category"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {categories.map(category => (
                <option key={category} value={category}>
                  {category === 'all' ? 'All Categories' : category}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Results Summary */}
        {!isLoading && (
          <div className="mt-4 text-sm text-gray-600">
            {filteredTravelAgencies.length === 0 ? (
              <span>No travel agencies found. Try adjusting your search criteria.</span>
            ) : (
              <span>
                Found {filteredTravelAgencies.length} travel agenc{filteredTravelAgencies.length !== 1 ? 'ies' : 'y'}
                {searchTerm && ` matching "${searchTerm}"`}
                {selectedCategory !== 'all' && ` in ${selectedCategory}`}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Error State */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          <div className="flex">
            <span className="mr-2">⚠️</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Travel Agency Listings */}
      {isLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTravelAgencies.map(agency => (
            <div key={agency._id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200">
              {/* Agency Image */}
              <div className="h-48 bg-gray-200 relative flex items-center justify-center">
                {agency.imageUrl ? (
                  <img 
                    src={agency.imageUrl} 
                    alt={agency.agencyName || agency.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-4xl text-gray-400">�️</div>
                )}
                <div className="absolute top-4 right-4 bg-white px-2 py-1 rounded-full text-sm font-medium">
                  {agency.stats?.averageRating ? agency.stats.averageRating.toFixed(1) : 'New'}
                </div>
              </div>

              {/* Travel Agency Information */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-semibold text-gray-900">{agency.agencyName || agency.name}</h3>
                  <div className="flex items-center text-yellow-500">
                    <span className="text-sm font-medium">
                      {agency.stats?.averageRating ? agency.stats.averageRating.toFixed(1) : 'New'}
                    </span>
                    <svg className="w-4 h-4 ml-1" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                    <span className="text-gray-600 text-sm ml-1">
                      ({agency.stats?.totalReviews || 0})
                    </span>
                  </div>
                </div>

                <p className="text-sm text-blue-600 mb-2">{agency.category}</p>
                <p className="text-gray-600 text-sm mb-4">
                  📍 {agency.address?.city}, {agency.address?.state}
                </p>
                
                {agency.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {agency.description}
                  </p>
                )}

                {/* Agency Contact */}
                <div className="mb-4">
                  <p className="text-xs text-gray-500">
                    📞 {agency.phone} | ✉️ {agency.email}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Link
                    to={`/agency/${agency._id}/packages`}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center text-sm font-medium"
                  >
                    View Packages
                  </Link>
                  <Link
                    to={`/agency/${agency._id}`}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
                  >
                    Agency Info
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredTravelAgencies.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🏝️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No travel agencies found</h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your search terms or browse all travel categories.
          </p>
          <button
            onClick={() => {
              setSearchTerm('');
              setSelectedCategory('all');
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Browse;
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import axiosInstance from "../../axiosInstance";

const Browse = () => {
  const [travelAgencies, setTravelAgencies] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ current: 1, pages: 1, total: 0 });

  const categories = [
    "all",
    "Adventure Tours",
    "Beach Holidays",
    "City Breaks",
    "Cultural Tours",
    "Cruise Packages",
    "Mountain Expeditions",
    "Safari Tours",
    "Luxury Travel",
    "Budget Travel",
    "Family Packages",
    "Honeymoon Specials",
  ];

  const searchTravelAgencies = async (searchParams = {}) => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (searchParams.search) params.append("search", searchParams.search);
      if (searchParams.category && searchParams.category !== "all")
        params.append("category", searchParams.category);
      params.append("page", searchParams.page || 1);
      params.append("limit", 20);
      params.append("sortBy", "name");

      const response = await axiosInstance.get(
        `/customers/businesses/search?${params.toString()}`
      );
      if (response.data.success) {
        setTravelAgencies(response.data.businesses);
        setPagination(response.data.pagination);
      } else {
        throw new Error(response.data.message || "Failed to load travel agencies");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load data");
      setTravelAgencies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    searchTravelAgencies({
      search: searchTerm,
      category: selectedCategory,
      page: 1,
    });
  }, [searchTerm, selectedCategory]);

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Search + Filter */}
      <div className="bg-white shadow rounded-lg p-4 flex flex-col md:flex-row gap-4 mb-6">
        <input
          type="text"
          placeholder="Search agencies or services..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none"
        />
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="md:w-64 border border-gray-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-yellow-400 outline-none"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c === "all" ? "All Categories" : c}
            </option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
          ⚠️ {error}
        </div>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="text-center text-gray-500 py-12">Loading agencies...</div>
      )}

      {/* Agencies */}
      {!isLoading && travelAgencies.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {travelAgencies.map((agency) => (
            <div
              key={agency._id}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-4 flex flex-col"
            >
              <div className="h-40 w-full bg-gray-100 rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                {agency.imageUrl ? (
                  <img
                    src={agency.imageUrl}
                    alt={agency.agencyName || agency.businessName || agency.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-4xl text-gray-400">✈️</span>
                )}
              </div>

              <h3 className="text-lg font-semibold text-gray-900 truncate">
                {agency.agencyName || agency.businessName || agency.name}
              </h3>
              <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                {agency.description || "No description available"}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                📍 {agency.address?.city || "Unknown"}, {agency.address?.state || ""}
              </p>

              {/* Actions */}
              <div className="mt-auto flex gap-2">
                <Link
                  to={`/agency/${agency._id}/packages`}
                  className="flex-1 text-center bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-3 py-2 rounded-lg font-medium transition"
                >
                  View Packages
                </Link>
                <Link
                  to={`/agency/${agency._id}`}
                  className="px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition"
                >
                  Info
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!isLoading && travelAgencies.length === 0 && !error && (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">🌍</div>
          <p className="text-gray-600 mb-4">No agencies found.</p>
          <button
            onClick={() => {
              setSearchTerm("");
              setSelectedCategory("all");
            }}
            className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 px-6 py-2 rounded-lg font-medium transition"
          >
            Clear Filters
          </button>
        </div>
      )}
    </div>
  );
};

export default Browse;

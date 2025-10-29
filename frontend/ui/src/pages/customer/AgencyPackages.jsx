import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axiosInstance from "../../axiosInstance";

/**
 * Agency Packages Page - View all travel packages from a specific agency
 *
 * Learning Concepts:
 * 1. Dynamic routing with agency details
 * 2. Package listing with filtering
 * 3. Direct booking navigation
 */

const AgencyPackages = () => {
  const { agencyId } = useParams();
  const navigate = useNavigate();

  const [agency, setAgency] = useState(null);
  const [packages, setPackages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priceFilter, setPriceFilter] = useState("all");
  const [durationFilter, setDurationFilter] = useState("all");
  const [selectedPackage, setSelectedPackage] = useState(null);

  /**
   * Load agency and packages
   */
  useEffect(() => {
    const loadAgencyData = async () => {
      if (!agencyId) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("🔄 Loading agency packages for:", agencyId);

        const response = await axiosInstance.get(
          `/customers/agencies/${agencyId}`
        );

        if (response.data.success) {
          setAgency(response.data.agency || response.data.business);
          setPackages(response.data.packages || response.data.services || []);
          console.log("✅ Agency packages loaded:", response.data.agency);
        } else {
          throw new Error(response.data.message || "Agency not found");
        }
      } catch (error) {
        console.error("❌ Error loading agency packages:", error);
        setError(
          error.response?.data?.message || "Failed to load agency details"
        );
      } finally {
        setIsLoading(false);
      }
    };

    loadAgencyData();
  }, [agencyId]);

  // Filter packages based on selected filters
  const filteredPackages = packages.filter((pkg) => {
    let matchesPrice = true;
    let matchesDuration = true;

    if (priceFilter !== "all") {
      if (priceFilter === "budget" && pkg.price > 1000) matchesPrice = false;
      if (priceFilter === "mid" && (pkg.price < 1000 || pkg.price > 3000))
        matchesPrice = false;
      if (priceFilter === "luxury" && pkg.price < 3000) matchesPrice = false;
    }

    if (durationFilter !== "all") {
      const days = pkg.durationDays || 0;
      if (durationFilter === "short" && days > 5) matchesDuration = false;
      if (durationFilter === "medium" && (days < 5 || days > 10))
        matchesDuration = false;
      if (durationFilter === "long" && days < 10) matchesDuration = false;
    }

    return matchesPrice && matchesDuration;
  });

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="flex justify-center items-center min-h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading travel packages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !agency) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            Agency Not Found
          </h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate("/customer/browse")}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Browse Travel Agencies
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header with Agency Info */}
      <div className="mb-8">
        <button
          onClick={() => navigate("/customer/browse")}
          className="text-blue-600 hover:text-blue-700 mb-4 flex items-center"
        >
          ← Back to Browse
        </button>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-start gap-6">
            <div className="w-24 h-24 rounded-lg bg-gray-200 flex items-center justify-center flex-shrink-0">
              {agency.imageUrl ? (
                <img
                  src={agency.imageUrl}
                  alt={agency.agencyName || agency.name}
                  className="w-24 h-24 rounded-lg object-cover"
                />
              ) : (
                <span className="text-4xl">✈️</span>
              )}
            </div>

            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {agency.agencyName || agency.name}
              </h1>
              <p className="text-blue-600 mb-2">{agency.category}</p>

              <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                <span>
                  📍 {agency.address?.city}, {agency.address?.state}
                </span>
                <span>📞 {agency.phone}</span>
                <div className="flex items-center text-yellow-500">
                  <span className="font-medium">
                    {agency.stats?.averageRating
                      ? agency.stats.averageRating.toFixed(1)
                      : "New"}
                  </span>
                  <svg
                    className="w-4 h-4 ml-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  <span className="text-gray-600 ml-1">
                    ({agency.stats?.totalReviews || 0})
                  </span>
                </div>
              </div>

              {agency.description && (
                <p className="text-gray-600">{agency.description}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Filter Packages
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range
            </label>
            <select
              value={priceFilter}
              onChange={(e) => setPriceFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Prices</option>
              <option value="budget">Budget (Under $1,000)</option>
              <option value="mid">Mid-Range ($1,000 - $3,000)</option>
              <option value="luxury">Luxury ($3,000+)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Duration
            </label>
            <select
              value={durationFilter}
              onChange={(e) => setDurationFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Durations</option>
              <option value="short">Short (1-5 days)</option>
              <option value="medium">Medium (6-10 days)</option>
              <option value="long">Long (10+ days)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-900">
          Available Travel Packages ({filteredPackages.length})
        </h2>
      </div>

      {filteredPackages.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow-md">
          <div className="text-6xl mb-4">📦</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No packages found
          </h3>
          <p className="text-gray-600 mb-6">
            Try adjusting your filters or check back later for new packages.
          </p>
          <button
            onClick={() => {
              setPriceFilter("all");
              setDurationFilter("all");
            }}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPackages.map((pkg) => (
            <div
              key={pkg._id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Package Image */}
              <div className="h-48 bg-gray-200 relative flex items-center justify-center">
                {pkg.images && pkg.images.length > 0 ? (
                  <img
                    src={pkg.images[0]} // ✅ use the first image
                    alt={agency.packageName || agency.name || "Travel Package"}
                    className="w-full h-48 rounded-lg object-cover"
                  />
                ) : (
                  <span className="text-4xl">✈️</span>
                )}
                {pkg.featured && (
                  <div className="absolute top-4 left-4 bg-yellow-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                    ⭐ Featured
                  </div>
                )}
              </div>

              {/* Package Details */}
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {pkg.packageName || pkg.name}
                </h3>

                <div className="mb-4 space-y-2 text-sm text-gray-600">
                  <p className="flex items-center">
                    <span className="mr-2">📍</span>
                    <span className="font-medium">{pkg.destination}</span>
                  </p>
                  <p className="flex items-center">
                    <span className="mr-2">📅</span>
                    <span>
                      {pkg.durationDays || pkg.durationMinutes}{" "}
                      {pkg.durationDays ? "days" : "minutes"}
                    </span>
                  </p>
                  
                </div>

                {pkg.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {pkg.description}
                  </p>
                )}

                {/* Highlights */}
                {pkg.inclusions && pkg.inclusions.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-medium text-gray-700 mb-1">
                      Includes:
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {pkg.inclusions.slice(0, 3).map((item, idx) => (
                        <span
                          key={idx}
                          className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded"
                        >
                          ✓ {item}
                        </span>
                      ))}
                      {pkg.inclusions.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{pkg.inclusions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Price and Action */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-xs text-gray-500">Starting from</p>
                      <p className="text-2xl font-bold text-blue-600">
                        ${pkg.price}
                        <span className="text-sm text-gray-500 font-normal">
                          /person
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      className="flex-1 bg-yellow-400 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition-colors font-medium text-center"
                      onClick={() => setSelectedPackage(pkg)}
                    >
                      View Details
                    </button>
                    <Link
                      to={`/agency/${agencyId}/book?package=${pkg._id}`}
                      className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium text-center"
                    >
                      Book Now
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    {/* Package Detail Modal */}
    {selectedPackage && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
        <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto relative">
          <button
            className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 text-2xl"
            onClick={() => setSelectedPackage(null)}
            aria-label="Close"
          >
            &times;
          </button>
          <div className="p-6">
            {/* Images */}
            {selectedPackage.images && selectedPackage.images.length > 0 && (
              <div className="mb-4">
                <img
                  src={selectedPackage.images[0]}
                  alt={selectedPackage.packageName || selectedPackage.name}
                  className="w-full h-64 object-cover rounded-lg mb-2"
                />
                {selectedPackage.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto">
                    {selectedPackage.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        alt={`Thumbnail ${idx + 1}`}
                        className="w-16 h-16 object-cover rounded border"
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
            {/* Name & Price */}
            <h2 className="text-2xl font-bold mb-2">
              {selectedPackage.packageName || selectedPackage.name}
            </h2>
            <div className="text-blue-600 text-xl font-semibold mb-2">
              ${selectedPackage.price} <span className="text-sm text-gray-500 font-normal">/person</span>
            </div>
            {/* Destination, Duration, Difficulty */}
            <div className="mb-2 text-gray-700">
              <div className="mb-1">📍 <span className="font-medium">{selectedPackage.destination}</span></div>
              <div className="mb-1">📅 {selectedPackage.durationDays || selectedPackage.durationMinutes} {selectedPackage.durationDays ? 'days' : 'minutes'}</div>
              
            </div>
            {/* Description */}
            {selectedPackage.description && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">Description</h3>
                <p className="text-gray-600">{selectedPackage.description}</p>
              </div>
            )}
            {/* Inclusions */}
            {selectedPackage.inclusions && selectedPackage.inclusions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">What's Included</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {selectedPackage.inclusions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Exclusions */}
            {selectedPackage.exclusions && selectedPackage.exclusions.length > 0 && (
              <div className="mb-4">
                <h3 className="font-semibold mb-1">What's Not Included</h3>
                <ul className="list-disc list-inside text-gray-700">
                  {selectedPackage.exclusions.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            )}
            {/* Book Now Button */}
            <div className="mt-6 flex justify-end">
              <Link
                to={`/agency/${agencyId}/book?package=${selectedPackage._id}`}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 font-medium"
              >
                Book Now
              </Link>
            </div>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};

export default AgencyPackages;

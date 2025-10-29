import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import axiosInstance from "../../axiosInstance";

const Services = () => {
  const { user } = useUser();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    packageName: "",
    destination: "",
    durationDays: "",
    price: "",
    category: "Adventure",
    description: "",
    inclusions: [],
    exclusions: [],
    imageUrl: "",
    images: [],
    promoCode: "",
    promoDiscount: "",
    promoCodeActive: false
  });
  const [newInclusion, setNewInclusion] = useState("");
  const [newExclusion, setNewExclusion] = useState("");

  useEffect(() => {
    if (user) loadServices();
  }, [user]);

  const loadServices = async () => {
    try {
      const res = await axiosInstance.get("/services/my-services");
      setServices(res.data.services || []);
    } catch (err) {
      console.error("Error loading services:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Limit the number of images to prevent payload size issues
      const limitedImages = form.images.slice(0, 5); // Limit to 5 images
      
      // Prepare data for backend (matching Service model)
      const data = {
        packageName: form.packageName,
        destination: form.destination,
        durationDays: parseInt(form.durationDays),
        price: parseFloat(form.price),
        category: form.category,
        description: form.description,
        inclusions: form.inclusions,
        exclusions: form.exclusions,
        images: limitedImages,
        isActive: true,
        promoCode: form.promoCodeActive ? form.promoCode : "",
        promoDiscount: form.promoCodeActive ? parseInt(form.promoDiscount) : 0,
        promoCodeActive: form.promoCodeActive
      };

      const res = editing 
        ? await axiosInstance.put(`/services/${editing._id}`, data)
        : await axiosInstance.post("/services", data);
      
      if (editing) {
        setServices(prev => prev.map(s => s._id === editing._id ? res.data.service : s));
      } else {
        setServices(prev => [...prev, res.data.service]);
      }
      
      handleCloseModal();
    } catch (err) {
      console.error("Error saving package:", err);
      alert("Error saving package: " + (err.response?.data?.message || err.message));
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setForm({
      packageName: "",
      destination: "",
      durationDays: "",
      price: "",
      category: "Adventure",
      description: "",
      inclusions: [],
      exclusions: [],
      imageUrl: "",
      images: [],
      promoCode: "",
      promoDiscount: "",
      promoCodeActive: false
    });
    setEditing(null);
    setNewInclusion("");
    setNewExclusion("");
  };

  const handleEdit = (service) => {
    setEditing(service);
    setForm({
      packageName: service.packageName || service.name || "",
      destination: service.destination || "",
      durationDays: service.durationDays?.toString() || "",
      price: service.price?.toString() || "",
      category: service.category || "Adventure",
      description: service.description || "",
      inclusions: service.inclusions || [],
      exclusions: service.exclusions || [],
      imageUrl: service.images?.[0] || "",
      images: service.images || [],
      promoCode: service.promoCode || "",
      promoDiscount: service.promoDiscount?.toString() || "",
      promoCodeActive: service.promoCodeActive || false
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this package?")) {
      try {
        await axiosInstance.delete(`/services/${id}`);
        setServices(prev => prev.filter(s => s._id !== id));
      } catch (err) {
        alert("Error deleting package");
      }
    }
  };

  const compressImage = async (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          
          // Calculate new dimensions while maintaining aspect ratio
          const maxDimension = 800;
          if (width > maxDimension || height > maxDimension) {
            if (width > height) {
              height = Math.round((height * maxDimension) / width);
              width = maxDimension;
            } else {
              width = Math.round((width * maxDimension) / height);
              height = maxDimension;
            }
          }

          canvas.width = width;
          canvas.height = height;
          
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with reduced quality
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.6);
          resolve(compressedDataUrl);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file");
      return;
    }

    try {
      const compressedImage = await compressImage(file);
      // Check compressed size (base64 string length * 0.75 gives approximate byte size)
      const approximateSize = Math.round((compressedImage.length * 0.75) / 1024); // size in KB
      
      if (approximateSize > 1000) { // 1MB limit
        alert("Image is too large even after compression. Please select a smaller image.");
        return;
      }

      setForm(prev => ({ 
        ...prev, 
        imageUrl: compressedImage,
        images: prev.images.includes(compressedImage) ? prev.images : [...prev.images, compressedImage]
      }));
    } catch (err) {
      console.error("Error processing image:", err);
      alert("Error processing image. Please try another image.");
    }
  };

  const removeImage = (imageToRemove) => {
    setForm(prev => ({
      ...prev,
      images: prev.images.filter(img => img !== imageToRemove),
      imageUrl: prev.imageUrl === imageToRemove ? prev.images.find(img => img !== imageToRemove) || "" : prev.imageUrl
    }));
  };

  const addInclusion = () => {
    if (newInclusion.trim()) {
      setForm(prev => ({
        ...prev,
        inclusions: [...prev.inclusions, newInclusion.trim()]
      }));
      setNewInclusion("");
    }
  };

  const removeInclusion = (index) => {
    setForm(prev => ({
      ...prev,
      inclusions: prev.inclusions.filter((_, i) => i !== index)
    }));
  };

  const addExclusion = () => {
    if (newExclusion.trim()) {
      setForm(prev => ({
        ...prev,
        exclusions: [...prev.exclusions, newExclusion.trim()]
      }));
      setNewExclusion("");
    }
  };

  const removeExclusion = (index) => {
    setForm(prev => ({
      ...prev,
      exclusions: prev.exclusions.filter((_, i) => i !== index)
    }));
  };

  const filtered = services.filter(s => 
    (s.packageName || s.name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Travel Packages</h1>
              <p className="text-gray-600 mt-1">Manage your travel packages and destinations</p>
            </div>
            <button 
              onClick={() => setShowModal(true)} 
              className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 py-3 rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              Add New Package
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search packages by name or destination..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</span>
          </div>
        </div>
        
        {/* Packages Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(service => (
              <div key={service._id} className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-200 overflow-hidden">
                {/* Image Section */}
                <div className="h-48 bg-gradient-to-br from-blue-100 to-blue-200 relative overflow-hidden">
                  {(service.images && service.images.length > 0) ? 
                    <img src={service.images[0]} alt={service.packageName} className="w-full h-full object-cover" /> :
                    <div className="w-full h-full flex items-center justify-center">
                      <span className="text-6xl opacity-50">🏝️</span>
                    </div>
                  }
                  <div className="absolute top-3 right-3 bg-white px-2 py-1 rounded-full text-sm font-semibold text-green-600">
                    ${service.price}
                  </div>
                  <div className="absolute bottom-3 left-3 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-sm">
                    {service.durationDays} day{service.durationDays !== 1 ? 's' : ''}
                  </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                  <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2">
                    {service.packageName || service.name}
                  </h3>
                  
                  <div className="flex items-center text-gray-600 mb-2">
                    <span className="mr-2">📍</span>
                    <span className="text-sm">{service.destination}</span>
                  </div>




                  {service.description && (
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {service.description}
                    </p>
                  )}

                  {/* Category Badge */}
                  <div className="mb-4 flex flex-wrap gap-2">
                    <span className="inline-block bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-semibold">
                      {service.category}
                    </span>
                    {service.promoCodeActive && service.promoCode && (
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-semibold">
                        🎯 {service.promoCode} ({service.promoDiscount}% OFF)
                      </span>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEdit(service)} 
                      className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => handleDelete(service._id)} 
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors duration-200"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <div className="text-6xl mb-4 opacity-50">✈️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No packages found</h3>
            <p className="text-gray-600 mb-6">
              {search ? "Try adjusting your search terms" : "Get started by creating your first travel package"}
            </p>
            {!search && (
              <button 
                onClick={() => setShowModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold"
              >
                Create Your First Package
              </button>
            )}
          </div>
        )}
      
      {/* Enhanced Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editing ? "Edit" : "Add New"} Travel Package
                </h2>
                <button 
                  onClick={handleCloseModal} 
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Basic Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Basic Information</h3>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Name *</label>
                      <input 
                        type="text" 
                        placeholder="Amazing Bali Adventure" 
                        value={form.packageName} 
                        onChange={(e) => setForm(prev => ({ ...prev, packageName: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        required 
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Destination *</label>
                      <input 
                        type="text" 
                        placeholder="Bali, Indonesia" 
                        value={form.destination} 
                        onChange={(e) => setForm(prev => ({ ...prev, destination: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        required 
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Duration (Days) *</label>
                        <input 
                          type="number" 
                          placeholder="7" 
                          min="1"
                          value={form.durationDays} 
                          onChange={(e) => setForm(prev => ({ ...prev, durationDays: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          required 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Price ($) *</label>
                        <input 
                          type="number" 
                          placeholder="1299" 
                          min="0"
                          step="0.01"
                          value={form.price} 
                          onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                          required 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <select 
                        value={form.category} 
                        onChange={(e) => setForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Adventure">Adventure</option>
                        <option value="Beach">Beach</option>
                        <option value="City Break">City Break</option>
                        <option value="Cultural">Cultural</option>
                        <option value="Cruise">Cruise</option>
                        <option value="Mountain">Mountain</option>
                        <option value="Safari">Safari</option>
                        <option value="Luxury">Luxury</option>
                        <option value="Budget">Budget</option>
                        <option value="Family">Family</option>
                        <option value="Honeymoon">Honeymoon</option>
                        <option value="Business">Business</option>
                        <option value="Religious">Religious</option>
                        <option value="Educational">Educational</option>
                        <option value="Food & Wine">Food & Wine</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <textarea 
                        placeholder="Describe your amazing travel package..." 
                        value={form.description} 
                        onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        rows="4"
                      />
                    </div>
                  </div>

                  {/* Package Details */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">Package Details</h3>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Max Group Size</label>
                        <input 
                          type="number" 
                          placeholder="10" 
                          min="1"
                          value={form.maxGroupSize} 
                          onChange={(e) => setForm(prev => ({ ...prev, maxGroupSize: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Min Age</label>
                        <input 
                          type="number" 
                          placeholder="0" 
                          min="0"
                          value={form.minAge} 
                          onChange={(e) => setForm(prev => ({ ...prev, minAge: e.target.value }))}
                          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                      <select 
                        value={form.difficulty} 
                        onChange={(e) => setForm(prev => ({ ...prev, difficulty: e.target.value }))}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="Easy">Easy</option>
                        <option value="Moderate">Moderate</option>
                        <option value="Challenging">Challenging</option>
                        <option value="Expert">Expert</option>
                      </select>
                    </div>

                    {/* Promo Code Section */}
                    <div className="space-y-4 bg-yellow-50 p-4 rounded-lg">
                      <h4 className="text-md font-medium text-gray-800">Promo Code Settings</h4>
                      
                      <div className="flex items-center">
                        <input 
                          type="checkbox" 
                          id="promoActive"
                          checked={form.promoCodeActive}
                          onChange={(e) => setForm(prev => ({ ...prev, promoCodeActive: e.target.checked }))}
                          className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded" 
                        />
                        <label htmlFor="promoActive" className="text-sm font-medium text-gray-700">
                          Enable Promo Code for this package
                        </label>
                      </div>

                      {form.promoCodeActive && (
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Promo Code</label>
                            <input 
                              type="text" 
                              placeholder="SAVE20" 
                              value={form.promoCode} 
                              onChange={(e) => setForm(prev => ({ ...prev, promoCode: e.target.value.toUpperCase() }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (%)</label>
                            <input 
                              type="number" 
                              placeholder="20" 
                              min="1"
                              max="50"
                              value={form.promoDiscount} 
                              onChange={(e) => setForm(prev => ({ ...prev, promoDiscount: e.target.value }))}
                              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Image Upload */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Package Images</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500" 
                      />
                      {form.images.length > 0 && (
                        <div className="mt-2 grid grid-cols-2 gap-2">
                          {form.images.map((image, index) => (
                            <div key={index} className="relative">
                              <img src={image} alt={`Package ${index + 1}`} className="h-20 w-full object-cover rounded" />
                              <button
                                type="button"
                                onClick={() => removeImage(image)}
                                className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                              >
                                ×
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Inclusions & Exclusions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Inclusions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Inclusions</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add inclusion..."
                        value={newInclusion}
                        onChange={(e) => setNewInclusion(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInclusion())}
                      />
                      <button
                        type="button"
                        onClick={addInclusion}
                        className="bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {form.inclusions.map((inclusion, index) => (
                        <div key={index} className="flex items-center justify-between bg-green-50 p-2 rounded">
                          <span className="text-sm">{inclusion}</span>
                          <button
                            type="button"
                            onClick={() => removeInclusion(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Exclusions */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Exclusions</label>
                    <div className="flex gap-2 mb-2">
                      <input
                        type="text"
                        placeholder="Add exclusion..."
                        value={newExclusion}
                        onChange={(e) => setNewExclusion(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addExclusion())}
                      />
                      <button
                        type="button"
                        onClick={addExclusion}
                        className="bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700"
                      >
                        Add
                      </button>
                    </div>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {form.exclusions.map((exclusion, index) => (
                        <div key={index} className="flex items-center justify-between bg-red-50 p-2 rounded">
                          <span className="text-sm">{exclusion}</span>
                          <button
                            type="button"
                            onClick={() => removeExclusion(index)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-4 pt-6 border-t">
                  <button 
                    type="button" 
                    onClick={handleCloseModal} 
                    className="flex-1 py-3 px-6 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-lg transition-all duration-200"
                  >
                    {editing ? "Update" : "Create"} Package
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default Services;

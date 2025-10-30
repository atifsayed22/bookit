import { useState, useEffect, useMemo } from "react";
import { useUser } from "@clerk/clerk-react";
import axiosInstance from "../../axiosInstance";
import { CheckCircle, XCircle } from "lucide-react";

/**
 * Appointments Management Page
 * Enhanced for better UX and code clarity
 */
const Appointments = () => {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(""); // ✅ start empty
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState("");

  // Appointment status map
  const appointmentStatuses = {
    pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: <i className="fas fa-clock" /> },
    confirmed: { label: "Confirmed", color: "bg-blue-100 text-blue-800", icon: <i className="fas fa-check-circle" /> },
    completed: { label: "Completed", color: "bg-green-100 text-green-800", icon: <i className="fas fa-check-double" /> },
    cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: <i className="fas fa-times-circle" /> },
  };

  /**
   * Load appointments when filters change
   */
  useEffect(() => {
    if (!user?.id) return;

    const loadAppointments = async () => {
      setIsLoading(true);
      setError("");

      try {
        const params = new URLSearchParams();
        if (statusFilter !== "all") params.append("status", statusFilter);
        if (selectedDate) params.append("date", selectedDate);

        const { data } = await axiosInstance.get(
          `/appointments/my-appointments?${params}`
        );

        if (data.success) {
          setAppointments(data.appointments || []);
        } else {
          setAppointments([]);
        }
      } catch (err) {
        setError("Failed to load appointments.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    // Slight delay to avoid flickering when typing filters fast
    const timer = setTimeout(loadAppointments, 300);
    return () => clearTimeout(timer);
  }, [user?.id, selectedDate, statusFilter]);

  /**
   * Update appointment status (with optimistic UI)
   */
  const handleStatusUpdate = async (appointmentId, newStatus) => {
    const previous = [...appointments];
    setAppointments((prev) =>
      prev.map((apt) =>
        apt._id === appointmentId ? { ...apt, status: newStatus } : apt
      )
    );

    try {
      const res = await axiosInstance.put(
        `/appointments/${appointmentId}/status`,
        { status: newStatus }
      );

      if (!res.data.success) {
        setAppointments(previous);
        alert("Failed to update status.");
      }
    } catch (err) {
      setAppointments(previous);
      alert("Error updating appointment.");
    }
  };

  /**
   * Derived filtered appointments
   */
  const filteredAppointments = useMemo(() => {
    const search = searchTerm.toLowerCase();
    return appointments.filter(
      (apt) =>
        apt.customerName.toLowerCase().includes(search) ||
        apt.service?.name.toLowerCase().includes(search) ||
        apt.service?.packageName?.toLowerCase().includes(search) ||
        apt.service?.destination?.toLowerCase().includes(search) ||
        apt.customerEmail.toLowerCase().includes(search)
    );
  }, [appointments, searchTerm]);

  /**
   * Date formatting helpers
   */
  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const formatTime = (timeString) => {
    if (!timeString || typeof timeString !== 'string') {
      return 'N/A';
    }
    try {
      const [h, m] = timeString.split(":");
      const d = new Date();
      d.setHours(h, m);
      return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    } catch (error) {
      return 'N/A';
    }
  };

  /**
   * Quick stats
   */
  const stats = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return {
      total: appointments.length,
      today: appointments.filter(
        (a) => a.appointmentDate.split("T")[0] === today
      ).length,
      pending: appointments.filter((a) => a.status === "pending").length,
      confirmed: appointments.filter((a) => a.status === "confirmed").length,
      revenue: appointments
        .filter((a) => a.status === "confirmed")
        .reduce((sum, a) => sum + (a.totalPrice || 0), 0),
    };
  }, [appointments]);

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          <i className="fas fa-calendar-alt mr-2" />
          Appointments
        </h1>
        <p className="text-gray-600">
          Manage and track your customer appointments in real-time.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: "Total", value: stats.total, color: "text-blue-600" },
          { label: "Today", value: stats.today, color: "text-purple-600" },
          { label: "Pending", value: stats.pending, color: "text-yellow-600" },
          { label: "Confirmed", value: stats.confirmed, color: "text-green-600" },
          { label: "Revenue", value: `₹${stats.revenue}`, color: "text-emerald-600" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-4 rounded-lg shadow text-center">
            <div className={`text-2xl font-bold ₹{stat.color}`}>{stat.value}</div>
            <div className="text-sm text-gray-600">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow mb-6 flex flex-col md:flex-row gap-4 items-center">
        <input
          type="text"
          placeholder="Search by name, service, or email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
        />

        <div className="flex items-center gap-2">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
          />
          {selectedDate && (
            <button
              onClick={() => setSelectedDate("")}
              className="text-sm text-gray-500 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500"
        >
          <option value="all">All Status</option>
          {Object.entries(appointmentStatuses).map(([key, val]) => (
            <option key={key} value={key}>
              {val.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table or Empty State */}
      <div className="bg-white rounded-lg shadow overflow-hidden transition-all">
        {isLoading ? (
          <div className="flex justify-center items-center h-60 text-gray-500">
            <div className="animate-spin h-10 w-10 border-4 border-green-500 border-t-transparent rounded-full"></div>
            <p className="ml-3">Loading appointments...</p>
          </div>
        ) : error ? (
          <div className="text-center py-10 text-red-500 font-medium">
            ⚠️ {error}
          </div>
        ) : filteredAppointments.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
                <tr>
                  <th className="px-6 py-3 text-left">Customer</th>
                  <th className="px-6 py-3 text-left">Service</th>
                  <th className="px-6 py-3 text-left">Date & Time</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Price</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAppointments.map((apt) => {
                  const status = appointmentStatuses[apt.status] || {
                    label: apt.status || "Unknown",
                    color: "bg-gray-100 text-gray-800",
                    icon: <i className="fas fa-question-circle" />
                  };
                  return (
                    <tr key={apt._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{apt.customerName}</div>
                        <div className="text-gray-500">{apt.customerEmail}</div>
                        <div className="text-gray-400">{apt.customerPhone}</div>
                      </td>
                      <td className="px-6 py-4">
                        {apt.service?.packageName || apt.service?.name || "—"}
                        <div className="text-gray-400 text-xs">
                          <span className="flex items-center gap-1">
                            {apt.service?.destination ? (
                              <>
                                <i className="fas fa-map-marker-alt" />
                                {apt.service.destination} • {apt.service.durationDays || 1} days
                              </>
                            ) : (
                              <>
                                <i className="fas fa-clock" />
                                {apt.service?.durationMinutes || 0} mins
                              </>
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {formatDate(apt.appointmentDate)}
                        <div className="text-gray-500">
                          {apt.startTime && apt.endTime ? (
                            `${formatTime(apt.startTime)} – ${formatTime(apt.endTime)}`
                          ) : apt.numberOfTravelers ? (
                            `${apt.numberOfTravelers} travelers`
                          ) : (
                            'Travel Booking'
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${status.color}`}
                        >
                          {status.icon} <span>{status.label}</span>
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium">₹{apt.totalPrice || 0}</td>
                      <td className="px-6 py-4 space-x-2">
                        {apt.status === "pending" && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleStatusUpdate(apt._id, "confirmed")}
                              className="p-2 hover:text-green-600 transition-colors"
                              title="Confirm Booking"
                            >
                               <CheckCircle className="w-4 h-4" /> Accept
                            </button>
                            <button
                              onClick={() => handleStatusUpdate(apt._id, "cancelled")}
                              className="p-2 hover:text-red-600 transition-colors"
                              title="Cancel Booking"
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </button>
                          </div>
                        )}
                        {apt.status === "confirmed" && (
                          <button
                            onClick={() => handleStatusUpdate(apt._id, "completed")}
                            className="p-2 hover:text-green-600 transition-colors"
                            title="Mark as Completed"
                          >
                            <i className="fas fa-check-double text-lg" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 text-gray-600">
            <div className="text-5xl mb-3">
              <i className="fas fa-calendar-times" />
            </div>
            <p>No appointments found for selected filters.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Appointments;

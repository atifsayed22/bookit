import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import axiosInstance from '../../axiosInstance';

/**
 * Business Calendar Page
 * 
 * Learning Concepts:
 * 1. Calendar UI - Building custom calendar components
 * 2. Date Mathematics - Date calculations and comparisons
 * 3. Event Visualization - Displaying events on calendar grid
 * 4. Interactive UI - Click handlers and hover states
 */

const BusinessCalendar = () => {
  const { user } = useUser();
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [viewMode, setViewMode] = useState('month'); // month, week, day

  /**
   * Load appointments for the current month
   * 
   * Learning: Date range queries
   * - Month start/end calculations
   * - API optimization with date ranges
   * - Calendar data loading patterns
   */
  useEffect(() => {
    const loadAppointments = async () => {
      if (user?.id) {
        setIsLoading(true);
        try {
          const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
          const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
          
          const response = await axiosInstance.get(`/api/business/appointments/${user.id}`, {
            params: {
              startDate: startOfMonth.toISOString().split('T')[0],
              endDate: endOfMonth.toISOString().split('T')[0]
            }
          });
          
          if (response.data.success) {
            setAppointments(response.data.appointments || []);
          }
        } catch (error) {
          console.error('Error loading appointments:', error);
          setAppointments([]);
        } finally {
          setIsLoading(false);
        }
      }
    };

    loadAppointments();
  }, [user, currentDate]);

  /**
   * Calendar utility functions
   * 
   * Learning: Date manipulation utilities
   * - Pure functions for date calculations
   * - Reusable calendar logic
   * - Cross-browser date handling
   */
  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    // First day of the calendar (might be from previous month)
    const startCalendar = new Date(firstDay);
    startCalendar.setDate(startCalendar.getDate() - firstDay.getDay());
    
    const days = [];
    const current = new Date(startCalendar);
    
    // Generate 42 days (6 weeks × 7 days)
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    
    return days;
  };

  /**
   * Get appointments for a specific date
   * 
   * Learning: Array filtering with dates
   * - Date comparison techniques
   * - Performance optimization
   * - Data transformation
   */
  const getAppointmentsForDate = (date) => {
    const dateString = date.toISOString().split('T')[0];
    return appointments.filter(apt => 
      apt.appointmentDate.split('T')[0] === dateString
    );
  };

  /**
   * Navigation functions
   * 
   * Learning: State management for navigation
   * - Immutable date updates
   * - Month/year calculations
   * - UI state synchronization
   */
  const navigateMonth = (direction) => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  /**
   * Format month/year for display
   * 
   * Learning: Internationalization patterns
   * - Locale-aware formatting
   * - Consistent date presentation
   * - Accessibility considerations
   */
  const formatMonthYear = (date) => {
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  /**
   * Check if date is today
   * 
   * Learning: Date comparison utility
   * - Cross-timezone handling
   * - Performance optimization
   * - Reusable logic
   */
  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  /**
   * Check if date is in current month
   * 
   * Learning: Month boundary detection
   * - Calendar UI logic
   * - Visual state management
   * - Date range validation
   */
  const isCurrentMonth = (date) => {
    return date.getMonth() === currentDate.getMonth() && 
           date.getFullYear() === currentDate.getFullYear();
  };

  /**
   * Get appointment status color
   * 
   * Learning: Status visualization
   * - Color coding systems
   * - Accessibility considerations
   * - Consistent theming
   */
  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-400',
      confirmed: 'bg-blue-500',
      'in-progress': 'bg-purple-500',
      completed: 'bg-green-500',
      cancelled: 'bg-red-400',
      'no-show': 'bg-gray-400'
    };
    return colors[status] || 'bg-gray-400';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading calendar...</p>
        </div>
      </div>
    );
  }

  const calendarDays = getCalendarDays();

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Calendar 🗓️</h1>
          <p className="text-gray-600">
            View and manage your appointments in calendar format.
          </p>
        </div>
        
        <div className="flex space-x-2 mt-4 sm:mt-0">
          <button
            onClick={goToToday}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Today
          </button>
        </div>
      </div>

      {/* Calendar Controls */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Previous month"
            >
              ← 
            </button>
            
            <h2 className="text-xl font-semibold text-gray-900">
              {formatMonthYear(currentDate)}
            </h2>
            
            <button
              onClick={() => navigateMonth(1)}
              className="p-2 hover:bg-gray-100 rounded-lg"
              title="Next month"
            >
              →
            </button>
          </div>

          <div className="flex space-x-2">
            {['month', 'week', 'day'].map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1 rounded-md text-sm ${
                  viewMode === mode 
                    ? 'bg-green-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {/* Weekday Headers */}
        <div className="grid grid-cols-7 bg-gray-50">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="p-4 text-center font-medium text-gray-700 border-b">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Days */}
        <div className="grid grid-cols-7">
          {calendarDays.map((date, index) => {
            const dayAppointments = getAppointmentsForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const isSelected = selectedDate && date.toDateString() === selectedDate.toDateString();

            return (
              <div
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`min-h-[120px] p-2 border-b border-r cursor-pointer hover:bg-gray-50 ${
                  !isCurrentMonthDay ? 'bg-gray-100 text-gray-400' : ''
                } ${
                  isTodayDate ? 'bg-blue-50 border-blue-200' : ''
                } ${
                  isSelected ? 'bg-green-50 border-green-300' : ''
                }`}
              >
                {/* Date Number */}
                <div className={`text-sm font-medium mb-1 ${
                  isTodayDate ? 'text-blue-600' : isCurrentMonthDay ? 'text-gray-900' : 'text-gray-400'
                }`}>
                  {date.getDate()}
                </div>

                {/* Appointments */}
                <div className="space-y-1">
                  {dayAppointments.slice(0, 3).map((appointment, aptIndex) => (
                    <div
                      key={aptIndex}
                      className={`text-xs p-1 rounded text-white truncate ${getStatusColor(appointment.status)}`}
                      title={`${appointment.customerName} - ${appointment.serviceName} at ${new Date(appointment.appointmentDateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                    >
                      {new Date(appointment.appointmentDateTime).toLocaleTimeString('en-US', { 
                        hour: 'numeric', 
                        minute: '2-digit', 
                        hour12: true 
                      })} {appointment.customerName}
                    </div>
                  ))}
                  
                  {dayAppointments.length > 3 && (
                    <div className="text-xs text-gray-500 font-medium">
                      +{dayAppointments.length - 3} more
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Appointments for {selectedDate.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </h3>
          
          {(() => {
            const dayAppointments = getAppointmentsForDate(selectedDate);
            
            if (dayAppointments.length === 0) {
              return (
                <p className="text-gray-600">No appointments scheduled for this date.</p>
              );
            }

            return (
              <div className="space-y-3">
                {dayAppointments
                  .sort((a, b) => new Date(a.appointmentDateTime) - new Date(b.appointmentDateTime))
                  .map((appointment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(appointment.status)}`}></div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(appointment.appointmentDateTime).toLocaleTimeString('en-US', { 
                              hour: 'numeric', 
                              minute: '2-digit', 
                              hour12: true 
                            })} - {appointment.serviceName}
                          </div>
                          <div className="text-sm text-gray-600">
                            {appointment.customerName} • {appointment.duration} min • ${appointment.price}
                          </div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500 capitalize">
                        {appointment.status.replace('-', ' ')}
                      </div>
                    </div>
                  ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 bg-white p-4 rounded-lg shadow-md">
        <h4 className="font-medium text-gray-900 mb-3">Status Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-yellow-400"></div>
            <span>Pending</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-blue-500"></div>
            <span>Confirmed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-purple-500"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-green-500"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-red-400"></div>
            <span>Cancelled</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded bg-gray-400"></div>
            <span>No Show</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BusinessCalendar;
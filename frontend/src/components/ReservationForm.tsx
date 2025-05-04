import { useState, useEffect } from 'react';
import { useSettings } from '../contexts/SettingsContext';
import { useAuth } from '../contexts/AuthContext';
import { Calendar, Clock, Users, Utensils, CalendarDays, Phone, User } from 'lucide-react';

interface FormData {
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequests: string;
}

const ReservationForm = () => {
  const { settings } = useSettings();
  const { isAuthenticated, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [formData, setFormData] = useState<FormData>({
    name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
    email: user?.email || '',
    phone: '',
    date: '',
    time: '',
    guests: 2,
    specialRequests: '',
  });

  // Calculate min and max date for reservations
  const getMinDate = () => {
    const today = new Date();
    today.setHours(today.getHours() + settings.reservation_settings.min_hours_in_advance);
    return today.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + settings.reservation_settings.max_days_in_advance);
    return maxDate.toISOString().split('T')[0]; // YYYY-MM-DD
  };

  // Generate available time slots for the selected day
  useEffect(() => {
    if (!formData.date) return;

    const selectedDate = new Date(formData.date);
    const dayOfWeek = selectedDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const dayName = dayNames[dayOfWeek] as keyof typeof settings.opening_hours;
    
    // Check if restaurant is closed on selected day
    if (settings.opening_hours[dayName].closed) {
      setAvailableTimes([]);
      setError('Sorry, we are closed on this day. Please select another date.');
      return;
    }

    // Clear any previous errors
    setError(null);

    // Parse opening and closing times
    const openTime = settings.opening_hours[dayName].open;
    const closeTime = settings.opening_hours[dayName].close;
    
    // Generate time slots based on interval
    const times: string[] = [];
    const interval = settings.reservation_settings.time_slot_interval; // in minutes
    const duration = settings.reservation_settings.default_reservation_duration; // in minutes
    
    // Convert HH:MM to minutes since midnight
    const timeToMinutes = (time: string) => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };
    
    // Convert minutes since midnight to HH:MM
    const minutesToTime = (minutes: number) => {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    };
    
    const openMinutes = timeToMinutes(openTime);
    const closeMinutes = timeToMinutes(closeTime);
    
    // Last reservation should end before closing time
    const lastReservationStart = closeMinutes - duration;
    
    // Generate time slots
    for (let time = openMinutes; time <= lastReservationStart; time += interval) {
      times.push(minutesToTime(time));
    }
    
    setAvailableTimes(times);
  }, [formData.date, settings.opening_hours, settings.reservation_settings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Format data for API
      const reservationData = {
        ...formData,
        reservation_date: formData.date,
        reservation_time: formData.time,
        party_size: formData.guests,
        special_requests: formData.specialRequests,
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        user_id: user?.id || null,
      };
      
      // Call reservation API
      const response = await fetch('http://localhost/savoria/backend/api/reservation/create_reservation.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservationData),
      });
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create reservation');
      }
      
      setSuccess(true);
      // Reset form after successful submission
      setFormData({
        name: user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : '',
        email: user?.email || '',
        phone: '',
        date: '',
        time: '',
        guests: 2,
        specialRequests: '',
      });
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Reservation error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Format time from 24h to 12h
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
      <div className="bg-amber-600 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center">
          <CalendarDays className="mr-2 h-6 w-6" />
          Reserve Your Table
        </h2>
        <p className="mt-2">Complete the form below to book your dining experience</p>
      </div>
      
      {success ? (
        <div className="p-8 text-center">
          <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Reservation Confirmed!</h3>
          <p className="text-gray-600 mb-6">
            Thank you for your reservation. We've sent a confirmation email with all the details.
          </p>
          <button
            onClick={() => setSuccess(false)}
            className="bg-amber-600 text-white px-6 py-2 rounded-md hover:bg-amber-700 transition-colors"
          >
            Make Another Reservation
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="bg-red-50 text-red-800 p-4 rounded-md mb-6">
              {error}
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contact Information */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <User className="mr-2 h-5 w-5 text-amber-600" />
                Contact Information
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    placeholder="Your full name"
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    placeholder="your.email@example.com"
                  />
                </div>
                
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    placeholder="(123) 456-7890"
                  />
                </div>
              </div>
            </div>
            
            {/* Reservation Details */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Utensils className="mr-2 h-5 w-5 text-amber-600" />
                Reservation Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <input
                      type="date"
                      id="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={getMinDate()}
                      max={getMaxDate()}
                      required
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Reservations available up to {settings.reservation_settings.max_days_in_advance} days in advance
                  </p>
                </div>
                
                <div>
                  <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                    Time
                  </label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      id="time"
                      name="time"
                      value={formData.time}
                      onChange={handleChange}
                      required
                      disabled={!formData.date || availableTimes.length === 0}
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 appearance-none"
                    >
                      <option value="">Select a time</option>
                      {availableTimes.map(time => (
                        <option key={time} value={time}>
                          {formatTime(time)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="guests" className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Guests
                  </label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                    <select
                      id="guests"
                      name="guests"
                      value={formData.guests}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500 appearance-none"
                    >
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(num => (
                        <option key={num} value={num}>
                          {num} {num === 1 ? 'person' : 'people'}
                        </option>
                      ))}
                      <option value="9">9+ people (large party)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Special Requests */}
          <div className="mt-6">
            <label htmlFor="specialRequests" className="block text-sm font-medium text-gray-700 mb-1">
              Special Requests (Optional)
            </label>
            <textarea
              id="specialRequests"
              name="specialRequests"
              value={formData.specialRequests}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-amber-500 focus:border-amber-500"
              placeholder="Allergies, special occasions, seating preferences, etc."
            ></textarea>
          </div>
          
          {/* Policies */}
          <div className="mt-6 p-4 bg-gray-50 rounded-md text-sm text-gray-700">
            <h4 className="font-medium mb-2">Reservation Policies:</h4>
            <ul className="space-y-1 list-disc list-inside">
              <li>Please arrive on time. We hold reservations for 15 minutes past the scheduled time.</li>
              <li>Cancellations must be made at least {settings.reservation_settings.min_hours_in_advance} hours before your reservation.</li>
              <li>For parties larger than 8, please contact us directly at {settings.phone}.</li>
            </ul>
          </div>
          
          {/* Submit Button */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 text-white py-3 px-6 rounded-md hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition-colors disabled:opacity-70"
            >
              {loading ? 'Processing...' : 'Confirm Reservation'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ReservationForm;

import ReservationForm from '../components/ReservationForm';
import { useSettings } from '../contexts/SettingsContext';
import { MapPin, Clock, Phone, Users, CalendarCheck } from 'lucide-react';

const Reservation = () => {
  const { settings } = useSettings();

  // Format time from 24h to 12h
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };
  
  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-amber-700 text-white py-16">
        <div className="absolute inset-0 bg-cover bg-center opacity-20" style={{ backgroundImage: "url('/images/reservation-bg.jpg')" }}></div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Reserve Your Table</h1>
            <p className="text-xl text-amber-100">
              Experience exceptional dining with your friends and family at {settings.restaurant_name}
            </p>
          </div>
        </div>
      </section>
      
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Reservation Form */}
            <div className="md:col-span-2">
              <ReservationForm />
            </div>
            
            {/* Info Section */}
            <div className="space-y-8">
              {/* Restaurant Hours */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-amber-600" />
                  Opening Hours
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Monday</span>
                    <span className="font-medium">
                      {settings.opening_hours.monday.closed 
                        ? 'Closed' 
                        : `${formatTime(settings.opening_hours.monday.open)} - ${formatTime(settings.opening_hours.monday.close)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tuesday</span>
                    <span className="font-medium">
                      {settings.opening_hours.tuesday.closed 
                        ? 'Closed' 
                        : `${formatTime(settings.opening_hours.tuesday.open)} - ${formatTime(settings.opening_hours.tuesday.close)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Wednesday</span>
                    <span className="font-medium">
                      {settings.opening_hours.wednesday.closed 
                        ? 'Closed' 
                        : `${formatTime(settings.opening_hours.wednesday.open)} - ${formatTime(settings.opening_hours.wednesday.close)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Thursday</span>
                    <span className="font-medium">
                      {settings.opening_hours.thursday.closed 
                        ? 'Closed' 
                        : `${formatTime(settings.opening_hours.thursday.open)} - ${formatTime(settings.opening_hours.thursday.close)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Friday</span>
                    <span className="font-medium">
                      {settings.opening_hours.friday.closed 
                        ? 'Closed' 
                        : `${formatTime(settings.opening_hours.friday.open)} - ${formatTime(settings.opening_hours.friday.close)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Saturday</span>
                    <span className="font-medium">
                      {settings.opening_hours.saturday.closed 
                        ? 'Closed' 
                        : `${formatTime(settings.opening_hours.saturday.open)} - ${formatTime(settings.opening_hours.saturday.close)}`}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sunday</span>
                    <span className="font-medium">
                      {settings.opening_hours.sunday.closed 
                        ? 'Closed' 
                        : `${formatTime(settings.opening_hours.sunday.open)} - ${formatTime(settings.opening_hours.sunday.close)}`}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Contact Information */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Phone className="mr-2 h-5 w-5 text-amber-600" />
                  Contact Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-start">
                    <MapPin className="h-5 w-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Address</p>
                      <p className="text-gray-600">{settings.address}</p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <Phone className="h-5 w-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
                    <div>
                      <p className="font-medium">Phone</p>
                      <p className="text-gray-600">{settings.phone}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Reservation Tips */}
              <div className="bg-white rounded-xl shadow-md p-6">
                <h3 className="text-xl font-semibold mb-4 flex items-center">
                  <Users className="mr-2 h-5 w-5 text-amber-600" />
                  Reservation Tips
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex">
                    <CalendarCheck className="h-5 w-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
                    <span>Book at least {settings.reservation_settings.min_hours_in_advance} hours in advance to secure your preferred time slot.</span>
                  </li>
                  <li className="flex">
                    <Users className="h-5 w-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
                    <span>For parties of more than 8 people, please call us directly for special arrangements.</span>
                  </li>
                  <li className="flex">
                    <Clock className="h-5 w-5 text-amber-600 mt-1 mr-3 flex-shrink-0" />
                    <span>Reservations are held for 15 minutes after the scheduled time.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Reservation;

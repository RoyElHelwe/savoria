import { Link } from 'react-router-dom';
import { Facebook, Instagram, Twitter, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const Footer = () => {
  const { settings } = useSettings();
  const currentYear = new Date().getFullYear();

  const formatTime = (time: string) => {
    // Simple time formatter to convert 24h to 12h format
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  // Format opening hours
  const formatHours = (day: { open: string; close: string; closed: boolean }) => {
    if (day.closed) return 'Closed';
    return `${formatTime(day.open)} - ${formatTime(day.close)}`;
  };

  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1: Logo & About */}
          <div>
            <Link to="/" className="inline-block mb-4">
              <span className="text-2xl font-bold text-amber-500">{settings.restaurant_name}</span>
            </Link>
            <p className="text-gray-400 mb-4">
              Indulge in the finest culinary experience with our exquisite dishes 
              prepared by our world-class chefs.
            </p>
            <div className="flex space-x-4">
              {settings.social_media.facebook && (
                <a href={settings.social_media.facebook} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-500 transition-colors">
                  <Facebook size={20} />
                  <span className="sr-only">Facebook</span>
                </a>
              )}
              {settings.social_media.instagram && (
                <a href={settings.social_media.instagram} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-500 transition-colors">
                  <Instagram size={20} />
                  <span className="sr-only">Instagram</span>
                </a>
              )}
              {settings.social_media.twitter && (
                <a href={settings.social_media.twitter} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-amber-500 transition-colors">
                  <Twitter size={20} />
                  <span className="sr-only">Twitter</span>
                </a>
              )}
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-amber-500">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/menu" className="text-gray-400 hover:text-white transition-colors">
                  Menu
                </Link>
              </li>
              <li>
                <Link to="/reservations" className="text-gray-400 hover:text-white transition-colors">
                  Reservations
                </Link>
              </li>
              <li>
                <Link to="/order-online" className="text-gray-400 hover:text-white transition-colors">
                  Order Online
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-gray-400 hover:text-white transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-400 hover:text-white transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Opening Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-amber-500">Opening Hours</h3>
            <ul className="space-y-2 text-gray-400">
              <li className="flex justify-between items-center">
                <span>Monday</span>
                <span className="font-medium">{formatHours(settings.opening_hours.monday)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Tuesday</span>
                <span className="font-medium">{formatHours(settings.opening_hours.tuesday)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Wednesday</span>
                <span className="font-medium">{formatHours(settings.opening_hours.wednesday)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Thursday</span>
                <span className="font-medium">{formatHours(settings.opening_hours.thursday)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Friday</span>
                <span className="font-medium">{formatHours(settings.opening_hours.friday)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Saturday</span>
                <span className="font-medium">{formatHours(settings.opening_hours.saturday)}</span>
              </li>
              <li className="flex justify-between items-center">
                <span>Sunday</span>
                <span className="font-medium">{formatHours(settings.opening_hours.sunday)}</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-amber-500">Contact Us</h3>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-start space-x-2">
                <MapPin size={20} className="flex-shrink-0 text-amber-500 mt-1" />
                <span>{settings.address}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Phone size={20} className="flex-shrink-0 text-amber-500" />
                <span>{settings.phone}</span>
              </li>
              <li className="flex items-center space-x-2">
                <Mail size={20} className="flex-shrink-0 text-amber-500" />
                <span>{settings.email}</span>
              </li>
              <li className="flex items-center space-x-2 mt-4">
                <Clock size={20} className="flex-shrink-0 text-amber-500" />
                <span className="text-sm">Reservations available up to {settings.reservation_settings.max_days_in_advance} days in advance</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-12 pt-8 border-t border-gray-800">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-1">
              <h3 className="text-lg font-semibold text-white">Stay Updated</h3>
              <p className="text-gray-400 mt-2">Subscribe to our newsletter for special offers and updates</p>
            </div>
            <div className="md:col-span-2">
              <form className="flex flex-col sm:flex-row gap-3">
                <input 
                  type="email" 
                  placeholder="Your email address" 
                  className="px-4 py-2 rounded-md bg-gray-800 text-white border border-gray-700 focus:outline-none focus:border-amber-500 flex-grow"
                />
                <button 
                  type="submit" 
                  className="px-6 py-2 bg-amber-600 text-white rounded-md transition-colors hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-gray-900"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="mt-12 pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            © {currentYear} {settings.restaurant_name}. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0 flex space-x-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gray-400 transition-colors">
              Terms of Service
            </Link>
            <Link to="/sitemap" className="hover:text-gray-400 transition-colors">
              Sitemap
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

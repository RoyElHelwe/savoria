import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSettings } from '../contexts/SettingsContext';
import { 
  Clock, MapPin, Utensils, Phone, CalendarDays, 
  ChefHat, Star, ArrowRight, Coffee, Award, Quote, AlertCircle, Loader
} from 'lucide-react';

// Define interface for featured menu item
interface FeaturedMenuItem {
  item_id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_name: string;
  special_tag?: string;
}

const Home = () => {
  const { settings } = useSettings();
  const [featuredItems, setFeaturedItems] = useState<FeaturedMenuItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch featured menu items
  useEffect(() => {
    const fetchFeaturedItems = async () => {
      try {
        setLoading(true);
        const response = await fetch(`http://localhost/savoria/backend/api/menu/get_featured.php`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch featured menu items');
        }
        
        const data = await response.json();
        
        if (!data.success) {
          throw new Error(data.error || 'Something went wrong');
        }
        
        setFeaturedItems(data.featured_items);
      } catch (err) {
        console.error('Error fetching featured items:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchFeaturedItems();
  }, []);

  // Convert day of week number to day name
  const getDayName = (dayNum: number) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayNum];
  };

  // Get today's opening hours
  const getTodayHours = () => {
    const today = new Date().getDay(); // 0 is Sunday, 1 is Monday, etc.
    const dayName = getDayName(today).toLowerCase() as keyof typeof settings.opening_hours;
    
    if (settings.opening_hours[dayName].closed) {
      return "Closed Today";
    }
    
    // Format time
    const formatTime = (time: string) => {
      const [hours, minutes] = time.split(':');
      const hour = parseInt(hours, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour % 12 || 12;
      return `${hour12}:${minutes} ${ampm}`;
    };
    
    return `${formatTime(settings.opening_hours[dayName].open)} - ${formatTime(settings.opening_hours[dayName].close)}`;
  };

  // Animation variants
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.7 } }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.3
      }
    }
  };

  // Render skeleton cards during loading
  const renderSkeletonCards = () => {
    return Array(3).fill(null).map((_, index) => (
      <motion.div 
        key={`skeleton-${index}`}
        className="group overflow-hidden rounded-2xl shadow-lg bg-white relative"
        variants={fadeInUp}
      >
        <div className="relative overflow-hidden h-80 bg-gray-200 animate-pulse"></div>
        <div className="p-6">
          <div className="flex justify-between items-center mb-3">
            <div className="w-16 h-6 bg-gray-200 animate-pulse rounded"></div>
            <div className="w-32 h-5 bg-gray-200 animate-pulse rounded"></div>
          </div>
          <div className="w-full h-20 bg-gray-200 animate-pulse rounded mb-4"></div>
          <div className="w-28 h-6 bg-gray-200 animate-pulse rounded"></div>
        </div>
      </motion.div>
    ));
  };

  // Render error message
  const renderError = () => (
    <motion.div 
      className="col-span-3 text-center p-10 bg-red-50 rounded-lg border border-red-100"
      variants={fadeInUp}
    >
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h3 className="text-xl font-semibold text-red-700 mb-2">Failed to Load Featured Menu</h3>
      <p className="text-red-600 mb-4">{error}</p>
      <Link 
        to="/menu" 
        className="inline-flex items-center px-6 py-2 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-medium rounded-md transition-colors"
      >
        View Full Menu Instead
      </Link>
    </motion.div>
  );

  return (
    <motion.div 
      initial="initial"
      animate="animate"
      exit={{ opacity: 0 }}
    >
      {/* Hero Section */}
      <section className="relative min-h-[95vh] bg-cover bg-center flex items-center" style={{ backgroundImage: "url('/images/hero-bg.jpg')" }}>
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 to-black/40"></div>
        <div className="container mx-auto px-4 relative z-10  flex flex-col items-center justify-center">
          <motion.div 
            className="max-w-3xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
          >
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-amber-400 font-medium mb-2 tracking-wider text-lg">THE FLAVOR EXPERIENCE</h2>
            </motion.div>
            
            <motion.h1 
              className="text-5xl md:text-7xl font-bold mb-6 text-white leading-tight"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Welcome to <br/><span className="text-amber-500">{settings.restaurant_name}</span>
            </motion.h1>
            
            <motion.p 
              className="text-xl md:text-2xl mb-10 text-gray-100 max-w-2xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Experience culinary excellence with our handcrafted dishes made from the finest local ingredients.
            </motion.p>
            
            <motion.div 
              className="flex flex-wrap gap-4 mb-16 justify-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Link 
                to="/menu" 
                className="bg-amber-500 hover:bg-amber-600 text-white font-medium px-8 py-4 rounded-md transition-all transform hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center"
              >
                <span>Explore Menu</span>
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
              <Link 
                to="/reservations" 
                className="bg-transparent hover:bg-white/10 text-white font-medium px-8 py-4 rounded-md transition-all border-2 border-white inline-flex items-center"
              >
                <CalendarDays className="mr-2 h-5 w-5" />
                <span>Reserve a Table</span>
              </Link>
            </motion.div>
            
            {/* Quick Info Cards */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
            >
              <motion.div 
                className="backdrop-blur-md bg-white/10 p-6 rounded-xl border border-white/20 group hover:bg-white/20 transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="flex items-start">
                  <div className="bg-amber-500/20 p-3 rounded-lg mr-4">
                    <Clock className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-amber-400 font-medium mb-1 tracking-wide text-sm uppercase">Today's Hours</h3>
                    <p className="text-white font-medium text-lg">{getTodayHours()}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="backdrop-blur-md bg-white/10 p-6 rounded-xl border border-white/20 group hover:bg-white/20 transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="flex items-start">
                  <div className="bg-amber-500/20 p-3 rounded-lg mr-4">
                    <Phone className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-amber-400 font-medium mb-1 tracking-wide text-sm uppercase">Contact Us</h3>
                    <p className="text-white font-medium text-lg">{settings.phone}</p>
                  </div>
                </div>
              </motion.div>
              
              <motion.div 
                className="backdrop-blur-md bg-white/10 p-6 rounded-xl border border-white/20 group hover:bg-white/20 transition-all duration-300"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="flex items-start">
                  <div className="bg-amber-500/20 p-3 rounded-lg mr-4">
                    <MapPin className="h-6 w-6 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="text-amber-400 font-medium mb-1 tracking-wide text-sm uppercase">Location</h3>
                    <p className="text-white font-medium text-lg">{settings.address.split(',')[0]}</p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Decorative element */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black to-transparent"></div>
      </section>

      {/* Featured Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div 
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <span className="text-amber-600 font-medium tracking-wider uppercase text-sm">Culinary Excellence</span>
            </motion.div>
            <motion.h2 
              className="text-4xl md:text-5xl font-bold mt-2 mb-4 text-gray-900"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              Our Signature Dishes
            </motion.h2>
            <motion.div 
              className="h-1 w-24 bg-amber-500 mx-auto mb-6"
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.4 }}
            ></motion.div>
            <motion.p 
              className="text-gray-600 text-lg max-w-2xl mx-auto"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5 }}
            >
              Discover our chef's carefully curated selection of signature dishes that have defined our culinary journey.
            </motion.p>
          </motion.div>
          
          <motion.div 
            className="grid md:grid-cols-3 gap-10"
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {loading && renderSkeletonCards()}
            
            {error && renderError()}
            
            {!loading && !error && featuredItems.length === 0 && (
              <motion.div 
                className="col-span-3 text-center p-10"
                variants={fadeInUp}
              >
                <p className="text-gray-500 mb-4">No featured items available at the moment.</p>
                <Link 
                  to="/menu" 
                  className="inline-flex items-center px-6 py-2 border border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white font-medium rounded-md transition-colors"
                >
                  Browse Our Full Menu
                </Link>
              </motion.div>
            )}
            
            {!loading && !error && featuredItems.map((item) => (
              <motion.div 
                key={item.item_id}
                className="group overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 bg-white relative"
                variants={fadeInUp}
                whileHover={{ y: -10 }}
              >
                <div className="relative overflow-hidden h-80">
                  <img 
                    src={item.image_url || "/images/default-food-placeholder.jpg"} 
                    alt={item.name} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent"></div>
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <span className="inline-block px-3 py-1 bg-amber-500 text-white text-xs uppercase tracking-wider rounded-full mb-3">
                      {item.special_tag || item.category_name}
                    </span>
                    <h3 className="text-2xl font-bold text-white">{item.name}</h3>
                    <div className="flex items-center mt-1 text-amber-300">
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                      <Star className="h-4 w-4 fill-current" />
                    </div>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-amber-600 font-semibold text-lg">${item.price.toFixed(2)}</span>
                    <div className="text-gray-500 text-sm">{item.category_name}</div>
                  </div>
                  <p className="text-gray-600 mb-4">{item.description}</p>
                  <Link to={`/menu?item=${item.item_id}`} className="text-amber-600 hover:text-amber-700 font-medium flex items-center group-hover:underline">
                    View Details 
                    <ArrowRight className="h-4 w-4 ml-1 transition-transform group-hover:translate-x-1" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <motion.div 
            className="text-center mt-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Link 
              to="/menu" 
              className="inline-flex items-center px-8 py-3 border-2 border-amber-600 text-amber-600 hover:bg-amber-600 hover:text-white font-medium rounded-md transition-colors"
            >
              <span>View Complete Menu</span>
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* CTA Reservation Banner */}
      <section className="py-24 relative bg-amber-600 overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-black/30"></div>
          <div className="absolute inset-0 bg-gradient-to-r from-amber-900/70 to-transparent"></div>
          <img 
            src="/images/reservation-bg.jpg" 
            alt="Restaurant interior" 
            className="w-full h-full object-cover opacity-60" 
          />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between max-w-5xl mx-auto">
            <motion.div 
              className="mb-10 md:mb-0 md:mr-10"
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
            >
              <span className="text-amber-200 font-medium uppercase tracking-wider text-sm mb-2 block">Don't miss out</span>
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 max-w-xl">Reserve Your Table for an Unforgettable Dining Experience</h2>
              <p className="text-white/90 text-lg max-w-xl">
                Create memories with friends and family in our exceptional atmosphere. Book now to secure your preferred time.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <Link 
                to="/reservations" 
                className="bg-white text-amber-600 hover:bg-amber-50 font-medium px-8 py-4 rounded-md transition-colors inline-flex items-center shadow-xl"
              >
                <CalendarDays className="mr-2 h-5 w-5" />
                <span className="font-semibold">Book a Table</span>
              </Link>
            </motion.div>
          </div>
          
          <motion.div 
            className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.div 
              className="backdrop-blur-sm bg-white/10 p-8 rounded-xl"
              variants={fadeInUp}
            >
              <div className="flex items-start">
                <div className="p-3 bg-white/20 rounded-md mr-4">
                  <Utensils className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">Fine Dining Experience</h3>
                  <p className="text-white/80">Elegant atmosphere perfect for special occasions and intimate dinners.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="backdrop-blur-sm bg-white/10 p-8 rounded-xl"
              variants={fadeInUp}
            >
              <div className="flex items-start">
                <div className="p-3 bg-white/20 rounded-md mr-4">
                  <Award className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">Award-Winning Chef</h3>
                  <p className="text-white/80">Exceptional cuisine crafted by our team of passionate culinary artists.</p>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="backdrop-blur-sm bg-white/10 p-8 rounded-xl"
              variants={fadeInUp}
            >
              <div className="flex items-start">
                <div className="p-3 bg-white/20 rounded-md mr-4">
                  <Clock className="h-7 w-7 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-white text-lg mb-2">Special Events</h3>
                  <p className="text-white/80">Perfect venue for private dinners, celebrations, and corporate events.</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      
      {/* Final CTA */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-6">Experience the Exceptional at {settings.restaurant_name}</h2>
            <p className="text-lg text-gray-300 mb-10">Join us for an unforgettable dining experience. Whether you're celebrating a special occasion or simply craving exceptional cuisine, we're here to make your visit memorable.</p>
            <div className="flex flex-wrap justify-center gap-4">
              <Link 
                to="/reservations" 
                className="bg-amber-500 hover:bg-amber-600 text-white px-8 py-4 rounded-md transition-all font-medium"
              >
                Reserve Your Table
              </Link>
              <Link 
                to="/contact" 
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-md hover:bg-white/10 transition-colors font-medium"
              >
                Contact Us
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </motion.div>
  );
};

export default Home;


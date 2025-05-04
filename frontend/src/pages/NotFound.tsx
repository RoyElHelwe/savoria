import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ArrowLeft, Home, Menu, Calendar } from 'lucide-react';
import { useSettings } from '../contexts/SettingsContext';

const NotFound = () => {
  const { settings } = useSettings();

  return (
    <motion.div 
      className="min-h-[70vh] flex items-center justify-center px-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <span className="text-9xl font-bold text-amber-500">404</span>
          <div className="h-1 w-24 bg-amber-500 mx-auto my-6"></div>
        </motion.div>
        
        <motion.h1 
          className="text-3xl md:text-4xl font-bold text-gray-800 mb-4"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          Page Not Found
        </motion.h1>
        
        <motion.p 
          className="text-gray-600 mb-8 max-w-md mx-auto"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          We're sorry, but the page you're looking for can't be found. 
          It might have been moved, deleted, or perhaps never existed.
        </motion.p>
        
        <motion.div 
          className="grid md:grid-cols-2 gap-4 max-w-md mx-auto text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Link 
            to="/" 
            className="flex items-center justify-center gap-2 bg-amber-600 text-white px-6 py-3 rounded-md hover:bg-amber-700 transition-colors"
          >
            <Home size={18} />
            <span>Back to Home</span>
          </Link>
          
          <Link 
            to="/menu" 
            className="flex items-center justify-center gap-2 border border-amber-600 text-amber-600 px-6 py-3 rounded-md hover:bg-amber-50 transition-colors"
          >
            <Menu size={18} />
            <span>View Menu</span>
          </Link>
        </motion.div>
        
        <motion.div 
          className="mt-8 pt-8 border-t border-gray-200"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <p className="text-gray-500 mb-4">Or you might want to:</p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link 
              to="/reservations" 
              className="flex items-center text-amber-600 hover:text-amber-700 font-medium"
            >
              <Calendar size={16} className="mr-1" />
              Make a Reservation
            </Link>
            <Link 
              to="/contact" 
              className="flex items-center text-amber-600 hover:text-amber-700 font-medium"
            >
              <ArrowLeft size={16} className="mr-1" />
              Contact Us
            </Link>
          </div>
        </motion.div>
        
        <motion.div
          className="mt-12 text-gray-500 text-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.5 }}
        >
          {settings.restaurant_name} &copy; {new Date().getFullYear()}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default NotFound; 
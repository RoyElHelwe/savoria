import { useState, useEffect, JSX } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { 
  Menu, X, User, ShoppingCart, Phone, MapPin, 
  Instagram, Facebook, Twitter, Mail, Calendar, LogOut
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon?: JSX.Element;
}

const Header = () => {
  const { isAuthenticated, user, logout } = useAuth();
  const { settings } = useSettings();
  const [isMenuOpen, setIsMenuOpen] = useState<boolean>(false);
  const [scrolled, setScrolled] = useState<boolean>(false);
  const location = useLocation();

  // Handle scroll effect for sticky header
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 80) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when location changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Menu items based on authentication state and user role
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [
      { label: 'Home', path: '/' },
      { label: 'Menu', path: '/menu' },
      { label: 'Reservations', path: '/reservations' },
      { label: 'Order Online', path: '/order-online' },
      { label: 'About', path: '/about' },
      { label: 'Contact', path: '/contact' },
    ];

    // Add admin/staff links if user has appropriate role
    if (isAuthenticated && user && ['admin', 'manager', 'staff'].includes(user.role)) {
      items.push({ 
        label: 'Dashboard', 
        path: '/admin',
        icon: <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"></span>
      });
    }

    return items;
  };

  // Animation variants
  const logoVariants = {
    normal: { 
      scale: 1, 
      y: 0,
      transition: { duration: 0.3 } 
    },
    scrolled: { 
      scale: 0.9, 
      y: 0,
      transition: { duration: 0.3 } 
    }
  };

  const topBarVariants = {
    visible: { 
      height: 'auto', 
      opacity: 1,
      transition: { duration: 0.3 } 
    },
    hidden: { 
      height: 0, 
      opacity: 0,
      transition: { duration: 0.3 } 
    }
  };

  const mobileMenuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        duration: 0.3,
        staggerChildren: 0.05,
        staggerDirection: -1,
        when: "afterChildren"
      }
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: {
        duration: 0.3,
        staggerChildren: 0.1,
        delayChildren: 0.1
      }
    }
  };

  const menuItemVariants = {
    closed: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.2 }
    },
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2 }
    }
  };

  // Function to check if a menu item is active
  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') {
      return true;
    }
    return location.pathname.startsWith(path) && path !== '/';
  };

  return (
    <header className="w-full fixed top-0 left-0 z-50">
      {/* Top Bar with Contact Info */}
      <AnimatePresence>
        {!scrolled && (
          <motion.div 
            className="bg-gray-900 text-white"
            variants={topBarVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
          >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center space-x-6">
                  <a href={`tel:${settings.phone}`} className="flex items-center hover:text-amber-300 transition-colors">
                    <Phone className="h-3.5 w-3.5 mr-1.5" />
                    <span>{settings.phone}</span>
                  </a>
                  <a href={`mailto:${settings.email}`} className="hidden sm:flex items-center hover:text-amber-300 transition-colors">
                    <Mail className="h-3.5 w-3.5 mr-1.5" />
                    <span>{settings.email}</span>
                  </a>
                  <div className="hidden md:flex items-center text-gray-400">
                    <MapPin className="h-3.5 w-3.5 mr-1.5" />
                    <span className="truncate max-w-[250px]">{settings.address}</span>
                  </div>
                </div>
                <div className="flex space-x-4">
                  {settings.social_media.facebook && (
                    <a 
                      href={settings.social_media.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      aria-label="Facebook"
                      className="hover:text-amber-300 transition-colors"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  )}
                  {settings.social_media.instagram && (
                    <a 
                      href={settings.social_media.instagram} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      aria-label="Instagram"
                      className="hover:text-amber-300 transition-colors"
                    >
                      <Instagram className="h-4 w-4" />
                    </a>
                  )}
                  {settings.social_media.twitter && (
                    <a 
                      href={settings.social_media.twitter} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      aria-label="Twitter"
                      className="hover:text-amber-300 transition-colors"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Navigation */}
      <motion.div 
        className={`transition-all duration-300 ${
          scrolled 
            ? 'bg-white shadow-lg py-3' 
            : 'bg-white py-4'
        }`}
        animate={scrolled ? "scrolled" : "normal"}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center">
                <motion.div variants={logoVariants}>
                  <span className="font-bold text-2xl md:text-3xl text-amber-600 tracking-tight">
                    {settings.restaurant_name}
                  </span>
                </motion.div>
              </Link>
            </div>

            {/* Desktop Nav */}
            <nav className="hidden md:flex items-center space-x-1">
              {getNavItems().map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`relative px-4 py-2 mx-1 text-sm font-medium rounded-md transition-all duration-200 group ${
                    isActive(item.path)
                      ? 'text-amber-600 font-semibold'
                      : 'text-gray-700 hover:text-amber-600'
                  }`}
                >
                  <span className="relative z-10 flex items-center">
                    {item.icon && item.icon}
                    {item.label}
                  </span>
                  
                  {isActive(item.path) && (
                    <motion.span 
                      className="absolute bottom-0 left-0 w-full h-0.5 bg-amber-500"
                      layoutId="navbar-indicator"
                    />
                  )}
                  
                  <span className="absolute inset-0 bg-amber-50 rounded-md opacity-0 group-hover:opacity-100 transition-opacity -z-10"></span>
                </Link>
              ))}
            </nav>

            {/* Auth/User Section */}
            <div className="hidden md:flex items-center space-x-2">
              {isAuthenticated ? (
                <div className="flex items-center">
                  <Link 
                    to="/reservations" 
                    className="flex items-center mr-3 text-sm text-gray-700 hover:text-amber-600 font-medium"
                  >
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span>Book a Table</span>
                  </Link>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="relative h-10 rounded-full hover:bg-amber-50 border border-gray-200">
                        <div className="flex items-center">
                          <div className="h-7 w-7 rounded-full bg-amber-100 flex items-center justify-center mr-2 text-amber-700 font-semibold">
                            {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                          </div>
                          <span className="hidden sm:inline text-sm font-medium text-gray-700">
                            {user?.first_name || user?.username}
                          </span>
                        </div>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                      <DropdownMenuLabel>My Account</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/profile" className="cursor-pointer">Profile</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/orders" className="cursor-pointer">My Orders</Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link to="/reservations/my" className="cursor-pointer">My Reservations</Link>
                      </DropdownMenuItem>
                      {user && ['admin', 'manager', 'staff'].includes(user.role) && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin" className="cursor-pointer">Admin Dashboard</Link>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={logout} className="cursor-pointer text-red-600 hover:text-red-700 hover:bg-red-50">
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ) : (
                <>
                  <Link 
                    to="/reservations" 
                    className="flex items-center mr-1 text-sm text-gray-700 hover:text-amber-600 font-medium"
                  >
                    <Calendar className="h-4 w-4 mr-1.5" />
                    <span>Reservations</span>
                  </Link>
                  <Button variant="ghost" className="hover:bg-amber-50 hover:text-amber-600 text-sm" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button variant="default" className="bg-amber-600 hover:bg-amber-700 text-sm shadow-sm" asChild>
                    <Link to="/register">Sign Up</Link>
                  </Button>
                </>
              )}
              
              <Button 
                variant="outline" 
                size="icon" 
                className="ml-1 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-600 relative" 
                asChild
              >
                <Link to="/order-online" aria-label="View Cart">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-amber-600 text-white text-xs rounded-full flex items-center justify-center">3</span>
                </Link>
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <div className="flex items-center md:hidden space-x-3">
              <Button 
                variant="outline" 
                size="icon" 
                className="hover:bg-amber-50 hover:text-amber-600 hover:border-amber-600 relative" 
                asChild
              >
                <Link to="/order-online" aria-label="View Cart">
                  <ShoppingCart className="h-5 w-5" />
                  <span className="absolute -top-1 -right-1 h-5 w-5 bg-amber-600 text-white text-xs rounded-full flex items-center justify-center">3</span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label="Toggle menu"
                className="h-10 w-10 rounded-full hover:bg-amber-50"
              >
                <motion.div
                  animate={isMenuOpen ? "open" : "closed"}
                  variants={{
                    open: { rotate: 180 },
                    closed: { rotate: 0 }
                  }}
                  transition={{ duration: 0.3 }}
                >
                  {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </motion.div>
              </Button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div 
            className="md:hidden bg-white border-t border-gray-100 shadow-xl overflow-hidden"
            variants={mobileMenuVariants}
            initial="closed"
            animate="open"
            exit="closed"
          >
            <motion.nav className="flex flex-col p-4 space-y-1">
              {getNavItems().map((item) => (
                <motion.div key={item.path} variants={menuItemVariants}>
                  <Link
                    to={item.path}
                    className={`${
                      isActive(item.path)
                        ? 'text-amber-600 bg-amber-50 font-medium'
                        : 'text-gray-700 hover:text-amber-600 hover:bg-amber-50'
                    } px-4 py-3 text-base rounded-md transition-colors flex items-center`}
                  >
                    {item.icon && item.icon}
                    {item.label}
                  </Link>
                </motion.div>
              ))}
            </motion.nav>
            
            <motion.div 
              className="border-t border-gray-200 p-4" 
              variants={menuItemVariants}
            >
              <div className="flex flex-col items-start gap-3">
                <div className="flex items-center text-gray-500 text-sm">
                  <Phone className="h-4 w-4 mr-2 text-amber-600" />
                  <a href={`tel:${settings.phone}`} className="hover:text-amber-600">{settings.phone}</a>
                </div>
                <div className="flex items-center text-gray-500 text-sm">
                  <Mail className="h-4 w-4 mr-2 text-amber-600" />
                  <a href={`mailto:${settings.email}`} className="hover:text-amber-600">{settings.email}</a>
                </div>
                <div className="flex items-start text-gray-500 text-sm">
                  <MapPin className="h-4 w-4 mr-2 text-amber-600 mt-1 flex-shrink-0" />
                  <span>{settings.address}</span>
                </div>
              </div>
            </motion.div>
            
            <motion.div 
              className="pt-4 border-t border-gray-200" 
              variants={menuItemVariants}
            >
              {isAuthenticated ? (
                <div className="px-4 py-3">
                  <div className="mb-3 flex items-center">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center mr-2 text-amber-700 font-semibold">
                      {user?.first_name?.[0] || user?.username?.[0] || 'U'}
                    </div>
                    <div>
                      <div className="font-medium text-gray-800">
                        {user?.first_name && user?.last_name 
                          ? `${user.first_name} ${user.last_name}` 
                          : user?.username || 'User'
                        }
                      </div>
                      <div className="text-sm text-gray-500">{user?.email}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Link to="/profile" className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-center text-sm">
                      Profile
                    </Link>
                    <Link to="/orders" className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-center text-sm">
                      My Orders
                    </Link>
                    <Link to="/reservations/my" className="block px-4 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-center text-sm">
                      My Reservations
                    </Link>
                    <button
                      onClick={logout}
                      className="block w-full px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-center text-sm"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col space-y-3 px-4 pt-2 pb-6">
                  <Button variant="default" className="w-full bg-amber-600 hover:bg-amber-700" asChild>
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button variant="outline" className="w-full border-amber-600 text-amber-600 hover:bg-amber-50" asChild>
                    <Link to="/register">Create Account</Link>
                  </Button>
                </div>
              )}
            </motion.div>
            
            <motion.div 
              className="py-4 px-4 border-t border-gray-200 flex justify-center space-x-6"
              variants={menuItemVariants}
            >
              {settings.social_media.facebook && (
                <a 
                  href={settings.social_media.facebook}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-amber-600"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {settings.social_media.instagram && (
                <a 
                  href={settings.social_media.instagram}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-amber-600"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {settings.social_media.twitter && (
                <a 
                  href={settings.social_media.twitter}
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-amber-600"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};

export default Header;
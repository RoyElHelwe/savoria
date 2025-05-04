import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const navItems = [
    { name: 'Dashboard', path: '/admin' },
    { name: 'Analytics', path: '/admin/analytics' },
    { name: 'Menu Management', path: '/admin/menu' },
    { name: 'Reservations', path: '/admin/reservations' },
    { name: 'Users', path: '/admin/users' },
    { name: 'Settings', path: '/admin/settings' },
  ];

  return (
    <div className="bg-gray-100 min-h-screen">
      {/* Mobile menu button */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-white shadow">
        <h1 className="text-xl font-bold text-amber-700">Savoria Admin</h1>
        <button 
          onClick={() => setMenuOpen(!menuOpen)}
          className="p-2 rounded-md text-gray-500 hover:text-amber-600 focus:outline-none"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={menuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"} />
          </svg>
        </button>
      </div>
      
      <div className="flex">
        {/* Sidebar */}
        <aside 
          className={`bg-white shadow-lg lg:w-64 w-72 fixed inset-y-0 left-0 transform ${
            menuOpen ? 'translate-x-0' : '-translate-x-full'
          } lg:translate-x-0 transition-transform duration-300 ease-in-out z-10`}
        >
          <div className="p-6 hidden lg:block">
            <h1 className="text-2xl font-bold text-amber-700">Savoria Admin</h1>
          </div>
          
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-10 w-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-lg">
                {user?.first_name?.[0]}{user?.last_name?.[0]}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700">{user?.first_name} {user?.last_name}</p>
                <p className="text-xs font-medium text-gray-500 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
          
          <nav className="p-4">
            <ul className="space-y-2">
              {navItems.map((item) => (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`block px-4 py-2 rounded-md text-sm font-medium ${
                      location.pathname === item.path
                        ? 'bg-amber-100 text-amber-700'
                        : 'text-gray-600 hover:bg-amber-50 hover:text-amber-600'
                    }`}
                    onClick={() => setMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          
          <div className="p-4 border-t border-gray-200 mt-auto">
            <Link 
              to="/"
              className="block px-4 py-2 rounded-md text-sm font-medium text-gray-600 hover:bg-amber-50 hover:text-amber-600"
            >
              Back to Website
            </Link>
          </div>
        </aside>
        
        {/* Main content */}
        <main className={`flex-1 p-6 lg:ml-64 transition-all duration-300 ease-in-out ${
          menuOpen ? 'ml-72' : 'ml-0'
        }`}>
          <Outlet />
        </main>
      </div>
      
      {/* Overlay to close the menu on mobile */}
      {menuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-0 lg:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;

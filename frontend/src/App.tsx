import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Menu from './pages/Menu';
import Reservation from './pages/Reservation';
import OrderOnline from './pages/OrderOnline';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminRoute from './components/AdminRoute';
import AdminDashboard from './pages/admin/Dashboard';
import MenuManager from './pages/admin/MenuManager';
import Users from './pages/admin/Users';
import ReservationManager from './pages/admin/ReservationManager';
import Settings from './pages/admin/Settings';
import Analytics from './pages/admin/Analytics';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="flex flex-col min-h-screen">
          <Header />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/menu" element={<Menu />} />
              <Route path="/reservations" element={<Reservation />} />
              <Route path="/order-online" element={<OrderOnline />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Admin Routes */}
              <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>}>
                <Route index element={<div className="p-4 bg-white rounded-lg shadow">
                  <h1 className="text-2xl font-bold mb-4">Dashboard Overview</h1>
                  <p>Welcome to Savoria Restaurant's Admin Dashboard.</p>
                </div>} />
                <Route path="menu" element={<MenuManager />} />
                <Route path="users" element={<Users />} />
                <Route path="reservations" element={<ReservationManager />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="settings" element={<Settings />} />
              </Route>
            </Routes>
          </main>
          <Footer />
        </div>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

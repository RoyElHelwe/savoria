import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { AnimatePresence } from "framer-motion";
import Header from "./components/Header";
import Footer from "./components/Footer";

// Public pages
import Home from "./pages/Home";
import Menu from "./pages/Menu";
import Reservation from "./pages/Reservation";
import OrderOnline from "./pages/OrderOnline";
import OrderTracking from "./pages/OrderTracking";
import Login from "./pages/Login";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NotFound from "./pages/NotFound";
import ScrollToTop from "./components/ScrollToTop";

// Protected routes components
import PrivateRoute from "./components/PrivateRoute";
import AdminRoute from "./components/AdminRoute";
import StaffRoute from "./components/StaffRoute";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import MenuManager from "./pages/admin/MenuManager";
import Users from "./pages/admin/Users";
import ReservationManager from "./pages/admin/ReservationManager";
import Settings from "./pages/admin/Settings";
import Analytics from "./pages/admin/Analytics";

// Staff pages
import StaffDashboard from "./pages/staff/Dashboard";
import StaffReservationManager from "./pages/staff/ReservationManager";
import OrderDetail from "./pages/staff/OrderDetail";
import OrderManager from "./pages/staff/OrderManager";
import CustomerDetails from "./pages/staff/CustomerDetails";

// Customer pages
import Profile from "./pages/customer/Profile";
import MyOrders from "./pages/customer/MyOrders";
import MyReservations from "./pages/customer/MyReservation";

import "./App.css";

// Page transitions wrapper
const PageTransitionWrapper = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public Routes */}
        <Route path="/" element={<Home />} />
        <Route path="/menu" element={<Menu />} />
        <Route path="/reservations" element={<Reservation />} />
        <Route path="/order-online" element={<OrderOnline />} />
        <Route path="/order-tracking/:orderId" element={<OrderTracking />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Customer Routes - Protected for any authenticated user */}
        <Route 
          path="/profile" 
          element={
            <PrivateRoute>
              <Profile />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/orders" 
          element={
            <PrivateRoute>
              <MyOrders />
            </PrivateRoute>
          } 
        />
        <Route 
          path="/reservations/my" 
          element={
            <PrivateRoute>
              <MyReservations />
            </PrivateRoute>
          } 
        />

        {/* Admin Routes */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard />
            </AdminRoute>
          }
        >
          <Route
            index
            element={
              <div className="p-6 bg-white rounded-xl shadow-md">
                <h1 className="text-3xl font-bold mb-4 text-gray-800">
                  Dashboard Overview
                </h1>
                <div className="h-1 w-20 bg-amber-500 mb-6"></div>
                <p className="text-gray-600">
                  Welcome to Savoria Restaurant's Admin Dashboard.
                </p>
              </div>
            }
          />
          <Route path="menu" element={<MenuManager />} />
          <Route path="users" element={<Users />} />
          <Route path="reservations" element={<ReservationManager />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        {/* Staff Routes */}
        <Route
          path="/staff"
          element={
            <StaffRoute>
              <StaffDashboard />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/reservations"
          element={
            <StaffRoute>
              <StaffReservationManager />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/orders"
          element={
            <StaffRoute>
              <OrderManager />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/orders/:id"
          element={
            <StaffRoute>
              <OrderDetail />
            </StaffRoute>
          }
        />
        <Route
          path="/staff/customers/:id"
          element={
            <StaffRoute>
              <CustomerDetails />
            </StaffRoute>
          }
        />

        {/* 404 Page */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SettingsProvider>
          <ScrollToTop />
          <div className="flex flex-col min-h-screen w-full">
            <Header />
            <main className="flex-grow pt-20">
              <PageTransitionWrapper />
            </main>
            <Footer />
          </div>
        </SettingsProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
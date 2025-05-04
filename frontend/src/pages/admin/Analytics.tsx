import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { getSalesData, getReservationData, getPopularItems, getUserGrowth } from '../../services/analyticsService';

interface SalesData {
  label: string;
  amount: number;
}

interface ReservationData {
  label: string;
  count: number;
}

interface PopularItem {
  id: number;
  name: string;
  orders: number;
  revenue: number;
}

interface ReservationsByStatus {
  status: string;
  count: number;
}

interface UserGrowthData {
  label: string;
  users: number;
}

const Analytics = () => {
  const [timeFrame, setTimeFrame] = useState<'week' | 'month' | 'year'>('week');
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [reservationData, setReservationData] = useState<ReservationData[]>([]);
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [reservationsByStatus, setReservationsByStatus] = useState<ReservationsByStatus[]>([]);
  const [userGrowth, setUserGrowth] = useState<UserGrowthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

  // Fetch analytics data from backend
  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Fetch sales data
        const salesResponse = await getSalesData(timeFrame);
        setSalesData(salesResponse.data);
        
        // Fetch reservation data
        const reservationResponse = await getReservationData(timeFrame);
        setReservationData(reservationResponse.reservationData);
        setReservationsByStatus(reservationResponse.statusData);
        
        // Fetch popular items
        const itemsResponse = await getPopularItems(timeFrame);
        setPopularItems(itemsResponse.data);
        
        // Fetch user growth
        const userResponse = await getUserGrowth(timeFrame);
        setUserGrowth(userResponse.growth);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError('Failed to load analytics data');
        
        // Fallback to mock data if API calls fail
        // This is just for demonstration - would be removed in production
        const mockSalesData: SalesData[] = [
          { label: 'Mon', amount: 1200 },
          { label: 'Tue', amount: 980 },
          { label: 'Wed', amount: 1500 },
          { label: 'Thu', amount: 1800 },
          { label: 'Fri', amount: 2400 },
          { label: 'Sat', amount: 3100 },
          { label: 'Sun', amount: 2200 },
        ];
        
        const mockReservationData: ReservationData[] = [
          { label: 'Mon', count: 8 },
          { label: 'Tue', count: 6 },
          { label: 'Wed', count: 12 },
          { label: 'Thu', count: 15 },
          { label: 'Fri', count: 24 },
          { label: 'Sat', count: 32 },
          { label: 'Sun', count: 21 },
        ];
        
        const mockPopularItems: PopularItem[] = [
          { id: 1, name: 'Margherita Pizza', orders: 145, revenue: 2175 },
          { id: 2, name: 'Beef Burger', orders: 120, revenue: 1440 },
          { id: 3, name: 'Caesar Salad', orders: 90, revenue: 990 },
          { id: 4, name: 'Spaghetti Carbonara', orders: 85, revenue: 1275 },
          { id: 5, name: 'Grilled Salmon', orders: 78, revenue: 1560 },
        ];
        
        const mockReservationsByStatus: ReservationsByStatus[] = [
          { status: 'Confirmed', count: 78 },
          { status: 'Cancelled', count: 12 },
          { status: 'Completed', count: 65 },
        ];
        
        const mockUserGrowth: UserGrowthData[] = [
          { label: 'Jan', users: 120 },
          { label: 'Feb', users: 145 },
          { label: 'Mar', users: 162 },
          { label: 'Apr', users: 190 },
          { label: 'May', users: 210 },
          { label: 'Jun', users: 252 },
        ];
        
        setSalesData(mockSalesData);
        setReservationData(mockReservationData);
        setPopularItems(mockPopularItems);
        setReservationsByStatus(mockReservationsByStatus);
        setUserGrowth(mockUserGrowth);
      } finally {
        setLoading(false);
      }
    };
    
    fetchAnalytics();
  }, [timeFrame]);

  const onTimeFrameChange = (newTimeFrame: 'week' | 'month' | 'year') => {
    setTimeFrame(newTimeFrame);
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse bg-gray-200 h-8 w-1/4 mb-4 rounded"></div>
        <div className="animate-pulse bg-gray-200 h-80 w-full rounded mb-8"></div>
        <div className="animate-pulse bg-gray-200 h-80 w-full rounded"></div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Restaurant Analytics</h1>
        
        <div className="flex space-x-2">
          <button 
            onClick={() => onTimeFrameChange('week')}
            className={`px-3 py-1 rounded-md ${
              timeFrame === 'week' 
                ? 'bg-amber-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
          <button 
            onClick={() => onTimeFrameChange('month')}
            className={`px-3 py-1 rounded-md ${
              timeFrame === 'month' 
                ? 'bg-amber-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Month
          </button>
          <button 
            onClick={() => onTimeFrameChange('year')}
            className={`px-3 py-1 rounded-md ${
              timeFrame === 'year' 
                ? 'bg-amber-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Year
          </button>
        </div>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-700 rounded-md">
          <p className="font-medium">Note: {error}</p>
          <p className="text-sm">Showing demo data for preview purposes.</p>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Sales Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Sales Overview</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={salesData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, 'Sales']} />
                <Legend />
                <Bar dataKey="amount" name="Sales ($)" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Reservations Chart */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Reservation Activity</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={reservationData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" name="Reservations" fill="#82ca9d" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Popular Menu Items */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Top Menu Items</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Orders</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {popularItems.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{item.orders}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${item.revenue}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Reservations by Status */}
        <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Reservations by Status</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={reservationsByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                  nameKey="status"
                >
                  {reservationsByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [`${value} reservations`, name]} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      
      {/* User Growth */}
      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
        <h2 className="text-lg font-semibold mb-4">User Growth</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={userGrowth}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="label" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="users" name="New Users" fill="#F59E0B" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 
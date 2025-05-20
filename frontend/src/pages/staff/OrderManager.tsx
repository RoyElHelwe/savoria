import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../config';
import LoadingSpinner from '../../components/LoadingSpinner';
import { OrderList } from '@/services/orderService';



const OrderManager: React.FC = () => {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderList[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        navigate('/login');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/staff/orders/get_active_orders.php`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        setOrders(data.orders || []);
      } else {
        setError(data.error || 'Failed to load orders');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`An error occurred while loading orders: ${errorMessage}`);
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    // If clicking the same field, toggle direction
    if (field === sortField) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // New field, set default direction
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric'
    }).format(date);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'delivered':
      case 'ready for pickup':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'out for delivery':
      case 'preparing':
        return 'bg-amber-100 text-amber-800';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Filter and sort orders
  const filteredOrders = orders
    .filter(order => {
      // Apply search filter
      const searchLower = searchTerm.toLowerCase();
      const searchMatch = 
        (order.customer_name?.toLowerCase() || '').includes(searchLower) ||
        (order.customer_email?.toLowerCase() || '').includes(searchLower) ||
        (order.status?.toLowerCase() || '').includes(searchLower);

      // Apply status filter
      const statusMatch = statusFilter === 'all' || 
        (order.status?.toLowerCase() || '') === statusFilter.toLowerCase();

      return searchMatch && statusMatch;
    })
    .sort((a, b) => {
      // Handle string fields
      if (sortField === 'customer_name' || sortField === 'status') {
        const aValue = (a[sortField as keyof OrderList] || '')?.toString().toLowerCase();
        const bValue = (b[sortField as keyof OrderList] || '')?.toString().toLowerCase();
        
        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      } 
      // Handle date fields
      else if (sortField === 'created_at' || sortField === 'updated_at') {
        const aDate = new Date(a[sortField as keyof OrderList] as string).getTime();
        const bDate = new Date(b[sortField as keyof OrderList] as string).getTime();
        
        return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
      } 
      // Handle numeric fields
      else {
        const aValue = Number(a[sortField as keyof OrderList] || 0);
        const bValue = Number(b[sortField as keyof OrderList] || 0);
        
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });

  // Get unique status values for filter dropdown
  const uniqueStatuses = Array.from(new Set(orders.map(order => order.status?.toLowerCase()))).filter(Boolean);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Order Management</h1>
        </div>
        <button 
          onClick={fetchOrders}
          className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-md flex items-center"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
          </svg>
          Refresh
        </button>
      </div>
      
      <div className="h-1 w-20 bg-amber-500 mb-6"></div>
      
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-lg shadow mb-6">
          <div className="font-medium">Error</div>
          <div>{error}</div>
        </div>
      )}
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold mb-4">Filters</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Search Orders
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                placeholder="Search by ID, customer name, email, or status"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-2">
                Status Filter
              </label>
              <select
                className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-amber-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Statuses</option>
                {uniqueStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('order_id')}
                >
                  <div className="flex items-center">
                    Order ID
                    {sortField === 'order_id' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('customer_name')}
                >
                  <div className="flex items-center">
                    Customer
                    {sortField === 'customer_name' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Status
                    {sortField === 'status' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('total_amount')}
                >
                  <div className="flex items-center">
                    Total
                    {sortField === 'total_amount' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  className="px-4 py-3 text-left text-sm font-medium text-gray-500 cursor-pointer"
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Date
                    {sortField === 'created_at' && (
                      <span className="ml-1">
                        {sortDirection === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
                <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.length > 0 ? (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      #{order.id}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{order.customer_name || 'Guest'}</div>
                      <div className="text-sm text-gray-500">{order.customer_email || 'No email'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      ${order.total_amount.toFixed(2)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {formatDate(order.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <Link
                        to={`/staff/orders/${order.id}`}
                        className="text-amber-600 hover:text-amber-800 font-medium text-sm"
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">
                    {orders.length === 0 ? (
                      <div>
                        <p>No orders found</p>
                        <p className="text-sm mt-1">There are currently no orders in the system.</p>
                      </div>
                    ) : (
                      <div>
                        <p>No matching orders</p>
                        <p className="text-sm mt-1">Try adjusting your search or filter criteria.</p>
                      </div>
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t bg-gray-50 text-sm text-gray-500">
          Showing {filteredOrders.length} of {orders.length} orders
        </div>
      </div>
      
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Orders by Status</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { status: 'pending', label: 'Pending', color: 'bg-gray-100' },
            { status: 'confirmed', label: 'Confirmed', color: 'bg-blue-100' },
            { status: 'preparing', label: 'Preparing', color: 'bg-amber-100' },
            { status: 'out for delivery', label: 'Out for Delivery', color: 'bg-amber-100' },
            { status: 'delivered', label: 'Delivered', color: 'bg-green-100' },
            { status: 'ready for pickup', label: 'Ready for Pickup', color: 'bg-green-100' },
            { status: 'completed', label: 'Completed', color: 'bg-green-100' },
            { status: 'cancelled', label: 'Cancelled', color: 'bg-red-100' }
          ].map((statusInfo) => {
            const count = orders.filter(order => 
              order.status?.toLowerCase() === statusInfo.status.toLowerCase()
            ).length;
            
            return (
              <div 
                key={statusInfo.status} 
                className={`${statusInfo.color} p-4 rounded-lg cursor-pointer hover:shadow-md transition`}
                onClick={() => setStatusFilter(statusInfo.status)}
              >
                <div className="text-lg font-bold">{count}</div>
                <div className="text-sm">{statusInfo.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OrderManager;
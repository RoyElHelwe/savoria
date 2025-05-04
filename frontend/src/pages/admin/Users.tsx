import { useState, useEffect } from 'react';
import { UserRole } from '../../contexts/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  role: UserRole;
  created_at: string;
  last_login?: string;
}

// User management API calls
const fetchUsers = async (): Promise<{ success: boolean; data: User[]; error?: string }> => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('http://localhost/savoria/backend/api/admin/users/get_all_users.php', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching users:', error);
    return { success: false, data: [], error: 'Failed to fetch users' };
  }
};

const updateUserRole = async (
  userId: number, 
  role: UserRole
): Promise<{ success: boolean; error?: string }> => {
  const token = localStorage.getItem('token');
  try {
    const response = await fetch('http://localhost/savoria/backend/api/admin/users/update_role.php', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ user_id: userId, role })
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error updating user role:', error);
    return { success: false, error: 'Failed to update user role' };
  }
};

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [roleChangeLoading, setRoleChangeLoading] = useState<boolean>(false);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      
      try {
        const response = await fetchUsers();
        
        if (response.success) {
          setUsers(response.data);
        } else {
          setError(response.error || 'Failed to load users');
        }
      } catch (err) {
        setError('An error occurred while loading users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    loadUsers();
  }, []);

  const handleRoleChange = async (userId: number, newRole: UserRole) => {
    setRoleChangeLoading(true);
    
    try {
      const response = await updateUserRole(userId, newRole);
      
      if (response.success) {
        // Update the user in the local state
        setUsers(prevUsers => 
          prevUsers.map(user => 
            user.id === userId 
              ? { ...user, role: newRole } 
              : user
          )
        );
      } else {
        setError(response.error || 'Failed to update user role');
      }
    } catch (err) {
      setError('An error occurred while updating user role');
      console.error(err);
    } finally {
      setRoleChangeLoading(false);
    }
  };

  if (loading && users.length === 0) {
    return <div className="p-4">Loading users...</div>;
  }

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h1 className="text-2xl font-bold mb-6">User Management</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Username</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-amber-600 text-white flex items-center justify-center font-bold text-lg">
                      {user.first_name[0]}{user.last_name[0]}
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-medium text-gray-900">
                        {user.first_name} {user.last_name}
                      </div>
                      {user.phone && (
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.username}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <select
                    className="text-sm rounded-md border-gray-300 shadow-sm focus:border-amber-500 focus:ring-amber-500"
                    value={user.role}
                    onChange={(e) => handleRoleChange(user.id, e.target.value as UserRole)}
                    disabled={roleChangeLoading}
                  >
                    <option value="customer">Customer</option>
                    <option value="staff">Staff</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    onClick={() => setSelectedUser(user)}
                    className="text-indigo-600 hover:text-indigo-900 mr-3"
                  >
                    View Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* User details modal could be added here */}
      {selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">User Details</h2>
            
            <div className="space-y-3">
              <div>
                <h3 className="text-sm font-medium text-gray-500">Name</h3>
                <p>{selectedUser.first_name} {selectedUser.last_name}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Email</h3>
                <p>{selectedUser.email}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Username</h3>
                <p>{selectedUser.username}</p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Role</h3>
                <p className="capitalize">{selectedUser.role}</p>
              </div>
              
              {selectedUser.phone && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Phone</h3>
                  <p>{selectedUser.phone}</p>
                </div>
              )}
              
              {selectedUser.address && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Address</h3>
                  <p>{selectedUser.address}</p>
                </div>
              )}
              
              <div>
                <h3 className="text-sm font-medium text-gray-500">Created</h3>
                <p>{new Date(selectedUser.created_at).toLocaleString()}</p>
              </div>
              
              {selectedUser.last_login && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500">Last Login</h3>
                  <p>{new Date(selectedUser.last_login).toLocaleString()}</p>
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedUser(null)}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Users;

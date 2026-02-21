import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { DollarSign, Clock, CheckCircle, Users, Loader } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ revenue: 0, activeOrders: 0, completedOrdersCount: 0, availableTables: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get auth token
  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.token;
  };

  // API configuration
  const api = axios.create({
    baseURL: 'http://localhost:5002/api',
    headers: {
      'Authorization': `Bearer ${getAuthToken()}`
    }
  });

  // Fetch dashboard data
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      
      // Fetch orders
      const ordersResponse = await api.get('/orders');
      const allOrders = ordersResponse.data.orders;
      
      // Calculate stats
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const todayOrders = allOrders.filter(order => 
        new Date(order.createdAt) >= today
      );
      
      const revenue = todayOrders
        .filter(order => order.isPaid)
        .reduce((sum, order) => sum + order.total, 0);
      
      const activeOrders = allOrders.filter(order => 
        ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'].includes(order.status)
      ).length;
      
      const completedOrdersCount = todayOrders.filter(order => 
        order.status === 'SERVED'
      ).length;
      
      setStats({
        revenue,
        activeOrders,
        completedOrdersCount,
        availableTables: 0 // This would need table data
      });
      
      setOrders(allOrders.slice(-5).reverse());
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      
      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-emerald-600" size={32} />
            <span className="text-gray-600 font-bold">Loading dashboard...</span>
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today Revenue Card */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Today Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">Rs.{stats.revenue.toFixed(2)}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <DollarSign className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Active Orders Card */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <Clock className="h-6 w-6 text-orange-600" />
            </div>
          </div>
        </div>

        {/* Completed Orders Card */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Completed Orders</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.completedOrdersCount}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <CheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Available Tables Card */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Available Tables</h3>
              <p className="text-2xl font-bold text-gray-900">{stats.availableTables}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
        {orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map((order) => (
              <div key={order._id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Order #{order.orderId}</span>
                <span>Rs.{order.total?.toFixed(2) || '0.00'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No orders yet</p>
        )}
      </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboard;
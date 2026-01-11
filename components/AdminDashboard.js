import React from 'react';
import { DollarSign, Clock, CheckCircle, Users } from 'lucide-react';

const AdminDashboard = ({ stats, orders }) => {
  
  // Simple fallback if stats is undefined
  const safeStats = stats || { revenue: 0, activeOrders: 0, completedOrdersCount: 0, availableTables: 0 };
  const safeOrders = orders || [];
  
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Today Revenue Card */}
        <div className="bg-white rounded-lg p-6 shadow-lg border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-500">Today Revenue</h3>
              <p className="text-2xl font-bold text-gray-900">Rs.{safeStats.revenue.toFixed(2)}</p>
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
              <p className="text-2xl font-bold text-gray-900">{safeStats.activeOrders}</p>
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
              <p className="text-2xl font-bold text-gray-900">{safeStats.completedOrdersCount}</p>
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
              <p className="text-2xl font-bold text-gray-900">{safeStats.availableTables}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <Users className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white rounded-lg p-6 shadow">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Orders</h3>
        {safeOrders.length > 0 ? (
          <div className="space-y-2">
            {safeOrders.slice(-5).map((order) => (
              <div key={order.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                <span>Order #{order.id}</span>
                <span>Rs.{order.total?.toFixed(2) || '0.00'}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No orders yet</p>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
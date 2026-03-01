import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { OrderStatus, UserRole } from '../types';
import { ChefHat, CheckCircle2, Clock, Eye, ShoppingBasket, Play, CheckCircle, Loader } from 'lucide-react';

const KitchenDisplay = ({ role }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

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

  // Fetch orders from backend
  const fetchOrders = async (isInitialLoad = false) => {
    try {
      if (isInitialLoad) {
        setLoading(true);
      } else {
        setIsRefreshing(true);
      }
      const response = await api.get('/orders');
      console.log('📦 Fetched orders:', response.data.orders);
      const backendOrders = response.data.orders.map(order => ({
        id: order._id,
        orderId: order.orderId,
        tableId: order.tableId,
        tableNumber: order.tableNumber,
        items: order.items.map(item => {
          console.log('📋 Item:', item.name, 'Status:', item.status);
          return {
            id: item._id,
            menuItemId: item.menuItem,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
            status: item.status || 'PENDING', // Use item-level status
            notes: item.specialInstructions || ''
          };
        }),
        status: order.status,
        total: order.total,
        createdAt: new Date(order.createdAt).getTime()
      }));
      setOrders(backendOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      if (isInitialLoad) {
        showMessage('error', 'Failed to load orders');
      }
    } finally {
      if (isInitialLoad) {
        setLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  };

  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  // Update order status
  const handleUpdateOrderStatus = async (orderId, newStatus) => {
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      showMessage('success', `Order status updated to ${newStatus}`);
      fetchOrders(false); // Refresh without loading spinner
    } catch (error) {
      console.error('Error updating order status:', error);
      showMessage('error', 'Failed to update order status');
    }
  };

  // Update item status (individual item)
  const handleUpdateItemStatus = async (orderId, itemId, newStatus) => {
    try {
      console.log('🔧 Updating item status:', { orderId, itemId, newStatus });
      const response = await api.patch(`/orders/${orderId}/status`, { 
        status: newStatus,
        itemId: itemId
      });
      console.log('✅ Item status update response:', response.data);
      showMessage('success', `Item status updated to ${newStatus}`);
      fetchOrders(false); // Refresh without loading spinner
    } catch (error) {
      console.error('❌ Error updating item status:', error);
      console.error('Error details:', error.response?.data || error.message);
      showMessage('error', error.response?.data?.message || 'Failed to update item status');
    }
  };

  // Fetch orders on mount and set up polling
  useEffect(() => {
    fetchOrders(true); // Initial load with loading spinner
    const interval = setInterval(() => fetchOrders(false), 5000); // Background refresh without loading spinner
    return () => clearInterval(interval);
  }, []);

  const activeOrders = orders.filter(o => o.status !== 'SERVED' && o.status !== 'CANCELLED');
  
  // Waiters are restricted from performing status updates
  const isReadOnly = role === UserRole.WAITER;

  const getItemStatusAction = (item) => {
    if (isReadOnly) return null;

    switch (item.status) {
      case 'PENDING': 
        return { label: 'START', next: 'PREPARING', color: 'bg-orange-600 hover:bg-orange-700', icon: <Play size={14} /> };
      case 'PREPARING': 
        return { label: 'PREPARING', next: 'READY', color: 'bg-blue-600 hover:bg-blue-700', icon: <Clock size={14} /> };
      case 'READY':
        return { label: 'READY', next: null, color: 'bg-emerald-600', icon: <CheckCircle size={14} /> };
      default: 
        return null;
    }
  };

  const getTimeElapsed = (createdAt) => {
    const minutes = Math.floor((Date.now() - createdAt) / 60000);
    return minutes > 60 ? '1h+' : `${minutes}m`;
  };

  const getTotalItemsCount = (order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  return (
    <div className="space-y-6">
      {/* Message Display */}
      {message.text && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 ${
          message.type === 'success' 
            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
            : 'bg-red-50 text-red-700 border border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Live Order Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isReadOnly ? 'Viewing active orders in read-only mode' : 'Manage kitchen throughput and service readiness'}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase">Pending</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase">Cooking</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase">Ready</span>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-32">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-emerald-600" size={32} />
            <span className="text-gray-600 font-bold">Loading orders...</span>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {activeOrders.length > 0 ? activeOrders.map((order) => {
          const isLate = (Date.now() - order.createdAt) > 15 * 60000;
          const totalItemsCount = getTotalItemsCount(order);
          const isAllReady = order.items.every(item => item.status === 'READY');

          return (
            <div 
              key={order.id} 
              className={`bg-white rounded-2xl border-t-8 shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-xl ${
                order.status === 'PENDING' ? 'border-orange-500' :
                order.status === 'PREPARING' ? 'border-blue-500' :
                'border-emerald-500'
              }`}
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-gray-900 whitespace-nowrap">Table {order.tableNumber}</h3>
                    <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm">
                      <ShoppingBasket size={12} />
                      {totalItemsCount} Items
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{order.orderId}</span>
                    {isReadOnly && (
                      <span className="flex items-center gap-1 text-[8px] font-black bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded uppercase">
                        <Eye size={10} /> View Only
                      </span>
                    )}
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black shrink-0 ${
                  isLate ? 'bg-red-100 text-red-600 animate-pulse' : 'bg-white border border-gray-100 text-gray-600 shadow-sm'
                }`}>
                  <Clock size={14} />
                  {getTimeElapsed(order.createdAt)}
                </div>
              </div>

              <div className="flex-1 p-6 space-y-4">
                <div className="space-y-3">
                  {order.items.map((item, idx) => {
                    const action = getItemStatusAction(item);
                    return (
                      <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-700 bg-white border border-emerald-100 px-1.5 py-0.5 rounded-lg shadow-sm">
                              {item.quantity}×
                            </span>
                            <p className="font-bold text-gray-900 text-sm leading-tight">{item.name}</p>
                          </div>
                          
                          {/* Item Status Controls */}
                          {!isReadOnly && action ? (
                            <button 
                              onClick={() => handleUpdateItemStatus(order.id, item.id, action.next)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-white shadow-sm transition-all active:scale-95 ${action.color}`}
                            >
                              {action.icon}
                              {action.label.toUpperCase()}
                            </button>
                          ) : (
                            <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm ${
                              item.status === 'PENDING' ? 'bg-orange-100 text-orange-700' :
                              item.status === 'PREPARING' ? 'bg-blue-100 text-blue-700' :
                              'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.status}
                            </span>
                          )}
                        </div>

                        {item.notes && (
                          <div className="flex items-start gap-1">
                            <span className="text-[8px] font-black text-orange-600 bg-orange-100 px-1 py-0.5 rounded uppercase tracking-tighter">Note</span>
                            <p className="text-[10px] text-orange-700 font-semibold italic">{item.notes}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Order Level Action */}
              <div className="px-5 py-4 bg-gray-50/50 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Order Progress</span>
                    <span className={`text-[11px] font-black uppercase tracking-tighter ${
                      order.status === 'PENDING' ? 'text-orange-600' :
                      order.status === 'PREPARING' ? 'text-blue-600' :
                      'text-emerald-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  {!isReadOnly && isAllReady && (
                    <button 
                      onClick={() => handleUpdateOrderStatus(order.id, 'SERVED')}
                      className="px-4 py-2 bg-emerald-600 text-white text-[11px] font-black rounded-xl hover:bg-emerald-700 shadow-md transition-all active:scale-95 flex items-center gap-2"
                    >
                      <ChefHat size={14} />
                      MARK SERVED
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="col-span-full py-32 bg-white rounded-[40px] border-4 border-dashed border-gray-100 flex flex-col items-center justify-center text-gray-300">
            <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6">
              <CheckCircle2 size={64} className="opacity-20 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-gray-400">Order Queue Empty</p>
            <p className="text-sm font-medium mt-2">All guests have been served. Great job!</p>
          </div>
        )}
        </div>
      )}
    </div>
  );
};

export default KitchenDisplay;
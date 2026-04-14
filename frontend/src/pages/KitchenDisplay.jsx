import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { UserRole } from '../types';
import { CheckCircle2, Clock, ShoppingBasket, Loader } from 'lucide-react';

const KitchenDisplay = ({ role }) => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [justServedOrderIds, setJustServedOrderIds] = useState([]);
  const latestFetchIdRef = useRef(0);

  const mapOrder = (order) => ({
    id: String(order._id || order.id || ''),
    orderId: order.orderId,
    tableId: order.tableId,
    tableNumber: order.tableNumber,
    items: (order.items || []).map((item) => ({
      id: String(item._id || item.id || ''),
      menuItemId: String(item.menuItem || item.menuItemId || ''),
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      status: item.status || 'PENDING',
      notes: item.specialInstructions || ''
    })),
    status: order.status,
    total: order.total,
    createdAt: new Date(order.createdAt).getTime()
  });

  // Get auth token
  const getAuthToken = () => {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    return user.token;
  };

  // API configuration
  const api = axios.create({
    baseURL: 'http://localhost:5002/api',
    headers: { 'Authorization': `Bearer ${getAuthToken()}` }
  });

  // Fetch orders from backend
  const fetchOrders = async (isInitialLoad = false) => {
    const fetchId = ++latestFetchIdRef.current;
    try {
      if (isInitialLoad) setLoading(true);
      const response = await api.get('/orders');
      const backendOrders = response.data.orders.map(mapOrder);
      // Ignore stale responses to prevent click updates from being overwritten.
      if (fetchId === latestFetchIdRef.current) {
        setOrders(backendOrders);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      if (isInitialLoad) setLoading(false);
    }
  };

  // Update individual item status
  const handleUpdateItemStatus = async (orderId, itemId, newStatus) => {
    const normalizedOrderId = String(orderId);
    const normalizedItemId = String(itemId);

    if (!normalizedItemId) {
      console.error('Missing itemId for status update', { orderId: normalizedOrderId, newStatus });
      return;
    }

    if (newStatus === 'SERVED') {
      setJustServedOrderIds((prev) => (prev.includes(normalizedOrderId) ? prev : [...prev, normalizedOrderId]));
      setTimeout(() => {
        setJustServedOrderIds((prev) => prev.filter((id) => id !== normalizedOrderId));
      }, 3500);
    }

    // Immediate local update so the click always feels responsive
    setOrders((prev) =>
      prev.map((order) => {
        if (order.id !== normalizedOrderId) return order;

        const updatedItems = order.items.map((item) =>
          item.id === normalizedItemId ? { ...item, status: newStatus } : item
        );

        const allStatuses = updatedItems.map((item) => item.status);
        const nextOrderStatus = allStatuses.every((s) => s === 'SERVED')
          ? 'SERVED'
          : allStatuses.every((s) => s === 'READY' || s === 'SERVED')
          ? 'READY'
          : allStatuses.some((s) => s === 'PREPARING' || s === 'READY' || s === 'SERVED')
          ? 'PREPARING'
          : 'PENDING';

        return { ...order, items: updatedItems, status: nextOrderStatus };
      })
    );

    try {
      const response = await api.patch(`/orders/${normalizedOrderId}/status`, { status: newStatus, itemId: normalizedItemId });
      const updated = response?.data?.order;

      if (updated) {
        const mappedUpdated = mapOrder(updated);
        const patchedItems = mappedUpdated.items.map((item) =>
          item.id === normalizedItemId ? { ...item, status: newStatus } : item
        );
        const patchedOrder = {
          ...mappedUpdated,
          items: patchedItems,
          status: deriveOrderStatusFromItems(patchedItems)
        };
        // Invalidate older in-flight fetch responses before applying update.
        latestFetchIdRef.current += 1;
        setOrders((prev) => prev.map((order) => (order.id === normalizedOrderId ? patchedOrder : order)));
      } else {
        fetchOrders(false);
      }
    } catch (error) {
      // Fallback endpoint for compatibility with older backend logic
      try {
        const fallbackResponse = await api.post('/orders/update-item-status', {
          orderId: normalizedOrderId,
          itemId: normalizedItemId,
          status: newStatus
        });
        const updated = fallbackResponse?.data?.order;
        if (updated) {
          const mappedUpdated = mapOrder(updated);
          const patchedItems = mappedUpdated.items.map((item) =>
            item.id === normalizedItemId ? { ...item, status: newStatus } : item
          );
          const patchedOrder = {
            ...mappedUpdated,
            items: patchedItems,
            status: deriveOrderStatusFromItems(patchedItems)
          };
          latestFetchIdRef.current += 1;
          setOrders((prev) => prev.map((order) => (order.id === normalizedOrderId ? patchedOrder : order)));
          return;
        }
      } catch (fallbackError) {
        console.error('Error updating item status:', error);
        console.error('Error response data:', error.response?.data);
        console.error('Fallback item status update failed:', fallbackError.response?.data || fallbackError.message);
      }
      // Re-sync with backend truth on failure
      fetchOrders(false);
    }
  };

  // Fetch orders on mount and set up polling
  useEffect(() => {
    fetchOrders(true);
    const interval = setInterval(() => fetchOrders(false), 5000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeOrders = orders.filter(
    (o) => o.status !== 'CANCELLED' && (o.status !== 'SERVED' || justServedOrderIds.includes(o.id))
  );
  
  // Waiters can update item statuses and mark orders as served
  const isReadOnly = false;
  const isWaiter = role === UserRole.WAITER;

  const getNextStage = (status) => {
    switch (status) {
      case 'PENDING':
        return 'PREPARING';
      case 'PREPARING':
        return 'READY';
      case 'READY':
        return 'SERVED';
      default:
        return null;
    }
  };

  const getButtonLabel = (status) => {
    if (status === 'PENDING') return 'ORDER PLACED';
    if (status === 'PREPARING') return 'PREPARING';
    if (status === 'READY') return 'READY';
    return 'SERVED';
  };

  const getTimeElapsed = (createdAt) => {
    const minutes = Math.floor((Date.now() - createdAt) / 60000);
    return minutes > 60 ? '1h+' : `${minutes}m`;
  };

  const getTotalItemsCount = (order) => {
    return order.items.reduce((sum, item) => sum + item.quantity, 0);
  };

  const deriveOrderStatusFromItems = (items) => {
    const allStatuses = items.map((item) => item.status);
    if (allStatuses.every((s) => s === 'SERVED')) return 'SERVED';
    if (allStatuses.every((s) => s === 'READY' || s === 'SERVED')) return 'READY';
    if (allStatuses.some((s) => s === 'PREPARING' || s === 'READY' || s === 'SERVED')) return 'PREPARING';
    return 'PENDING';
  };

  return (
    <div className="space-y-6">

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Live Order Monitor</h1>
          <p className="text-sm text-gray-500 mt-1">
            {isWaiter ? 'Manage order stages and mark as served' : 'Manage kitchen throughput and service readiness'}
          </p>
        </div>
        <div className="flex items-center gap-4 bg-white p-2 px-4 rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase">Order Placed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase">Preparing</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase">Ready</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-gray-500"></div>
            <span className="text-[10px] font-black text-gray-600 uppercase">Served</span>
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

          return (
            <div 
              key={order.id} 
              className={`bg-white rounded-2xl border-t-8 shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-xl ${
                order.status === 'SERVED'
                  ? 'border-gray-400'
                  : order.status === 'READY'
                  ? 'border-emerald-500'
                  : order.status === 'PREPARING'
                  ? 'border-blue-500'
                  : 'border-orange-500'
              }`}
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-bold text-gray-900 whitespace-nowrap">Table {order.tableNumber}</h3>
                    <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm">
                      <ShoppingBasket size={12} />
                      {totalItemsCount} Items
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#{order.orderId}</span>
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
                    const displayStatus = item.status;
                    return (
                      <div key={idx} className="flex flex-col gap-2 p-3 bg-gray-50 rounded-xl border border-gray-100">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black text-emerald-700 bg-white border border-emerald-100 px-1.5 py-0.5 rounded-lg shadow-sm">
                              {item.quantity}×
                            </span>
                            <p className="font-bold text-gray-900 text-sm leading-tight">{item.name}</p>
                          </div>
                          
                          <button
                            onClick={() => {
                              const nextStatus = getNextStage(displayStatus);
                              if (nextStatus) {
                                handleUpdateItemStatus(order.id, item.id, nextStatus);
                              }
                            }}
                            disabled={isReadOnly || displayStatus === 'SERVED'}
                            className={`px-3 py-1.5 text-[10px] font-black rounded-lg transition-all ${
                              displayStatus === 'PENDING'
                                ? 'bg-orange-600 text-white hover:bg-orange-700'
                                : displayStatus === 'PREPARING'
                                ? 'bg-blue-600 text-white hover:bg-blue-700'
                                : displayStatus === 'READY'
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-gray-200 text-gray-600'
                            } ${
                              isReadOnly || displayStatus === 'SERVED'
                                ? 'opacity-60 cursor-not-allowed'
                                : 'active:scale-95'
                            }`}
                          >
                            {getButtonLabel(displayStatus)}
                          </button>
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
                      order.status === 'PREPARING' ? 'text-orange-600' :
                      order.status === 'SERVED' ? 'text-emerald-700' :
                      'text-emerald-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  <span className="px-3 py-1.5 text-[10px] font-black rounded-lg bg-white border border-gray-200 text-gray-600 uppercase">
                    {order.status === 'PENDING' ? 'ORDER PLACED' : order.status}
                  </span>
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
import React from 'react';
import { OrderStatus, UserRole } from '../types';
import { ChefHat, CheckCircle2, Clock, Eye, ShoppingBasket, Play, CheckCircle } from 'lucide-react';

const KitchenDisplay = ({ orders, onUpdateItemStatus, onUpdateOrderStatus, role }) => {
  const activeOrders = orders.filter(o => o.status !== OrderStatus.SERVED && o.status !== OrderStatus.CANCELLED);
  
  // Waiters are restricted from performing status updates
  const isReadOnly = role === UserRole.WAITER;

  const getItemStatusAction = (item) => {
    if (isReadOnly) return null;

    switch (item.status) {
      case OrderStatus.PENDING: 
        return { label: 'Start', next: OrderStatus.PREPARING, color: 'bg-orange-600 hover:bg-orange-700', icon: <Play size={14} /> };
      case OrderStatus.PREPARING: 
        return { label: 'Ready', next: OrderStatus.READY, color: 'bg-blue-600 hover:bg-blue-700', icon: <CheckCircle size={14} /> };
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

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
        {activeOrders.length > 0 ? activeOrders.map((order) => {
          const isLate = (Date.now() - order.createdAt) > 15 * 60000;
          const totalItemsCount = getTotalItemsCount(order);
          const isAllReady = order.items.every(item => item.status === OrderStatus.READY);

          return (
            <div 
              key={order.id} 
              className={`bg-white rounded-2xl border-t-8 shadow-lg overflow-hidden flex flex-col transition-all hover:shadow-xl ${
                order.status === OrderStatus.PENDING ? 'border-orange-500' :
                order.status === OrderStatus.PREPARING ? 'border-blue-500' :
                'border-emerald-500'
              }`}
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-start bg-gray-50/50">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-gray-900 whitespace-nowrap">Table {order.tableId.slice(-2)}</h3>
                    <div className="flex items-center gap-1 bg-emerald-600 text-white px-2 py-0.5 rounded-lg text-[10px] font-black shadow-sm">
                      <ShoppingBasket size={12} />
                      {totalItemsCount} Items
                    </div>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">#ORD-{order.id.slice(-4).toUpperCase()}</span>
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
                              onClick={() => onUpdateItemStatus(order.id, item.id, action.next)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black text-white shadow-sm transition-all active:scale-95 ${action.color}`}
                            >
                              {action.icon}
                              {action.label.toUpperCase()}
                            </button>
                          ) : (
                            <span className={`text-[8px] font-black px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm ${
                              item.status === OrderStatus.PENDING ? 'bg-orange-100 text-orange-700' :
                              item.status === OrderStatus.PREPARING ? 'bg-blue-100 text-blue-700' :
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
                      order.status === OrderStatus.PENDING ? 'text-orange-600' :
                      order.status === OrderStatus.PREPARING ? 'text-blue-600' :
                      'text-emerald-600'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                  
                  {!isReadOnly && isAllReady && (
                    <button 
                      onClick={() => onUpdateOrderStatus(order.id, OrderStatus.SERVED)}
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
    </div>
  );
};

export default KitchenDisplay;
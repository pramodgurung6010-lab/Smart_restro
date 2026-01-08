import React, { useState, useEffect } from 'react';
import { OrderStatus } from '../types';
import { CATEGORIES } from '../constants';
import { ChevronLeft, Plus, Minus, Send, Trash2, ShoppingCart } from 'lucide-react';

const OrderTaking = ({ table, menu, onSubmitOrder, onCancel, existingOrder }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);

  useEffect(() => {
    if (existingOrder) {
      setCart(existingOrder.items);
    } else {
      setCart([]);
    }
  }, [existingOrder]);

  const filteredMenu = menu.filter(item => 
    (activeCategory === 'All' || item.category === activeCategory) && item.available
  );

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.menuItemId === item.id);
      if (existing) {
        return prev.map(i => i.menuItemId === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: Math.random().toString(36).substr(2, 9),
        menuItemId: item.id,
        name: item.name,
        quantity: 1,
        price: item.price,
        status: OrderStatus.PENDING
      }];
    });
  };

  const updateQuantity = (menuItemId, delta) => {
    setCart(prev => prev.map(i => {
      if (i.menuItemId === menuItemId) {
        const newQty = Math.max(0, i.quantity + delta);
        return { ...i, quantity: newQty };
      }
      return i;
    }).filter(i => i.quantity > 0));
  };

  const subtotal = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
  const itemsCount = cart.reduce((acc, curr) => acc + curr.quantity, 0);

  const handleSubmit = () => {
    if (cart.length === 0) return;
    const newOrder = {
      id: existingOrder?.id || Math.random().toString(36).substr(2, 9),
      tableId: table.id,
      items: cart,
      status: existingOrder?.status || OrderStatus.PENDING,
      total: subtotal,
      createdAt: existingOrder?.createdAt || Date.now(),
      waiterId: existingOrder?.waiterId || 'waiter-1'
    };
    onSubmitOrder(newOrder);
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right duration-300 pb-4">
      <div className="flex items-center justify-between">
        <button 
          onClick={onCancel}
          className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition-all font-bold group"
        >
          <div className="bg-white p-2 rounded-xl border border-gray-100 shadow-sm group-hover:bg-emerald-50 transition-colors">
            <ChevronLeft size={20} />
          </div>
          Exit Order
        </button>
        <div className="bg-emerald-600 text-white px-6 py-2 rounded-2xl text-lg font-black shadow-lg shadow-emerald-100">
          Table {table.number}
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row gap-8 overflow-hidden">
        {/* Menu Grid */}
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 text-xs font-black rounded-xl whitespace-nowrap transition-all ${
                  activeCategory === cat 
                    ? 'bg-emerald-600 text-white shadow-lg' 
                    : 'bg-white text-gray-400 border border-gray-100 hover:border-emerald-200'
                }`}
              >
                {cat.toUpperCase()}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredMenu.map(item => (
                <button 
                  key={item.id}
                  onClick={() => addToCart(item)}
                  className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-xl hover:border-emerald-400 transition-all text-left flex flex-col justify-between h-48 group"
                >
                  <div className="flex justify-between items-start">
                    <h4 className="text-lg font-black text-gray-800 leading-tight pr-4">{item.name}</h4>
                    <span className="text-lg font-black text-emerald-600 font-mono shrink-0">Rs.{item.price.toFixed(2)}</span>
                  </div>
                  <div className="mt-4 inline-flex items-center gap-2 text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-xl opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                    <Plus size={14} /> ADD ITEM
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Cart Summary Sidebar - Matching User Request */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-[40px] shadow-2xl border border-gray-100 overflow-hidden">
          <div className="p-8 border-b border-gray-50 flex items-center gap-4">
            <ShoppingCart className="text-emerald-500" size={28} />
            <h3 className="text-xl font-black text-[#022c22]">Cart Summary</h3>
          </div>

          <div className="flex-1 overflow-y-auto no-scrollbar p-6">
            {cart.length > 0 ? (
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-gray-50/50 p-4 rounded-3xl border border-gray-50">
                    <div className="flex-1">
                      <p className="font-bold text-gray-800 text-sm leading-tight">{item.name}</p>
                      <p className="text-xs text-emerald-600 font-black font-mono mt-1">Rs.{item.price.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-3 bg-white rounded-2xl p-1 border border-gray-100 shadow-sm">
                      <button onClick={() => updateQuantity(item.menuItemId, -1)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"><Minus size={14}/></button>
                      <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.menuItemId, 1)} className="p-1.5 text-gray-400 hover:text-emerald-600 transition-colors"><Plus size={14}/></button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-40">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                  <ShoppingCart size={40} className="text-gray-300" />
                </div>
                <p className="text-sm font-bold text-gray-500 max-w-[200px]">Select items from the menu to start ordering.</p>
              </div>
            )}
          </div>

          <div className="bg-[#022c22] p-8 space-y-8">
            <div className="flex justify-between items-end border-b border-white/10 pb-6">
              <div>
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Net Subtotal</span>
                <span className="text-4xl font-black text-white font-mono tracking-tighter">Rs.{subtotal.toFixed(2)}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest block mb-2">Items Count</span>
                <span className="text-2xl font-black text-white font-mono">{itemsCount}</span>
              </div>
            </div>
            
            <button 
              disabled={cart.length === 0}
              onClick={handleSubmit}
              className={`w-full py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 transition-all ${
                cart.length > 0 
                  ? 'bg-emerald-500 text-[#022c22] hover:bg-emerald-400 shadow-xl shadow-emerald-950/20 active:scale-[0.98]' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
              }`}
            >
              <Send size={18} />
              {existingOrder ? 'UPDATE KITCHEN' : 'SUBMIT TO KITCHEN'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderTaking;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { OrderStatus } from '../types';
import { CATEGORIES } from '../constants';
import { ChevronLeft, Plus, Minus, Send, Trash2, ShoppingCart, Loader } from 'lucide-react';

const OrderTaking = ({ table, onSubmitOrder, onCancel, existingOrder }) => {
  const [activeCategory, setActiveCategory] = useState('All');
  const [cart, setCart] = useState([]);
  const [menu, setMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Get auth token from localStorage
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

  // Fetch menu items from backend
  const fetchMenu = async () => {
    try {
      setLoading(true);
      const response = await api.get('/menu');
      const backendMenu = response.data.map(item => ({
        id: item._id,
        name: item.name,
        category: item.category,
        price: item.price,
        available: item.isAvailable,
        description: item.description || ''
      }));
      setMenu(backendMenu);
    } catch (error) {
      console.error('Error fetching menu:', error);
      showMessage('error', 'Failed to load menu items');
    } finally {
      setLoading(false);
    }
  };

  // Show message helper
  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  // Load menu and existing order on component mount
  useEffect(() => {
    fetchMenu();
  }, []);

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
        id: `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
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

  const generateOrderNumber = () => {
    const today = new Date();
    const year = today.getFullYear().toString().slice(-2);
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const day = today.getDate().toString().padStart(2, '0');
    const timestamp = Date.now().toString().slice(-4);
    return `ORD${year}${month}${day}${timestamp}`;
  };

  const handleSubmit = async () => {
    if (cart.length === 0) return;
    
    try {
      setSubmitting(true);
      
      // Prepare order data for backend
      const orderData = {
        tableId: table.id,
        tableNumber: table.number,
        items: cart.map(item => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || ''
        }))
      };

      if (existingOrder) {
        // Update existing order
        const response = await api.put(`/orders/${existingOrder.id}`, {
          items: orderData.items
        });
        showMessage('success', 'Order updated successfully!');
        onSubmitOrder(response.data.order);
      } else {
        // Create new order
        const response = await api.post('/orders', orderData);
        showMessage('success', 'Order submitted to kitchen!');
        onSubmitOrder(response.data.order);
      }
      
      // Clear cart after successful submission
      setCart([]);
      
    } catch (error) {
      console.error('Error submitting order:', error);
      const errorMessage = error.response?.data?.message || 'Failed to submit order';
      showMessage('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in slide-in-from-right duration-300 pb-4">
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

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex items-center gap-3">
            <Loader className="animate-spin text-emerald-600" size={24} />
            <span className="text-gray-600">Loading menu...</span>
          </div>
        </div>
      ) : (
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
              disabled={cart.length === 0 || submitting}
              onClick={handleSubmit}
              className={`w-full py-5 rounded-[24px] font-black text-sm flex items-center justify-center gap-3 transition-all ${
                cart.length > 0 && !submitting
                  ? 'bg-emerald-500 text-[#022c22] hover:bg-emerald-400 shadow-xl shadow-emerald-950/20 active:scale-[0.98]' 
                  : 'bg-white/5 text-white/20 cursor-not-allowed border border-white/10'
              }`}
            >
              {submitting ? (
                <>
                  <Loader className="animate-spin" size={18} />
                  SUBMITTING...
                </>
              ) : (
                <>
                  <Send size={18} />
                  {existingOrder ? 'UPDATE KITCHEN' : 'SUBMIT TO KITCHEN'}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default OrderTaking;
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { TableStatus, OrderStatus, UserRole } from '../types';
import { 
  Receipt, 
  CreditCard, 
  Banknote, 
  Printer, 
  CheckCircle, 
  Clock, 
  Download,
  Edit3,
  History,
  Smartphone
} from 'lucide-react';

const BillingAndPayment = ({ tables, orders, userRole, onFinalize, onEditBill, onCancelBill, onVoidPaidBill }) => {
  const [selectedTableId, setSelectedTableId] = useState(null);
  const [view, setView] = useState('PENDING');
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [discount, setDiscount] = useState(0);
  const [discountType, setDiscountType] = useState('percentage'); // 'percentage' or 'amount'
  const [editedItems, setEditedItems] = useState({});
  const [isEditingBill, setIsEditingBill] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [unpaidOrders, setUnpaidOrders] = useState([]);

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

  // Fetch unpaid orders
  const fetchUnpaidOrders = async () => {
    try {
      const response = await api.get('/orders/billing/unpaid');
      setUnpaidOrders(response.data.orders);
    } catch (error) {
      console.error('Error fetching unpaid orders:', error);
    }
  };

  useEffect(() => {
    fetchUnpaidOrders();
    const interval = setInterval(fetchUnpaidOrders, 10000); // Refresh every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const pendingTables = tables.filter(t => t.status === TableStatus.OCCUPIED && !t.masterTableId);
  const currentTable = tables.find(t => t.id === selectedTableId);
  const currentOrder = orders.find(o => o.id === currentTable?.currentOrderId);

  const calculateTotals = (sub) => {
    const tax = Number((sub * 0.05).toFixed(2));
    const service = Number((sub * 0.10).toFixed(2));
    const subtotalWithTaxService = sub + tax + service;
    
    let discountAmount = 0;
    if (discount > 0) {
      if (discountType === 'percentage') {
        discountAmount = Number((subtotalWithTaxService * (discount / 100)).toFixed(2));
      } else {
        discountAmount = Number(discount.toFixed(2));
      }
    }
    
    const total = Number((subtotalWithTaxService - discountAmount).toFixed(2));
    return { subtotal: sub, tax, service, discountAmount, total };
  };

  const getEditedOrderTotal = () => {
    if (!currentOrder) return 0;
    
    let total = 0;
    currentOrder.items.forEach(item => {
      const editedItem = editedItems[item.id];
      if (editedItem) {
        total += editedItem.price * editedItem.quantity;
      } else {
        total += item.price * item.quantity;
      }
    });
    return total;
  };

  const handleItemEdit = (itemId, field, value) => {
    setEditedItems(prev => ({
      ...prev,
      [itemId]: {
        ...prev[itemId],
        [field]: field === 'quantity' ? parseInt(value) || 0 : parseFloat(value) || 0
      }
    }));
  };

  const handlePay = async () => {
    if (!selectedTableId || !paymentMethod || !currentOrder) return;
    
    setLoading(true);
    try {
      // First apply discount if any
      if (discount > 0) {
        await api.post(`/orders/${currentOrder.id}/bill/discount`, {
          discount,
          discountType
        });
      }

      // Calculate total with edited items if any
      const orderTotal = isEditingBill ? getEditedOrderTotal() : currentOrder.total;
      const { total } = calculateTotals(orderTotal);

      // Process payment
      const response = await api.post(`/orders/${currentOrder.id}/bill/pay`, {
        paymentMethod,
        amountPaid: total,
        discount: discount > 0 ? (discountType === 'percentage' ? (orderTotal * discount / 100) : discount) : 0
      });

      setIsSuccess(true);
      setMessage({ type: 'success', text: 'Payment processed successfully!' });
      
      setTimeout(() => {
        onFinalize(selectedTableId);
        setSelectedTableId(null);
        setPaymentMethod(null);
        setIsSuccess(false);
        setDiscount(0);
        setEditedItems({});
        setIsEditingBill(false);
        fetchUnpaidOrders();
      }, 2000);
    } catch (error) {
      console.error('Payment error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Failed to process payment' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-in fade-in duration-500">
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
        <div>
          <h1 className="text-2xl font-black text-gray-900">Billing Center</h1>
          <p className="text-[13px] text-gray-400 font-medium">Manage settlements and history</p>
        </div>
        <div className="flex bg-white p-1 rounded-xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setView('PENDING')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${view === 'PENDING' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <Clock size={16} /> Active Bills
          </button>
          <button 
            onClick={() => setView('HISTORY')}
            className={`flex items-center gap-2 px-6 py-2 rounded-lg text-xs font-bold transition-all ${view === 'HISTORY' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-gray-400 hover:bg-gray-50'}`}
          >
            <History size={16} /> Payment History
          </button>
        </div>
      </div>

      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Left Table List */}
        <div className="w-[360px] flex flex-col gap-3 overflow-y-auto no-scrollbar">
          {pendingTables.map(table => {
            const order = orders.find(o => o.id === table.currentOrderId);
            const isSelected = selectedTableId === table.id;
            const displayNumber = table.mergedWith ? 
              `${table.number},${table.mergedWith.map(id => tables.find(t => t.id === id)?.number).join(',')}` 
              : table.number;
            
            return (
              <button
                key={table.id}
                onClick={() => { setSelectedTableId(table.id); setPaymentMethod(null); setDiscount(0); setEditedItems({}); setIsEditingBill(false); }}
                className={`flex items-center gap-4 p-5 rounded-[28px] border-2 transition-all text-left ${
                  isSelected ? 'border-emerald-500 bg-white ring-4 ring-emerald-50 shadow-lg' : 'border-gray-100 bg-white hover:border-emerald-200'
                }`}
              >
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-sm ${
                  isSelected ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'
                }`}>
                  {displayNumber}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-black text-gray-900">Table {displayNumber}</p>
                    <span className="text-[8px] font-black uppercase text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md">READY</span>
                  </div>
                  <p className="text-[11px] text-gray-400 font-bold uppercase mt-0.5">{order?.items.length} Items • Rs.{order?.total.toFixed(2)}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Preview Area */}
        <div className="flex-1 flex flex-col">
          {selectedTableId && currentOrder ? (
            <div className="bg-white rounded-[48px] shadow-2xl border border-gray-100 overflow-hidden relative flex flex-col h-full animate-in zoom-in-95 duration-500">
              {isSuccess && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-md z-50 flex flex-col items-center justify-center text-center">
                  <div className="w-24 h-24 bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-2xl animate-bounce mb-6">
                    <CheckCircle size={56} />
                  </div>
                  <h3 className="text-4xl font-black text-gray-900 tracking-tighter">SETTLED!</h3>
                  <p className="text-gray-400 font-bold mt-2 uppercase tracking-widest text-xs">Table {currentTable?.number} Paid In Full</p>
                </div>
              )}

              <div className="p-10 flex-1 overflow-y-auto no-scrollbar space-y-12">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-emerald-600 text-white rounded-[24px] flex items-center justify-center shadow-lg shadow-emerald-50">
                      <Receipt size={32} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-gray-900">Billing Preview</h2>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black uppercase text-emerald-600 tracking-widest">Table {currentTable?.number}</span>
                        <span className="text-gray-200 text-xs">•</span>
                        <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Order #{currentOrder.id.slice(-6).toUpperCase()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3.5 bg-gray-50 text-gray-400 hover:text-emerald-600 rounded-2xl border border-gray-100 transition-all"><Printer size={22} /></button>
                    <button className="p-3.5 bg-gray-50 text-gray-400 hover:text-emerald-600 rounded-2xl border border-gray-100 transition-all"><Download size={22} /></button>
                    <button onClick={() => onEditBill(selectedTableId)} className="p-3.5 bg-gray-50 text-gray-400 hover:text-emerald-600 rounded-2xl border border-gray-100 transition-all"><Edit3 size={22} /></button>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-12 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-50 pb-4">
                    <div className="col-span-6">Description</div>
                    <div className="col-span-2 text-center">Qty</div>
                    <div className="col-span-2 text-right">Price</div>
                    <div className="col-span-2 text-right">Total</div>
                  </div>
                  <div className="space-y-5">
                    {currentOrder.items.map((item, idx) => {
                      const editedItem = editedItems[item.id];
                      const displayQuantity = editedItem?.quantity ?? item.quantity;
                      const displayPrice = editedItem?.price ?? item.price;
                      
                      return (
                        <div key={idx} className="grid grid-cols-12 text-[14px] items-center">
                          <div className="col-span-6 font-bold text-gray-800">{item.name}</div>
                          <div className="col-span-2 text-center">
                            {isEditingBill && userRole === 'ADMIN' ? (
                              <input
                                type="number"
                                min="1"
                                value={displayQuantity}
                                onChange={(e) => handleItemEdit(item.id, 'quantity', e.target.value)}
                                className="w-12 text-center border border-gray-300 rounded px-1 py-0.5 text-xs"
                              />
                            ) : (
                              <span className="text-gray-400 font-bold">x{displayQuantity}</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right">
                            {isEditingBill && userRole === 'ADMIN' ? (
                              <input
                                type="number"
                                step="0.01"
                                value={displayPrice}
                                onChange={(e) => handleItemEdit(item.id, 'price', e.target.value)}
                                className="w-16 text-right border border-gray-300 rounded px-1 py-0.5 text-xs font-mono"
                              />
                            ) : (
                              <span className="text-gray-400 font-mono">Rs.{displayPrice.toFixed(2)}</span>
                            )}
                          </div>
                          <div className="col-span-2 text-right font-black text-gray-900 font-mono">
                            Rs.{(displayPrice * displayQuantity).toFixed(2)}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Admin Discount Section */}
                  {userRole === 'ADMIN' && (
                    <div className="pt-6 border-t border-gray-100">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-sm font-bold text-gray-700">Admin Controls</h4>
                        <button
                          onClick={() => setIsEditingBill(!isEditingBill)}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            isEditingBill 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-gray-100 text-gray-600 hover:bg-emerald-50'
                          }`}
                        >
                          {isEditingBill ? 'Done Editing' : 'Edit Bill'}
                        </button>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">Discount Type</label>
                          <select
                            value={discountType}
                            onChange={(e) => setDiscountType(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          >
                            <option value="percentage">Percentage (%)</option>
                            <option value="amount">Fixed Amount (Rs.)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-600 mb-1">
                            Discount {discountType === 'percentage' ? '(%)' : '(Rs.)'}
                          </label>
                          <input
                            type="number"
                            step={discountType === 'percentage' ? '1' : '0.01'}
                            min="0"
                            max={discountType === 'percentage' ? '100' : undefined}
                            value={discount}
                            onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono"
                            placeholder="0"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-8 items-end relative">
                  <div className="flex-1 space-y-4">
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Payment Method</p>
                    <div className="grid grid-cols-3 gap-4">
                      <button onClick={() => setPaymentMethod('CARD')} className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'CARD' ? 'border-emerald-500 bg-emerald-50/20 ring-4 ring-emerald-50 text-emerald-700' : 'bg-white border-gray-50 text-gray-400 hover:border-emerald-200'}`}>
                        <CreditCard size={28} /><span className="text-[9px] font-black uppercase tracking-widest">Card</span>
                      </button>
                      <button onClick={() => setPaymentMethod('CASH')} className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'CASH' ? 'border-emerald-500 bg-emerald-50/20 ring-4 ring-emerald-50 text-emerald-700' : 'bg-white border-gray-50 text-gray-400 hover:border-emerald-200'}`}>
                        <Banknote size={28} /><span className="text-[9px] font-black uppercase tracking-widest">Cash</span>
                      </button>
                      <button onClick={() => setPaymentMethod('UPI')} className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-2 ${paymentMethod === 'UPI' ? 'border-emerald-500 bg-emerald-50/20 ring-4 ring-emerald-50 text-emerald-700' : 'bg-white border-gray-50 text-gray-400 hover:border-emerald-200'}`}>
                        <Smartphone size={28} /><span className="text-[9px] font-black uppercase tracking-widest">UPI</span>
                      </button>
                    </div>
                  </div>

                  {/* Overlapping dark teal summary card */}
                  <div className="w-[340px] bg-[#022c22] text-white rounded-[40px] p-10 shadow-2xl relative translate-y-4 shrink-0">
                    <div className="space-y-4 opacity-70">
                      {(() => {
                        const orderTotal = isEditingBill ? getEditedOrderTotal() : currentOrder.total;
                        const { subtotal, tax, service, discountAmount, total } = calculateTotals(orderTotal);
                        return (
                          <>
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest"><span>Subtotal</span><span>Rs.{subtotal.toFixed(2)}</span></div>
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest"><span>Gov Tax (5%)</span><span>Rs.{tax.toFixed(2)}</span></div>
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest"><span>Service (10%)</span><span>₹{service.toFixed(2)}</span></div>
                            {discountAmount > 0 && (
                              <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                                <span>Discount</span><span>-Rs.{discountAmount.toFixed(2)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-[11px] font-bold uppercase tracking-widest pb-4 border-b border-white/10">
                              <span>Subtotal + Tax/Service</span><span>Rs.{(subtotal + tax + service).toFixed(2)}</span>
                            </div>
                            <div className="pt-2 opacity-100">
                              <p className="text-[10px] font-black uppercase tracking-widest mb-1 text-emerald-400">Total Payable</p>
                              <p className="text-5xl font-black tracking-tighter">Rs.{total.toFixed(2)}</p>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-10 bg-gray-50/50 border-t border-gray-100">
                <button 
                  disabled={!paymentMethod || loading}
                  onClick={handlePay}
                  className={`w-full py-6 rounded-[32px] font-black text-lg transition-all shadow-xl active:scale-[0.98] ${
                    paymentMethod && !loading ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-200' : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {loading ? 'PROCESSING...' : paymentMethod ? 'CONFIRM SETTLEMENT' : 'CHOOSE PAYMENT TO CONTINUE'}
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-30 p-20 bg-white rounded-[48px] border-4 border-dashed border-gray-50">
              <Receipt size={64} className="mb-6 mx-auto text-gray-300" />
              <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest">Terminal Idle</h3>
              <p className="text-sm font-bold text-gray-500 mt-2 max-w-[200px] mx-auto">Select a table from the list to process billing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BillingAndPayment;
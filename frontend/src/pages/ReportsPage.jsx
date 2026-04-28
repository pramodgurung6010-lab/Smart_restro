import React, { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { Download, TrendingUp, Calendar, FileText, History as HistoryIcon, ArrowRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportsPage = () => {
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportHistory, setReportHistory] = useState([]);
  const [settlementFilter, setSettlementFilter] = useState('ALL');
  // eslint-disable-next-line no-unused-vars
  const [logPage, setLogPage] = useState(1);
  // eslint-disable-next-line no-unused-vars
  const LOG_PAGE_SIZE = 10;

  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        const response = await axios.get('http://localhost:5002/api/orders', {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        const backendOrders = (response.data.orders || []).map(o => ({
          id: o._id,
          orderId: o.orderId,
          tableNumber: o.tableNumber,
          waiterId: o.waiterName || 'Staff',
          total: o.total || 0,
          isPaid: o.isPaid === true || o.paymentStatus === 'PAID',
          status: o.status,
          createdAt: new Date(o.createdAt).getTime(),
          items: o.items || []
        }));
        setOrders(backendOrders);
      } catch (error) {
        console.error('Error fetching orders:', error);
      }
    };
    fetchOrders();
  }, []);

  // Helper to format date for display like in the image (DD/MM/YYYY)
  const formatDateDisplay = (dateStr) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const start = new Date(startDate).setHours(0, 0, 0, 0);
    const end = new Date(endDate).setHours(23, 59, 59, 999);
    return orders.filter(o => o.createdAt >= start && o.createdAt <= end);
  }, [orders, startDate, endDate]);

  // Derived Stats
  const stats = useMemo(() => {
    const paidOrders = filteredOrders.filter(o => o.isPaid);
    // Count revenue from all completed orders (PAID, SERVED, or any with total > 0)
    const revenueOrders = filteredOrders.filter(o => o.total > 0);
    const totalRevenue = revenueOrders.reduce((acc, o) => acc + (parseFloat(o.total) || 0), 0);
    const orderCount = filteredOrders.length;
    const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
    return { totalRevenue, orderCount, aov, paidCount: paidOrders.length };
  }, [filteredOrders]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text('Smart Restro - Sales Report', 14, 20);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Period: ${startDate} to ${endDate}`, 14, 28);
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 34);
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Revenue: Rs.${stats.totalRevenue.toFixed(2)}`, 14, 45);
    doc.text(`Total Orders: ${stats.orderCount}`, 14, 51);
    const tableData = filteredOrders.map(order => [
      `#ORD-${order.id.slice(-6).toUpperCase()}`,
      order.waiterId,
      new Date(order.createdAt).toLocaleDateString(),
      `Rs.${order.total.toFixed(2)}`,
      order.isPaid ? 'PAID' : 'PENDING'
    ]);
    autoTable(doc, { startY: 65, head: [['Order ID', 'Waiter', 'Date', 'Amount', 'Status']], body: tableData, headStyles: { fillColor: [16, 185, 129] } });
    doc.save(`SmartRestro_Report_${startDate}_${endDate}.pdf`);
    addToHistory('PDF');
  };

  const addToHistory = (type) => {
    const newReport = {
      id: `RPT${Date.now().toString().slice(-6)}`,
      name: `Sales_${startDate}_to_${endDate}`,
      type,
      date: Date.now(),
      revenue: stats.totalRevenue,
      orderCount: stats.orderCount
    };
    setReportHistory(prev => [newReport, ...prev].slice(0, 10));
  };

  return (
    <div className="space-y-8 pb-10 max-w-[1600px] mx-auto animate-in fade-in duration-500">
      {/* Header & Advanced Filters */}
      <div className="bg-white p-4 md:p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Analytics Hub</h1>
            <p className="text-sm text-gray-500 mt-1">Detailed financial performance and trend analysis</p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* STYLIZED DATE PILL (Matching Request Image) */}
            <div className="flex items-center gap-4 bg-gray-50/50 p-1.5 px-6 rounded-full border border-gray-100 shadow-inner hover:shadow-md transition-all group cursor-pointer">
              {/* Clicking the logo icon triggers the start date picker */}
              <button 
                onClick={() => startInputRef.current?.showPicker()}
                className="text-emerald-600 hover:scale-110 transition-transform p-1"
              >
                <Calendar size={20} strokeWidth={2.5} />
              </button>

              <div className="flex items-center gap-4 py-2">
                {/* Start Date Area */}
                <div className="relative flex items-center gap-2" onClick={() => startInputRef.current?.showPicker()}>
                  <input 
                    ref={startInputRef}
                    type="date" 
                    value={startDate} 
                    onChange={(e) => setStartDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <span className="text-[13px] font-black text-gray-700 tracking-tight whitespace-nowrap">
                    {formatDateDisplay(startDate)}
                  </span>
                  <Calendar size={12} className="text-gray-200" />
                </div>

                <ArrowRight size={14} className="text-gray-300" />

                {/* End Date Area */}
                <div className="relative flex items-center gap-2" onClick={() => endInputRef.current?.showPicker()}>
                  <input 
                    ref={endInputRef}
                    type="date" 
                    value={endDate} 
                    onChange={(e) => setEndDate(e.target.value)}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  />
                  <span className="text-[13px] font-black text-gray-700 tracking-tight whitespace-nowrap">
                    {formatDateDisplay(endDate)}
                  </span>
                  <Calendar size={12} className="text-gray-200" />
                </div>
              </div>
            </div>

            <button 
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white rounded-full text-xs font-bold hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest active:scale-95"
            >
              <Download size={16} />
              Generate PDF
            </button>
          </div>
        </div>

        {/* Quick Selection Buttons */}
        <div className="flex flex-wrap gap-2 pt-6 border-t border-gray-50">
          <button 
            onClick={() => {
              const today = new Date().toISOString().split('T')[0];
              setStartDate(today);
              setEndDate(today);
            }}
            className="px-6 py-2 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-emerald-100"
          >
            Today
          </button>
          <button 
            onClick={() => {
              setStartDate(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }}
            className="px-6 py-2 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-emerald-100"
          >
            Last 7 Days
          </button>
          <button 
            onClick={() => {
              const d = new Date();
              setStartDate(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
              setEndDate(new Date().toISOString().split('T')[0]);
            }}
            className="px-6 py-2 bg-gray-50 hover:bg-emerald-50 text-gray-500 hover:text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-emerald-100"
          >
            This Month
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Revenue', value: `Rs.${stats.totalRevenue.toFixed(2)}`, trend: '+12.5%', icon: <TrendingUp size={20}/>, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Orders', value: stats.orderCount, trend: 'Range', icon: <FileText size={20}/>, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Avg Order', value: `Rs.${stats.aov.toFixed(2)}`, trend: 'AOV', icon: <TrendingUp size={20}/>, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Settled', value: stats.paidCount, trend: '98%', icon: <Calendar size={20}/>, color: 'text-amber-600', bg: 'bg-amber-50' },
        ].map((kpi, i) => (
          <div key={i} className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${kpi.bg} ${kpi.color} p-3 rounded-2xl`}>{kpi.icon}</div>
              <span className="text-[10px] font-black px-2 py-1 rounded-full bg-gray-50 text-gray-400 uppercase tracking-tighter">{kpi.trend}</span>
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h4 className="text-2xl font-bold text-gray-900">{kpi.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-6">Revenue Performance</h3>
          {filteredOrders.length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No orders in selected date range</div>
          ) : (
            <div className="space-y-4">
              {/* Daily revenue bars */}
              {(() => {
                const dailyMap = {};
                filteredOrders.forEach(o => {
                  const day = new Date(o.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
                  dailyMap[day] = (dailyMap[day] || 0) + (parseFloat(o.total) || 0);
                });
                const days = Object.entries(dailyMap).slice(-7);
                const maxVal = Math.max(...days.map(([,v]) => v), 1);
                return days.map(([day, val]) => (
                  <div key={day} className="flex items-center gap-3">
                    <span className="text-xs font-black text-gray-400 w-16 shrink-0">{day}</span>
                    <div className="flex-1 bg-gray-50 rounded-full h-6 overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-500 flex items-center justify-end pr-2"
                        style={{ width: `${Math.max((val / maxVal) * 100, 2)}%` }}
                      >
                        <span className="text-[9px] font-black text-white">Rs.{val.toFixed(0)}</span>
                      </div>
                    </div>
                  </div>
                ));
              })()}
            </div>
          )}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest">Total Revenue</p>
              <p className="text-xl font-bold text-emerald-800">Rs.{stats.totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-gray-50 rounded-2xl p-4">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Avg Order Value</p>
              <p className="text-xl font-bold text-gray-800">Rs.{stats.aov.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HistoryIcon size={20} className="text-emerald-600" /> Export Log
          </h3>
          <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar">
            {reportHistory.map((report) => (
              <div key={report.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-50 group hover:border-emerald-200 transition-all">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-[10px] ${report.type === 'PDF' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                    {report.type}
                  </div>
                  <div>
                    <p className="text-xs font-black text-gray-900 truncate max-w-[120px]">{report.name}</p>
                    <p className="text-[10px] text-gray-400 font-bold">{new Date(report.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <Download size={14} className="text-gray-300 group-hover:text-emerald-600 transition-colors" />
              </div>
            ))}
            {reportHistory.length === 0 && <p className="text-center text-xs text-gray-400 py-20 italic">No reports generated yet</p>}
          </div>
        </div>
      </div>

      {/* Audit Trail Table */}
      <div className="bg-white rounded-[40px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-8 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-xl font-bold text-gray-900">Historical Log</h3>
          <div className="flex items-center gap-3">
            {/* Settlement filter */}
            <div className="flex bg-gray-50 p-1 rounded-xl border border-gray-100">
              {['ALL', 'SETTLED', 'UNPAID'].map(f => (
                <button
                  key={f}
                  onClick={() => { setSettlementFilter(f); setLogPage(1); }}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                    settlementFilter === f
                      ? f === 'SETTLED' ? 'bg-emerald-600 text-white shadow'
                        : f === 'UNPAID' ? 'bg-red-500 text-white shadow'
                        : 'bg-white text-gray-700 shadow'
                      : 'text-gray-400 hover:text-gray-600'
                  }`}
                >
                  {f === 'ALL' ? `All (${filteredOrders.length})` : f === 'SETTLED' ? `Settled (${filteredOrders.filter(o => o.isPaid).length})` : `Unpaid (${filteredOrders.filter(o => !o.isPaid).length})`}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 text-gray-400 text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="px-10 py-5">Reference</th>
                <th className="px-10 py-5">Date</th>
                <th className="px-10 py-5">Waitstaff</th>
                <th className="px-10 py-5">Amount</th>
                <th className="px-10 py-5 text-right">Settlement</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(() => {
                const allFiltered = filteredOrders
                  .slice()
                  .reverse()
                  .filter(o => settlementFilter === 'ALL' || (settlementFilter === 'SETTLED' ? o.isPaid : !o.isPaid));
                const totalPages = Math.ceil(allFiltered.length / LOG_PAGE_SIZE);
                const display = allFiltered.slice((logPage - 1) * LOG_PAGE_SIZE, logPage * LOG_PAGE_SIZE);
                return display.length > 0 ? display.map((order) => (
                  <tr key={order.id} className="hover:bg-emerald-50/20 transition-colors group">
                    <td className="px-10 py-5 font-bold text-gray-900">#ORD-{order.id.slice(-6).toUpperCase()}</td>
                    <td className="px-10 py-5 text-gray-400 text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                    <td className="px-10 py-5 text-gray-500">{order.waiterId}</td>
                    <td className="px-10 py-5 font-bold text-gray-900">Rs.{order.total.toFixed(2)}</td>
                    <td className="px-10 py-5 text-right">
                      <span className={`px-4 py-1.5 rounded-xl text-xs font-bold uppercase tracking-widest ${order.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                        {order.isPaid ? 'Settled' : 'Unpaid'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr><td colSpan={5} className="px-10 py-20 text-center text-gray-300 italic">No records found</td></tr>
                );
              })()}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {(() => {
          const allFiltered = filteredOrders
            .filter(o => settlementFilter === 'ALL' || (settlementFilter === 'SETTLED' ? o.isPaid : !o.isPaid));
          const totalPages = Math.ceil(allFiltered.length / LOG_PAGE_SIZE);
          if (totalPages <= 1) return null;
          return (
            <div className="px-8 py-4 border-t border-gray-100 flex items-center justify-between">
              <p className="text-xs text-gray-400">
                Showing {((logPage - 1) * LOG_PAGE_SIZE) + 1}–{Math.min(logPage * LOG_PAGE_SIZE, allFiltered.length)} of {allFiltered.length} orders
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogPage(p => Math.max(1, p - 1))}
                  disabled={logPage === 1}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 transition-all"
                >
                  ← Prev
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setLogPage(p)}
                    className={`w-8 h-8 text-xs font-bold rounded-lg transition-all ${logPage === p ? 'bg-emerald-600 text-white' : 'bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700'}`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setLogPage(p => Math.min(totalPages, p + 1))}
                  disabled={logPage === totalPages}
                  className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gray-50 text-gray-500 hover:bg-emerald-50 hover:text-emerald-700 disabled:opacity-30 transition-all"
                >
                  Next →
                </button>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};

export default ReportsPage;
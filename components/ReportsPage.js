import React, { useState, useMemo, useRef } from 'react';
import { OrderStatus } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Calendar, FileText, History as HistoryIcon, ArrowRight } from 'lucide-react';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

const ReportsPage = ({ orders }) => {
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportHistory, setReportHistory] = useState([]);

  const startInputRef = useRef(null);
  const endInputRef = useRef(null);

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
    const totalRevenue = paidOrders.reduce((acc, o) => acc + o.total, 0);
    const orderCount = filteredOrders.length;
    const aov = orderCount > 0 ? totalRevenue / orderCount : 0;
    return { totalRevenue, orderCount, aov, paidCount: paidOrders.length };
  }, [filteredOrders]);

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(16, 185, 129);
    doc.text('EmeraldDine RMS - Sales Report', 14, 20);
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
    doc.autoTable({ startY: 65, head: [['Order ID', 'Waiter', 'Date', 'Amount', 'Status']], body: tableData, headStyles: { fillColor: [16, 185, 129] } });
    doc.save(`EmeraldDine_Report_${startDate}_${endDate}.pdf`);
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
      <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm space-y-8">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
              <div className="p-3 bg-emerald-100 text-emerald-600 rounded-2xl">
                <TrendingUp size={24} />
              </div>
              Analytics Hub
            </h1>
            <p className="text-sm text-gray-500 font-medium">Detailed financial performance and trend analysis</p>
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
              className="flex items-center gap-2 px-8 py-3.5 bg-emerald-600 text-white rounded-full text-[11px] font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 uppercase tracking-widest active:scale-95"
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
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <h4 className="text-2xl font-black text-gray-900">{kpi.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-8 rounded-[40px] shadow-sm border border-gray-100">
          <h3 className="text-xl font-black text-gray-900 mb-8">Revenue Performance</h3>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={filteredOrders.slice(-15).map(o => ({ id: o.id.slice(-4), total: o.total }))}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                <XAxis dataKey="id" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)'}} />
                <Bar dataKey="total" fill="#10b981" radius={[6, 6, 0, 0]} barSize={32} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 flex flex-col">
          <h3 className="text-lg font-black text-gray-900 mb-6 flex items-center gap-2">
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
        <div className="p-8 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-xl font-black text-gray-900">Historical Log</h3>
          <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-black">{filteredOrders.length} records in range</div>
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
              {filteredOrders.length > 0 ? filteredOrders.slice().reverse().map((order) => (
                <tr key={order.id} className="hover:bg-emerald-50/20 transition-colors group">
                  <td className="px-10 py-5 font-black text-gray-900">#ORD-{order.id.slice(-6).toUpperCase()}</td>
                  <td className="px-10 py-5 text-gray-400 font-mono text-xs">{new Date(order.createdAt).toLocaleDateString()}</td>
                  <td className="px-10 py-5 text-gray-500 font-bold">{order.waiterId}</td>
                  <td className="px-10 py-5 font-black text-gray-900">Rs.{order.total.toFixed(2)}</td>
                  <td className="px-10 py-5 text-right">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${order.isPaid ? 'bg-emerald-100 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {order.isPaid ? 'Settled' : 'Unpaid'}
                    </span>
                  </td>
                </tr>
              )) : (
                <tr><td colSpan={5} className="px-10 py-20 text-center text-gray-300 italic">No records found for this period</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportsPage;
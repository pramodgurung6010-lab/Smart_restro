import React from 'react';
import { DollarSign, ShoppingBag, CheckCircle, TrendingUp } from 'lucide-react';
import { OrderStatus } from '../types';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

const data = [
  { name: '10am', sales: 400 },
  { name: '12pm', sales: 1200 },
  { name: '2pm', sales: 900 },
  { name: '4pm', sales: 600 },
  { name: '6pm', sales: 1800 },
  { name: '8pm', sales: 2400 },
  { name: '10pm', sales: 1500 },
];

const AdminDashboard = ({ stats, orders }) => {
  const aov = stats.completedOrdersCount > 0 ? (stats.revenue / stats.completedOrdersCount).toFixed(2) : '0.00';

  const cards = [
    { label: 'Today Revenue', value: `Rs.${stats.revenue.toFixed(2)}`, icon: <DollarSign />, color: 'bg-emerald-500', trend: '+12%' },
    { label: 'Active Orders', value: stats.activeOrders, icon: <ShoppingBag />, color: 'bg-blue-500', trend: 'Live' },
    { label: 'Avg Order Value (AOV)', value: `Rs.${aov}`, icon: <TrendingUp />, color: 'bg-indigo-500', trend: 'Global' },
    { label: 'Completed Orders', value: stats.completedOrdersCount, icon: <CheckCircle />, color: 'bg-orange-500', trend: 'Done' },
  ];

  const recentOrders = orders.slice(-5).reverse();

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Operations Control Center</h1>
          <p className="text-sm text-gray-500 mt-1">Real-time health of EmeraldDine operations</p>
        </div>
        <button className="bg-emerald-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-200">Generate Full Report</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => (
          <div key={idx} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`${card.color} p-3 rounded-2xl text-white shadow-lg`}>{React.cloneElement(card.icon, { size: 24 })}</div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-full ${card.trend.includes('+') ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>{card.trend}</span>
            </div>
            <h3 className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{card.label}</h3>
            <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
           <div className="flex items-center justify-between mb-8">
             <h3 className="text-lg font-black text-gray-900">Performance Trend</h3>
             <div className="text-xs font-bold text-gray-500">Hourly Analysis</div>
           </div>
           <div className="h-72 w-full">
             <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={data}>
                 <defs><linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                 <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                 <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                 <YAxis axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 10}} />
                 <Tooltip contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}} />
                 <Area type="monotone" dataKey="sales" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
               </AreaChart>
             </ResponsiveContainer>
           </div>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100">
          <h3 className="text-lg font-black text-gray-900 mb-6">Live Activity</h3>
          <div className="space-y-6">
            {recentOrders.length > 0 ? recentOrders.map((order) => (
              <div key={order.id} className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${order.status === OrderStatus.SERVED ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}><ShoppingBag size={18} /></div>
                <div className="flex-1">
                  <div className="flex justify-between items-start"><p className="text-sm font-bold text-gray-900">Table {order.tableId}</p><span className="text-[10px] text-gray-400 font-bold">{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                  <p className="text-xs text-gray-500">{order.items.length} items • Rs.{order.total.toFixed(2)}</p>
                  <div className="mt-1"><span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${order.status === OrderStatus.SERVED ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>{order.status}</span></div>
                </div>
              </div>
            )) : <div className="text-center py-20 text-gray-300 font-bold">No live activity detected</div>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
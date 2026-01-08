import React from 'react';
import { NAVIGATION_ITEMS } from '../constants';
import { LogOut } from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab, role, onLogout }) => {
  const filteredNav = NAVIGATION_ITEMS.filter(item => item.roles.includes(role));

  return (
    <div className="w-64 bg-white border-r border-gray-100 flex flex-col h-full z-20 shrink-0">
      <div className="p-8 pb-10 flex items-center gap-3">
        <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-100">
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M8 12L8 20M16 8L16 24M24 12L24 20" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M20 8L20 12M12 20L12 24" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          </svg>
        </div>
        <span className="text-xl font-black text-emerald-900 tracking-tight">Smart Restro</span>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {filteredNav.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-4 px-5 py-3.5 text-[13px] font-bold rounded-2xl transition-all relative ${
              activeTab === item.id
                ? 'bg-emerald-50 text-emerald-700'
                : 'text-gray-400 hover:bg-gray-50 hover:text-gray-900'
            }`}
          >
            <span className={activeTab === item.id ? 'text-emerald-600' : 'text-gray-400'}>
              {item.icon}
            </span>
            {item.label}
            {activeTab === item.id && (
              <div className="absolute right-4 w-1.5 h-1.5 bg-emerald-500 rounded-full" />
            )}
          </button>
        ))}
      </nav>

      <div className="p-6 border-t border-gray-50">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-4 px-5 py-4 text-[13px] font-bold text-red-500 rounded-2xl hover:bg-red-50 transition-all group"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
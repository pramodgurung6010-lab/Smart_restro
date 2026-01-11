import React, { useState } from 'react';
import { Bell, Search, Calendar, ChevronDown, LogOut, Phone, Mail, X } from 'lucide-react';

const TopBar = ({ user, onLogout, onSearch, notifications = [], onClearNotification, searchResultsCount }) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const today = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    month: 'long', 
    day: 'numeric',
    year: 'numeric'
  });

  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && onSearch) {
      onSearch(searchQuery);
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-8 z-30 shrink-0 relative">
      <div className="flex items-center gap-6 flex-1">
        <div className="relative w-full max-w-[280px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearch}
            onKeyPress={handleKeyPress}
            className="block w-full pl-10 pr-4 py-2 border-none rounded-xl text-xs bg-gray-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all placeholder:text-gray-400 font-medium"
            placeholder="Search orders, tables, menu... or type 'billing', 'menu' to navigate"
          />
          {searchQuery && searchResultsCount !== undefined && (
            <div className={`absolute top-full left-0 mt-1 text-white text-[9px] font-bold px-2 py-1 rounded-lg shadow-lg ${
              typeof searchResultsCount === 'string' && searchResultsCount.includes('Navigate') 
                ? 'bg-blue-600' 
                : 'bg-emerald-600'
            }`}>
              {searchResultsCount}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex justify-center items-center text-[13px] text-gray-500 font-medium">
        <Calendar className="h-4 w-4 mr-2 text-emerald-600" />
        {today}
      </div>

      <div className="flex items-center gap-6 flex-1 justify-end">
        {/* Notifications */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 text-gray-400 hover:text-emerald-600 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 flex items-center justify-center h-4 w-4 text-[9px] font-bold text-white bg-red-500 rounded-full border-2 border-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-[-1]" onClick={() => setShowNotifications(false)}></div>
              <div className="absolute top-full right-0 mt-3 w-80 bg-white rounded-[28px] shadow-2xl border border-gray-100 p-4 animate-in slide-in-from-top-2 duration-300 z-50 max-h-96 overflow-hidden">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-black text-gray-900">Notifications</h3>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X size={14} />
                  </button>
                </div>
                
                <div className="space-y-2 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="text-center py-8 text-gray-400">
                      <Bell size={32} className="mx-auto mb-2 opacity-50" />
                      <p className="text-xs font-medium">No notifications</p>
                    </div>
                  ) : (
                    notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 rounded-2xl border transition-all ${
                          notification.read 
                            ? 'bg-gray-50 border-gray-100' 
                            : 'bg-emerald-50 border-emerald-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1">
                            <p className="text-xs font-bold text-gray-900 mb-1">
                              {notification.title}
                            </p>
                            <p className="text-[10px] text-gray-600 leading-relaxed">
                              {notification.message}
                            </p>
                            <p className="text-[9px] text-gray-400 mt-2 font-medium">
                              {notification.time}
                            </p>
                          </div>
                          {!notification.read && (
                            <button
                              onClick={() => onClearNotification && onClearNotification(notification.id)}
                              className="p-1 hover:bg-white rounded-lg transition-colors"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* PROFILE DROP_DOWN SECTION */}
        <div className="relative">
          <div 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 cursor-pointer group hover:bg-gray-50 px-3 py-1.5 rounded-2xl transition-all select-none"
          >
            <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold text-sm shadow-sm ring-2 ring-emerald-50">
              {(user.name || user.username || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="text-left leading-tight hidden sm:block">
              <p className="text-[13px] font-bold text-gray-900">{user.name || user.username || 'User'}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{user.role}</p>
            </div>
            <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-emerald-600' : 'group-hover:text-gray-600'}`} />
          </div>

          {/* DROPDOWN MENU */}
          {isDropdownOpen && (
            <>
              {/* Backdrop to close menu */}
              <div className="fixed inset-0 z-[-1]" onClick={() => setIsDropdownOpen(false)}></div>
              
              <div className="absolute top-full right-0 mt-3 w-72 bg-white rounded-[28px] shadow-2xl border border-gray-100 p-2 animate-in slide-in-from-top-2 duration-300 z-50 overflow-hidden">
                {/* Header / Detail Part */}
                <div className="p-6 bg-emerald-50/50 rounded-[22px] mb-2">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-600 flex items-center justify-center text-white text-xl font-black shadow-lg shadow-emerald-100">
                      {(user.name || user.username || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-black text-gray-900">{user.name || user.username || 'User'}</p>
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-[0.1em]">{user.role}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3 pt-4 border-t border-emerald-100/50">
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                      <Mail size={14} className="text-emerald-500" />
                      {user.email || 'No email set'}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                      <Phone size={14} className="text-emerald-500" />
                      {user.phoneNumber || 'No phone set'}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-1">
                  <button 
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout();
                    }}
                    className="w-full flex items-center justify-between gap-4 px-5 py-4 text-[12px] font-black text-red-500 rounded-2xl hover:bg-red-50 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut size={18} />
                      SIGN OUT
                    </div>
                    <div className="w-1.5 h-1.5 bg-red-400 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default TopBar;
import React, { useState, useEffect, useMemo } from 'react';
import { UserRole, OrderStatus, TableStatus } from './types';
import { INITIAL_MENU, INITIAL_TABLES } from './constants';
import LoginPage from './components/LoginPage';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';
import AdminDashboard from './components/AdminDashboard';
import MenuManagement from './components/MenuManagement';
import TableMap from './components/TableMap';
import OrderTaking from './components/OrderTaking';
import KitchenDisplay from './components/KitchenDisplay';
import BillingAndPayment from './components/BillingAndPayment';
import ReportsPage from './components/ReportsPage';
import UserManagement from './components/UserManagement';
import ProfileSettings from './components/ProfileSettings';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // App States
  const [menu, setMenu] = useState(INITIAL_MENU);
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]); // Start with empty array, will be loaded from backend
  const [selectedTable, setSelectedTable] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [notifications, setNotifications] = useState([
    {
      id: '1',
      title: 'New Order Ready',
      message: 'Table 5 order is ready for serving',
      time: '2 minutes ago',
      read: false
    },
    {
      id: '2',
      title: 'Table Reservation',
      message: 'Table 8 reserved for 7:30 PM',
      time: '15 minutes ago',
      read: false
    },
    {
      id: '3',
      title: 'Kitchen Alert',
      message: 'Low stock: Chicken Tikka ingredients',
      time: '1 hour ago',
      read: true
    }
  ]);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === UserRole.KITCHEN) setActiveTab('orders');
      else if (currentUser.role === UserRole.WAITER) setActiveTab('tables');
      else setActiveTab('dashboard');
    }
  }, [currentUser]);

  const stats = useMemo(() => {
    const today = new Date().setHours(0,0,0,0);
    const completedOrders = orders.filter(o => o.createdAt >= today && o.isPaid && o.status !== OrderStatus.CANCELLED);
    const revenue = completedOrders.reduce((acc, curr) => acc + curr.total, 0);
    
    return {
      revenue,
      activeOrders: orders.filter(o => o.status !== OrderStatus.SERVED && o.status !== OrderStatus.CANCELLED).length,
      completedOrdersCount: completedOrders.length,
      availableTables: tables.filter(t => t.status === TableStatus.AVAILABLE).length
    };
  }, [orders, tables]);

  const handleLogin = (user) => {
    setCurrentUser(user);
  };
  const handleLogout = () => {
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    
    // Navigation search - check if query matches section names
    const navigationMap = {
      'dashboard': 'dashboard',
      'admin': 'dashboard',
      'home': 'dashboard',
      'overview': 'dashboard',
      'menu': 'menu',
      'food': 'menu',
      'items': 'menu',
      'dishes': 'menu',
      'cuisine': 'menu',
      'tables': 'tables',
      'table': 'tables',
      'seating': 'tables',
      'floor': 'tables',
      'dining': 'tables',
      'orders': 'orders',
      'order': 'orders',
      'kitchen': 'orders',
      'cooking': 'orders',
      'preparation': 'orders',
      'billing': 'billing',
      'bill': 'billing',
      'payment': 'billing',
      'checkout': 'billing',
      'invoice': 'billing',
      'reports': 'reports',
      'report': 'reports',
      'analytics': 'reports',
      'statistics': 'reports',
      'data': 'reports',
      'users': 'users',
      'user': 'users',
      'staff': 'users',
      'employees': 'users',
      'team': 'users',
      'profile': 'profile',
      'settings': 'profile',
      'account': 'profile',
      'preferences': 'profile'
    };
    
    const queryLower = query.toLowerCase().trim();
    
    // Check if the search query matches any navigation term
    for (const [searchTerm, tabName] of Object.entries(navigationMap)) {
      if (queryLower === searchTerm || (queryLower.length >= 3 && searchTerm.includes(queryLower))) {
        // Small delay to show the navigation hint before switching
        setTimeout(() => {
          setActiveTab(tabName);
        }, 500);
        break;
      }
    }
  };

  // Filter data based on search query
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) {
      return { tables, orders, menu, users };
    }

    const query = searchQuery.toLowerCase();
    
    return {
      tables: tables.filter(table => 
        table.number.toLowerCase().includes(query) ||
        table.status.toLowerCase().includes(query)
      ),
      orders: orders.filter(order => {
        const table = tables.find(t => t.id === order.tableId);
        return (
          order.id.toLowerCase().includes(query) ||
          (table && table.number.toLowerCase().includes(query)) ||
          order.items.some(item => item.name.toLowerCase().includes(query)) ||
          order.status.toLowerCase().includes(query)
        );
      }),
      menu: menu.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query)
      ),
      users: users.filter(user =>
        user.name.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query)
      )
    };
  }, [searchQuery, tables, orders, menu, users]);

  // Calculate search results count based on active tab
  const searchResultsCount = useMemo(() => {
    if (!searchQuery.trim()) return undefined;
    
    // Check if it's a navigation search
    const navigationMap = {
      'dashboard': 'Dashboard',
      'admin': 'Dashboard',
      'home': 'Dashboard',
      'overview': 'Dashboard',
      'menu': 'Menu Management',
      'food': 'Menu Management',
      'items': 'Menu Management',
      'dishes': 'Menu Management',
      'cuisine': 'Menu Management',
      'tables': 'Table Map',
      'table': 'Table Map',
      'seating': 'Table Map',
      'floor': 'Table Map',
      'dining': 'Table Map',
      'orders': 'Kitchen Orders',
      'order': 'Kitchen Orders',
      'kitchen': 'Kitchen Orders',
      'cooking': 'Kitchen Orders',
      'preparation': 'Kitchen Orders',
      'billing': 'Billing & Payment',
      'bill': 'Billing & Payment',
      'payment': 'Billing & Payment',
      'checkout': 'Billing & Payment',
      'invoice': 'Billing & Payment',
      'reports': 'Reports',
      'report': 'Reports',
      'analytics': 'Reports',
      'statistics': 'Reports',
      'data': 'Reports',
      'users': 'User Management',
      'user': 'User Management',
      'staff': 'User Management',
      'employees': 'User Management',
      'team': 'User Management',
      'profile': 'Profile Settings',
      'settings': 'Profile Settings',
      'account': 'Profile Settings',
      'preferences': 'Profile Settings'
    };
    
    const queryLower = searchQuery.toLowerCase().trim();
    
    // Check if the search query matches any navigation term
    for (const [searchTerm, sectionName] of Object.entries(navigationMap)) {
      if (queryLower === searchTerm || (queryLower.length >= 3 && searchTerm.includes(queryLower))) {
        return `Navigate to ${sectionName}`;
      }
    }
    
    // Regular search results count
    switch (activeTab) {
      case 'tables': return filteredData.tables.length;
      case 'orders': return filteredData.orders.length;
      case 'menu': return filteredData.menu.length;
      case 'users': return filteredData.users.length;
      case 'dashboard': return filteredData.orders.length;
      case 'billing': return filteredData.orders.length + filteredData.tables.length;
      case 'reports': return filteredData.orders.length;
      default: return 0;
    }
  }, [searchQuery, activeTab, filteredData]);

  const handleClearNotification = (notificationId) => {
    setNotifications(prev => prev.map(n => 
      n.id === notificationId ? { ...n, read: true } : n
    ));
  };

  // Add new notifications when orders change status
  useEffect(() => {
    const readyOrders = orders.filter(o => o.status === OrderStatus.READY && !o.notificationSent);
    readyOrders.forEach(order => {
      const table = tables.find(t => t.id === order.tableId);
      if (table) {
        setNotifications(prev => [{
          id: `order-${order.id}-${Date.now()}`,
          title: 'Order Ready',
          message: `Table ${table.number} order is ready for serving`,
          time: 'Just now',
          read: false
        }, ...prev]);
        
        // Mark as notification sent
        setOrders(prev => prev.map(o => 
          o.id === order.id ? { ...o, notificationSent: true } : o
        ));
      }
    });
  }, [orders, tables]);

  const addOrder = (order) => {
    setOrders(prev => {
      const existingIndex = prev.findIndex(o => o.id === order.id);
      if (existingIndex > -1) {
        return prev.map(o => o.id === order.id ? order : o);
      }
      return [...prev, order];
    });
    
    setTables(prev => prev.map(t => {
      if (t.id === order.tableId) {
        return { ...t, status: TableStatus.OCCUPIED, currentOrderId: order.id };
      }
      return t;
    }));
    
    setSelectedTable(null);
    setActiveTab('tables');
  };

  const handleUpdateItemStatus = (orderId, itemId, status) => {
    setOrders(prev => prev.map(order => {
      if (order.id !== orderId) return order;
      
      const updatedItems = order.items.map(item => 
        item.id === itemId ? { ...item, status } : item
      );
      
      let newOrderStatus = order.status;
      const allReady = updatedItems.every(i => i.status === OrderStatus.READY);
      const anyPreparing = updatedItems.some(i => i.status === OrderStatus.PREPARING || i.status === OrderStatus.READY);

      if (allReady) {
        newOrderStatus = OrderStatus.READY;
      } else if (anyPreparing) {
        newOrderStatus = OrderStatus.PREPARING;
      } else {
        newOrderStatus = OrderStatus.PENDING;
      }
      
      return { ...order, items: updatedItems, status: newOrderStatus };
    }));
  };

  const handleUpdateOrderStatus = (orderId, status) => {
    setOrders(prev => prev.map(o => {
      if (o.id === orderId) {
        const updatedItems = (status === OrderStatus.SERVED || status === OrderStatus.CANCELLED)
          ? o.items.map(item => ({ ...item, status }))
          : o.items;
        return { ...o, status, items: updatedItems };
      }
      return o;
    }));
  };

  const handleUpdateTableStatus = (tableId, status) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        if (status === TableStatus.AVAILABLE) {
          return { ...t, status, currentOrderId: undefined };
        }
        return { ...t, status };
      }
      return t;
    }));
  };

  const reassignTable = (fromTableId, toTableId) => {
    const fromTable = tables.find(t => t.id === fromTableId);
    if (!fromTable?.currentOrderId) return;

    setOrders(prev => prev.map(o => o.id === fromTable.currentOrderId ? { ...o, tableId: toTableId } : o));
    
    setTables(prev => prev.map(t => {
      if (t.id === fromTableId) {
        return { ...t, status: TableStatus.AVAILABLE, currentOrderId: undefined };
      }
      if (t.id === toTableId) {
        return { ...t, status: TableStatus.OCCUPIED, currentOrderId: fromTable.currentOrderId };
      }
      return t;
    }));
  };

  const finalizeBill = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || !table.currentOrderId) return;

    const orderId = table.currentOrderId;
    const tableIdsToRelease = [tableId, ...(table.mergedWith || [])];
    
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, isPaid: true, status: OrderStatus.SERVED } : o));
    
    setTables(prev => {
      let nextTables = prev.map(t => {
        if (tableIdsToRelease.includes(t.id)) {
          return { 
            ...t, 
            status: TableStatus.AVAILABLE, 
            currentOrderId: undefined, 
            mergedWith: undefined, 
            masterTableId: undefined,
            capacity: t.originalCapacity || t.capacity,
            originalCapacity: undefined
          };
        }
        return t;
      });

      if (table.parentId) {
        const siblings = nextTables.filter(t => t.parentId === table.parentId);
        if (siblings.every(s => s.status === TableStatus.AVAILABLE)) {
          nextTables = nextTables.filter(t => t.parentId !== table.parentId);
          nextTables = nextTables.map(t => t.id === table.parentId ? { 
            ...t, 
            isSplit: false, 
            status: TableStatus.AVAILABLE,
            capacity: t.originalCapacity || t.capacity,
            originalCapacity: undefined
          } : t);
        }
      }
      return nextTables;
    });
    setSelectedTable(null);
  };

  const handleEditOrder = (tableId) => {
    const table = tables.find(t => t.id === tableId);
    if (table) {
      setSelectedTable(table);
      setActiveTab('order-entry');
    }
  };

  const handleVoidPaidOrder = (orderId) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: OrderStatus.CANCELLED, isPaid: false } : o));
  };

  const handleSplitTable = (tableId, parts) => {
    const table = tables.find(t => t.id === tableId);
    if (!table || table.status !== TableStatus.AVAILABLE) return;

    const baseCapacity = Math.floor(table.capacity / parts);
    const remainder = table.capacity % parts;

    const subTables = Array.from({ length: parts }).map((_, i) => ({
      id: `split-${tableId}-${i}`,
      number: `${table.number}.${i + 1}`,
      capacity: baseCapacity + (i < remainder ? 1 : 0),
      status: TableStatus.AVAILABLE,
      parentId: tableId
    }));

    setTables(prev => [
      ...prev.map(t => t.id === tableId ? { ...t, isSplit: true, status: TableStatus.OCCUPIED, originalCapacity: t.capacity } : t),
      ...subTables
    ]);
  };

  const handleUnsplit = (parentId) => {
    setTables(prev => {
      const filtered = prev.filter(t => t.parentId !== parentId);
      return filtered.map(t => t.id === parentId ? { 
        ...t, 
        isSplit: false, 
        status: TableStatus.AVAILABLE,
        capacity: t.originalCapacity || t.capacity,
        originalCapacity: undefined
      } : t);
    });
  };

  const handleMergeTables = (masterId, otherIds) => {
    setTables(prev => {
      const masterTable = prev.find(t => t.id === masterId);
      const otherTables = prev.filter(t => otherIds.includes(t.id));
      if (!masterTable) return prev;
      const totalCapacity = masterTable.capacity + otherTables.reduce((sum, t) => sum + t.capacity, 0);
      return prev.map(t => {
        if (t.id === masterId) return { ...t, mergedWith: otherIds, capacity: totalCapacity, originalCapacity: t.originalCapacity || t.capacity };
        if (otherIds.includes(t.id)) return { ...t, status: TableStatus.MERGED, masterTableId: masterId, originalCapacity: t.originalCapacity || t.capacity };
        return t;
      });
    });
  };

  const handleUnmerge = (masterId) => {
    const master = tables.find(t => t.id === masterId);
    if (!master || !master.mergedWith) return;
    const allIds = [masterId, ...master.mergedWith];
    setTables(prev => prev.map(t => {
      if (allIds.includes(t.id)) return { ...t, status: TableStatus.AVAILABLE, mergedWith: undefined, masterTableId: undefined, capacity: t.originalCapacity || t.capacity, originalCapacity: undefined };
      return t;
    }));
  };

  const handleSelectiveUnmerge = (masterId, tableIdToUnmerge) => {
    setTables(prev => {
      const master = prev.find(t => t.id === masterId);
      if (!master || !master.mergedWith) return prev;
      
      // Remove the table from the merged group
      const updatedMergedWith = master.mergedWith.filter(id => id !== tableIdToUnmerge);
      
      return prev.map(t => {
        if (t.id === masterId) {
          // Update master table
          const tableToUnmerge = prev.find(table => table.id === tableIdToUnmerge);
          const newCapacity = t.capacity - (tableToUnmerge?.originalCapacity || tableToUnmerge?.capacity || 0);
          
          if (updatedMergedWith.length === 0) {
            // If no more merged tables, restore master to original state
            return { 
              ...t, 
              mergedWith: undefined, 
              capacity: t.originalCapacity || t.capacity, 
              originalCapacity: undefined 
            };
          } else {
            // Update merged list and capacity
            return { 
              ...t, 
              mergedWith: updatedMergedWith, 
              capacity: newCapacity 
            };
          }
        }
        if (t.id === tableIdToUnmerge) {
          // Unmerge the specific table
          return { 
            ...t, 
            status: TableStatus.AVAILABLE, 
            masterTableId: undefined, 
            capacity: t.originalCapacity || t.capacity, 
            originalCapacity: undefined 
          };
        }
        return t;
      });
    });
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard stats={stats} orders={filteredData.orders} />;
      case 'menu': return (
        <MenuManagement 
          menu={filteredData.menu} 
          onUpdateItem={(item) => setMenu(prev => {
            const exists = prev.find(i => i.id === item.id);
            if (exists) {
              return prev.map(i => i.id === item.id ? item : i);
            }
            return [...prev, item];
          })} 
        />
      );
      case 'tables': return (
        <TableMap 
          tables={filteredData.tables} 
          onSelectTable={(t) => { setSelectedTable(t); setActiveTab('order-entry'); }} 
          onUpdateStatus={handleUpdateTableStatus}
          onSplit={handleSplitTable} 
          onUnsplit={handleUnsplit}
          onMerge={handleMergeTables} 
          onUnmerge={handleUnmerge}
          onSelectiveUnmerge={handleSelectiveUnmerge}
          onReassign={reassignTable} 
        />
      );
      case 'order-entry': 
        if (!selectedTable) {
          setActiveTab('tables');
          return null;
        }
        const existingOrder = selectedTable.currentOrderId ? orders.find(o => o.id === selectedTable.currentOrderId) : undefined;
        return <OrderTaking table={selectedTable} menu={filteredData.menu} onSubmitOrder={addOrder} onCancel={() => { setSelectedTable(null); setActiveTab('tables'); }} existingOrder={existingOrder} />;
      case 'orders': 
        return (
          <KitchenDisplay 
            orders={filteredData.orders} 
            onUpdateItemStatus={handleUpdateItemStatus}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            role={currentUser.role} 
          />
        );
      case 'billing': 
        return (
          <BillingAndPayment 
            tables={filteredData.tables} 
            orders={filteredData.orders} 
            userRole={currentUser.role}
            onFinalize={finalizeBill} 
            onEditBill={handleEditOrder}
            onCancelBill={(id) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: OrderStatus.CANCELLED } : o))} 
            onVoidPaidBill={handleVoidPaidOrder}
          />
        );
      case 'reports': return <ReportsPage orders={filteredData.orders} />;
      case 'users': return <UserManagement users={filteredData.users} setUsers={setUsers} />;
      case 'profile': return <ProfileSettings user={currentUser} onUpdate={(updated) => setCurrentUser(updated)} />;
      default: return <div className="p-8 text-center text-gray-500">Feature Coming Soon</div>;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={currentUser.role} onLogout={handleLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopBar 
          user={currentUser} 
          onLogout={handleLogout} 
          onSearch={handleSearch}
          notifications={notifications}
          onClearNotification={handleClearNotification}
          searchResultsCount={searchResultsCount}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6 no-scrollbar">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
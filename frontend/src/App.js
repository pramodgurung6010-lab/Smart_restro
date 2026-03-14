import { useState, useEffect } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import MenuManagement from './pages/MenuManagement';
import TableMap from './pages/TableMap';
import OrderTaking from './pages/OrderTaking';
import KitchenDisplay from './pages/KitchenDisplay';
import BillingAndPayment from './pages/BillingAndPayment';
import ReportsPage from './pages/ReportsPage';
import UserManagement from './pages/UserManagement';
import ProfileSettings from './pages/ProfileSettings';
import Sidebar from './components/Sidebar';
import TopBar from './components/TopBar';

const App = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedTable, setSelectedTable] = useState(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCurrentUser(user);
        const storedTab = localStorage.getItem('activeTab');
        if (storedTab && storedTab !== 'order-entry') setActiveTab(storedTab);
      } catch (e) { localStorage.removeItem('currentUser'); }
    }
  }, []);

  useEffect(() => {
    if (currentUser && activeTab) localStorage.setItem('activeTab', activeTab);
  }, [activeTab, currentUser]);

  const handleLogin = (user) => {
    setCurrentUser(user);
    localStorage.setItem('currentUser', JSON.stringify(user));
    if (user.role === 'KITCHEN') setActiveTab('orders');
    else if (user.role === 'WAITER') setActiveTab('tables');
    else setActiveTab('dashboard');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('activeTab');
    setCurrentUser(null);
    setActiveTab('dashboard');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <AdminDashboard />;
      case 'menu': return <MenuManagement />;
      case 'tables': return <TableMap onSelectTable={(table) => { setSelectedTable(table); setActiveTab('order-entry'); }} />;
      case 'order-entry':
        if (!selectedTable) { setActiveTab('tables'); return null; }
        return <OrderTaking table={selectedTable} onSubmitOrder={() => { setSelectedTable(null); setActiveTab('tables'); }} onCancel={() => { setSelectedTable(null); setActiveTab('tables'); }} />;
      case 'orders': return <KitchenDisplay role={currentUser?.role} />;
      case 'billing': return <BillingAndPayment userRole={currentUser?.role} />;
      case 'reports': return <ReportsPage />;
      case 'users': return <UserManagement />;
      case 'profile': return <ProfileSettings user={currentUser} onUpdate={setCurrentUser} />;
      default: return <div className='p-8 text-center text-gray-500'>Coming Soon</div>;
    }
  };

  if (!currentUser) return <LoginPage onLogin={handleLogin} />;

  return (
    <div className='flex h-screen bg-gray-50'>
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={currentUser.role} onLogout={handleLogout} />
      <div className='flex-1 flex flex-col overflow-hidden'>
        <TopBar user={currentUser} onLogout={handleLogout} />
        <main className='flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6'>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;

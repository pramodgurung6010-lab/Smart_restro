import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { UserRole } from '../types';
import { Plus, Edit2, Trash2, Mail, Phone, User, ShieldCheck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const UserManagement = ({ users, setUsers }) => {
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ 
    username: '', 
    name: '', 
    role: UserRole.WAITER, 
    email: '', 
    phoneNumber: '', 
    password: '' 
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailStatus, setEmailStatus] = useState('');

  // Load users from backend on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5002/api/auth/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Failed to load users:', error.response?.data || error.message);
      setError('Failed to load users: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setEmailStatus('');

    if (!formData.username || !formData.name || !formData.email) {
      setError('Username, name, and email are required');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      
      if (editingUser) {
        // Update existing user
        await axios.put(`http://localhost:5002/api/auth/users/${editingUser._id}`, {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
          isActive: true
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        setEmailStatus('User updated successfully');
      } else {
        // Create new user
        const response = await axios.post('http://localhost:5002/api/auth/register', {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
          // No password field - it will be auto-generated
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.emailSent) {
          setEmailStatus(`✅ User created and credentials sent via email!
          
🔐 Generated Password: ${response.data.generatedPassword}
(Backup - user will receive this via email)`);
        } else if (response.data.manualCredentials) {
          const creds = response.data.manualCredentials;
          setEmailStatus(`⚠️ User created successfully! Email not configured - Please share these credentials manually:
          
📋 Login Details:
• Username: ${creds.username}
• Password: ${creds.password}
• Role: ${creds.role}

🔐 Auto-generated secure password for better security!`);
        } else {
          setEmailStatus(`⚠️ User created but email sending failed. 
          
🔐 Generated Password: ${response.data.generatedPassword}
Please share these credentials manually.`);
        }
      }

      // Reload users list
      await loadUsers();
      
      // Reset form
      setShowModal(false);
      setEditingUser(null);
      setFormData({ 
        username: '', 
        name: '', 
        role: UserRole.WAITER, 
        email: '', 
        phoneNumber: '', 
        password: '' 
      });
      
      // Clear status after 5 seconds
      setTimeout(() => setEmailStatus(''), 5000);
      
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (user) => {
    setEditingUser(user);
    setFormData({ 
      username: user.username, 
      name: user.name || user.username, 
      role: user.role, 
      email: user.email || '', 
      phoneNumber: user.phoneNumber || '', 
      password: '' 
    });
    setShowModal(true);
    setError('');
    setEmailStatus('');
  };

  const deleteUser = async (user) => {
    if (!confirm(`Are you sure you want to remove ${user.name || user.username}?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`http://localhost:5002/api/auth/users/${user._id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Reload users list
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete user');
    }
  };

  const openNewUserModal = () => {
    setShowModal(true);
    setEditingUser(null);
    setFormData({ 
      username: '', 
      name: '', 
      role: UserRole.WAITER, 
      email: '', 
      phoneNumber: '', 
      password: '' 
    });
    setError('');
    setEmailStatus('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Staff Management</h1>
          <p className="text-sm text-gray-500 font-medium mt-1">Register and manage restaurant personnel</p>
        </div>
        <button 
          onClick={openNewUserModal} 
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
        >
          <Plus size={18} /> REGISTER NEW STAFF
        </button>
      </div>

      {/* Email Status Message */}
      {emailStatus && (
        <div className={`p-4 rounded-xl border ${
          emailStatus.includes('✅') 
            ? 'bg-green-50 border-green-200 text-green-800' 
            : 'bg-yellow-50 border-yellow-200 text-yellow-800'
        }`}>
          <div className="flex items-center gap-2">
            {emailStatus.includes('✅') ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
            <span className="font-medium">{emailStatus}</span>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/30 text-[10px] font-black text-gray-400 uppercase tracking-widest">
            <tr>
              <th className="px-8 py-5">Name & Role</th>
              <th className="px-8 py-5">Contact</th>
              <th className="px-8 py-5">Username</th>
              <th className="px-8 py-5">Status</th>
              <th className="px-8 py-5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map(user => (
              <tr key={user._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-8 py-5">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 font-black text-lg border border-emerald-100">
                      {(user.name || user.username).charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 leading-tight">{user.name || user.username}</p>
                      <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest mt-1 inline-block">{user.role}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs text-gray-500">
                  <p className="flex items-center gap-2 font-medium">
                    <Mail size={12} className="text-gray-300" /> 
                    {user.email || '—'}
                  </p>
                  <p className="flex items-center gap-2 mt-1 font-black text-gray-900">
                    <Phone size={12} className="text-emerald-500" /> 
                    {user.phoneNumber || '—'}
                  </p>
                </td>
                <td className="px-8 py-5 font-mono text-sm text-gray-400 font-bold">@{user.username}</td>
                <td className="px-8 py-5">
                  <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full ${
                    user.isActive 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-8 py-5 text-right space-x-2">
                  <button 
                    onClick={() => startEdit(user)} 
                    className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                  >
                    <Edit2 size={18}/>
                  </button>
                  <button 
                    onClick={() => deleteUser(user)} 
                    className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18}/>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#022c22]/20 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSubmit} className="bg-white rounded-[40px] shadow-2xl p-10 max-w-md w-full space-y-6 animate-in zoom-in-95 duration-200">
            <div>
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">
                {editingUser ? 'Update Staff Member' : 'Register New Staff'}
              </h3>
              <p className="text-gray-400 font-medium text-sm">
                {editingUser ? 'Update staff information' : 'Secure password will be auto-generated and emailed'}
              </p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-[10px] font-black uppercase rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <User size={12} /> Full Name
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full mt-1.5 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold" 
                  required 
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    @ Username
                  </label>
                  <input 
                    type="text" 
                    value={formData.username} 
                    onChange={e => setFormData({...formData, username: e.target.value})} 
                    className="w-full mt-1.5 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold" 
                    required 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} /> Role
                  </label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})} 
                    className="w-full mt-1.5 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold appearance-none"
                  >
                    <option value={UserRole.WAITER}>Waiter</option>
                    <option value={UserRole.KITCHEN}>Kitchen</option>
                    <option value={UserRole.ADMIN}>Admin</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Mail size={12} /> Email
                </label>
                <input 
                  type="email" 
                  value={formData.email} 
                  onChange={e => setFormData({...formData, email: e.target.value})} 
                  className="w-full mt-1.5 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold" 
                  required
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={12} /> Phone Number
                </label>
                <input 
                  type="tel" 
                  value={formData.phoneNumber} 
                  onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                  className="w-full mt-1.5 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-black" 
                  placeholder="+1 (555) 000-0000" 
                />
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl text-xs uppercase tracking-widest"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    {editingUser ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  editingUser ? 'Update Account' : 'Save Account'
                )}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
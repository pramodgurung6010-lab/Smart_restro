import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { UserRole } from '../types';
import { Plus, Edit2, Trash2, Mail, Phone, User, ShieldCheck, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
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
      const response = await api.get('/auth/users');
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

    // Validate email format — require 2+ chars after dot, proper domain structure
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const domain = formData.email.split('@')[1] || '';
    const tld = domain.split('.').pop() || '';
    if (!emailRegex.test(formData.email) || tld.length < 2) {
      setError('Please enter a valid email address (e.g. name@gmail.com)');
      setLoading(false);
      return;
    }
    // Warn about suspicious domains
    const knownDomains = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com'];
    const domainLower = domain.toLowerCase();
    if (domainLower.startsWith('gmail.') && domainLower !== 'gmail.com') {
      setError('Did you mean @gmail.com? Please check the email address.');
      setLoading(false);
      return;
    }

    // Validate phone number — exactly 10 digits after +977
    if (formData.phoneNumber) {
      const digits = formData.phoneNumber.replace(/^\+?977/, '').replace(/\D/g, '');
      if (digits.length !== 10) {
        setError('Phone number must be exactly 10 digits (e.g. 9812345678)');
        setLoading(false);
        return;
      }
      // Check phone uniqueness against existing users
      const phoneExists = users.some(u => 
        u.phoneNumber === formData.phoneNumber && 
        (!editingUser || u._id !== editingUser._id)
      );
      if (phoneExists) {
        setError('Phone number already exists');
        setLoading(false);
        return;
      }
    }

    try {
      const token = localStorage.getItem('token');
      if (editingUser) {
        await api.put(`/auth/users/${editingUser._id}`, {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
          isActive: true
        });
        
        setEmailStatus('User updated successfully');
      } else {
        const response = await api.post('/auth/register', {
          username: formData.username,
          name: formData.name,
          email: formData.email,
          role: formData.role,
          phoneNumber: formData.phoneNumber,
        });

        if (response.data.manualCredentials) {
          const creds = response.data.manualCredentials;
          setEmailStatus(`⚠️ User created! Email could not be sent — share credentials manually:\n\nUsername: ${creds.username}\nPassword: ${creds.password}\nRole: ${creds.role}`);
        } else {
          setEmailStatus(`✅ User created and credentials sent to ${formData.email}!`);
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
      
      // Clear status after 30 seconds (longer so admin can copy credentials)
      setTimeout(() => setEmailStatus(''), 30000);
      
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
    if (!window.confirm(`Are you sure you want to remove ${user.name || user.username}?`)) return;
    try {
      await api.delete(`/auth/users/${user._id}`);
      
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

  const toggleUserStatus = async (user) => {
    if (user.role === 'ADMIN') return;
    try {
      await api.patch(`/auth/users/${user._id}/toggle-status`);
      await loadUsers();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-500 mt-1">Register and manage restaurant personnel</p>
        </div>
        <button 
          onClick={openNewUserModal} 
          className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"
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
          <div className="flex items-start gap-2">
            {emailStatus.includes('✅') ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
            <div className="flex-1">
              {emailStatus.includes('⚠️') ? (
                <>
                  <p className="font-bold text-sm mb-2">User created! Email could not be sent — share credentials manually:</p>
                  <div className="bg-white border border-yellow-300 rounded-lg p-3 font-mono text-sm space-y-1">
                    {emailStatus.split('\n').filter(l => l.trim() && !l.includes('⚠️')).map((line, i) => (
                      <p key={i} className="text-gray-800">{line}</p>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      const text = emailStatus.split('\n').filter(l => l.trim() && !l.includes('⚠️')).join('\n');
                      navigator.clipboard.writeText(text);
                    }}
                    className="mt-2 text-xs font-bold text-yellow-700 underline mr-4"
                  >
                    Copy credentials
                  </button>
                  <a
                    href={(() => {
                      const lines = emailStatus.split('\n').filter(l => l.trim() && !l.includes('⚠️'));
                      const text = `Smart Restro Login Credentials:\n${lines.join('\n')}\n\nLogin at your restaurant app.`;
                      return `https://wa.me/?text=${encodeURIComponent(text)}`;
                    })()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 text-xs font-bold text-green-700 underline"
                  >
                    Share via WhatsApp
                  </a>
                </>
              ) : (
                <span className="font-medium text-sm">{emailStatus}</span>
              )}
            </div>
            <button onClick={() => setEmailStatus('')} className="text-gray-400 hover:text-gray-600 shrink-0">✕</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-gray-50/30 text-xs font-bold text-gray-400 uppercase tracking-widest">
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
                      <span className="text-xs font-bold uppercase text-emerald-500 tracking-widest mt-1 inline-block">{user.role}</span>
                    </div>
                  </div>
                </td>
                <td className="px-8 py-5 text-xs text-gray-500">
                  <p className="flex items-center gap-2 font-medium">
                    <Mail size={12} className="text-gray-300" /> 
                    {user.email || '—'}
                  </p>
                  <p className="flex items-center gap-2 mt-1 font-bold text-gray-900">
                    <Phone size={12} className="text-emerald-500" /> 
                    {user.phoneNumber 
                      ? (user.phoneNumber.startsWith('+977') ? user.phoneNumber : `+977${user.phoneNumber}`)
                      : '—'
                    }
                  </p>
                </td>
                <td className="px-8 py-5 font-mono text-sm text-gray-400 font-bold">@{user.username}</td>
                <td className="px-8 py-5">
                  <button
                    onClick={() => toggleUserStatus(user)}
                    disabled={user.role === 'ADMIN'}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${
                      user.role === 'ADMIN'
                        ? 'bg-emerald-100 text-emerald-700 cursor-not-allowed'
                        : user.isActive
                        ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                        : 'bg-red-50 text-red-600 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <div className={`w-1.5 h-1.5 rounded-full ${
                      user.role === 'ADMIN' ? 'bg-emerald-600' : user.isActive ? 'bg-emerald-600' : 'bg-red-600'
                    }`}></div>
                    {user.role === 'ADMIN' ? 'Active' : user.isActive ? 'Active' : 'Inactive'}
                  </button>
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
              <h3 className="text-2xl font-bold text-gray-900">
                {editingUser ? 'Update Staff Member' : 'Register New Staff'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {editingUser ? 'Update staff information' : 'Secure password will be auto-generated and emailed'}
              </p>
            </div>
            
            {error && (
              <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs font-bold uppercase rounded-xl">
                {error}
              </div>
            )}
            
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
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
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
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
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <ShieldCheck size={12} /> Role
                  </label>
                  <select 
                    value={formData.role} 
                    onChange={e => setFormData({...formData, role: e.target.value})} 
                    className="w-full mt-1.5 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold appearance-none"
                  >
                    <option value={UserRole.WAITER}>Waiter</option>
                    <option value={UserRole.KITCHEN}>Kitchen</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
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
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Phone size={12} /> Phone Number
                </label>
                <div className="flex mt-1.5">
                  <span className="px-4 py-3.5 bg-gray-100 border border-gray-100 rounded-l-2xl font-bold text-gray-600 text-sm shrink-0">+977</span>
                  <input 
                    type="tel"
                    value={formData.phoneNumber.replace(/^\+?977/, '')}
                    onChange={e => {
                      const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setFormData({...formData, phoneNumber: `+977${digits}`});
                    }}
                    className="flex-1 px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-r-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold"
                    placeholder="0000000000"
                    maxLength={10}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-4 pt-4">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                className="flex-1 py-4 bg-gray-100 text-gray-500 font-bold rounded-2xl text-xs uppercase tracking-widest"
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="flex-[2] py-4 bg-emerald-600 text-white font-bold rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 active:scale-95 transition-all text-xs uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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
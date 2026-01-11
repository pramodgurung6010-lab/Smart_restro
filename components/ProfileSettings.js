import React, { useState } from 'react';
import axios from 'axios';
import { Save, UserCircle, Key, Loader2, CheckCircle, AlertCircle } from 'lucide-react';

const ProfileSettings = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({ 
    name: user.name || user.username, 
    email: user.email || '', 
    phoneNumber: user.phoneNumber || '' 
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.put('http://localhost:5002/api/auth/profile', {
        name: formData.name,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Update user in parent component
      onUpdate(response.data.user);
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordLoading(true);
    setPasswordError('');
    setPasswordSuccess(false);

    // Validate passwords match
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('New passwords do not match');
      setPasswordLoading(false);
      return;
    }

    // Validate password strength
    if (passwordData.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters long');
      setPasswordLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put('http://localhost:5002/api/auth/change-password', {
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setPasswordSuccess(true);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      setTimeout(() => setPasswordSuccess(false), 5000);
    } catch (err) {
      setPasswordError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full border-4 border-white shadow-lg">
          <UserCircle size={48} />
        </div>
        <h1 className="text-3xl font-black text-gray-900">Account Settings</h1>
        <p className="text-gray-500">Maintain your security credentials and contact info</p>
      </div>

      {/* Profile Information Form */}
      <form onSubmit={handleProfileSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-6">
          <h2 className="text-xl font-black text-gray-900">Profile Information</h2>
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name</label>
              <input 
                type="text" 
                value={formData.name} 
                onChange={e => setFormData({...formData, name: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username (Permanent)</label>
              <input 
                type="text" 
                value={`@${user.username}`} 
                disabled 
                className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl font-mono text-gray-400 cursor-not-allowed" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
              <input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({...formData, email: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
              <input 
                type="tel" 
                value={formData.phoneNumber} 
                onChange={e => setFormData({...formData, phoneNumber: e.target.value})} 
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">
            {saved ? (
              <span className="flex items-center gap-2 text-green-600">
                <CheckCircle size={16} />
                Changes saved successfully!
              </span>
            ) : (
              'Ensure your data is up to date.'
            )}
          </p>
          <button 
            type="submit" 
            className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Updating...
              </>
            ) : (
              <>
                <Save size={18} />
                Update Profile
              </>
            )}
          </button>
        </div>
      </form>

      {/* Password Change Form */}
      <form onSubmit={handlePasswordSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="flex items-center gap-2 text-emerald-600 font-black text-sm uppercase tracking-widest">
            <Key size={16} />
            Change Password
          </div>

          {passwordError && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl flex items-center gap-2">
              <AlertCircle size={16} />
              {passwordError}
            </div>
          )}

          {passwordSuccess && (
            <div className="p-3 bg-green-50 border border-green-100 text-green-600 text-sm rounded-xl flex items-center gap-2">
              <CheckCircle size={16} />
              Password changed successfully!
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Current Password</label>
              <input 
                type="password" 
                value={passwordData.currentPassword}
                onChange={e => setPasswordData({...passwordData, currentPassword: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
              <input 
                type="password" 
                value={passwordData.newPassword}
                onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                required
                minLength={6}
              />
              <p className="text-[10px] text-gray-400">Minimum 6 characters required</p>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Confirm New Password</label>
              <input 
                type="password" 
                value={passwordData.confirmPassword}
                onChange={e => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" 
                required
              />
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-end">
          <button 
            type="submit" 
            className="flex items-center gap-2 px-8 py-3 bg-red-600 text-white font-black rounded-xl shadow-xl shadow-red-100 hover:bg-red-700 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={passwordLoading}
          >
            {passwordLoading ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Changing...
              </>
            ) : (
              <>
                <Key size={18} />
                Change Password
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
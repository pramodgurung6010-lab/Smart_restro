import React, { useState } from 'react';
import { Save, UserCircle, Key } from 'lucide-react';

const ProfileSettings = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({ name: user.name, email: user.email || '', phoneNumber: user.phoneNumber || '', password: '' });
  const [saved, setSaved] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate({ ...user, ...formData });
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <div className="inline-flex items-center justify-center w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full border-4 border-white shadow-lg"><UserCircle size={48} /></div>
        <h1 className="text-3xl font-black text-gray-900">Account Settings</h1>
        <p className="text-gray-500">Maintain your security credentials and contact info</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Display Name</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-semibold" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Username (Permanent)</label>
              <input type="text" value={`@${user.username}`} disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-100 rounded-xl font-mono text-gray-400 cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email Address</label>
              <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone Number</label>
              <input type="tel" value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
            </div>
          </div>

          <div className="pt-6 border-t border-gray-50">
            <div className="flex items-center gap-2 mb-4 text-emerald-600 font-black text-xs uppercase tracking-widest"><Key size={16} /> Change Password</div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">New Password</label>
              <input type="password" placeholder="••••••••" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none" />
              <p className="text-[10px] text-gray-400">Leave blank to keep your current password</p>
            </div>
          </div>
        </div>

        <div className="px-8 py-6 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
          <p className="text-xs text-gray-500 font-medium">{saved ? '✨ Changes saved successfully!' : 'Ensure your data is up to date.'}</p>
          <button type="submit" className="flex items-center gap-2 px-8 py-3 bg-emerald-600 text-white font-black rounded-xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all active:scale-95"><Save size={18} /> Update Profile</button>
        </div>
      </form>
    </div>
  );
};

export default ProfileSettings;
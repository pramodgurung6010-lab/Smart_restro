import React, { useState } from 'react';
import { CATEGORIES } from '../constants';
import { Plus, Search, Edit3, Trash2, Check, X, DollarSign, Tag, Info, FileText } from 'lucide-react';

const MenuManagement = ({ menu, onUpdateItem }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Main',
    price: 0,
    available: true,
    description: ''
  });

  const filteredMenu = menu.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setFormData({ name: '', category: 'Main', price: 0, available: true, description: '' });
    setShowModal(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setFormData({ 
      name: item.name, 
      category: item.category, 
      price: item.price, 
      available: item.available,
      description: item.description || ''
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingItem) {
      onUpdateItem({ ...editingItem, ...formData });
    } else {
      const newItem = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      };
      onUpdateItem(newItem); 
    }
    setShowModal(false);
  };

  const toggleAvailability = (item) => {
    onUpdateItem({ ...item, available: !item.available });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight">Menu Management</h1>
          <p className="text-sm text-gray-500 font-medium">Create and refine your culinary offerings</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="inline-flex items-center px-6 py-3 bg-emerald-600 text-white font-black rounded-2xl hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-100 active:scale-95"
        >
          <Plus size={20} className="mr-2" />
          ADD NEW DISH
        </button>
      </div>

      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/30 flex flex-col lg:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search dishes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/10 transition-all font-medium"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 lg:pb-0">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-2.5 text-[11px] font-black rounded-xl whitespace-nowrap transition-all uppercase tracking-widest ${
                  activeCategory === cat 
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' 
                    : 'bg-white text-gray-400 border border-gray-100 hover:border-emerald-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50/20 text-gray-400 text-[10px] font-black uppercase tracking-[0.2em] border-b border-gray-100">
                <th className="px-8 py-5">Dish Details</th>
                <th className="px-8 py-5">Category</th>
                <th className="px-8 py-5">Price</th>
                <th className="px-8 py-5">Availability</th>
                <th className="px-8 py-5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredMenu.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                  <td className="px-8 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-black text-lg border border-emerald-100">
                        {item.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{item.name}</span>
                        {item.description && (
                          <span className="text-[10px] text-gray-400 font-medium truncate max-w-[200px]">{item.description}</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="px-3 py-1 rounded-xl bg-gray-100 text-gray-500 text-[10px] font-black uppercase tracking-widest">
                      {item.category}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <span className="font-mono font-black text-gray-900 text-lg">Rs.{item.price.toFixed(2)}</span>
                  </td>
                  <td className="px-8 py-5">
                    <button 
                      onClick={() => toggleAvailability(item)}
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
                        item.available 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-red-50 text-red-600 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <div className={`w-1.5 h-1.5 rounded-full ${item.available ? 'bg-emerald-600' : 'bg-red-600'}`}></div>
                      {item.available ? 'Active' : 'Sold Out'}
                    </button>
                  </td>
                  <td className="px-8 py-5 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handleOpenEdit(item)}
                        className="p-2.5 text-blue-600 hover:bg-blue-50 rounded-xl transition-all"
                      >
                        <Edit3 size={18} />
                      </button>
                      <button className="p-2.5 text-red-400 hover:bg-red-50 rounded-xl transition-all">
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[#022c22]/20 backdrop-blur-md z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-lg w-full animate-in zoom-in-95 duration-300">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-3xl font-black text-gray-900 tracking-tight">
                  {editingItem ? 'Edit Dish' : 'Create New Dish'}
                </h3>
                <p className="text-gray-400 font-medium text-sm">Fill in the details for your menu item</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-400 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <Info size={12} /> Dish Name
                </label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold" 
                  placeholder="e.g. Truffle Mushroom Risotto"
                  required 
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Tag size={12} /> Category
                  </label>
                  <select 
                    value={formData.category} 
                    onChange={e => setFormData({...formData, category: e.target.value})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-bold appearance-none"
                  >
                    {CATEGORIES.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <DollarSign size={12} /> Price
                  </label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: parseFloat(e.target.value)})}
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-mono font-black"
                    required 
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FileText size={12} /> Description
                </label>
                <textarea 
                  value={formData.description} 
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all font-medium min-h-[100px] resize-none" 
                  placeholder="Describe the flavors, ingredients, or allergens..."
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="flex-1 py-4 bg-gray-100 text-gray-500 font-black rounded-2xl hover:bg-gray-200 transition-all text-xs uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="flex-[2] py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all text-xs uppercase tracking-widest active:scale-95"
                >
                  {editingItem ? 'UPDATE DISH' : 'CONFIRM DISH'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;
import React, { useState } from 'react';
import { TableStatus } from '../types';
import { Users, GitMerge, Columns, X, Check, Move, Undo2, Plus, ChevronDown, ArrowRight } from 'lucide-react';

const TableMap = ({ tables, onSelectTable, onUpdateStatus, onSplit, onUnsplit, onMerge, onUnmerge, onSelectiveUnmerge, onReassign }) => {
  const [mergeMode, setMergeMode] = useState(false);
  const [reassignMode, setReassignMode] = useState(null);
  const [selectedForMerge, setSelectedForMerge] = useState([]);
  const [showSplitModal, setShowSplitModal] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(null);
  const [showUnmergeModal, setShowUnmergeModal] = useState(null);

  const movingTable = reassignMode ? tables.find(t => t.id === reassignMode) : null;

  const getStatusColor = (table) => {
    if (mergeMode && selectedForMerge.includes(table.id)) {
      return 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 text-emerald-800 scale-105';
    }
    
    // UI state for the table being moved
    if (reassignMode === table.id) {
      return 'bg-blue-50 border-blue-500 ring-4 ring-blue-100 shadow-xl scale-105 z-10';
    }

    // UI state for potential destination tables
    if (reassignMode && table.status === TableStatus.AVAILABLE) {
      return 'bg-white border-blue-400 border-dashed hover:border-blue-600 hover:bg-blue-50/50 text-blue-700';
    }

    // Dimming effect for ineligible tables during reassign mode
    if (reassignMode && table.status !== TableStatus.AVAILABLE) {
      return 'bg-gray-50 border-gray-100 opacity-30 grayscale pointer-events-none';
    }

    switch (table.status) {
      case TableStatus.AVAILABLE: return 'bg-white border-green-200 hover:border-green-500 text-green-700';
      case TableStatus.OCCUPIED: return 'bg-red-50 border-red-200 text-red-700 shadow-inner ring-1 ring-red-100';
      case TableStatus.RESERVED: return 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-100';
      case TableStatus.MERGED: return 'bg-gray-50 border-gray-200 text-gray-400 opacity-60 pointer-events-none grayscale';
      default: return 'bg-gray-100 border-gray-200 text-gray-700';
    }
  };

  const handleTableClick = (table) => {
    if (mergeMode) {
      if (table.status !== TableStatus.AVAILABLE) return;
      setSelectedForMerge(prev => prev.includes(table.id) ? prev.filter(id => id !== table.id) : [...prev, table.id]);
      return;
    }

    if (reassignMode) {
      if (table.status === TableStatus.AVAILABLE && reassignMode !== table.id) {
        onReassign(reassignMode, table.id);
        setReassignMode(null);
      } else if (reassignMode === table.id) {
        setReassignMode(null);
      }
      return;
    }

    if (table.status === TableStatus.AVAILABLE || table.status === TableStatus.OCCUPIED) {
      onSelectTable(table);
    }
  };

  const confirmMerge = () => {
    if (selectedForMerge.length < 2) return;
    const [master, ...others] = selectedForMerge;
    onMerge(master, others);
    setMergeMode(false);
    setSelectedForMerge([]);
  };

  const visibleTables = tables.filter(t => !t.isSplit);

  const canSplit = (table) => {
    return (table.number === '12' || table.number === '13') && !table.parentId && table.status === TableStatus.AVAILABLE;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          {reassignMode ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white animate-pulse">
                <Move size={20} />
              </div>
              <div>
                <h1 className="text-2xl font-black text-blue-700">MOVE GUEST</h1>
                <p className="text-sm text-blue-500 font-bold">Select destination for Table {movingTable?.number}</p>
              </div>
            </div>
          ) : (
            <>
              <h1 className="text-2xl font-bold text-gray-900">Dining Floor Control</h1>
              <p className="text-sm text-gray-500 mt-1">Manage seating, manual reservations, and ongoing service</p>
            </>
          )}
        </div>
        <div className="flex gap-2">
          {mergeMode ? (
            <>
              <button onClick={confirmMerge} disabled={selectedForMerge.length < 2} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-bold shadow-lg disabled:opacity-50"><Check size={18} /> Confirm Merge</button>
              <button onClick={() => { setMergeMode(false); setSelectedForMerge([]); }} className="px-4 py-2 border border-red-200 text-red-600 rounded-lg text-sm font-bold"><X size={18} /></button>
            </>
          ) : reassignMode ? (
            <button onClick={() => setReassignMode(null)} className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-xl text-sm font-black shadow-xl hover:bg-gray-800 transition-all">
              <X size={18} /> CANCEL MOVE
            </button>
          ) : (
            <button onClick={() => setMergeMode(true)} className="flex items-center gap-2 px-4 py-2 bg-white border border-emerald-200 text-emerald-700 rounded-lg text-sm font-bold shadow-sm hover:bg-emerald-50 transition-all"><GitMerge size={18} /> Group Tables</button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-6">
        {visibleTables.map((table) => (
          <div 
            key={table.id}
            onClick={() => handleTableClick(table)}
            className={`group relative flex flex-col items-center justify-center p-6 rounded-3xl border-2 transition-all transform ${getStatusColor(table)} h-56 ${table.status === TableStatus.AVAILABLE || table.status === TableStatus.OCCUPIED || table.status === TableStatus.RESERVED || mergeMode || reassignMode ? 'cursor-pointer' : ''}`}
          >
            {/* Context Badge for Reassign Mode */}
            {reassignMode === table.id && (
              <div className="absolute -top-3 bg-blue-600 text-white text-[10px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-lg animate-bounce">
                Relocating
              </div>
            )}
            
            {reassignMode && table.status === TableStatus.AVAILABLE && (
              <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-blue-50/40 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="bg-blue-600 text-white p-3 rounded-full mb-2 shadow-lg">
                  <ArrowRight size={24} />
                </div>
                <span className="text-[11px] font-black text-blue-700 uppercase">Move Here</span>
              </div>
            )}

            {/* Status Dropdown */}
            {!reassignMode && (
              <div className="absolute top-4 right-4 z-10">
                <button 
                  onClick={(e) => { e.stopPropagation(); setShowStatusMenu(showStatusMenu === table.id ? null : table.id); }}
                  className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                >
                  <ChevronDown size={14} />
                </button>
                
                {showStatusMenu === table.id && (
                  <div className="absolute top-full right-0 mt-1 w-36 bg-white rounded-2xl shadow-2xl border border-gray-100 p-1 animate-in slide-in-from-top-2 duration-200 z-50">
                    <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(table.id, TableStatus.AVAILABLE); setShowStatusMenu(null); }} className="w-full text-left px-4 py-2 text-[11px] font-black uppercase text-green-600 hover:bg-green-50 rounded-xl">Available</button>
                    <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(table.id, TableStatus.RESERVED); setShowStatusMenu(null); }} className="w-full text-left px-4 py-2 text-[11px] font-black uppercase text-amber-600 hover:bg-amber-50 rounded-xl">Reserved</button>
                    <button onClick={(e) => { e.stopPropagation(); onUpdateStatus(table.id, TableStatus.OCCUPIED); setShowStatusMenu(null); }} className="w-full text-left px-4 py-2 text-[11px] font-black uppercase text-red-600 hover:bg-red-50 rounded-xl">Occupied</button>
                  </div>
                )}
              </div>
            )}

            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform ${reassignMode === table.id ? 'bg-blue-600 text-white' : 'bg-white/50 backdrop-blur-sm'}`}>
              <span className="text-lg font-black text-center leading-tight">
                {table.mergedWith ? 
                  `${table.number},${table.mergedWith.map(id => tables.find(t => t.id === id)?.number).join(',')}` 
                  : table.number
                }
              </span>
            </div>
            
            <div className="flex items-center gap-1 text-[11px] font-bold opacity-60 uppercase tracking-widest mb-1">
              <Users size={12} />
              <span>{table.capacity} Seats</span>
            </div>

            <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter mb-4 ${
              table.status === TableStatus.AVAILABLE ? 'bg-green-100 text-green-700' :
              table.status === TableStatus.OCCUPIED ? 'bg-red-100 text-red-700' :
              table.status === TableStatus.RESERVED ? 'bg-amber-100 text-amber-700' :
              'bg-gray-100 text-gray-400'
            }`}>
              {table.status}
            </div>

            <div className="w-full space-y-2">
              {!reassignMode && table.status === TableStatus.OCCUPIED ? (
                <div className="flex gap-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSelectTable(table); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase bg-red-600 text-white rounded-xl shadow-lg hover:bg-red-700 transition-all active:scale-95"
                  >
                    <Plus size={14} /> Add
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); setReassignMode(table.id); }}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase bg-blue-600 text-white rounded-xl shadow-lg hover:bg-blue-700 transition-all active:scale-95"
                    title="Move Guest"
                  >
                    <Move size={14} /> Move
                  </button>
                </div>
              ) : table.status === TableStatus.AVAILABLE && !reassignMode ? (
                <div className="flex gap-2 w-full">
                  <button onClick={(e) => { e.stopPropagation(); onSelectTable(table); }} className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-md active:scale-95">Order</button>
                  {canSplit(table) && (
                    <button onClick={(e) => { e.stopPropagation(); setShowSplitModal(table.id); }} className="px-3 bg-white border-2 border-emerald-100 text-emerald-700 rounded-xl py-2.5 text-[10px] font-black uppercase hover:bg-emerald-50 transition-colors shadow-sm"><Columns size={14} /></button>
                  )}
                </div>
              ) : table.status === TableStatus.RESERVED && !reassignMode ? (
                <button 
                   onClick={(e) => { e.stopPropagation(); onUpdateStatus(table.id, TableStatus.OCCUPIED); }}
                   className="w-full flex items-center justify-center gap-1.5 py-2.5 text-[10px] font-black uppercase bg-amber-600 text-white rounded-xl shadow-lg hover:bg-amber-700 transition-all active:scale-95"
                >
                  <Check size={14} /> Check-In
                </button>
              ) : null}
            </div>

            {(table.mergedWith || table.parentId) && !mergeMode && !reassignMode && (
              <div className="absolute -bottom-3 flex gap-2">
                 {table.mergedWith && (
                   <button 
                     onClick={(e) => { e.stopPropagation(); setShowUnmergeModal(table.id); }} 
                     className="bg-amber-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 shadow-lg hover:bg-amber-700 transition-all"
                   >
                     <Undo2 size={12} /> Unmerge
                   </button>
                 )}
                 {table.parentId && <button onClick={(e) => { e.stopPropagation(); onUnsplit(table.parentId); }} className="bg-purple-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 shadow-lg hover:bg-purple-700 transition-all"><Undo2 size={12} /> Combine</button>}
              </div>
            )}
          </div>
        ))}
      </div>

      {showSplitModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-sm w-full animate-in zoom-in duration-200">
            <h3 className="text-3xl font-black text-gray-900 mb-2">Split Configuration</h3>
            <p className="text-sm text-gray-500 mb-8 font-medium">Choose virtual sections for Table {tables.find(t => t.id === showSplitModal)?.number}</p>
            <div className="grid grid-cols-2 gap-6 mb-10">
              {[2, 3].map(count => (
                <button key={count} onClick={() => { onSplit(showSplitModal, count); setShowSplitModal(null); }} className="flex flex-col items-center justify-center p-8 border-2 border-gray-100 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50 group transition-all shadow-sm hover:shadow-xl">
                  <Columns size={40} className="text-gray-300 group-hover:text-emerald-600 mb-3" />
                  <span className="text-xl font-black text-gray-700 group-hover:text-emerald-800">{count} Parts</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowSplitModal(null)} className="w-full py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors">Cancel</button>
          </div>
        </div>
      )}

      {showUnmergeModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] shadow-2xl p-10 max-w-md w-full animate-in zoom-in duration-200">
            {(() => {
              const masterTable = tables.find(t => t.id === showUnmergeModal);
              const mergedTables = masterTable?.mergedWith?.map(id => tables.find(t => t.id === id)).filter(Boolean) || [];
              
              return (
                <>
                  <h3 className="text-3xl font-black text-gray-900 mb-2">Unmerge Tables</h3>
                  <p className="text-sm text-gray-500 mb-8 font-medium">
                    Select which table to unmerge from Table {masterTable?.number}
                  </p>
                  
                  <div className="space-y-4 mb-8">
                    {/* Master Table */}
                    <div className="flex items-center justify-between p-4 bg-amber-50 border-2 border-amber-200 rounded-2xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-amber-600 text-white rounded-full flex items-center justify-center font-black">
                          {masterTable?.number}
                        </div>
                        <div>
                          <span className="font-bold text-amber-800">Master Table</span>
                          <div className="text-xs text-amber-600">{masterTable?.capacity} seats</div>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-amber-700 bg-amber-200 px-2 py-1 rounded-full">MASTER</span>
                    </div>

                    {/* Merged Tables */}
                    {mergedTables.map(table => (
                      <div key={table.id} className="flex items-center justify-between p-4 bg-gray-50 border-2 border-gray-200 rounded-2xl hover:border-red-300 hover:bg-red-50 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-600 group-hover:bg-red-600 text-white rounded-full flex items-center justify-center font-black transition-colors">
                            {table.number}
                          </div>
                          <div>
                            <span className="font-bold text-gray-800 group-hover:text-red-800">Table {table.number}</span>
                            <div className="text-xs text-gray-600 group-hover:text-red-600">{table.originalCapacity || table.capacity} seats</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => {
                            onSelectiveUnmerge(showUnmergeModal, table.id);
                            setShowUnmergeModal(null);
                          }}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-1 shadow-lg transition-all active:scale-95"
                        >
                          <Undo2 size={12} /> Unmerge
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-3">
                    <button 
                      onClick={() => {
                        onUnmerge(showUnmergeModal);
                        setShowUnmergeModal(null);
                      }}
                      className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                    >
                      <Undo2 size={16} /> Unmerge All
                    </button>
                    <button 
                      onClick={() => setShowUnmergeModal(null)} 
                      className="flex-1 py-4 bg-gray-100 text-gray-600 font-bold rounded-2xl hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default TableMap;
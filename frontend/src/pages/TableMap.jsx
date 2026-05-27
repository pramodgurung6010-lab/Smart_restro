import React, { useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import { TableStatus } from '../types';
import { INITIAL_TABLES } from '../constants';
import { Users, GitMerge, Columns, X, Check, Move, Undo2, Plus, ChevronDown, ArrowRight } from 'lucide-react';

const TableMap = ({ onSelectTable }) => {
  const [tables, setTables] = useState(INITIAL_TABLES);
  const [mergeMode, setMergeMode] = useState(false);
  const [reassignMode, setReassignMode] = useState(null);
  const [selectedForMerge, setSelectedForMerge] = useState([]);
  const [showSplitModal, setShowSplitModal] = useState(null);
  const [showStatusMenu, setShowStatusMenu] = useState(null);
  const [showUnmergeModal, setShowUnmergeModal] = useState(null);

  // ─── Fetch tables from backend ───────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    try {
      const res = await api.get('/tables');
      const backendTables = res.data;
      if (backendTables && backendTables.length > 0) {
        // Map backend fields to frontend shape
        setTables(backendTables.map(t => ({
          id: t.tableId,
          number: t.number,
          capacity: t.capacity,
          originalCapacity: t.originalCapacity,
          status: t.status,
          manualStatus: t.manualStatus,
          currentOrderId: t.currentOrderId,
          mergedWith: t.mergedWith?.length ? t.mergedWith : undefined,
          masterTableId: t.masterTableId || undefined,
          isSplit: t.isSplit,
          parentId: t.parentId || undefined,
        })));
      }
    } catch (err) {
      console.error('Error fetching tables:', err);
    }
  }, []);

  // Poll every 5 seconds for real-time updates across all staff
  useEffect(() => {
    fetchTables();
    const interval = setInterval(fetchTables, 5000);
    return () => clearInterval(interval);
  }, [fetchTables]);

  // ─── Sync a single table status to backend ───────────────────────────────
  const syncStatus = async (tableId, fields) => {
    try {
      await api.patch(`/tables/${tableId}/status`, fields);
    } catch (err) {
      console.error('Error syncing table status:', err);
    }
  };

  // ─── Bulk sync multiple tables to backend ────────────────────────────────
  const bulkSync = async (updates) => {
    try {
      await api.post('/tables/bulk-update', { updates });
    } catch (err) {
      console.error('Error bulk syncing tables:', err);
    }
  };

  const movingTable = reassignMode ? tables.find(t => t.id === reassignMode) : null;

  const getStatusColor = (table) => {
    if (mergeMode && selectedForMerge.includes(table.id)) {
      return 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-200 text-emerald-800 scale-105';
    }

    // In merge mode - show all selectable tables (AVAILABLE + OCCUPIED + sub-tables) with dashed border
    if (mergeMode && !selectedForMerge.includes(table.id) &&
        table.status !== TableStatus.MERGED && table.status !== TableStatus.RESERVED) {
      return 'bg-white border-emerald-300 border-dashed hover:border-emerald-500 hover:bg-emerald-50/50 cursor-pointer';
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
      // Allow selecting AVAILABLE or OCCUPIED tables, and sub-tables (split parts)
      if (table.status === TableStatus.MERGED || table.status === TableStatus.RESERVED) return;
      setSelectedForMerge(prev => prev.includes(table.id) ? prev.filter(id => id !== table.id) : [...prev, table.id]);
      return;
    }

    if (reassignMode) {
      if (table.status === TableStatus.AVAILABLE && reassignMode !== table.id) {
        handleReassign(reassignMode, table.id);
        setReassignMode(null);
      } else if (reassignMode === table.id) {
        setReassignMode(null);
      }
      return;
    }

    if (table.status === TableStatus.AVAILABLE || table.status === TableStatus.OCCUPIED) {
      if (typeof onSelectTable === 'function') {
        onSelectTable(table);
      }
    }
  };

  const handleUpdateStatus = async (tableId, status) => {
    const fields = {
      status,
      manualStatus: status !== TableStatus.AVAILABLE,
      ...(status === TableStatus.AVAILABLE && { currentOrderId: null })
    };
    // Optimistic update
    setTables(prev => prev.map(t =>
      t.id === tableId ? { ...t, ...fields } : t
    ));
    await syncStatus(tableId, fields);
  };

  const handleReassign = async (fromTableId, toTableId) => {
    const fromTable = tables.find(t => t.id === fromTableId);
    if (!fromTable?.currentOrderId) return;

    try {
      const toTable = tables.find(t => t.id === toTableId);
      await api.put(`/orders/${fromTable.currentOrderId}`, {
        tableId: toTableId,
        tableNumber: toTable?.number || toTableId
      });

      // Update local state
      setTables(prev => prev.map(t => {
        if (t.id === fromTableId) return { ...t, status: TableStatus.AVAILABLE, currentOrderId: undefined };
        if (t.id === toTableId) return { ...t, status: TableStatus.OCCUPIED, currentOrderId: fromTable.currentOrderId };
        return t;
      }));

      // Sync both tables to backend
      await bulkSync([
        { tableId: fromTableId, status: TableStatus.AVAILABLE, currentOrderId: null, manualStatus: false },
        { tableId: toTableId, status: TableStatus.OCCUPIED, currentOrderId: fromTable.currentOrderId, manualStatus: false }
      ]);
    } catch (error) {
      console.error('Error reassigning table:', error);
      alert('Failed to reassign table');
    }
  };

  const confirmMerge = async () => {
    if (selectedForMerge.length < 2) return;
    const [master, ...others] = selectedForMerge;

    const masterTable = tables.find(t => t.id === master);
    const otherTables = tables.filter(t => others.includes(t.id));

    const hasOrders = masterTable?.currentOrderId || otherTables.some(t => t.currentOrderId);
    if (hasOrders) {
      try {
        await api.post('/orders/merge-tables', {
          masterTableId: master,
          masterTableNumber: masterTable?.number,
          slaveTableIds: others
        });
      } catch (error) {
        console.error('Error merging orders:', error);
      }
    }

    handleMerge(master, others);
    setMergeMode(false);
    setSelectedForMerge([]);
  };

  const handleMerge = async (masterId, otherIds) => {
    setTables(prev => {
      const masterTable = prev.find(t => t.id === masterId);
      const otherTables = prev.filter(t => otherIds.includes(t.id));
      if (!masterTable) return prev;
      const totalCapacity = masterTable.capacity + otherTables.reduce((sum, t) => sum + t.capacity, 0);
      const inheritedOrderId = masterTable.currentOrderId ||
        otherTables.find(t => t.currentOrderId)?.currentOrderId;
      return prev.map(t => {
        if (t.id === masterId) return {
          ...t, mergedWith: otherIds, capacity: totalCapacity,
          originalCapacity: t.originalCapacity || t.capacity,
          status: inheritedOrderId ? TableStatus.OCCUPIED : t.status,
          currentOrderId: inheritedOrderId
        };
        if (otherIds.includes(t.id)) return {
          ...t, status: TableStatus.MERGED, masterTableId: masterId,
          originalCapacity: t.originalCapacity || t.capacity, currentOrderId: undefined
        };
        return t;
      });
    });

    // Sync to backend
    const masterTable = tables.find(t => t.id === masterId);
    const otherTables = tables.filter(t => otherIds.includes(t.id));
    const totalCapacity = (masterTable?.capacity || 0) + otherTables.reduce((sum, t) => sum + t.capacity, 0);
    const inheritedOrderId = masterTable?.currentOrderId || otherTables.find(t => t.currentOrderId)?.currentOrderId;

    await bulkSync([
      {
        tableId: masterId,
        mergedWith: otherIds,
        capacity: totalCapacity,
        originalCapacity: masterTable?.originalCapacity || masterTable?.capacity,
        status: inheritedOrderId ? TableStatus.OCCUPIED : (masterTable?.status || TableStatus.AVAILABLE),
        currentOrderId: inheritedOrderId || null,
        isMerged: false
      },
      ...otherIds.map(id => {
        const t = tables.find(x => x.id === id);
        return {
          tableId: id,
          status: TableStatus.MERGED,
          masterTableId: masterId,
          originalCapacity: t?.originalCapacity || t?.capacity,
          currentOrderId: null
        };
      })
    ]);
  };

  const handleUnmerge = async (masterId) => {
    const master = tables.find(t => t.id === masterId);
    if (!master || !master.mergedWith) return;
    const allIds = [masterId, ...master.mergedWith];

    setTables(prev => prev.map(t => {
      if (allIds.includes(t.id)) return {
        ...t, status: TableStatus.AVAILABLE, mergedWith: undefined,
        masterTableId: undefined, capacity: t.originalCapacity || t.capacity, originalCapacity: undefined
      };
      return t;
    }));

    await bulkSync(allIds.map(id => {
      const t = tables.find(x => x.id === id);
      return {
        tableId: id,
        status: TableStatus.AVAILABLE,
        mergedWith: [],
        masterTableId: null,
        capacity: t?.originalCapacity || t?.capacity,
        originalCapacity: null,
        currentOrderId: null,
        manualStatus: false
      };
    }));
  };

  const handleSelectiveUnmerge = async (masterId, tableIdToUnmerge) => {
    const master = tables.find(t => t.id === masterId);
    if (!master || !master.mergedWith) return;

    const updatedMergedWith = master.mergedWith.filter(id => id !== tableIdToUnmerge);
    const tableToUnmerge = tables.find(t => t.id === tableIdToUnmerge);
    const removedCapacity = tableToUnmerge?.originalCapacity || tableToUnmerge?.capacity || 0;
    const newMasterCapacity = master.capacity - removedCapacity;

    setTables(prev => prev.map(t => {
      if (t.id === masterId) {
        if (updatedMergedWith.length === 0) {
          return { ...t, mergedWith: undefined, capacity: t.originalCapacity || t.capacity, originalCapacity: undefined };
        }
        return { ...t, mergedWith: updatedMergedWith, capacity: newMasterCapacity };
      }
      if (t.id === tableIdToUnmerge) {
        return { ...t, status: TableStatus.AVAILABLE, masterTableId: undefined, capacity: t.originalCapacity || t.capacity, originalCapacity: undefined };
      }
      return t;
    }));

    // Sync to backend
    await bulkSync([
      {
        tableId: masterId,
        mergedWith: updatedMergedWith,
        capacity: updatedMergedWith.length === 0 ? (master.originalCapacity || master.capacity) : newMasterCapacity,
        originalCapacity: updatedMergedWith.length === 0 ? null : (master.originalCapacity || master.capacity)
      },
      {
        tableId: tableIdToUnmerge,
        status: TableStatus.AVAILABLE,
        masterTableId: null,
        capacity: tableToUnmerge?.originalCapacity || tableToUnmerge?.capacity,
        originalCapacity: null
      }
    ]);
  };

  const handleSplit = async (tableId, parts) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;

    const baseCapacity = Math.floor(table.capacity / parts);
    const remainder = table.capacity % parts;

    const subTables = Array.from({ length: parts }).map((_, i) => ({
      id: `split-${tableId}-${i}`,
      number: `${table.number}.${i + 1}`,
      capacity: baseCapacity + (i < remainder ? 1 : 0),
      status: i === 0 && table.currentOrderId ? TableStatus.OCCUPIED : TableStatus.AVAILABLE,
      currentOrderId: i === 0 && table.currentOrderId ? table.currentOrderId : undefined,
      parentId: tableId
    }));

    // Reassign order to first sub-table in backend
    if (table.currentOrderId) {
      try {
        await api.put(`/orders/${table.currentOrderId}`, {
          tableId: subTables[0].id,
          tableNumber: subTables[0].number
        });
      } catch (error) {
        console.error('Error reassigning order to sub-table:', error);
      }
    }

    // Update local state
    setTables(prev => [
      ...prev.map(t => t.id === tableId ? {
        ...t, isSplit: true, status: TableStatus.OCCUPIED,
        originalCapacity: t.capacity, currentOrderId: undefined
      } : t),
      ...subTables
    ]);

    // Sync parent + sub-tables to backend
    await bulkSync([
      {
        tableId,
        isSplit: true,
        status: TableStatus.OCCUPIED,
        originalCapacity: table.capacity,
        currentOrderId: null
      },
      ...subTables.map(st => ({
        tableId: st.id,
        number: st.number,
        capacity: st.capacity,
        status: st.status,
        currentOrderId: st.currentOrderId || null,
        parentId: tableId,
        isSplit: false
      }))
    ]);
  };

  const handleUnsplit = async (parentId) => {
    const subTableIds = tables.filter(t => t.parentId === parentId).map(t => t.id);
    const parent = tables.find(t => t.id === parentId);

    // Update local state
    setTables(prev => {
      const filtered = prev.filter(t => t.parentId !== parentId);
      return filtered.map(t => t.id === parentId ? {
        ...t, isSplit: false, status: TableStatus.AVAILABLE,
        capacity: t.originalCapacity || t.capacity, originalCapacity: undefined
      } : t);
    });

    // Delete sub-tables from backend and restore parent
    await Promise.all(subTableIds.map(id => api.delete(`/tables/${id}`).catch(() => {})));
    await syncStatus(parentId, {
      isSplit: false,
      status: TableStatus.AVAILABLE,
      capacity: parent?.originalCapacity || parent?.capacity,
      originalCapacity: null,
      currentOrderId: null
    });
  };

  const visibleTables = tables.filter(t => {
    // Hide merged slave tables
    if (t.status === TableStatus.MERGED) return false;
    // Hide split parent ONLY if sub-tables actually exist in current state
    if (t.isSplit && tables.some(x => x.parentId === t.id)) return false;
    return true;
  });

  const canSplit = (table) => {
    return (table.number === '12' || table.number === '13') && !table.parentId && !table.isSplit &&
      (table.status === TableStatus.AVAILABLE || table.status === TableStatus.OCCUPIED);
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
                    <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(table.id, TableStatus.AVAILABLE); setShowStatusMenu(null); }} className="w-full text-left px-4 py-2 text-[11px] font-black uppercase text-green-600 hover:bg-green-50 rounded-xl">Available</button>
                    <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(table.id, TableStatus.RESERVED); setShowStatusMenu(null); }} className="w-full text-left px-4 py-2 text-[11px] font-black uppercase text-amber-600 hover:bg-amber-50 rounded-xl">Reserved</button>
                    <button onClick={(e) => { e.stopPropagation(); handleUpdateStatus(table.id, TableStatus.OCCUPIED); setShowStatusMenu(null); }} className="w-full text-left px-4 py-2 text-[11px] font-black uppercase text-red-600 hover:bg-red-50 rounded-xl">Occupied</button>
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
                    onClick={(e) => { e.stopPropagation(); handleTableClick(table); }}
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
                  {canSplit(table) && (
                    <button onClick={(e) => { e.stopPropagation(); setShowSplitModal(table.id); }} className="px-3 bg-white border-2 border-emerald-100 text-emerald-700 rounded-xl py-2.5 text-[10px] font-black uppercase hover:bg-emerald-50 transition-colors shadow-sm"><Columns size={14} /></button>
                  )}
                </div>
              ) : (table.status === TableStatus.AVAILABLE || table.mergedWith) && !reassignMode ? (
                <div className="flex gap-2 w-full">
                  <button 
                    onClick={(e) => { 
                      e.stopPropagation(); 
                      // Pass merged table info so order shows combined table number
                      const tableForOrder = table.mergedWith 
                        ? { 
                            ...table, 
                            number: `${table.number}+${table.mergedWith.map(id => tables.find(t => t.id === id)?.number).join('+')}`,
                            isMerged: true,
                            mergedTableIds: table.mergedWith
                          }
                        : table;
                      handleTableClick(tableForOrder); 
                    }} 
                    className="flex-1 bg-emerald-600 text-white rounded-xl py-2.5 text-[10px] font-black uppercase hover:bg-emerald-700 transition-all shadow-md active:scale-95">
                    {table.mergedWith ? 'Order (Merged)' : 'Order'}
                  </button>
                  {canSplit(table) && !table.mergedWith && (
                    <button onClick={(e) => { e.stopPropagation(); setShowSplitModal(table.id); }} className="px-3 bg-white border-2 border-emerald-100 text-emerald-700 rounded-xl py-2.5 text-[10px] font-black uppercase hover:bg-emerald-50 transition-colors shadow-sm"><Columns size={14} /></button>
                  )}
                </div>
              ) : table.status === TableStatus.RESERVED && !reassignMode ? (
                <button 
                   onClick={(e) => { e.stopPropagation(); handleUpdateStatus(table.id, TableStatus.OCCUPIED); }}
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
                 {table.parentId && <button onClick={(e) => { e.stopPropagation(); handleUnsplit(table.parentId); }} className="bg-purple-600 text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase flex items-center gap-1 shadow-lg hover:bg-purple-700 transition-all"><Undo2 size={12} /> Combine</button>}
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
                <button key={count} onClick={() => { handleSplit(showSplitModal, count); setShowSplitModal(null); }} className="flex flex-col items-center justify-center p-8 border-2 border-gray-100 rounded-3xl hover:border-emerald-500 hover:bg-emerald-50 group transition-all shadow-sm hover:shadow-xl">
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
                            handleSelectiveUnmerge(showUnmergeModal, table.id);
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
                        handleUnmerge(showUnmergeModal);
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
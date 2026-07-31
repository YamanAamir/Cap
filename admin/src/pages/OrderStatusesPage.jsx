import React, { useState, useEffect } from 'react';
import { getOrderStatuses, createOrderStatus, updateOrderStatusDef, deleteOrderStatusDef } from '../services/admin.service';
import { Plus, Loader2, GripVertical, Eye, EyeOff, Factory, Trash2, ShieldAlert } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';

const OrderStatusesPage = () => {
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', sortOrder: 0, isInternal: false, triggersProduction: false, color: '#6366f1' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [isDeleting, setIsDeleting] = useState(false);

  const load = () => {
    setLoading(true);
    getOrderStatuses().then(setStatuses).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    await createOrderStatus(form);
    setForm({ name: '', sortOrder: statuses.length + 1, isInternal: false, triggersProduction: false, color: '#6366f1' });
    setShowForm(false);
    load();
  };

  const toggleField = async (id, field, current) => {
    await updateOrderStatusDef(id, { [field]: !current });
    load();
  };

  const executeDelete = async () => {
    if (!confirmModal.id) return;
    setIsDeleting(true);
    try {
      await deleteOrderStatusDef(confirmModal.id);
      load();
    } finally {
      setIsDeleting(false);
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handleDeleteClick = (id) => {
    setConfirmModal({ isOpen: true, id });
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const activeStatuses = statuses.filter(s => s.isActive);
    const sourceIndex = result.source.index;
    const destIndex = result.destination.index;

    if (sourceIndex === destIndex) return;

    const newStatuses = Array.from(activeStatuses);
    const [reorderedItem] = newStatuses.splice(sourceIndex, 1);
    newStatuses.splice(destIndex, 0, reorderedItem);

    // Optimistically update
    const finalStatuses = statuses.map(s => {
      if (!s.isActive) return s;
      const index = newStatuses.findIndex(ns => ns.id === s.id);
      return { ...s, sortOrder: index + 1 };
    }).sort((a, b) => a.sortOrder - b.sortOrder);

    setStatuses(finalStatuses);

    // Sync to backend sequentially to avoid race conditions
    for (let i = 0; i < newStatuses.length; i++) {
      const status = newStatuses[i];
      if (status.sortOrder !== i + 1) {
        await updateOrderStatusDef(status.id, { sortOrder: i + 1 });
      }
    }
  };

  if (loading && !statuses.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  const activeStatuses = statuses.filter(s => s.isActive);

  return (
    <div className="animate-in fade-in duration-500 max-w-[1000px] mx-auto pb-12">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Order Statuses</h2>
          <p className="text-sm text-slate-500">Configure workflow steps and production triggers.</p>
        </div>
        <button 
          onClick={() => setShowForm(!showForm)} 
          className={cn(
            "flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors",
            showForm ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-[#7cb342] text-white hover:bg-[#689f38]"
          )}
        >
          <Plus className={cn("h-4 w-4", showForm && "rotate-45")} /> 
          {showForm ? 'CANCEL' : 'ADD NEW STATUS'}
        </button>
      </div>

      {/* Creation Form */}
      {showForm && (
        <div className="mb-6 p-6 bg-white border border-slate-200 rounded animate-in slide-in-from-top-2 fade-in duration-300">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Create Custom Status</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Status Name</label>
              <input 
                type="text" 
                placeholder="e.g. Quality Check" 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Pipeline Order</label>
              <input 
                type="number" 
                placeholder="Sort order" 
                value={form.sortOrder} 
                onChange={e => setForm({ ...form, sortOrder: parseInt(e.target.value) })} 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              />
            </div>
            
            <div className="md:col-span-2 mt-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2 block">Configuration</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex items-center gap-3 p-3 rounded border border-slate-200 bg-[#fafafa]">
                  <input type="color" value={form.color} onChange={e => setForm({ ...form, color: e.target.value })} className="h-8 w-12 p-0 border-0 cursor-pointer" />
                  <span className="text-xs font-bold text-slate-700">Badge Color</span>
                </div>
                
                <label className="flex-1 flex items-center justify-between p-3 rounded border border-slate-200 bg-[#fafafa] cursor-pointer hover:bg-slate-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <EyeOff className="h-4 w-4 text-slate-500" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Internal Only</p>
                      <p className="text-[10px] text-slate-500">Hidden from customers</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={form.isInternal} onChange={e => setForm({ ...form, isInternal: e.target.checked })} className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500" />
                </label>

                <label className="flex-1 flex items-center justify-between p-3 rounded border border-amber-200 bg-amber-50 cursor-pointer hover:bg-amber-100 transition-colors">
                  <div className="flex items-center gap-2">
                    <Factory className="h-4 w-4 text-amber-600" />
                    <div>
                      <p className="text-xs font-bold text-amber-900">Production Trigger</p>
                      <p className="text-[10px] text-amber-700">Generates exports</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={form.triggersProduction} onChange={e => setForm({ ...form, triggersProduction: e.target.checked })} className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500" />
                </label>
              </div>
            </div>
            
            <button type="submit" className="md:col-span-2 mt-2 bg-[#1e3a8a] text-white text-xs font-bold px-6 py-3 rounded shadow-sm hover:bg-blue-800 transition-colors">
              SAVE NEW STATUS
            </button>
          </form>
        </div>
      )}

      {/* Statuses List */}
      <div className="bg-white border border-slate-200 rounded overflow-hidden">
        {activeStatuses.length === 0 && !loading && (
          <div className="py-12 text-center">
            <ShieldAlert className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-500">No active statuses found</p>
          </div>
        )}
        
        {activeStatuses.length > 0 && (
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="statuses-list">
              {(provided) => (
                <div 
                  {...provided.droppableProps} 
                  ref={provided.innerRef}
                  className="divide-y divide-slate-200"
                >
                  {activeStatuses.map((s, i) => (
                    <Draggable key={s.id.toString()} draggableId={s.id.toString()} index={i}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={cn(
                            "flex flex-col sm:flex-row sm:items-center gap-4 px-5 py-4 transition-colors bg-white",
                            snapshot.isDragging && "shadow-lg bg-blue-50/50 relative z-50 rounded"
                          )}
                          style={{
                            ...provided.draggableProps.style,
                          }}
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div 
                              {...provided.dragHandleProps}
                              className="cursor-grab active:cursor-grabbing text-slate-400 hover:text-slate-600 transition-colors p-2 -ml-2"
                            >
                              <GripVertical className="h-4 w-4" />
                            </div>
                            
                            <div className="flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-500 font-bold text-xs">
                              {i + 1}
                            </div>
                            
                            <div className="w-8 h-8 rounded flex items-center justify-center shrink-0 border border-slate-100" style={{ backgroundColor: s.color + '15' }}>
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                            </div>
                            
                            <div>
                              <span className="text-sm font-bold text-slate-800 block">{s.name}</span>
                              <div className="flex gap-2 mt-1">
                                {s.isInternal && (
                                  <span className="bg-slate-800 text-white text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <EyeOff className="h-2.5 w-2.5" /> Internal
                                  </span>
                                )}
                                {s.triggersProduction && (
                                  <span className="bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
                                    <Factory className="h-2.5 w-2.5" /> Production Target
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2 pl-14 sm:pl-0">
                            <button 
                              onClick={() => toggleField(s.id, 'triggersProduction', s.triggersProduction)} 
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors",
                                s.triggersProduction ? "bg-amber-100 text-amber-800 border border-amber-200" : "bg-[#fafafa] text-slate-500 border border-slate-200 hover:bg-slate-100"
                              )} 
                            >
                              <Factory className="h-3 w-3" />
                              <span className="hidden lg:inline">Production</span>
                            </button>
                            
                            <button 
                              onClick={() => toggleField(s.id, 'isInternal', s.isInternal)} 
                              className={cn(
                                "flex items-center gap-1.5 px-2.5 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-colors",
                                s.isInternal ? "bg-slate-800 text-white border border-slate-800" : "bg-[#fafafa] text-slate-500 border border-slate-200 hover:bg-slate-100"
                              )} 
                            >
                              {s.isInternal ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                              <span className="hidden lg:inline">{s.isInternal ? 'Internal' : 'Public'}</span>
                            </button>
                            
                            <button onClick={() => handleDeleteClick(s.id)} className="p-2 ml-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors">
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}
      </div>
      
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Deactivate Status"
        message="Are you sure you want to deactivate this status? It will no longer be visible in the order pipeline."
        confirmText="Deactivate"
        isDestructive={true}
        isLoading={isDeleting}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default OrderStatusesPage;

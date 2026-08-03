import React, { useState, useEffect } from 'react';
import { getExcelColumns, createExcelColumn, updateExcelColumns, deleteExcelColumn } from '../services/admin.service';
import api from '../services/api';
import { Loader2, Save, FileSpreadsheet, Plus, Trash2, X, GripVertical } from 'lucide-react';
import ConfirmModal from '../components/common/ConfirmModal';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const BASE_FIELDS = [
  { label: 'Order Number', value: 'orderNumber' },
  { label: 'Order Date', value: 'orderDate' },
  { label: 'Customer Name', value: 'customerName' },
  { label: 'Customer Email', value: 'customerEmail' },
  { label: 'Customer Phone', value: 'customerPhone' },
  { label: 'Customer Address', value: 'customerAddress' },
  { label: 'Customer City', value: 'customerCity' },
  { label: 'Customer Zip', value: 'customerPostalCode' },
  { label: 'School Name', value: 'schoolName' },
  { label: 'Delivery Type', value: 'deliveryType' },
  { label: 'Total Price', value: 'totalPrice' },
  { label: 'Currency', value: 'currency' },
  { label: 'Package Name', value: 'packageName' },
  { label: 'Program', value: 'program' },
  { label: 'Status', value: 'status' },
  { label: 'Discount Code', value: 'discountCode' },
  { label: 'Discount Amount', value: 'discountAmount' },
  { label: 'Static Value "1"', value: 'static:1' },
  { label: 'Static Value "x"', value: 'static:x' },
  { label: 'Static Value "NO"', value: 'static:NO' }
];

const ExcelTemplatesPage = () => {
  const [columns, setColumns] = useState([]);
  const [configOptions, setConfigOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ headerLabel: '', fieldKey: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, id: null });
  const [draggedItem, setDraggedItem] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cols, settingsRes] = await Promise.all([
        getExcelColumns(),
        api.get('/admin/settings/configurator')
      ]);
      setColumns(cols);
      
      const standard = settingsRes.data?.priceConfig?.standard || {};
      const opts = [];
      Object.keys(standard).forEach(category => {
        Object.keys(standard[category]).forEach(field => {
           opts.push({
             label: `${category} - ${field}`,
             value: `options.${category}.${field}`
           });
        });
      });
      setConfigOptions(opts);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const getLabelForFieldKey = (key) => {
    const baseMatch = BASE_FIELDS.find(f => f.value === key);
    if (baseMatch) return baseMatch.label;
    
    const configMatch = configOptions.find(f => f.value === key);
    if (configMatch) return configMatch.label;

    if (key.startsWith('options.')) {
      const parts = key.replace('options.', '').split('.');
      if (parts.length === 2) return `${parts[0]} - ${parts[1]}`;
    }
    
    if (key.startsWith('static:')) {
      const val = key.replace('static:', '').split('::')[0];
      return `Static Value "${val}"`;
    }
    
    return key;
  };

  const handleSaveOrder = async () => {
    setSaving(true);
    try {
      const updatedColumns = columns.map((col, idx) => ({ ...col, sortOrder: idx + 1 }));
      await updateExcelColumns(updatedColumns);
      toast.success('Column order saved!');
      load();
    } catch (e) { 
      toast.error('Failed to save changes'); 
    } finally { 
      setSaving(false); 
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await createExcelColumn({
        ...form,
        sortOrder: columns.length + 1
      });
      setForm({ headerLabel: '', fieldKey: '' });
      setShowForm(false);
      toast.success('Column added!');
      load();
    } catch (e) {
      toast.error('Failed to add column');
    } finally {
      setSaving(false);
    }
  };

  const executeDelete = async () => {
    if (!confirmModal.id) return;
    try {
      await deleteExcelColumn(confirmModal.id);
      toast.success('Column deleted!');
      load();
    } catch (e) {
      toast.error('Deletion failed');
    } finally {
      setConfirmModal({ isOpen: false, id: null });
    }
  };

  const handleDragStart = (e, index) => {
    setDraggedItem(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedItem === null || draggedItem === index) return;
    
    const newColumns = [...columns];
    const draggedCol = newColumns[draggedItem];
    newColumns.splice(draggedItem, 1);
    newColumns.splice(index, 0, draggedCol);
    
    setDraggedItem(index);
    setColumns(newColumns);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  const updateColumnLocally = (index, field, value) => {
    const newColumns = [...columns];
    newColumns[index][field] = value;
    setColumns(newColumns);
  };

  if (loading && !columns.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1000px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Production Excel Template</h2>
          <p className="text-sm text-slate-500">Configure the columns included in the factory production export</p>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={handleSaveOrder} 
            disabled={saving}
            className="flex items-center gap-2 text-white bg-green-600 hover:bg-green-700 text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />} 
            SAVE CHANGES
          </button>
          <button 
            onClick={() => setShowForm(!showForm)} 
            className={cn(
              "flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors",
              showForm ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-[#1e3a8a] text-white hover:bg-blue-800"
            )}
          >
            {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />} 
            {showForm ? 'CANCEL' : 'ADD COLUMN'}
          </button>
        </div>
      </div>

      {showForm && (
        <div className="mb-6 p-6 bg-white border border-slate-200 rounded shadow-sm animate-in slide-in-from-top-2 fade-in duration-300">
          <h3 className="text-sm font-bold text-slate-700 mb-4">Add New Excel Column</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Column Header</label>
              <input 
                type="text" 
                placeholder="e.g. Cap Color"
                value={form.headerLabel} 
                onChange={e => setForm({ ...form, headerLabel: e.target.value })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block mb-1">Data Path / Value</label>
              <select
                value={form.fieldKey}
                onChange={e => setForm({ ...form, fieldKey: e.target.value })}
                required
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-mono text-slate-700 bg-white"
              >
                <option value="" disabled>Select a data path...</option>
                <optgroup label="Standard Order Fields">
                  {BASE_FIELDS.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </optgroup>
                <optgroup label="Configurator Options">
                  {configOptions.map(f => (
                    <option key={f.value} value={f.value}>{f.label}</option>
                  ))}
                </optgroup>
              </select>
            </div>
            <div className="md:col-span-2">
              <button 
                type="submit" 
                disabled={saving}
                className="bg-[#1e3a8a] text-white text-xs font-bold px-6 py-2.5 rounded shadow-sm hover:bg-blue-800 transition-colors flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                ADD COLUMN
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded overflow-hidden shadow-sm">
        <div className="flex bg-[#fafafa] border-b border-slate-200 p-3">
          <div className="w-10"></div>
          <div className="flex-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Column Header</div>
          <div className="flex-1 text-[11px] font-bold text-slate-500 uppercase tracking-widest">Data Path</div>
          <div className="w-12 text-center text-[11px] font-bold text-slate-500 uppercase tracking-widest">Actions</div>
        </div>
        
        <ul className="divide-y divide-slate-100">
          {columns.map((col, idx) => (
            <li 
              key={col.id} 
              className={cn(
                "flex items-center p-3 transition-colors bg-white hover:bg-slate-50",
                draggedItem === idx && "opacity-50 bg-blue-50"
              )}
              draggable
              onDragStart={(e) => handleDragStart(e, idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              onDragEnd={handleDragEnd}
            >
              <div className="w-10 flex justify-center cursor-move text-slate-300 hover:text-slate-500">
                <GripVertical className="w-5 h-5" />
              </div>
              <div className="flex-1 pr-4">
                <input
                  type="text"
                  value={col.headerLabel}
                  onChange={(e) => updateColumnLocally(idx, 'headerLabel', e.target.value)}
                  className="w-full bg-transparent border-0 border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:ring-0 px-0 py-1 text-sm font-bold text-slate-700 outline-none transition-colors"
                />
              </div>
              <div className="flex-1 pr-4">
                <div className="w-full bg-transparent border-0 px-0 py-1 text-sm font-medium text-slate-600 outline-none">
                  {getLabelForFieldKey(col.fieldKey)}
                </div>
              </div>
              <div className="w-12 flex justify-center">
                <button 
                  onClick={() => setConfirmModal({ isOpen: true, id: col.id })} 
                  className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                  title="Remove Column"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </li>
          ))}
          {columns.length === 0 && (
            <div className="p-8 text-center text-slate-500">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="font-medium">No Excel columns configured.</p>
              <p className="text-sm">Add columns to build your production export template.</p>
            </div>
          )}
        </ul>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Delete Column"
        message="Are you sure you want to remove this column from the Excel export template?"
        confirmText="Delete"
        isDestructive={true}
        onConfirm={executeDelete}
        onCancel={() => setConfirmModal({ isOpen: false, id: null })}
      />
    </div>
  );
};

export default ExcelTemplatesPage;

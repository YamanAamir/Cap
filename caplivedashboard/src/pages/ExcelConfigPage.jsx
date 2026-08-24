import React, { useState, useEffect } from 'react';
import { getExcelColumns, updateExcelColumns, createExcelColumn } from '../services/admin.service';
import { Loader2, Eye, EyeOff, Save, Plus, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const ExcelConfigPage = () => {
  const [columns, setColumns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newCol, setNewCol] = useState({ fieldKey: '', headerLabel: '' });

  const load = () => {
    setLoading(true);
    getExcelColumns().then(setColumns).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const toggleVisible = (id) => {
    setColumns(cols => cols.map(c => c.id === id ? { ...c, isVisible: !c.isVisible } : c));
  };

  const updateLabel = (id, headerLabel) => {
    setColumns(cols => cols.map(c => c.id === id ? { ...c, headerLabel } : c));
  };

  const moveColumn = (index, direction) => {
    const newCols = [...columns];
    const target = index + direction;
    if (target < 0 || target >= newCols.length) return;
    [newCols[index], newCols[target]] = [newCols[target], newCols[index]];
    setColumns(newCols.map((c, i) => ({ ...c, sortOrder: i + 1 })));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateExcelColumns(columns);
      alert('Excel configuration saved!');
    } catch (e) { alert('Save failed'); }
    finally { setSaving(false); }
  };

  const handleAddColumn = async () => {
    if (!newCol.fieldKey || !newCol.headerLabel) return;
    await createExcelColumn({ ...newCol, sortOrder: columns.length + 1 });
    setNewCol({ fieldKey: '', headerLabel: '' });
    load();
  };

  if (loading && !columns.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[800px] mx-auto pb-12">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Excel Template</h2>
          <p className="text-sm text-slate-500">Configure columns for manufacturer export</p>
        </div>
        <button 
          onClick={handleSave} 
          disabled={saving} 
          className={cn(
            "flex items-center justify-center gap-2 text-white text-xs font-bold px-5 py-2.5 rounded shadow-sm transition-colors",
            saving ? "bg-slate-400 cursor-not-allowed" : "bg-[#1e3a8a] hover:bg-blue-800"
          )}
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          SAVE CHANGES
        </button>
      </div>

      <div className="bg-white border border-slate-200 rounded overflow-hidden mb-6">
        <div className="divide-y divide-slate-100">
          {columns.map((col, i) => (
            <div key={col.id} className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex flex-col">
                <button onClick={() => moveColumn(i, -1)} className="text-slate-300 hover:text-slate-600 text-[10px]">▲</button>
                <button onClick={() => moveColumn(i, 1)} className="text-slate-300 hover:text-slate-600 text-[10px]">▼</button>
              </div>
              <GripVertical className="h-4 w-4 text-slate-300 cursor-grab active:cursor-grabbing" />
              <code className="text-[11px] bg-[#fafafa] border border-slate-200 px-2 py-1 rounded font-mono text-slate-600 w-40 shrink-0 truncate" title={col.fieldKey}>
                {col.fieldKey}
              </code>
              <input 
                type="text"
                value={col.headerLabel} 
                onChange={e => updateLabel(col.id, e.target.value)} 
                className="flex-1 px-3 py-1.5 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 font-bold text-slate-700" 
              />
              <button onClick={() => toggleVisible(col.id)} className="p-2 rounded hover:bg-slate-100 transition-colors ml-2">
                {col.isVisible ? <Eye className="h-4 w-4 text-green-600" /> : <EyeOff className="h-4 w-4 text-slate-400" />}
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-[#fafafa] p-5 border border-slate-200 rounded">
        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Add Custom Column</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text"
            placeholder="Field key (e.g. options.BETRÆK.Farve)" 
            value={newCol.fieldKey} 
            onChange={e => setNewCol({ ...newCol, fieldKey: e.target.value })}
            className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <input 
            type="text"
            placeholder="Header label" 
            value={newCol.headerLabel} 
            onChange={e => setNewCol({ ...newCol, headerLabel: e.target.value })}
            className="flex-1 px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
          />
          <button 
            onClick={handleAddColumn} 
            className="bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded flex items-center justify-center hover:bg-slate-50 transition-colors shrink-0"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExcelConfigPage;

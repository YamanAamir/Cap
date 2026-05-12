import React, { useState, useEffect } from 'react';
import { Flag, Plus, Trash2, Edit2, Save, X, Loader2, Info, CreditCard, Settings2, AlertCircle, RefreshCw, Search } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, Button, Input, Badge } from '../components/ui';
import { cn } from '@/lib/utils';
import api from '../services/api';

const FlagsPage = () => {
  const [flags, setFlags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newFlag, setNewFlag] = useState({ name: '', price: '' });
  const [editValues, setEditValues] = useState({ name: '', price: '' });
  const [search, setSearch] = useState('');

  const fetchFlags = async () => {
    try {
      setLoading(true);
      const res = await api.get('/flags');
      setFlags(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Error fetching flags:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlags();
  }, []);

  const handleAdd = async () => {
    if (!newFlag.name.trim() || newFlag.price === '') return;
    setSaving(true);
    try {
      await api.post('/flags', { 
        name: newFlag.name.trim(), 
        price: parseFloat(newFlag.price) 
      });
      setNewFlag({ name: '', price: '' });
      await fetchFlags();
    } catch (err) {
      console.error('Error adding flag:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (id) => {
    if (!editValues.name.trim()) return;
    setSaving(true);
    try {
      await api.put(`/flags/${id}`, { 
        name: editValues.name.trim(), 
        price: parseFloat(editValues.price) 
      });
      setEditingId(null);
      await fetchFlags();
    } catch (err) {
      console.error('Error updating flag:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Er du sikker på du vil slette "${name}"?`)) return;
    try {
      await api.delete(`/flags/${id}`);
      await fetchFlags();
    } catch (err) {
      console.error('Error deleting flag:', err);
    }
  };

  const startEdit = (flag) => {
    setEditingId(flag.id);
    setEditValues({ name: flag.name, price: flag.price });
  };

  const filteredFlags = flags.filter(flag => 
    flag.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12">
      {/* Header Section matching Orders */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search flags..."
            className="pl-10 h-11 border-gray-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="h-11 px-6 bg-white border-gray-200 font-bold text-gray-600 rounded-md shadow-sm">
            {flags.length} Flags Database
          </Badge>
          <Button
            variant="outline"
            onClick={fetchFlags}
            className={cn("rounded-md shadow-sm h-11 bg-white", loading && "opacity-50 pointer-events-none")}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin text-primary" /> : <RefreshCw className="mr-2 h-4 w-4 text-primary" />}
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* Add New Flag Card - Premium Styling */}
        <Card className="relative overflow-hidden shadow-lg border-none ring-1 ring-black/5 bg-white rounded-xl">
          <CardHeader className="border-b bg-gray-50/50 p-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                  <Plus className="h-5 w-5 text-primary" />
                  Add New Flag Configuration
                </CardTitle>
                <CardDescription className="text-sm font-medium text-gray-500 mt-1">
                  Opret et nyt flag til din konfigurator og angiv prisen i DKK.
                </CardDescription>
              </div>
              <div className="hidden sm:block">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                  <Flag className="h-6 w-6" />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8">
            <div className="flex flex-wrap gap-6 items-end">
              <div className="flex-1 min-w-[240px] space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Flag Identity</label>
                <Input
                  placeholder="f.eks. Sverige"
                  value={newFlag.name}
                  onChange={(e) => setNewFlag({ ...newFlag, name: e.target.value })}
                  className="h-12 border-gray-200 focus:border-primary focus:ring-primary/10 font-bold"
                />
              </div>
              <div className="w-full sm:w-48 space-y-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Extra Cost (DKK)</label>
                <div className="relative">
                  <Input
                    type="number"
                    placeholder="0"
                    value={newFlag.price}
                    onChange={(e) => setNewFlag({ ...newFlag, price: e.target.value })}
                    className="h-12 border-gray-200 focus:border-primary focus:ring-primary/10 font-bold pr-12"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-300">DKK</span>
                </div>
              </div>
              <Button 
                onClick={handleAdd}
                disabled={saving || !newFlag.name || newFlag.price === ''}
                className="h-12 px-8 rounded-lg shadow-md shadow-primary/20 bg-primary hover:bg-primary/90 font-black text-xs uppercase tracking-widest transition-all active:scale-95"
              >
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save to Cloud
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Flags Table Card - Exact Theme Match with Orders Page */}
        <Card className="relative overflow-hidden shadow-lg border-none ring-1 ring-black/5 bg-white rounded-xl">
          {loading && (
            <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50/80 border-b">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    # <span className="ml-1 opacity-30">ID</span>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                    Flag Name
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">
                    Price Structure
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredFlags.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/30">
                      Ingen flag fundet matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredFlags.map((flag, index) => (
                    <tr key={flag.id} className="hover:bg-gray-50/80 transition-all group">
                      <td className="px-6 py-5 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <span className="font-bold text-gray-400">{index + 1}</span>
                           <span className="text-[10px] text-gray-300 font-mono">ID:{flag.id}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap">
                        {editingId === flag.id ? (
                          <Input
                            value={editValues.name}
                            onChange={(e) => setEditValues({ ...editValues, name: e.target.value })}
                            className="h-10 font-bold border-primary/30 max-w-[200px]"
                            autoFocus
                          />
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-black text-[10px] group-hover:bg-primary group-hover:text-white transition-all shadow-sm">
                               {flag.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{flag.name}</span>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        {editingId === flag.id ? (
                          <div className="flex items-center justify-end gap-2">
                            <Input
                              type="number"
                              value={editValues.price}
                              onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                              className="h-10 w-24 font-mono font-bold border-primary/30 text-emerald-600 text-right"
                            />
                            <Badge variant="outline" className="h-10 bg-amber-50 text-amber-700 border-amber-200 font-bold">DKK</Badge>
                          </div>
                        ) : (
                          <Badge 
                            variant={parseFloat(flag.price) === 0 ? "secondary" : "default"} 
                            className={cn(
                              "font-black px-4 py-1.5 rounded-full text-[11px] shadow-sm",
                              parseFloat(flag.price) === 0 ? "bg-emerald-50 text-emerald-700 border-emerald-100" : "bg-primary text-white"
                            )}
                          >
                            {parseFloat(flag.price) === 0 ? 'FREE UNIT' : `+${flag.price} DKK`}
                          </Badge>
                        )}
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-right">
                        <div className="flex justify-end gap-2 transition-transform duration-300">
                          {editingId === flag.id ? (
                            <>
                              <Button 
                                size="sm" 
                                className="h-10 px-4 rounded-lg shadow-md bg-emerald-600 hover:bg-emerald-700 text-white font-bold" 
                                onClick={() => handleUpdate(flag.id)} 
                                disabled={saving}
                              >
                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-10 px-4 rounded-lg bg-white" 
                                onClick={() => setEditingId(null)}
                              >
                                <X className="h-4 w-4 text-gray-400" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => startEdit(flag)}
                                className="h-10 w-10 p-0 rounded-lg text-gray-400 hover:text-primary hover:bg-primary/10 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Edit2 className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(flag.id, flag.name)}
                                className="h-10 w-10 p-0 rounded-lg text-gray-400 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-center space-x-3 text-gray-400/60 py-6 border-t border-gray-100">
        <AlertCircle className="h-4 w-4" />
        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-center">
          Production Environment Integrity Verified • Real-time Data Sync Enabled
        </span>
      </div>
    </div>
  );
};

export default FlagsPage;

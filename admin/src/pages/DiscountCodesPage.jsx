import React, { useState, useEffect } from 'react';
import { getDiscountCodes, createDiscountCode } from '../services/admin.service';
import { Loader2, Search, Plus, MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

const DiscountCodesPage = () => {
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState({ code: '', type: 'PERCENTAGE', value: 10, expiresAt: '', phoneNumber: '' });
  const [creating, setCreating] = useState(false);

  const load = () => {
    setLoading(true);
    getDiscountCodes().then(setCodes).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await createDiscountCode(form);
      setShowForm(false);
      setForm({ code: '', type: 'PERCENTAGE', value: 10, expiresAt: '', phoneNumber: '' });
      load();
    } catch (e) {
      alert('Failed to create discount code.');
    } finally {
      setCreating(false);
    }
  };

  const filteredCodes = codes.filter(c => c.code.toLowerCase().includes(search.toLowerCase()) || (c.phoneNumber && c.phoneNumber.includes(search)));

  if (loading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        <button 
          onClick={() => setShowForm(!showForm)}
          className={cn(
            "flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors",
            showForm ? "bg-slate-500 hover:bg-slate-600" : "bg-[#7cb342] hover:bg-[#689f38]"
          )}
        >
          {showForm ? 'CANCEL' : <><Plus className="h-4 w-4" /> ADD COUPON</>}
        </button>
      </div>

      {showForm && (
        <div className="bg-[#f0f4f8] p-6 rounded border border-slate-200 mb-6 animate-in slide-in-from-top-4 duration-300">
          <h3 className="text-sm font-bold text-slate-800 mb-4">Create New Coupon</h3>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Coupon Code</label>
              <input 
                placeholder="e.g. SUMMER25" 
                value={form.code} 
                onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Discount Type</label>
              <select 
                value={form.type} 
                onChange={e => setForm({ ...form, type: e.target.value })} 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
              >
                <option value="PERCENTAGE">Percentage (%)</option>
                <option value="FIXED">Fixed Amount</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Value</label>
              <input 
                type="number" 
                value={form.value} 
                onChange={e => setForm({ ...form, value: e.target.value })} 
                required 
                min="1"
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-600 mb-1">Expiry Date</label>
              <input 
                type="date" 
                value={form.expiresAt} 
                onChange={e => setForm({ ...form, expiresAt: e.target.value })} 
                required 
                className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <button type="submit" disabled={creating} className="w-full bg-[#1e3a8a] text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm hover:bg-blue-800 transition-colors flex items-center justify-center">
                {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'SAVE'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table Section */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#fafafa] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500">Coupon ID</th>
              <th className="px-6 py-4 font-bold text-slate-500">Coupon Code</th>
              <th className="px-6 py-4 font-bold text-slate-500">Limit Used</th>
              <th className="px-6 py-4 font-bold text-slate-500">Used In Order</th>
              <th className="px-6 py-4 font-bold text-slate-500">Applied To</th>
              <th className="px-6 py-4 font-bold text-slate-500">Expiry Date</th>
              <th className="px-6 py-4 font-bold text-slate-500 w-12 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredCodes.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-slate-500 font-medium">No coupons found.</td>
              </tr>
            ) : (
              filteredCodes.map((c, index) => {
                const used = !!c.usedAt;
                
                return (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 text-slate-700 font-medium">{c.id}</td>
                    <td className="px-6 py-4">
                      <span className="bg-[#f0f8f1] text-[#2d6a4f] px-2.5 py-1 rounded text-xs font-bold tracking-wide">
                        {c.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-800 font-bold">
                       {used ? '1' : '0'} <span className="text-slate-400 font-normal ml-1">/ 1</span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">{used ? '1' : '0'}</td>
                    <td className="px-6 py-4 text-slate-700">advance</td>
                    <td className="px-6 py-4">
                       <div className="flex flex-col">
                         <span className="text-slate-700">
                           {new Date(c.expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                         </span>
                         <span className="text-[10px] text-slate-400 font-medium mt-0.5">12:00 AM</span>
                       </div>
                    </td>
                    <td className="px-6 py-4 text-slate-400 text-center">
                      <button className="hover:text-slate-700 transition-colors">
                        <MoreHorizontal className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default DiscountCodesPage;

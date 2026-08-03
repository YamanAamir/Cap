import React, { useState, useEffect } from 'react';
import { getOrders, updateOrderStatus } from '../services/auth.service';
import { getOrderStatuses } from '../services/admin.service';
import { Loader2, Search, Filter, RefreshCw, ImageIcon, X, MapPin, Phone, Mail, User, School, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const safeParseJSON = (jsonString) => {
  if (!jsonString) return {};
  if (typeof jsonString === 'object') return jsonString;
  try { return JSON.parse(jsonString); } catch (e) { return { _raw: jsonString }; }
};

const ProductionFactoryPage = () => {
  const [data, setData] = useState({ orders: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [debounceSearch, setDebounceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [statuses, setStatuses] = useState([]);
  
  // Modal states
  const [viewModal, setViewModal] = useState({ isOpen: false, order: null });
  const [galleryIndex, setGalleryIndex] = useState(0);

  useEffect(() => {
    getOrderStatuses().then(res => {
      // Only production-visible statuses
      setStatuses(res.filter(s => s.isVisibleToProduction));
    }).catch(console.error);
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => setDebounceSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        page,
        search: debounceSearch,
        limit: 20,
        statusId: statusFilter,
        isVisibleToProduction: 'true'
      });
      setData(response);
    } catch (error) {
      toast.error('Failed to load production queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, debounceSearch, statusFilter]);

  const handleStatusUpdate = async (orderId, newStatusId) => {
    try {
      await updateOrderStatus(orderId, { statusId: parseInt(newStatusId) });
      toast.success('Status updated');
      fetchOrders();
      if (viewModal.isOpen && viewModal.order.id === orderId) {
        setViewModal(prev => ({
          ...prev, 
          order: { ...prev.order, statusId: parseInt(newStatusId), orderStatus: statuses.find(s => s.id === parseInt(newStatusId)) }
        }));
      }
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading && !data.orders.length) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div>
           <h2 className="text-xl font-bold text-slate-800">Production Queue</h2>
           <p className="text-sm text-slate-500">Manage orders currently in the factory pipeline.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-[250px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search order or email..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="relative w-full sm:w-auto">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 pointer-events-none" />
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full sm:w-48 pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 bg-white"
            >
              <option value="all">All Visible Statuses</option>
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={fetchOrders}
            className={cn("flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 h-9 w-9 rounded border border-slate-200 transition-colors", loading && "opacity-50")}
          >
            <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#fafafa] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500">Order #</th>
              <th className="px-6 py-4 font-bold text-slate-500">Date Received</th>
              <th className="px-6 py-4 font-bold text-slate-500">School / Program</th>
              <th className="px-6 py-4 font-bold text-slate-500">Current Status</th>
              <th className="px-6 py-4 font-bold text-slate-500 w-12 text-center">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.orders.length === 0 && !loading ? (
              <tr>
                <td colSpan="5" className="px-6 py-8 text-center text-slate-500 font-medium">No production orders found.</td>
              </tr>
            ) : (
              data.orders.map((order) => {
                const customerDetails = safeParseJSON(order.customerDetails);
                return (
                  <tr key={order.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-700">{order.orderNumber}</td>
                    <td className="px-6 py-4 text-slate-600">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-700">{customerDetails.Skolenavn || order.program || 'N/A'}</span>
                        <span className="text-xs text-slate-400">{order.packageName || 'Standard'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                       <select
                          value={order.statusId || ''}
                          onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                          className="px-2.5 py-1.5 border border-slate-200 rounded text-xs font-bold text-slate-700 bg-[#fafafa] focus:outline-none focus:border-blue-500"
                        >
                          {statuses.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                          ))}
                       </select>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button 
                        className="px-3 py-1.5 bg-[#1e3a8a] text-white text-xs font-bold rounded shadow-sm hover:bg-blue-800 transition-colors flex items-center gap-1.5 mx-auto"
                        onClick={() => { setViewModal({ isOpen: true, order }); setGalleryIndex(0); }}
                      >
                        <ImageIcon className="h-3 w-3" /> View Specs
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-xs text-slate-500 font-bold">
          Showing <span className="text-slate-700">{data.orders.length}</span> orders
        </p>
        <div className="flex gap-1">
           <button 
             disabled={page === 1}
             onClick={() => setPage(page - 1)}
             className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-sm hover:bg-slate-50 disabled:opacity-50"
           >Prev</button>
           <button 
             disabled={!data.pagination.totalPages || page === data.pagination.totalPages}
             onClick={() => setPage(page + 1)}
             className="px-3 py-1 bg-white border border-slate-200 text-slate-600 rounded text-sm hover:bg-slate-50 disabled:opacity-50"
           >Next</button>
        </div>
      </div>

      {/* Production Details Modal */}
      {viewModal.isOpen && viewModal.order && (() => {
        const order = viewModal.order;
        const customerDetails = safeParseJSON(order.customerDetails);
        const capImagesObj = safeParseJSON(order.capImages);
        const selectedOptions = safeParseJSON(order.selectedOptions);
        
        const capViews = [
          { key: 'front', label: 'Front' },
          { key: 'back', label: 'Back' },
          { key: 'top', label: 'Top' },
          { key: 'bottom', label: 'Bottom' },
        ].filter(v => capImagesObj?.[v.key]?.startsWith('data:image'));

        const liningImageBase64 = order?.selectedOptions?.FOER?.['Indvendigt foer billede']?.[0]?.url || selectedOptions?.FOER?.['Indvendigt foer billede'];

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in-95">
              
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-[#fafafa] shrink-0">
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Order #{order.orderNumber}</h3>
                  <p className="text-xs text-slate-500 font-medium">Production Specifications</p>
                </div>
                <div className="flex items-center gap-4">
                   <select
                      value={order.statusId || ''}
                      onChange={(e) => handleStatusUpdate(order.id, e.target.value)}
                      className="px-3 py-2 border border-slate-200 rounded text-xs font-bold text-slate-700 bg-white shadow-sm focus:outline-none focus:border-blue-500"
                    >
                      {statuses.map(s => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                   </select>
                   <button onClick={() => setViewModal({ isOpen: false, order: null })} className="text-slate-400 hover:text-slate-600 p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors">
                     <X className="w-5 h-5" />
                   </button>
                </div>
              </div>
              
              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
                
                {/* Visuals Column */}
                <div className="lg:w-[400px] shrink-0 space-y-6">
                  {capViews.length > 0 ? (
                    <div className="bg-white border border-slate-200 rounded p-4">
                      <div className="aspect-square w-full bg-[#fafafa] rounded border border-slate-100 mb-4 overflow-hidden relative group">
                        <img src={capImagesObj[capViews[galleryIndex].key]} alt="Cap View" className="w-full h-full object-contain" />
                        <div className="absolute top-2 left-2 bg-slate-900/70 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">
                          {capViews[galleryIndex].label} View
                        </div>
                        <button onClick={() => setGalleryIndex((i) => (i === 0 ? capViews.length - 1 : i - 1))} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white text-slate-800 rounded opacity-0 group-hover:opacity-100 transition-all"><ChevronLeft className="w-4 h-4" /></button>
                        <button onClick={() => setGalleryIndex((i) => (i === capViews.length - 1 ? 0 : i + 1))} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-white/50 hover:bg-white text-slate-800 rounded opacity-0 group-hover:opacity-100 transition-all"><ChevronRight className="w-4 h-4" /></button>
                      </div>
                      <div className="flex gap-2 overflow-x-auto pb-1">
                         {capViews.map((view, idx) => (
                           <button key={view.key} onClick={() => setGalleryIndex(idx)} className={cn("w-16 h-16 shrink-0 rounded border-2 overflow-hidden", galleryIndex === idx ? "border-blue-500" : "border-transparent opacity-60 hover:opacity-100")}>
                             <img src={capImagesObj[view.key]} className="w-full h-full object-cover bg-slate-50" />
                           </button>
                         ))}
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-square w-full bg-slate-50 rounded border border-dashed border-slate-300 flex items-center justify-center flex-col text-slate-400">
                      <ImageIcon className="w-12 h-12 mb-2 opacity-50" />
                      <span className="text-xs font-bold">No Render Images</span>
                    </div>
                  )}

                  {liningImageBase64 && (
                    <div className="bg-white border border-slate-200 rounded p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Custom Lining Image</h4>
                      <img src={liningImageBase64} alt="Lining" className="w-full rounded border border-slate-100 object-cover" />
                    </div>
                  )}
                </div>

                {/* Data Column */}
                <div className="flex-1 space-y-6">
                  
                  {/* Delivery Info */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-[#fafafa] border border-slate-200 rounded p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><User className="w-3 h-3" /> Customer</h4>
                      <p className="font-bold text-sm text-slate-800">{customerDetails?.firstName} {customerDetails?.lastName}</p>
                      <p className="text-xs text-slate-600 flex items-center gap-1 mt-1"><Mail className="w-3 h-3 text-slate-400"/> {order.customerEmail}</p>
                      {customerDetails?.phone && <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-slate-400"/> {customerDetails.phone}</p>}
                    </div>
                    <div className="bg-[#fafafa] border border-slate-200 rounded p-4">
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Delivery Address</h4>
                      <p className="font-bold text-sm text-slate-800">{customerDetails?.address}</p>
                      <p className="text-xs text-slate-600 mt-1">{customerDetails?.postalCode} {customerDetails?.city}</p>
                      <p className="text-xs text-slate-600 mt-0.5 font-medium text-amber-700">{customerDetails?.deliveryType === 'express' ? 'Priority Express' : 'Standard Delivery'}</p>
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded p-4">
                     <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><School className="w-3 h-3" /> Academic Info</h4>
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">School</p>
                         <p className="text-sm font-bold text-slate-800">{customerDetails?.Skolenavn || 'N/A'}</p>
                       </div>
                       <div>
                         <p className="text-[10px] text-slate-400 font-bold uppercase">Program</p>
                         <p className="text-sm font-bold text-slate-800">{order.program || 'N/A'}</p>
                       </div>
                     </div>
                  </div>

                  {/* Complete Options Dump */}
                  <div className="bg-white border border-slate-200 rounded p-4 flex-1 flex flex-col min-h-[250px]">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Full Specifications</h4>
                    <div className="bg-slate-900 rounded p-4 flex-1 overflow-auto custom-scrollbar">
                      <pre className="text-[11px] font-mono text-green-400">
                        {JSON.stringify(selectedOptions, null, 2)}
                      </pre>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default ProductionFactoryPage;

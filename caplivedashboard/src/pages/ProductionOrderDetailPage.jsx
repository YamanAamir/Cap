import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '../services/auth.service';
import { getOrderStatuses, getSettings } from '../services/admin.service';
import { ChevronLeft, Loader2, User, Mail, MapPin, Phone, School, Truck, ImageIcon, X, ChevronRight, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import ConfigBlueprintCards from '../components/orders/ConfigBlueprintCards';
import ConfirmModal from '../components/common/ConfirmModal';

const safeParseJSON = (jsonString) => {
  if (!jsonString) return {};
  if (typeof jsonString === 'object') return jsonString;
  try { return JSON.parse(jsonString); } catch (e) { return { _raw: jsonString }; }
};

const ProductionOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, statusId: null });
  const [productionFilters, setProductionFilters] = useState([]);
  const [translateLoading, setTranslateLoading] = useState(() => {
    return !(document.documentElement.classList.contains('translated-ltr') || document.documentElement.classList.contains('translated-rtl'));
  });

  const fetchOrderAndSettings = async () => {
    setLoading(true);
    try {
      const [data, settings] = await Promise.all([
        getOrder(id),
        getSettings().catch(() => [])
      ]);
      setOrder(data);
      
      const pTerms = settings.find(s => s.key === 'PRODUCTION_DISPLAY_TERMS');
      if (pTerms && pTerms.value) {
        const val = typeof pTerms.value === 'string' ? JSON.parse(pTerms.value) : pTerms.value;
        setProductionFilters(val);
      }
    } catch (err) {
      toast.error('Failed to load order details');
      navigate('/dashboard/factory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrderAndSettings();
    
    getOrderStatuses()
      .then(data => setStatuses(data.filter(s => s.isVisibleToProduction)))
      .catch(err => console.error('Error fetching statuses:', err));
  }, [id]);

  useEffect(() => {
    // Auto-translate to English
    document.cookie = "googtrans=/da/en; path=/";
    document.cookie = "googtrans=/da/en; domain=" + document.domain + "; path=/";

    // Inject Google Translate script if not present
    if (!document.getElementById('google-translate-script')) {
      const style = document.createElement('style');
      style.innerHTML = `
        .goog-te-banner-frame { display: none !important; }
        .goog-te-combo { display: none !important; }
        body { top: 0px !important; }
        #google_translate_element { display: none !important; }
      `;
      document.head.appendChild(style);

      const script = document.createElement('script');
      script.id = 'google-translate-script';
      script.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
      script.async = true;
      document.body.appendChild(script);

      window.googleTranslateElementInit = () => {
        if (window.google && window.google.translate) {
          new window.google.translate.TranslateElement({
            pageLanguage: 'da',
            includedLanguages: 'en',
            layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
            autoDisplay: true
          }, 'google_translate_element');
        }
      };
    }

    if (translateLoading) {
      const checkTranslate = setInterval(() => {
        if (document.documentElement.classList.contains('translated-ltr') || document.documentElement.classList.contains('translated-rtl')) {
          clearInterval(checkTranslate);
          setTranslateLoading(false);
        }
      }, 100);

      const timeout = setTimeout(() => {
        clearInterval(checkTranslate);
        setTranslateLoading(false);
      }, 2000);

      return () => {
        clearInterval(checkTranslate);
        clearTimeout(timeout);
      };
    }
  }, [translateLoading]);

  const handleStatusUpdate = async () => {
    if (!confirmModal.statusId) return;
    setUpdating(true);
    try {
      await updateOrderStatus(id, { statusId: parseInt(confirmModal.statusId) });
      toast.success('Status updated');
      await fetchOrderAndSettings();
    } catch (err) {
      toast.error('Failed to update status');
    } finally {
      setUpdating(false);
      setConfirmModal({ isOpen: false, statusId: null });
    }
  };

  if (loading || !order) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
      </div>
    );
  }

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
    <div className={`animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12 transition-opacity ${translateLoading ? 'opacity-0' : 'opacity-100'}`}>
      {translateLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80">
          <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
      )}
      <div id="google_translate_element"></div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/factory')}
            className="p-2 border border-slate-200 text-slate-500 rounded hover:bg-slate-50 transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">#{order.orderNumber}</h1>
            <p className="text-xs text-slate-500 font-medium">Production Specifications</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
           <select
              value={order.statusId || ''}
              onChange={(e) => setConfirmModal({ isOpen: true, statusId: e.target.value })}
              disabled={updating}
              className="px-3 py-2 border border-slate-200 rounded text-sm font-bold text-slate-700 bg-white focus:outline-none focus:border-blue-500 min-w-[200px]"
            >
              {statuses.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
           </select>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Visuals Column */}
        <div className="lg:col-span-1 space-y-6">
          {capViews.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded p-4">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                Render Gallery
              </h3>
              <div 
                className="aspect-square w-full bg-[#fafafa] rounded border border-slate-100 mb-4 overflow-hidden relative group cursor-pointer"
                onClick={() => setIsGalleryOpen(true)}
              >
                <img src={capImagesObj[capViews[galleryIndex].key]} alt="Cap View" className="w-full h-full object-contain" />
                <div className="absolute top-2 left-2 bg-slate-900/70 text-white px-2 py-1 rounded text-[10px] font-bold uppercase">
                  {capViews[galleryIndex].label} View
                </div>
                <div className="absolute inset-0 bg-black/5 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                  <span className="bg-black/70 text-white text-xs px-2 py-1 rounded font-bold">Click to Expand</span>
                </div>
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

          {liningImageBase64?.startsWith?.('data:image') && (
            <div className="bg-white border border-slate-200 rounded p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2">Custom Lining Image</h4>
              <img src={liningImageBase64} alt="Lining" className="w-full rounded border border-slate-100 object-cover" />
            </div>
          )}
        </div>

        {/* Data Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Delivery & Academic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200 rounded p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><User className="w-3 h-3" /> Customer</h4>
              <p className="font-bold text-sm text-slate-800">{customerDetails?.firstName} {customerDetails?.lastName}</p>
              <p className="text-xs text-slate-600 flex items-center gap-1 mt-1"><Mail className="w-3 h-3 text-slate-400"/> {order.customerEmail}</p>
              {customerDetails?.phone && <p className="text-xs text-slate-600 flex items-center gap-1 mt-0.5"><Phone className="w-3 h-3 text-slate-400"/> {customerDetails.phone}</p>}
            </div>
            
            <div className="bg-white border border-slate-200 rounded p-4">
              <h4 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-2 flex items-center gap-1.5"><MapPin className="w-3 h-3" /> Delivery</h4>
              <p className="font-bold text-sm text-slate-800">{customerDetails?.address}</p>
              <p className="text-xs text-slate-600 mt-1">{customerDetails?.postalCode} {customerDetails?.city}</p>
              <p className="text-xs text-slate-600 mt-0.5 font-medium text-amber-700">{customerDetails?.deliveryType === 'express' ? 'Priority Express' : 'Standard Delivery'}</p>
            </div>
            
            <div className="bg-white border border-slate-200 rounded p-4 sm:col-span-2">
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
          </div>

          <div className="mt-6">
             <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
               <Settings2 className="h-4 w-4 text-slate-400" />
               Production Specifications
             </h3>
             <ConfigBlueprintCards selectedOptions={selectedOptions} productionFilters={productionFilters} />
          </div>

        </div>
      </div>

      {/* Fullscreen Gallery Overlay */}
      {isGalleryOpen && capViews.length > 0 && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4">
            <h3 className="text-white font-bold text-sm uppercase tracking-wider">{capViews[galleryIndex].label} View</h3>
            <button onClick={() => setIsGalleryOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors">
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <button 
              onClick={() => setGalleryIndex((i) => (i === 0 ? capViews.length - 1 : i - 1))}
              className="absolute left-4 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block"
            >
              <ChevronLeft className="h-8 w-8" />
            </button>
            
            <img 
              src={capImagesObj[capViews[galleryIndex].key]} 
              alt={capViews[galleryIndex].label} 
              className="max-h-full max-w-full object-contain drop-shadow-2xl"
            />
            
            <button 
              onClick={() => setGalleryIndex((i) => (i === capViews.length - 1 ? 0 : i + 1))}
              className="absolute right-4 p-4 bg-white/10 hover:bg-white/20 rounded-full text-white transition-colors hidden sm:block"
            >
              <ChevronRight className="h-8 w-8" />
            </button>
          </div>

          <div className="p-6 flex justify-center gap-4 overflow-x-auto bg-black/20">
            {capViews.map((view, idx) => (
              <button 
                key={view.key}
                onClick={() => setGalleryIndex(idx)}
                className={cn(
                  "h-20 w-20 rounded-xl overflow-hidden border-2 transition-all shrink-0 shadow-lg",
                  galleryIndex === idx ? "border-blue-500 scale-110" : "border-transparent opacity-50 hover:opacity-100"
                )}
              >
                <img src={capImagesObj[view.key]} alt={view.label} className="w-full h-full object-cover bg-white" />
              </button>
            ))}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Update Order Status"
        message="Are you sure you want to update the status of this order? If an email template is linked to the new status, it will be automatically sent to the customer."
        confirmText="Yes, Update Status"
        isDestructive={false}
        isLoading={updating}
        onConfirm={handleStatusUpdate}
        onCancel={() => !updating && setConfirmModal({ isOpen: false, statusId: null })}
      />
    </div>
  );
};

export default ProductionOrderDetailPage;

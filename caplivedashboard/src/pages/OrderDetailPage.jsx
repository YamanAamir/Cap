import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, updateOrderStatus, resendOrderEmails } from '../services/auth.service';
import { getOrderStatuses } from '../services/admin.service';
import {
  ChevronLeft, Loader2, User, Mail, Package, Calendar,
  MapPin, Phone, School, Truck, Settings2,
  AlertCircle, Code, CheckCircle2, Tag, ImageIcon, ChevronRight, X, CreditCard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import ConfigBlueprintCards from '../components/orders/ConfigBlueprintCards';
import ConfirmModal from '../components/common/ConfirmModal';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [selectedStatusId, setSelectedStatusId] = useState('');
  
  // Gallery State
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  
  // Confirmation Modal
  const [confirmModal, setConfirmModal] = useState({ isOpen: false });

  // Resend Email State
  const [resendingEmails, setResendingEmails] = useState(false);

  const fetchOrder = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOrder(id);
      setOrder(data);
    } catch (err) {
      console.error('Failed to fetch order details:', err);
      setError(err.response?.data?.message || 'Failed to load order details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    getOrderStatuses().then(setStatuses).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (order?.statusId) setSelectedStatusId(String(order.statusId));
  }, [order?.statusId]);

  const handleStatusUpdate = async () => {
    if (!selectedStatusId) return;
    setUpdating(true);
    try {
      await updateOrderStatus(id, { statusId: parseInt(selectedStatusId) });
      await fetchOrder();
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
      setConfirmModal({ isOpen: false });
    }
  };

  const handleResendEmails = async () => {
    if (!window.confirm("Are you sure you want to force-resend confirmation emails for this order? This will send confirmation emails to the Customer, Admin, and Factory using the latest configuration.")) return;
    setResendingEmails(true);
    try {
      await resendOrderEmails(id);
      alert('Emails resent successfully!');
    } catch (err) {
      console.error('Failed to resend emails:', err);
      alert(err.response?.data?.message || 'Failed to resend emails. Please try again.');
    } finally {
      setResendingEmails(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center space-y-6">
        <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
        <p className="text-slate-500 font-bold text-sm">Retrieving Order Data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center space-y-4 max-w-md mx-auto text-center px-6">
        <AlertCircle className="h-10 w-10 text-red-500" />
        <h2 className="text-xl font-bold text-slate-800">Connection Error</h2>
        <p className="text-slate-500 text-sm">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-4 px-6 py-2 bg-slate-800 text-white font-bold text-sm rounded hover:bg-slate-700">
          Attempt Recovery
        </button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <Package className="h-12 w-12 text-slate-300 mb-4" />
        <h2 className="text-xl font-bold text-slate-800 mb-2">Order Not Found</h2>
        <p className="text-slate-500 text-sm mb-6">The requested order could not be located.</p>
        <button onClick={() => navigate('/dashboard/orders')} className="px-6 py-2 bg-slate-800 text-white font-bold text-sm rounded hover:bg-slate-700">
          Return to Orders
        </button>
      </div>
    );
  }

  const safeParseJSON = (jsonString) => {
    if (!jsonString) return {};
    if (typeof jsonString === 'object') return jsonString;
    try {
      return JSON.parse(jsonString);
    } catch (e) {
      return { _raw: jsonString };
    }
  };

  const customerDetails = safeParseJSON(order.customerDetails);
  const selectedOptions = safeParseJSON(order.selectedOptions);
  const liningImageBase64 =
    order?.selectedOptions?.FOER?.['Indvendigt foer billede']?.[0]?.url ||
    selectedOptions?.FOER?.['Indvendigt foer billede'] ||
    null;

  const InfoItem = ({ label, value, icon: Icon, className }) => (
    <div className={cn("flex flex-col space-y-1", className)}>
      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
        {Icon && <Icon className="h-3.5 w-3.5" />}
        {label}
      </span>
      <span className="text-sm font-bold text-slate-800 break-words">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || '—')}
      </span>
    </div>
  );

  const capImagesObj = safeParseJSON(order.capImages);
  
  const capViews = [
    { key: 'front', label: 'Front Angle' },
    { key: 'back', label: 'Rear Angle' },
    { key: 'top', label: 'Top View' },
    { key: 'bottom', label: 'Underbrim View' },
  ].filter(v => capImagesObj?.[v.key]?.startsWith('data:image'));

  const getStatusBadge = (orderStatus, fallbackStatus) => {
    const name = orderStatus?.name || fallbackStatus?.replace(/_/g, ' ') || 'Unknown';
    const color = orderStatus?.color || '#6366f1';
    return (
      <span className="px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center" style={{ backgroundColor: `${color}15`, color }}>
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ backgroundColor: color }} />
        {name}
      </span>
    );
  };

  return (
    <div className="animate-in fade-in duration-500 max-w-[1200px] mx-auto pb-12">
      
      {/* Header Actions */}
      <div className="flex flex-col md:flex-row justify-between md:items-center mb-6 gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/dashboard/orders')}
            className="p-2 border border-slate-200 text-slate-500 rounded hover:bg-slate-50 transition-colors shrink-0"
            title="Back to Orders"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">#{order.orderNumber}</h1>
              {getStatusBadge(order.orderStatus, order.status)}
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1 mt-1 font-bold">
              <Calendar className="h-3 w-3" />
              {new Date(order.createdAt).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Force Send Email Button */}
          <button
            onClick={handleResendEmails}
            disabled={resendingEmails}
            className="flex items-center justify-center h-10 px-4 rounded bg-emerald-600 text-white font-bold transition-colors hover:bg-emerald-700 disabled:bg-slate-300 shrink-0 text-sm"
          >
            {resendingEmails ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1.5" /> Sending...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-1.5" /> Send Order Emails
              </>
            )}
          </button>

          <div className="flex items-center gap-2 bg-[#fafafa] p-1.5 rounded border border-slate-200 w-full md:w-auto">
            <select
              value={selectedStatusId}
              onChange={(e) => setSelectedStatusId(e.target.value)}
              className="h-10 border-0 bg-transparent px-3 text-sm font-bold text-slate-700 min-w-[200px] focus:ring-0 cursor-pointer outline-none w-full md:w-auto"
            >
              <option value="">Update Status...</option>
              {statuses.filter(s => s.isActive).map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
            <button
              onClick={() => setConfirmModal({ isOpen: true })}
              disabled={updating || !selectedStatusId || String(order.statusId) === selectedStatusId}
              className={cn(
                "flex items-center justify-center h-10 px-4 rounded text-white font-bold transition-colors shrink-0",
                updating || !selectedStatusId || String(order.statusId) === selectedStatusId ? "bg-slate-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
              )}
            >
              {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'UPDATE'}
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Info & Registry */}
        <div className="lg:col-span-2 space-y-6">
          
          <div className="bg-white border border-slate-200 rounded p-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-6 pb-4 border-b border-slate-100">
              <User className="h-4 w-4 text-slate-400" />
              Client Dossier
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Identity & Contact</h4>
                  <div className="space-y-4">
                    <InfoItem
                      label="Primary Name"
                      value={`${customerDetails?.firstName || ''} ${customerDetails?.lastName || ''}`.trim() || customerDetails?.name}
                      icon={User}
                    />
                    <InfoItem label="Email Address" value={customerDetails?.email || order.customerEmail} icon={Mail} />
                    <InfoItem label="Phone Number" value={customerDetails?.phone} icon={Phone} />
                  </div>
                </div>
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Academic Profile</h4>
                  <div className="space-y-4">
                    <InfoItem label="Institution" value={customerDetails.Skolenavn} icon={School} />
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Logistics</h4>
                  <div className="space-y-4">
                    <InfoItem 
                      label="Fulfillment Tier" 
                      value={customerDetails?.deliveryType === 'express' ? 'Priority Express (3 Weeks)' : 'Standard (6 Weeks)'} 
                      icon={Truck} 
                      className={customerDetails?.deliveryType === 'express' ? "text-amber-700" : ""}
                    />
                    <InfoItem label="Delivery Address" value={customerDetails?.address} icon={MapPin} />
                    <div className="grid grid-cols-2 gap-4">
                      <InfoItem label="City" value={customerDetails?.city} />
                      <InfoItem label="Postal Code" value={customerDetails?.postalCode} />
                    </div>
                  </div>
                </div>
                
                {customerDetails?.notes && (
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Special Notes</h4>
                    <div className="bg-[#fafafa] p-3 rounded border border-slate-200 text-sm font-bold text-slate-700">
                      "{customerDetails.notes}"
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Blueprint Registry (Configuration JSON) */}
          <div className="mt-6">
            <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
              <Settings2 className="h-4 w-4 text-slate-400" />
              Configuration Blueprint
            </h3>
            <ConfigBlueprintCards selectedOptions={selectedOptions} />
          </div>
        </div>

        {/* Right Column: Visuals & Totals */}
        <div className="space-y-6">
          
          {/* Financial Summary */}
          <div className="bg-[#fafafa] border border-slate-200 rounded p-6">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1 block">Net Valuation</span>
            <p className="text-3xl font-bold text-slate-900 tracking-tight">
              {new Intl.NumberFormat('da-DK', { style: 'currency', currency: order.currency || 'DKK' }).format(order.totalPrice || 0)}
            </p>
            
            <div className="mt-6 space-y-3">
              {order.discountCode && (
                <div className="bg-white rounded p-3 border border-slate-200">
                  <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest block mb-1 flex items-center gap-1">
                    <Tag className="h-3 w-3" /> Applied Discount
                  </span>
                  <p className="font-bold text-sm text-slate-800">{order.discountCode.code}</p>
                  {order.discountAmount > 0 && (
                    <p className="text-xs font-bold text-green-600 mt-1">−{order.discountAmount} DKK</p>
                  )}
                </div>
              )}
              <div className="bg-white rounded p-3 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest block mb-1">Tier</span>
                <p className="font-bold text-sm text-slate-800">{order.packageName || 'Standard Issue'}</p>
              </div>

              {order.installmentDetails && order.installmentDetails.installments && (
                <div className="bg-white rounded p-3 border border-emerald-200 mt-4">
                  <span className="text-[10px] font-bold uppercase text-emerald-600 tracking-widest block mb-2 flex items-center gap-1">
                    <CreditCard className="h-3 w-3" /> Installment History
                  </span>
                  <div className="space-y-2">
                    {order.installmentDetails.installments.map((inst, i) => (
                      <div key={i} className="flex justify-between items-center text-sm border-b border-slate-100 last:border-0 pb-2 last:pb-0">
                        <div>
                          <p className="font-bold text-slate-700">{inst.label}</p>
                          <p className="text-xs text-slate-500">{inst.paidAt ? new Date(inst.paidAt).toLocaleDateString() : 'Pending'}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-slate-900">{inst.amount} DKK</p>
                          <span className={cn("text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded", inst.status === 'Paid' ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700")}>
                            {inst.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="bg-white rounded p-3 border border-slate-200">
                <span className="text-[10px] font-bold uppercase text-slate-500 tracking-widest block mb-1">Affiliation</span>
                <p className="font-bold text-sm text-slate-800">{order.program || 'N/A'}</p>
              </div>
              {(order.installmentPlanId || order.installmentDetails) && (() => {
                const planDetails = order.installmentDetails || order.installmentPlan || {};
                const totalVal = parseFloat(order.totalPrice || 0);
                const dpVal = planDetails.downPayment !== undefined 
                  ? planDetails.downPayment 
                  : (totalVal * (planDetails.downPaymentPercent || 0) / 100).toFixed(2);
                const rates = Array.isArray(planDetails.installments) ? planDetails.installments : [];

                return (
                  <div className="bg-indigo-50/70 border border-indigo-200 rounded p-4.5 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase text-indigo-700 tracking-widest flex items-center gap-1.5">
                        <CreditCard className="h-3.5 w-3.5 text-indigo-600" /> Afdragsordning
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-indigo-600 text-white uppercase tracking-wider">
                        AFDRAG
                      </span>
                    </div>
                    <p className="font-bold text-sm text-slate-800">
                      {planDetails.name || 'Afdragsplan'}
                    </p>
                    <div className="text-xs space-y-1.5 text-slate-600 pt-1 border-t border-indigo-100">
                      <div className="flex justify-between">
                        <span>Depositum (1. betaling {planDetails.downPaymentPercent ? `${planDetails.downPaymentPercent}%` : ''}):</span>
                        <span className="font-bold text-slate-800">{dpVal} DKK</span>
                      </div>
                      {rates.map((rate, rIdx) => {
                        const rAmt = rate.amount !== undefined ? rate.amount : (totalVal * (rate.percent || 0) / 100).toFixed(2);
                        return (
                          <div key={rIdx} className="flex justify-between text-slate-600">
                            <span>{rate.label || `${rIdx + 2}. rate`} ({rate.percent ? `${rate.percent}% - ` : ''}{rate.dueLabel || 'Forfald'}):</span>
                            <span className="font-bold text-slate-800">{rAmt} DKK</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* 4-View Design Gallery */}
          {capViews.length > 0 && (
            <div className="bg-white border border-slate-200 rounded p-6">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <ImageIcon className="h-4 w-4 text-slate-400" />
                Render Gallery
              </h3>
              
              <div className="relative group cursor-pointer" onClick={() => setIsGalleryOpen(true)}>
                 <div className="aspect-square w-full bg-[#fafafa] rounded border border-slate-200 overflow-hidden relative">
                    <img src={capImagesObj[capViews[0].key]} alt="Primary Render" className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                 </div>
                 <div className="absolute bottom-2 right-2 bg-slate-900/80 text-white px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                   <ImageIcon className="h-3 w-3" /> {capViews.length}
                 </div>
              </div>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {capViews.slice(0, 4).map((view, idx) => (
                  <div key={view.key} className="aspect-square bg-[#fafafa] rounded overflow-hidden border border-slate-200 opacity-60 hover:opacity-100 transition-opacity">
                    <img src={capImagesObj[view.key]} alt={view.label} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Lining Upload */}
          {liningImageBase64?.startsWith?.('data:image') && (
            <div className="bg-white border border-slate-200 rounded p-6">
               <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Package className="h-4 w-4 text-slate-400" />
                Custom Lining
              </h3>
              <div className="rounded overflow-hidden border border-slate-200">
                <img src={liningImageBase64} alt="Inside Lining" className="w-full h-auto max-h-48 object-cover" />
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Fullscreen Gallery Overlay */}
      {isGalleryOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-sm flex flex-col animate-in fade-in duration-200">
          <div className="flex items-center justify-between p-4">
            <h3 className="text-white font-bold text-sm">{capViews[galleryIndex].label}</h3>
            <button onClick={() => setIsGalleryOpen(false)} className="p-2 bg-white/10 hover:bg-white/20 rounded text-white transition-colors">
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex-1 flex items-center justify-center p-4 relative">
            <button 
              onClick={() => setGalleryIndex((i) => (i === 0 ? capViews.length - 1 : i - 1))}
              className="absolute left-4 p-3 bg-white/10 hover:bg-white/20 rounded text-white transition-colors hidden sm:block"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            
            <img 
              src={capImagesObj[capViews[galleryIndex].key]} 
              alt={capViews[galleryIndex].label} 
              className="max-h-full max-w-full object-contain rounded"
            />
            
            <button 
              onClick={() => setGalleryIndex((i) => (i === capViews.length - 1 ? 0 : i + 1))}
              className="absolute right-4 p-3 bg-white/10 hover:bg-white/20 rounded text-white transition-colors hidden sm:block"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </div>

          <div className="p-4 flex justify-center gap-2 overflow-x-auto">
            {capViews.map((view, idx) => (
              <button 
                key={view.key}
                onClick={() => setGalleryIndex(idx)}
                className={cn(
                  "h-16 w-16 rounded overflow-hidden border-2 transition-all shrink-0",
                  galleryIndex === idx ? "border-blue-500" : "border-transparent opacity-50 hover:opacity-100"
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
        onCancel={() => !updating && setConfirmModal({ isOpen: false })}
      />
    </div>
  );
};

export default OrderDetailPage;

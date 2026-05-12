import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '../services/auth.service';
import { Card, CardHeader, CardTitle, CardContent, Button, Badge } from '../components/ui';
import { 
  ChevronLeft, Loader2, User, Mail, CreditCard, Package, Calendar, 
  MapPin, Phone, School, Truck, Notebook as Notes, Settings2, 
  Info, AlertCircle, Code, CheckCircle2, XCircle, Clock 
} from 'lucide-react';
import { cn } from '@/lib/utils';

const OrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);

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
  }, [id]);

  const handleStatusUpdate = async (status) => {
    setUpdating(true);
    try {
      await updateOrderStatus(id, status);
      await fetchOrder(); // Refresh data
    } catch (err) {
      console.error('Failed to update status:', err);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 text-primary animate-spin" />
        <p className="text-muted-foreground font-medium animate-pulse">Loading order details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-[70vh] items-center justify-center space-y-6 max-w-md mx-auto text-center px-6">
        <div className="h-20 w-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-gray-900">Communication Error</h2>
          <p className="text-muted-foreground">{error}</p>
        </div>
        <Button onClick={() => window.location.reload()} variant="outline" className="w-full">
          Try Again
        </Button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-20 flex flex-col items-center">
        <Package className="h-16 w-16 text-gray-200 mb-4" />
        <h2 className="text-2xl font-bold text-gray-400">Order not found</h2>
        <Button onClick={() => navigate('/dashboard/orders')} className="mt-6 rounded-full px-8">
          Return to Orders
        </Button>
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

  const InfoItem = ({ label, value, icon: Icon, className }) => (
    <div className={cn("flex flex-col space-y-1", className)}>
      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center">
        {Icon && <Icon className="mr-1.5 h-3 w-3" />}
        {label}
      </span>
      <span className="text-sm font-semibold text-gray-900 break-words">
        {typeof value === 'boolean' ? (value ? 'Yes' : 'No') : (value || 'N/A')}
      </span>
    </div>
  );

  const getStatusBadge = (status) => {
    const statuses = {
      'PENDING': { color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Clock },
      'ACCEPTED': { color: 'bg-emerald-100 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
      'REJECTED': { color: 'bg-red-100 text-red-700 border-red-200', icon: XCircle },
    };
    const config = statuses[status] || statuses['PENDING'];
    const Icon = config.icon;
    return (
      <Badge variant="outline" className={cn("px-3 py-1 rounded-full font-bold flex items-center gap-1.5", config.color)}>
        <Icon className="h-3 w-3" />
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/dashboard/orders')}
            className="rounded-full shadow-sm hover:bg-primary hover:text-white transition-all h-10 w-10"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">Order {order.orderNumber}</h1>
              {getStatusBadge(order.status)}
            </div>
            <p className="text-muted-foreground flex items-center mt-1 text-xs font-semibold uppercase tracking-wider">
              <Calendar className="mr-1.5 h-3.5 w-3.5 text-primary" />
              Placed {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Order Actions */}
        <div className="flex items-center gap-2">
          {order.status === 'PENDING' && (
            <>
              <Button 
                onClick={() => handleStatusUpdate('ACCEPTED')} 
                disabled={updating}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl px-6"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                Accept Order
              </Button>
              <Button 
                onClick={() => handleStatusUpdate('REJECTED')} 
                disabled={updating}
                variant="outline"
                className="border-red-200 text-red-600 hover:bg-red-50 font-bold rounded-xl px-6"
              >
                {updating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <XCircle className="h-4 (w-4 mr-2" />}
                Reject
              </Button>
            </>
          )}
          {order.status !== 'PENDING' && (
            <Button 
              onClick={() => handleStatusUpdate('PENDING')} 
              disabled={updating}
              variant="ghost"
              className="text-gray-400 hover:text-primary font-bold"
            >
              Reset to Pending
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden rounded-2xl">
            <CardHeader className="border-b bg-gray-50/50 p-6 text-left">
              <CardTitle className="text-lg flex items-center font-bold text-gray-800">
                <User className="mr-2.5 h-5 w-5 text-primary" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                <div className="space-y-6 text-left">
                  <div className="border-l-4 border-primary pl-4 -ml-4">
                    <h4 className="text-xs font-black text-primary uppercase tracking-tighter mb-4">Contact Profile</h4>
                    <div className="space-y-6 text-left">
                      <InfoItem
                        label="Full Name"
                        value={`${customerDetails?.firstName || ''} ${customerDetails?.lastName || ''}`.trim() || customerDetails?.name}
                        icon={User}
                      />
                      <InfoItem label="Email Address" value={customerDetails?.email || order.customerEmail} icon={Mail} />
                      <InfoItem label="Phone Number" value={customerDetails?.phone} icon={Phone} />
                    </div>
                  </div>
                  <div className="border-l-4 border-indigo-500 pl-4 -ml-4">
                    <h4 className="text-xs font-black text-indigo-500 uppercase tracking-tighter mb-4 text-left">Delivery Options</h4>
                    <div className="space-y-6 text-left">
                      <InfoItem label="Delivery Type" value={customerDetails?.deliveryType === 'express' ? 'Ekspres (3 uger)' : 'Normal (6 uger)'} icon={Truck} className="capitalize font-bold text-indigo-600" />
                      <InfoItem label="School Name" value={customerDetails.Skolenavn} icon={School} />
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="border-l-4 border-emerald-500 pl-4 -ml-4">
                    <h4 className="text-xs font-black text-emerald-500 uppercase tracking-tighter mb-4 text-left">Shipping Address</h4>
                    <div className="space-y-6 text-left">
                      <InfoItem label="Address" value={customerDetails?.address} icon={MapPin} />
                      <div className="grid grid-cols-2 gap-4 text-left">
                        <InfoItem label="City" value={customerDetails?.city} />
                        <InfoItem label="Postal Code" value={customerDetails?.postalCode} />
                      </div>
                    </div>
                  </div>
                  {customerDetails?.notes && (
                    <div className="border-l-4 border-amber-500 pl-4 -ml-4">
                      <h4 className="text-xs font-black text-amber-500 uppercase tracking-tighter mb-4 text-left">Order Notes</h4>
                      <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 italic text-gray-700 text-sm leading-relaxed text-left shadow-inner">
                        "{customerDetails.notes}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden rounded-2xl text-left">
            <CardHeader className="border-b bg-gray-50/50 p-6">
              <CardTitle className="text-lg flex items-center font-bold text-gray-800">
                <Settings2 className="mr-2.5 h-5 w-5 text-primary" />
                Customizations
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left mb-8">
                {Object.entries(selectedOptions || {}).map(([key, value]) => {
                  if (typeof value === 'object' && value !== null && !Array.isArray(value)) return null;
                  const displayValue = Array.isArray(value) ? value.join(', ') : value;
                  return (
                    <div key={key} className="flex items-start p-4 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white transition-all group">
                      <div className="ml-4 flex flex-col min-w-0">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest truncate">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <span className="text-sm font-bold text-gray-900 mt-0.5 break-words">
                          {typeof displayValue === 'boolean' ? (displayValue ? 'Yes' : 'No') : displayValue}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              {selectedOptions['Indvendigt foer billede'] && (
                <div className="space-y-4 mb-8 pt-6 border-t border-gray-100">
                  <div className="flex items-center space-x-2 text-primary font-black uppercase tracking-widest text-[10px]">
                    <Package className="h-4 w-4" />
                    <span>Custom Inside Lining (Customer Upload)</span>
                  </div>
                  <div className="relative group max-w-lg overflow-hidden rounded-2xl border-4 border-white shadow-xl ring-1 ring-black/5">
                    <img 
                      src={selectedOptions['Indvendigt foer billede']} 
                      alt="Inside Lining" 
                      className="w-full h-auto object-cover transition-transform group-hover:scale-105 duration-700" 
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Button variant="outline" className="text-white border-white hover:bg-white/20 font-bold" onClick={() => window.open(selectedOptions['Indvendigt foer billede'])}>
                          View Full Image
                       </Button>
                    </div>
                  </div>
                </div>
              )}
              <div className="space-y-4 text-left pt-6 border-t border-gray-100">
                <div className="flex items-center space-x-2 text-gray-400">
                  <Code className="h-4 w-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-left">Meta Registry</span>
                </div>
                <div className="bg-slate-900 rounded-2xl p-6 shadow-inner relative overflow-hidden">
                  <pre className="text-[11px] font-mono text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre-wrap">
                    {JSON.stringify(selectedOptions, null, 2)}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 text-left">
          <Card className="border-none shadow-xl ring-1 ring-black/5 overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 to-primary text-white p-8">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-50">Grand Total</span>
            <div className="mt-4">
              <p className="text-5xl font-black tracking-tighter">
                {new Intl.NumberFormat('da-DK', { style: 'currency', currency: order.currency || 'DKK' }).format(order.totalPrice || 0)}
              </p>
            </div>
            <div className="mt-12 space-y-4">
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
                <span className="text-[10px] font-bold uppercase opacity-50 block mb-1">Package</span>
                <p className="font-black text-xl">{order.packageName || 'Standard'}</p>
              </div>
              <div className="bg-white/10 rounded-2xl p-4 backdrop-blur-sm border border-white/5">
                <span className="text-[10px] font-bold uppercase opacity-50 block mb-1">Program</span>
                <p className="font-black text-lg">{order.program || 'N/A'}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;

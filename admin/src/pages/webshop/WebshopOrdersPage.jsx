import React, { useState, useEffect } from 'react';
import {
  Search, ShoppingBag, Eye, ArrowLeft, Trash2, X, CheckCircle2, Clock, Truck,
  AlertCircle, RefreshCw, Tag, Filter, History, Calendar, CreditCard, Package, User
} from 'lucide-react';
import toast from 'react-hot-toast';
import ConfirmModal from '../../components/common/ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const getImageUrl = (img) => {
  if (!img) return null;
  if (img.startsWith('http://') || img.startsWith('https://') || img.startsWith('data:')) {
    return img;
  }
  const SERVER_URL = API_URL.replace(/\/api\/?$/, '');
  return `${SERVER_URL}${img.startsWith('/') ? '' : '/'}${img}`;
};

const formatDenmarkDateTime = (dateInput, options = {}) => {
  if (!dateInput) return '—';
  try {
    const date = new Date(dateInput);
    if (isNaN(date.getTime())) return '—';

    const locale = options.locale || 'da-DK';
    const timeZone = 'Europe/Copenhagen';

    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone,
      year: 'numeric',
      month: options.monthFormat || 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: options.includeSeconds ? '2-digit' : undefined,
      hour12: false,
    });

    return formatter.format(date);
  } catch (error) {
    console.error('Date formatting error:', error);
    return String(dateInput);
  }
};

const generateOrderTimeline = (order) => {
  if (!order) return [];
  const timeline = [];

  const createdDate = order.orderDate || order.createdAt;

  // 1. Initial Order Creation Event
  timeline.push({
    id: `event-created-${order.id}`,
    timestamp: createdDate,
    type: 'CREATED',
    icon: Package,
    badge: 'Oprettet',
    badgeColor: '#3b82f6',
    title: 'Ordre Modtaget og Oprettet',
    description: `Ordre #${order.orderNumber} blev registreret med en samlet pris på ${order.totalAmount} ${order.currency || 'DKK'}.`,
    details: [
      { label: 'Kunde', value: order.customerDetails?.name || order.customerEmail },
      { label: 'Email', value: order.customerEmail },
      { label: 'Telefon', value: order.customerDetails?.phone || 'N/A' },
      { label: 'Skole', value: order.customerDetails?.school || 'N/A' },
    ],
    performedBy: 'Kunde (Webshop Checkout)',
  });

  // 2. Stripe Payment Confirmed Event
  if (order.paymentStatus === 'PAID') {
    timeline.push({
      id: `event-payment-${order.id}`,
      timestamp: createdDate,
      type: 'PAYMENT',
      icon: CreditCard,
      badge: 'Stripe Betalt',
      badgeColor: '#10b981',
      title: 'Stripe Online Betaling Bekræftet',
      description: `Betaling på ${order.totalAmount} ${order.currency || 'DKK'} er bekræftet og modtaget via Stripe.`,
      details: [
        { label: 'Stripe Session ID', value: order.stripeSessionId || 'N/A' },
        { label: 'Status', value: 'Betalt (PAID)' },
      ],
      performedBy: 'Stripe Gateway',
    });
  }

  // 3. Status History Log (from customerDetails._history)
  const custDetails = order.customerDetails || {};
  if (Array.isArray(custDetails._history)) {
    custDetails._history.forEach((h, idx) => {
      timeline.push({
        id: h.id || `event-hist-${idx}`,
        timestamp: h.timestamp || order.updatedAt,
        type: 'STATUS_CHANGE',
        icon: RefreshCw,
        badge: h.newStatus || 'Statusændring',
        badgeColor: '#8b5cf6',
        title: h.title || `Status ændret til "${h.newStatus}"`,
        description: h.description || `Ordrestatus blev opdateret fra "${h.oldStatus}" til "${h.newStatus}".`,
        performedBy: h.performedBy || 'Admin Webshop Dashboard',
      });
    });
  }

  // 4. Current Status Milestone if not logged in history
  if (order.orderStatus && (!custDetails._history || !custDetails._history.some(h => h.newStatus === order.orderStatus))) {
    timeline.push({
      id: `event-current-${order.id}`,
      timestamp: order.updatedAt || order.createdAt,
      type: 'STATUS_CURRENT',
      icon: CheckCircle2,
      badge: order.orderStatus,
      badgeColor: '#6366f1',
      title: `Nuværende Status: ${order.orderStatus}`,
      description: `Ordrens aktuelle behandlingstatus er sat til "${order.orderStatus}".`,
      performedBy: 'System / Admin',
    });
  }

  // Sort chronological (latest first)
  timeline.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return timeline;
};

const WebshopOrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'primary',
    confirmText: 'Confirm',
    loading: false,
    onConfirm: null,
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [ordRes, stRes] = await Promise.all([
        fetch(`${API_URL}/webshop/admin/orders`),
        fetch(`${API_URL}/webshop/admin/statuses`),
      ]);
      const ordData = await ordRes.json();
      const stData = await stRes.json();

      if (ordData.success) {
        setOrders(ordData.data);
      }
      if (stData.success) {
        setStatuses(stData.data);
      }
    } catch (error) {
      console.error('Error fetching webshop orders and statuses:', error);
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleRequestUpdateStatus = (orderId, orderNumber, newStatus) => {
    const statusObj = statuses.find(
      (s) => (s.slug || s.name || '').toUpperCase() === newStatus.toUpperCase()
    );
    const hasEmail = statusObj && statusObj.emailTemplate && statusObj.emailTemplate.isActive;
    const emailNotice = hasEmail
      ? ` (Attached email "${statusObj.emailTemplate.name}" will be automatically sent to customer)`
      : '';

    setConfirmModal({
      isOpen: true,
      title: 'Update Order Status',
      message: `Are you sure you want to change order #${orderNumber} status to "${newStatus}"?${emailNotice}`,
      type: 'primary',
      confirmText: `Update to ${newStatus}`,
      loading: false,
      onConfirm: () => executeUpdateStatus(orderId, newStatus),
    });
  };

  const executeUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingOrderId(orderId);
      setConfirmModal((prev) => ({ ...prev, loading: true }));
      const res = await fetch(`${API_URL}/webshop/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Order status updated to ${newStatus}`);
        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        fetchData();
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(data.data);
        }
      } else {
        toast.error(data.message || 'Failed to update status');
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      toast.error('Status update failed');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleRequestDeleteOrder = (order) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Order',
      message: `Are you sure you want to delete order #${order.orderNumber}? This action cannot be undone.`,
      type: 'danger',
      confirmText: 'Delete Order',
      loading: false,
      onConfirm: () => executeDeleteOrder(order.id),
    });
  };

  const executeDeleteOrder = async (orderId) => {
    try {
      setConfirmModal((prev) => ({ ...prev, loading: true }));
      const res = await fetch(`${API_URL}/webshop/admin/orders/${orderId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Order deleted successfully');
        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        if (selectedOrder && selectedOrder.id === orderId) {
          setSelectedOrder(null);
        }
        fetchData();
      } else {
        toast.error(data.message || 'Failed to delete order');
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    }
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, selectedStatusFilter, limit]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (order.customerDetails?.name && order.customerDetails.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus =
      selectedStatusFilter === 'all' ||
      (order.orderStatus && order.orderStatus.toLowerCase() === selectedStatusFilter.toLowerCase());

    return matchesSearch && matchesStatus;
  });

  const totalPages = Math.ceil(filteredOrders.length / limit) || 1;
  const paginatedOrders = filteredOrders.slice((page - 1) * limit, page * limit);

  const getStatusBadge = (statusName) => {
    const matched = statuses.find(
      (s) => (s.slug || s.name || '').toUpperCase() === (statusName || '').toUpperCase()
    );
    const color = matched?.color || '#6366f1';

    return (
      <span
        className="inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full border shadow-sm"
        style={{
          backgroundColor: `${color}15`,
          borderColor: `${color}40`,
          color: color,
        }}
      >
        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        {statusName}
      </span>
    );
  };

  // RENDER FULL PAGE ORDER DETAILS VIEW IF AN ORDER IS SELECTED
  if (selectedOrder) {
    const timelineEvents = generateOrderTimeline(selectedOrder);
    const hasCurrentMatch = statuses.some(
      (s) => (s.slug || s.name || '').toUpperCase() === (selectedOrder.orderStatus || '').toUpperCase()
    );
    const matchedStatus = statuses.find(
      (s) => (s.slug || s.name || '').toUpperCase() === (selectedOrder.orderStatus || '').toUpperCase()
    );
    const selectValue = matchedStatus ? (matchedStatus.slug || matchedStatus.name) : selectedOrder.orderStatus;

    return (
      <div className="animate-in fade-in duration-300 max-w-[1400px] mx-auto pb-12 space-y-6">
        {/* Top Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex flex-wrap items-center gap-3 sm:gap-4">
            <button
              onClick={() => setSelectedOrder(null)}
              className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors flex items-center gap-2 text-sm font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Orders</span>
            </button>
            <div className="hidden sm:block h-6 w-px bg-slate-200" />
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 flex flex-wrap items-center gap-2 sm:gap-3">
                Order #{selectedOrder.orderNumber}
                {getStatusBadge(selectedOrder.orderStatus)}
              </h2>
              <p className="text-xs text-slate-500 mt-1 flex items-center gap-1 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>Dansk Tid: {formatDenmarkDateTime(selectedOrder.createdAt, { includeSeconds: true, monthFormat: 'long' })}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => handleRequestDeleteOrder(selectedOrder)}
              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 border border-red-200"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Order</span>
            </button>
          </div>
        </div>

        {/* Change Status Card */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Order Status</h3>
            <p className="text-xs text-slate-500 mt-1">Update current order processing stage & send automated emails</p>
          </div>
          <div className="flex items-center gap-3">
            {updatingOrderId === selectedOrder.id && (
              <RefreshCw className="w-4 h-4 animate-spin text-[#1e3a8a]" />
            )}
            <select
              value={selectValue}
              disabled={updatingOrderId === selectedOrder.id}
              onChange={(e) =>
                handleRequestUpdateStatus(selectedOrder.id, selectedOrder.orderNumber, e.target.value)
              }
              className="px-4 py-2.5 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-[#1e3a8a] bg-slate-50 cursor-pointer"
            >
              {!hasCurrentMatch && (
                <option value={selectedOrder.orderStatus} disabled>
                  Current Status: {selectedOrder.orderStatus}
                </option>
              )}
              {statuses.map((st) => (
                <option key={st.id || st.slug} value={st.slug || st.name}>
                  {st.name} {st.emailTemplate ? '📧' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Customer Information</h3>
            <div className="space-y-2 text-sm">
              <div className="font-bold text-slate-900 text-base">{selectedOrder.customerDetails?.name || 'N/A'}</div>
              <div className="text-slate-600 flex items-center gap-2">
                <span className="font-medium">Email:</span> {selectedOrder.customerEmail}
              </div>
              <div className="text-slate-600 flex items-center gap-2">
                <span className="font-medium">Phone:</span> {selectedOrder.customerDetails?.phone || 'No phone provided'}
              </div>
            </div>
          </div>

          {/* Shipping Address Card */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Shipping Address</h3>
            {selectedOrder.shippingAddress ? (
              <div className="space-y-1 text-sm text-slate-700">
                <div className="font-semibold text-slate-900">{selectedOrder.shippingAddress.address}</div>
                {selectedOrder.shippingAddress.apartment && <div>{selectedOrder.shippingAddress.apartment}</div>}
                <div>
                  {selectedOrder.shippingAddress.zip} {selectedOrder.shippingAddress.city}
                </div>
                <div>{selectedOrder.shippingAddress.country || 'Denmark'}</div>
              </div>
            ) : (
              <div className="text-slate-400 italic text-sm">No shipping address provided</div>
            )}
          </div>
        </div>

        {/* Order Items Table with Product Images */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Order Items</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase border-b border-slate-200">
                <tr>
                  <th className="p-4 w-20">Image</th>
                  <th className="p-4">Product</th>
                  <th className="p-4 text-center">Qty</th>
                  <th className="p-4 text-right">Unit Price</th>
                  <th className="p-4 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {(Array.isArray(selectedOrder.items) ? selectedOrder.items : []).map((item, idx) => {
                  const itemTotal = (parseFloat(item.price) || 0) * (parseInt(item.quantity) || 1);
                  let rawImg = item.image;
                  if (!rawImg && Array.isArray(item.images) && item.images.length > 0) {
                    rawImg = item.images[0];
                  }
                  const displayImg = getImageUrl(rawImg);

                  return (
                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4">
                        {displayImg ? (
                          <img
                            src={displayImg}
                            alt={item.title || 'Product'}
                            className="w-14 h-14 object-cover rounded-lg border border-slate-200 bg-slate-50"
                          />
                        ) : (
                          <div className="w-14 h-14 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] text-slate-400 border border-slate-200 font-medium text-center">
                            No Image
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <div className="font-bold text-slate-900">{item.title || 'Product'}</div>
                        {item.shortDescription && (
                          <div className="text-xs text-slate-500 line-clamp-1 mt-0.5">{item.shortDescription}</div>
                        )}
                      </td>
                      <td className="p-4 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="p-4 text-right text-slate-600">{parseFloat(item.price || 0).toFixed(2)} DKK</td>
                      <td className="p-4 text-right font-bold text-slate-900">{itemTotal.toFixed(2)} DKK</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="p-6 bg-slate-50 border-t border-slate-200 flex items-center justify-between font-bold text-lg text-slate-900">
            <span>Total Amount Paid</span>
            <span className="text-[#1e3a8a]">
              {selectedOrder.totalAmount} {selectedOrder.currency || 'DKK'}
            </span>
          </div>
        </div>

        {/* Order History Timeline Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <History className="w-5 h-5 text-[#1e3a8a]" />
              <div>
                <h3 className="text-base font-bold text-slate-900">Order History & Timeline</h3>
                <p className="text-xs text-slate-500">Chronological audit log with Danish time zone tracking</p>
              </div>
            </div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>Dansk Tid (Europe/Copenhagen)</span>
            </div>
          </div>

          {/* Timeline List */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {timelineEvents.map((event) => {
              const EventIcon = event.icon || Clock;
              return (
                <div key={event.id} className="relative flex items-start gap-4 group">
                  {/* Icon Dot */}
                  <div
                    className="absolute -left-6 top-1 w-5 h-5 rounded-full flex items-center justify-center text-white ring-4 ring-white shadow-sm"
                    style={{ backgroundColor: event.badgeColor || '#3b82f6' }}
                  >
                    <EventIcon className="w-3 h-3" />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex-1 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 text-sm">{event.title}</span>
                        <span
                          className="px-2 py-0.5 rounded text-[10px] font-bold text-white uppercase tracking-wider"
                          style={{ backgroundColor: event.badgeColor || '#3b82f6' }}
                        >
                          {event.badge}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-600 flex items-center gap-1.5 bg-white px-2.5 py-1 rounded border border-slate-200 shadow-2xs">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" />
                        <span>Dansk Tid: {formatDenmarkDateTime(event.timestamp, { includeSeconds: true, monthFormat: 'short' })}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">{event.description}</p>

                    {event.details && event.details.length > 0 && (
                      <div className="flex flex-wrap gap-x-6 gap-y-1 pt-1 text-xs text-slate-500 border-t border-slate-200/60">
                        {event.details.map((d, i) => (
                          <span key={i}>
                            <strong className="text-slate-700 font-semibold">{d.label}:</strong> {d.value}
                          </span>
                        ))}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400 italic pt-1">
                      Udført af: {event.performedBy}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Stripe Metadata */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 font-mono text-xs text-slate-500 flex justify-between items-center">
          <span>Stripe Session ID: {selectedOrder.stripeSessionId || 'N/A'}</span>
          <span>Payment Status: <strong className="text-emerald-600">{selectedOrder.paymentStatus || 'PAID'}</strong></span>
        </div>

        {/* Confirmation Modal */}
        <ConfirmModal
          isOpen={confirmModal.isOpen}
          title={confirmModal.title}
          message={confirmModal.message}
          type={confirmModal.type}
          confirmText={confirmModal.confirmText}
          loading={confirmModal.loading}
          onConfirm={confirmModal.onConfirm}
          onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        />
      </div>
    );
  }

  // ORDERS TABLE LIST VIEW
  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="relative w-full sm:w-[260px]">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search orders or customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-3 py-2 border border-slate-200 rounded text-sm bg-white focus:outline-none focus:border-blue-500 font-medium text-slate-700"
          >
            <option value="all">All Statuses</option>
            {statuses.map((s) => (
              <option key={s.id || s.slug} value={s.slug || s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchData}
          className="flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-700 h-9 w-9 rounded border border-slate-200 transition-colors"
          title="Refresh orders"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded border border-slate-200 overflow-x-auto relative">
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-20">
            <div className="h-full bg-blue-500 animate-pulse w-1/3 rounded-r-full" />
          </div>
        )}

        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#fafafa] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500">Order #</th>
              <th className="px-6 py-4 font-bold text-slate-500">Dansk Tid</th>
              <th className="px-6 py-4 font-bold text-slate-500">Customer</th>
              <th className="px-6 py-4 font-bold text-slate-500">Status</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-right">Total</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.length === 0 && !loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">
                  No webshop orders found.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => {
                const isUpdatingThis = updatingOrderId === order.id;
                const customerName = order.customerDetails?.name || 'Guest Customer';

                const hasCurrentMatch = statuses.some(
                  (s) => (s.slug || s.name || '').toUpperCase() === (order.orderStatus || '').toUpperCase()
                );
                const matchedStatus = statuses.find(
                  (s) => (s.slug || s.name || '').toUpperCase() === (order.orderStatus || '').toUpperCase()
                );
                const selectValue = matchedStatus ? (matchedStatus.slug || matchedStatus.name) : order.orderStatus;

                return (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      {order.orderNumber}
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs font-semibold">
                      {formatDenmarkDateTime(order.createdAt, { includeSeconds: false })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="font-bold text-slate-700">{order.customerEmail}</span>
                        <span className="text-xs text-slate-400">{customerName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {isUpdatingThis ? (
                        <span className="inline-flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Updating...
                        </span>
                      ) : (
                        <div className="flex items-center gap-2">
                          {getStatusBadge(order.orderStatus)}
                          <select
                            value={selectValue}
                            onChange={(e) => handleRequestUpdateStatus(order.id, order.orderNumber, e.target.value)}
                            className="text-xs font-bold py-1 px-2 rounded border border-slate-200 bg-white focus:outline-none cursor-pointer"
                          >
                            {!hasCurrentMatch && (
                              <option value={order.orderStatus} disabled>
                                Current: {order.orderStatus}
                              </option>
                            )}
                            {statuses.map((st) => (
                              <option key={st.id || st.slug} value={st.slug || st.name}>
                                Change to: {st.name} {st.emailTemplate ? '📧' : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-slate-800">
                      {order.totalAmount} {order.currency}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="View Order Details & History"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequestDeleteOrder(order)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="mt-4 px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-sm shrink-0">
        <div className="flex items-center gap-2 text-slate-600">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-white font-bold"
          >
            {[5, 10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="text-slate-500 font-medium">
          {filteredOrders.length > 0 ? (
            <>
              Showing <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * limit, filteredOrders.length)}</span> of{' '}
              <span className="font-bold text-slate-800">{filteredOrders.length}</span> orders
            </>
          ) : (
            'No orders to display'
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, index, array) => {
                const showEllipsis = index > 0 && p - array[index - 1] > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                        page === p
                          ? 'bg-[#1e3a8a] text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default WebshopOrdersPage;

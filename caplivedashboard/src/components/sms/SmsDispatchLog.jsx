import React, { useState, useEffect } from 'react';
import { getSmsMessages, forceSendSmsMessage, deleteSmsMessage, deleteRecipientMessages, updateRecipientPhone, updateSmsMessage } from '../../services/admin.service';
import {  Clock, Send, Search, Filter, RefreshCcw, AlertCircle, CheckCircle, XCircle, Loader2 , ChevronDown, ChevronRight, Trash2, Edit2, X } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import { cn } from '@/lib/utils';
import { toast } from 'react-hot-toast';

const STATUS_ICONS = {
  DELIVERED: <CheckCircle className="h-3 w-3" />,
  SENT: <CheckCircle className="h-3 w-3" />,
  ENROUTE: <Send className="h-3 w-3" />,
  SCHEDULED: <Clock className="h-3 w-3" />,
  PENDING: <RefreshCcw className="h-3 w-3 animate-spin" />,
  REJECTED: <AlertCircle className="h-3 w-3" />,
  UNDELIVERED: <AlertCircle className="h-3 w-3" />,
  UNDELIVERABLE: <AlertCircle className="h-3 w-3" />,
  FAILED: <XCircle className="h-3 w-3" />,
  CANCELLED: <XCircle className="h-3 w-3" />
};

const getStatusBadgeClasses = (status) => {
  switch (status) {
    case 'DELIVERED': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
    case 'SENT': return 'bg-green-50 text-green-600 border-green-200';
    case 'ENROUTE': return 'bg-blue-50 text-blue-600 border-blue-200';
    case 'SCHEDULED': return 'bg-slate-50 text-slate-500 border-slate-200';
    case 'PENDING': return 'bg-yellow-50 text-yellow-600 border-yellow-200';
    case 'REJECTED': 
    case 'UNDELIVERED':
    case 'UNDELIVERABLE':
    case 'FAILED': return 'bg-red-50 text-red-600 border-red-200';
    case 'CANCELLED': return 'bg-gray-50 text-gray-500 border-gray-200';
    default: return 'bg-slate-50 text-slate-500 border-slate-200';
  }
};

export default function SmsDispatchLog({ campaigns }) {
  const [messages, setMessages] = useState([]);
  const [expandedPhone, setExpandedPhone] = useState(null);
  const [loading, setLoading] = useState(true);
  const [forceSendingId, setForceSendingId] = useState(null);
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, msgId: null });
  const [deleteMessageModal, setDeleteMessageModal] = useState({ isOpen: false, msgId: null });
  const [deleteRecipientModal, setDeleteRecipientModal] = useState({ isOpen: false, group: null });
  const [editPhoneModal, setEditPhoneModal] = useState({
    isOpen: false,
    group: null,
    phone: '',
    isSaving: false
  });
  const [editMessageModal, setEditMessageModal] = useState({
    isOpen: false,
    msg: null,
    text: '',
    isSaving: false
  });
  const [deleting, setDeleting] = useState(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filters
  const [filters, setFilters] = useState({
    campaignId: '',
    status: '',
    orderStatus: '',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const loadMessages = async () => {
    setLoading(true);
    try {
      // Remove empty filters
      const cleanFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, v]) => v !== '')
      );
      const data = await getSmsMessages(cleanFilters);
      setMessages(data);
    } catch (e) {
      toast.error('Failed to load dispatch log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMessages();
    setCurrentPage(1);
  }, [filters]);

  const confirmForceSend = async () => {
    const id = confirmModal.msgId;
    if (!id) return;
    
    setForceSendingId(id);
    try {
      await forceSendSmsMessage(id);
      toast.success('Message sent successfully');
      loadMessages();
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to force send message');
    } finally {
      setForceSendingId(null);
      setConfirmModal({ isOpen: false, msgId: null });
    }
  };

  const confirmDeleteSingleMessage = async () => {
    const id = deleteMessageModal.msgId;
    if (!id) return;
    setDeleting(true);
    try {
      await deleteSmsMessage(id);
      toast.success(`Message #${id} deleted`);
      loadMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete message');
    } finally {
      setDeleting(false);
      setDeleteMessageModal({ isOpen: false, msgId: null });
    }
  };

  const confirmDeleteRecipientMessages = async () => {
    const group = deleteRecipientModal.group;
    if (!group) return;
    setDeleting(true);
    try {
      const messageIds = group.msgs.map(m => m.id);
      await deleteRecipientMessages({ messageIds, phone: group.phone, customerId: group.customer?.id });
      toast.success(`Messages deleted for ${group.customer?.name || group.phone}`);
      loadMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete messages');
    } finally {
      setDeleting(false);
      setDeleteRecipientModal({ isOpen: false, group: null });
    }
  };

  const handleSaveRecipientPhone = async (e) => {
    if (e) e.preventDefault();
    if (!editPhoneModal.group) return;
    
    const cleanDigits = editPhoneModal.phone.replace(/\D/g, '');
    
    if (!cleanDigits || cleanDigits.length < 8) {
      toast.error('Please enter a valid phone number (at least 8 digits)');
      return;
    }
    
    setEditPhoneModal(prev => ({ ...prev, isSaving: true }));
    
    try {
      await updateRecipientPhone({
        customerId: editPhoneModal.group.customer?.id,
        phone: editPhoneModal.group.phone,
        newPhone: editPhoneModal.phone.trim()
      });
      toast.success('Phone number updated successfully');
      setEditPhoneModal({ isOpen: false, group: null, phone: '', isSaving: false });
      loadMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update phone number');
      setEditPhoneModal(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleSaveMessage = async (e) => {
    if (e) e.preventDefault();
    if (!editMessageModal.msg) return;

    const trimmed = editMessageModal.text.trim();
    if (!trimmed) {
      toast.error('SMS message cannot be empty');
      return;
    }

    setEditMessageModal(prev => ({ ...prev, isSaving: true }));
    try {
      await updateSmsMessage(editMessageModal.msg.id, { message: trimmed });
      toast.success('SMS message updated successfully');
      setEditMessageModal({ isOpen: false, msg: null, text: '', isSaving: false });
      loadMessages();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update message');
      setEditMessageModal(prev => ({ ...prev, isSaving: false }));
    }
  };

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const formatPhone = (p) => {
    if (!p) return '';
    const clean = p.replace(/\D/g, '');
    if (clean.length === 8) {
      return `+45 ${clean.slice(0, 2)} ${clean.slice(2, 4)} ${clean.slice(4, 6)} ${clean.slice(6, 8)}`;
    }
    if (clean.startsWith('45') && clean.length === 10) {
      const d = clean.slice(2);
      return `+45 ${d.slice(0, 2)} ${d.slice(2, 4)} ${d.slice(4, 6)} ${d.slice(6, 8)}`;
    }
    if (clean.length > 8) {
      return `+${clean}`;
    }
    return p;
  };

  const getGroupKey = (msg) => {
    const clean = (msg.phone || '').replace(/\D/g, '');
    if (clean.length >= 8) {
      return clean.slice(-8); // group by local 8 digits so +45 and non-45 merge
    }
    if (msg.customerId) return `cust_${msg.customerId}`;
    if (msg.customer?.email) return `email_${msg.customer.email}`;
    return msg.phone || `msg_${msg.id}`;
  };

  const grouped = Object.values(
    messages.reduce((acc, msg) => {
      const key = getGroupKey(msg);
      if (!acc[key]) {
        const clean = (msg.phone || '').replace(/\D/g, '');
        const displayPhone = clean.length === 8 ? `45${clean}` : clean || msg.phone;
        acc[key] = { 
          key,
          phone: displayPhone, 
          customer: msg.customer, 
          latestId: msg.id,
          latestCreatedAt: msg.createdAt || msg.scheduledFor,
          msgs: [] 
        };
      } else {
        if (!acc[key].customer && msg.customer) {
          acc[key].customer = msg.customer;
        }
        if (msg.id > acc[key].latestId) {
          acc[key].latestId = msg.id;
          acc[key].latestCreatedAt = msg.createdAt || msg.scheduledFor;
        }
      }
      acc[key].msgs.push(msg);
      return acc;
    }, {})
  )
  .map(group => {
    // Sort chronological: earliest day first inside accordion
    group.msgs.sort((a, b) => new Date(a.scheduledFor) - new Date(b.scheduledFor));
    return group;
  })
  .sort((a, b) => b.latestId - a.latestId); // NEWEST recipients / signups at the TOP!

  const totalItems = grouped.length;
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);
  const paginatedGrouped = grouped.slice(startIndex, startIndex + pageSize);

  return (
    <div className="bg-white border border-slate-200 rounded-lg flex flex-col h-full min-h-[600px] shadow-sm">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-[#fafafa] flex items-center justify-between">
        <h3 className="font-bold text-slate-700 text-base flex items-center gap-2">
          <Send className="h-5 w-5 text-blue-600" /> Advanced Dispatch Log
        </h3>
        <button onClick={loadMessages} className="text-slate-500 hover:text-blue-600 transition-colors" title="Refresh">
          <RefreshCcw className={cn("h-4 w-4", loading && "animate-spin")} />
        </button>
      </div>

      {/* Filters Bar */}
      <div className="p-4 border-b border-slate-100 bg-white grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="relative lg:col-span-2">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input 
            type="text"
            name="search"
            placeholder="Search name or phone..."
            value={filters.search}
            onChange={handleFilterChange}
            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>
        
        <select name="campaignId" value={filters.campaignId} onChange={handleFilterChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-white">
          <option value="">All Campaigns</option>
          {campaigns?.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <select name="status" value={filters.status} onChange={handleFilterChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-white">
          <option value="">All Message Statuses</option>
          <option value="SENT">Sent</option>
          <option value="SCHEDULED">Scheduled</option>
          <option value="PENDING">Pending</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>

        <select name="orderStatus" value={filters.orderStatus} onChange={handleFilterChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-white">
          <option value="">All Order Statuses</option>
          <option value="NOT_CANCELLED">Active/Completed Orders</option>
          <option value="CANCELLED">Cancelled Orders</option>
          <option value="NO_ORDER">No Order Placed</option>
        </select>

        <div className="flex gap-2 lg:col-span-2">
          <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500 text-slate-600" />
          <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} className="w-full px-3 py-2 text-sm border border-slate-200 rounded focus:outline-none focus:border-blue-500 text-slate-600" />
        </div>
      </div>

      {/* Table / List Area */}
      <div className="flex-1 overflow-x-auto relative min-h-[400px]">
        {loading && messages.length === 0 ? (
           <div className="absolute inset-0 flex items-center justify-center bg-white/80 z-10">
             <Loader2 className="h-8 w-8 text-blue-600 animate-spin" />
           </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center mt-12">
            <Filter className="h-12 w-12 mb-3 opacity-20" />
            <p className="text-sm font-bold">No dispatch records found.</p>
            <p className="text-xs mt-1">Try adjusting your filters.</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-200 shadow-sm">
              <tr>
                <th className="px-4 py-3 w-8"></th>
                <th className="px-4 py-3">Recipient</th>
                <th className="px-4 py-3">Campaign</th>
                <th className="px-4 py-3">Order Status</th>
                <th className="px-4 py-3">Message Overview</th>
                <th className="px-4 py-3">Next / Last Date</th>
                <th className="px-4 py-3 min-w-[200px]">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedGrouped.map((group) => {
                const isExpanded = expandedPhone === group.key;
                
                const hasCancelled = group.customer?.orders?.some(o => o.status === 'CANCELLED');
                const hasActiveOrders = group.customer?.orders?.some(o => o.status !== 'CANCELLED');
                const hasOrders = group.customer?.orders?.length > 0;

                // Campaign names in this group
                const campaignNames = Array.from(new Set(group.msgs.map(m => m.enrollment?.campaign?.name).filter(Boolean)));
                const campaignDisplay = campaignNames.length > 0 ? campaignNames.join(', ') : 'Campaign';

                // Message breakdown
                const scheduledCount = group.msgs.filter(m => m.status === 'SCHEDULED' || m.status === 'PENDING').length;
                const sentCount = group.msgs.filter(m => m.status === 'SENT' || m.status === 'DELIVERED').length;
                const cancelledCount = group.msgs.filter(m => m.status === 'CANCELLED').length;
                const failedCount = group.msgs.filter(m => m.status === 'FAILED' || m.status === 'REJECTED' || m.status === 'UNDELIVERED').length;

                // Next scheduled message or latest sent message
                const nextScheduled = group.msgs.find(m => m.status === 'SCHEDULED' || m.status === 'PENDING');
                const latestSent = [...group.msgs].reverse().find(m => m.status === 'SENT' && m.sentAt);
                const displayDateMsg = nextScheduled || latestSent || group.msgs[0];
                
                return (
                  <React.Fragment key={group.key}>
                    <tr 
                      className={cn(
                        "hover:bg-slate-50 transition-colors cursor-pointer",
                        isExpanded && "bg-blue-50/20"
                      )}
                      onClick={() => setExpandedPhone(isExpanded ? null : group.key)}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {isExpanded ? <ChevronDown className="h-4 w-4 text-blue-600" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{group.customer?.name || 'Unknown'}</div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-xs font-mono text-slate-600">{formatPhone(group.phone)}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const raw = group.phone || '';
                              const clean = raw.replace(/\D/g, '');
                              const initial = clean.startsWith('45')
                                ? `+${clean}`
                                : clean.length === 8
                                  ? `+45${clean}`
                                  : raw.startsWith('+')
                                    ? raw
                                    : (clean ? `+${clean}` : '');
                              setEditPhoneModal({
                                isOpen: true,
                                group,
                                phone: initial,
                                isSaving: false
                              });
                            }}
                            title="Edit recipient phone number"
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          >
                            <Edit2 className="h-3 w-3" />
                          </button>
                        </div>
                        {group.customer?.school && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{group.customer.school}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-700 font-medium">
                        <div className="font-semibold text-slate-800">{campaignDisplay}</div>
                        <div className="text-[11px] text-slate-500 font-normal">{group.msgs.length} message{group.msgs.length > 1 ? 's' : ''}</div>
                      </td>
                      <td className="px-4 py-3">
                        {!hasOrders ? (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-slate-200">No Order</span>
                        ) : hasActiveOrders ? (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-emerald-200">Active</span>
                        ) : hasCancelled ? (
                          <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-red-200">Cancelled</span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-slate-200">No Order</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {scheduledCount > 0 && (
                            <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-blue-200">
                              {scheduledCount} Scheduled
                            </span>
                          )}
                          {sentCount > 0 && (
                            <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-emerald-200">
                              {sentCount} Sent
                            </span>
                          )}
                          {cancelledCount > 0 && (
                            <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-slate-200">
                              {cancelledCount} Cancelled
                            </span>
                          )}
                          {failedCount > 0 && (
                            <span className="bg-red-50 text-red-700 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-200">
                              {failedCount} Failed
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {displayDateMsg ? (
                          displayDateMsg.status === 'SENT' && displayDateMsg.sentAt ? (
                            <span>Sent: {new Date(displayDateMsg.sentAt).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          ) : (
                            <span className="text-slate-500">Scheduled: {new Date(displayDateMsg.scheduledFor).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })}</span>
                          )
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-blue-600 font-medium hover:underline cursor-pointer">
                            {isExpanded ? 'Hide messages ▲' : 'View all messages ▼'}
                          </span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteRecipientModal({ isOpen: true, group });
                            }}
                            title="Delete all SMS messages for this recipient (Customer and orders will remain safe)"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors shrink-0"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {isExpanded && group.msgs.map(msg => (
                      <tr key={msg.id} className="bg-slate-50/70 border-t border-slate-100">
                        <td></td>
                        <td className="px-4 py-2.5 border-l-2 border-blue-500">
                          <span className="text-[11px] font-mono text-slate-500">Msg #{msg.id}</span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-600 font-medium text-xs">
                          {msg.enrollment?.campaign?.name || <span className="text-slate-400 italic">Deleted</span>}
                        </td>
                        <td className="px-4 py-2.5"></td>
                        <td className="px-4 py-2.5">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase",
                            getStatusBadgeClasses(msg.status)
                          )}>
                            {STATUS_ICONS[msg.status] || <Clock className="h-3 w-3" />}
                            <span>{msg.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600">
                          {msg.status === 'SENT' && msg.sentAt ? (
                            <span className="text-emerald-700 font-medium">
                              {new Date(msg.sentAt).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          ) : (
                            <span className="text-slate-500" title="Scheduled For">
                              {new Date(msg.scheduledFor).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-xs text-slate-600 max-w-[400px]">
                          <div className="flex items-center justify-between gap-3">
                            <span className="truncate" title={msg.message}>{msg.message}</span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditMessageModal({
                                    isOpen: true,
                                    msg,
                                    text: msg.message,
                                    isSaving: false
                                  });
                                }}
                                title="Edit SMS message"
                                className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              {msg.status !== 'DELIVERED' && (
                                <button
                                  onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, msgId: msg.id }); }}
                                  disabled={forceSendingId === msg.id}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded border border-blue-200 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  {forceSendingId === msg.id ? (
                                    <>
                                      <Loader2 className="h-3 w-3 animate-spin" />
                                      Sending...
                                    </>
                                  ) : (
                                    "Force Send"
                                  )}
                                </button>
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteMessageModal({ isOpen: true, msgId: msg.id });
                                }}
                                title="Delete this SMS message"
                                className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
      {/* Pagination Footer */}
      <div className="px-5 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0 text-sm">
        {/* Entries display limit selector */}
        <div className="flex items-center gap-2 text-slate-600">
          <span>Show</span>
          <select
            value={pageSize}
            onChange={(e) => {
              setPageSize(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-white font-bold"
          >
            {[5, 10, 20, 50, 100].map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
          <span>entries</span>
        </div>

        {/* Showing entries info */}
        <div className="text-slate-500 font-medium">
          {totalItems > 0 ? (
            <>
              Showing <span className="font-bold text-slate-800">{startIndex + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{endIndex}</span> of{' '}
              <span className="font-bold text-slate-800">{totalItems}</span> recipients
            </>
          ) : (
            'No records to display'
          )}
        </div>

        {/* Pagination controls */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          {/* Page numbers list */}
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter(page => {
              return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
            })
            .map((page, index, array) => {
              const showEllipsis = index > 0 && page - array[index - 1] > 1;
              return (
                <React.Fragment key={page}>
                  {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                  <button
                    onClick={() => setCurrentPage(page)}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-bold transition-all",
                      currentPage === page
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Force Send Message"
        message="Are you sure you want to force send this message right now?"
        confirmText="Yes, Send Now"
        onConfirm={confirmForceSend}
        onCancel={() => setConfirmModal({ isOpen: false, msgId: null })}
        isLoading={forceSendingId !== null}
        isDestructive={false}
      />

      {/* Delete Single Message Modal */}
      <ConfirmModal
        isOpen={deleteMessageModal.isOpen}
        title="Delete SMS Message"
        message={`Are you sure you want to delete SMS Msg #${deleteMessageModal.msgId}? Note: The customer record, orders, and active discount codes will remain completely safe and untouched.`}
        confirmText="Yes, Delete Message"
        onConfirm={confirmDeleteSingleMessage}
        onCancel={() => setDeleteMessageModal({ isOpen: false, msgId: null })}
        isLoading={deleting}
        isDestructive={true}
      />

      {/* Delete Recipient Messages Modal */}
      <ConfirmModal
        isOpen={deleteRecipientModal.isOpen}
        title="Delete Recipient SMS Messages"
        message={`Are you sure you want to delete all ${deleteRecipientModal.group?.msgs?.length || ''} SMS message(s) for ${deleteRecipientModal.group?.customer?.name || 'this recipient'} (${formatPhone(deleteRecipientModal.group?.phone)})? Note: The customer record, orders, and active discount codes will NOT be deleted or harmed.`}
        confirmText="Yes, Delete Messages"
        onConfirm={confirmDeleteRecipientMessages}
        onCancel={() => setDeleteRecipientModal({ isOpen: false, group: null })}
        isLoading={deleting}
        isDestructive={true}
      />

      {/* Edit Recipient Phone Modal */}
      {editPhoneModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setEditPhoneModal({ isOpen: false, group: null, phone: '', isSaving: false })}
        >
          <div 
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Edit Phone Number</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  {editPhoneModal.group?.customer?.name || 'Recipient'} &bull; <span className="font-mono">{formatPhone(editPhoneModal.group?.phone)}</span>
                </p>
              </div>
              <button
                onClick={() => setEditPhoneModal({ isOpen: false, group: null, phone: '', isSaving: false })}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRecipientPhone} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  New Phone Number *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={editPhoneModal.phone}
                    onChange={(e) => setEditPhoneModal({ ...editPhoneModal, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-base border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-slate-800 font-semibold tracking-wide"
                    placeholder="+4512345678"
                    required
                    autoFocus
                    disabled={editPhoneModal.isSaving}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
                  Edit recipient phone number for SMS dispatch (e.g. +4561785979). Updates only campaign SMS messages.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditPhoneModal({ isOpen: false, group: null, phone: '', isSaving: false })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={editPhoneModal.isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editPhoneModal.isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editPhoneModal.isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Phone Number'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit SMS Message Modal */}
      {editMessageModal.isOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
          onClick={() => setEditMessageModal({ isOpen: false, msg: null, text: '', isSaving: false })}
        >
          <div 
            className="bg-white rounded-xl shadow-xl border border-slate-200 w-full max-w-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div>
                <h3 className="font-bold text-slate-800 text-base">Edit SMS Message</h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  Msg #{editMessageModal.msg?.id} &bull; <span className="font-mono">{formatPhone(editMessageModal.msg?.phone)}</span>
                </p>
              </div>
              <button
                onClick={() => setEditMessageModal({ isOpen: false, msg: null, text: '', isSaving: false })}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMessage} className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Message Content *
                  </label>
                  <span className="text-[11px] font-mono text-slate-400">
                    {editMessageModal.text.length} chars (approx. {Math.max(1, Math.ceil(editMessageModal.text.length / 160))} SMS)
                  </span>
                </div>
                <textarea
                  rows={5}
                  value={editMessageModal.text}
                  onChange={(e) => setEditMessageModal({ ...editMessageModal, text: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 font-medium leading-relaxed resize-y"
                  placeholder="Enter SMS message text..."
                  required
                  autoFocus
                  disabled={editMessageModal.isSaving}
                />
                <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                  Saved directly to this message. If scheduled or force sent, the updated message text will be dispatched.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditMessageModal({ isOpen: false, msg: null, text: '', isSaving: false })}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                  disabled={editMessageModal.isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editMessageModal.isSaving}
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {editMessageModal.isSaving ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Message'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

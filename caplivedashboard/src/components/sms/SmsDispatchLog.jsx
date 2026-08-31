import React, { useState, useEffect } from 'react';
import { getSmsMessages, forceSendSmsMessage } from '../../services/admin.service';
import {  Clock, Send, Search, Filter, RefreshCcw, AlertCircle, CheckCircle, XCircle, Loader2 , ChevronDown, ChevronRight } from 'lucide-react';
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

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const grouped = Object.values(
    messages.reduce((acc, msg) => {
      if (!acc[msg.phone]) acc[msg.phone] = { phone: msg.phone, customer: msg.customer, msgs: [] };
      acc[msg.phone].msgs.push(msg);
      return acc;
    }, {})
  );

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
        <button onClick={loadMessages} className="text-slate-500 hover:text-blue-600 transition-colors">
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
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 min-w-[200px]">Message Snippet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedGrouped.map((group) => {
                const isExpanded = expandedPhone === group.phone;
                const latestMsg = group.msgs[0]; // Assuming they are sorted or we just take the first
                
                const hasCancelled = group.customer?.orders?.some(o => o.status === 'CANCELLED');
                const hasOrders = group.customer?.orders?.length > 0;
                
                return (
                  <React.Fragment key={group.phone}>
                    <tr 
                      className="hover:bg-slate-50 transition-colors cursor-pointer"
                      onClick={() => setExpandedPhone(isExpanded ? null : group.phone)}
                    >
                      <td className="px-4 py-3 text-slate-400">
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-800">{group.customer?.name || 'Unknown'}</div>
                        <div className="text-xs text-slate-500">{group.phone}</div>
                        {group.customer?.school && <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{group.customer.school}</div>}
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-medium">
                        {group.msgs.length > 1 ? `${group.msgs.length} Messages` : (latestMsg.enrollment?.campaign?.name || <span className="text-slate-400 italic">Deleted</span>)}
                      </td>
                      <td className="px-4 py-3">
                        {!hasOrders ? (
                          <span className="bg-slate-100 text-slate-500 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-slate-200">No Order</span>
                        ) : hasCancelled ? (
                          <span className="bg-red-50 text-red-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-red-200">Cancelled</span>
                        ) : (
                          <span className="bg-green-50 text-green-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase border border-green-200">Active</span>
                        )}
                      </td>
                      <td colSpan={3} className="px-4 py-3 text-xs text-slate-500 italic">
                        Click to view messages
                      </td>
                    </tr>
                    
                    {isExpanded && group.msgs.map(msg => (
                      <tr key={msg.id} className="bg-slate-50/50">
                        <td></td>
                        <td className="px-4 py-2 border-l-2 border-blue-400"></td>
                        <td className="px-4 py-2 text-slate-600 font-medium text-xs">
                          {msg.enrollment?.campaign?.name || <span className="text-slate-400 italic">Deleted</span>}
                        </td>
                        <td className="px-4 py-2"></td>
                        <td className="px-4 py-2">
                          <div className={cn(
                            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded border text-[10px] font-bold uppercase",
                            getStatusBadgeClasses(msg.status)
                          )}>
                            {STATUS_ICONS[msg.status] || <Clock className="h-3 w-3" />}
                            <span>{msg.status}</span>
                          </div>
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500">
                          {msg.status === 'SENT' && msg.sentAt ? (
                            new Date(msg.sentAt).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })
                          ) : (
                            <span className="text-slate-400" title="Scheduled For">
                              {new Date(msg.scheduledFor).toLocaleString('da-DK', { dateStyle: 'short', timeStyle: 'short' })}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-xs text-slate-500 max-w-[300px]">
                          <div className="flex items-center justify-between gap-2">
                            <span className="truncate" title={msg.message}>{msg.message}</span>
                            {(msg.status === 'SCHEDULED' || msg.status === 'PENDING') && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setConfirmModal({ isOpen: true, msgId: msg.id }); }}
                                disabled={forceSendingId === msg.id}
                                className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded border border-blue-200 transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
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
              // Show current, first, last, and pages adjacent to current
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
    </div>
  );
}

import React, { useState } from 'react';
import {
  History, Clock, CheckCircle2, Factory, CreditCard, Tag,
  ChevronDown, ChevronUp, Package, Mail, Sparkles, User,
  Calendar, ShieldCheck, ArrowRight, AlertCircle, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatDenmarkDateTime, getDenmarkDateTimeParts } from '../../utils/dateUtils';

/**
 * Generates structured chronological timeline events from an Order object
 */
export const generateOrderTimeline = (order) => {
  if (!order) return [];

  const timeline = [];

  const safeParse = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const customerDetails = safeParse(order.customerDetails) || {};
  const installmentDetails = safeParse(order.installmentDetails) || {};

  // 1. Initial Order Creation Event
  const createdDate = order.orderDate || order.createdAt;
  timeline.push({
    id: `event-created-${order.id}`,
    timestamp: createdDate,
    type: 'CREATED',
    icon: Package,
    badge: 'Oprettet',
    badgeColor: '#3b82f6', // blue
    title: 'Ordre Modtaget og Oprettet',
    description: `Ordre #${order.orderNumber || order.id} blev registreret med en samlet værdi på ${new Intl.NumberFormat('da-DK', { minimumFractionDigits: 2 }).format(order.totalPrice || 0)} DKK.`,
    details: [
      { label: 'Kunde', value: `${customerDetails.firstName || ''} ${customerDetails.lastName || ''}`.trim() || customerDetails.name || order.customerEmail },
      { label: 'Pakke', value: order.packageName || 'Standard Issue' },
      { label: 'Uddannelse', value: order.program || customerDetails.Skolenavn || 'N/A' },
      { label: 'Levering', value: customerDetails.deliveryType === 'express' ? 'Ekspreslevering (3 uger)' : 'Standardlevering' },
    ],
    performedBy: 'Kunde (Webshop Checkout)',
  });

  // 2. Discount Code Application (if any)
  if (order.discountCode || order.discountAmount > 0) {
    timeline.push({
      id: `event-discount-${order.id}`,
      timestamp: createdDate,
      type: 'DISCOUNT',
      icon: Tag,
      badge: 'Rabatkode',
      badgeColor: '#10b981', // emerald
      title: `Rabatkode Anvendt: ${order.discountCode?.code || 'Kupon'}`,
      description: `Rabat på ${order.discountAmount || 0} DKK blev fratrukket totalbeløbet ved checkout.`,
      details: [
        { label: 'Kode', value: order.discountCode?.code || 'N/A' },
        { label: 'Rabatbeløb', value: `${order.discountAmount} DKK` },
      ],
      performedBy: 'System / Checkout',
    });
  }

  // 3. Installment Plan Events (Deposit and Rates)
  if (installmentDetails && Array.isArray(installmentDetails.installments) && installmentDetails.installments.length > 0) {
    installmentDetails.installments.forEach((inst, index) => {
      if (inst.status === 'Paid') {
        timeline.push({
          id: `event-installment-paid-${index}`,
          timestamp: inst.paidAt || (index === 0 ? createdDate : order.updatedAt),
          type: 'PAYMENT',
          icon: CreditCard,
          badge: index === 0 ? 'Depositum Betalt' : `${inst.label} Betalt`,
          badgeColor: '#059669', // green
          title: `${inst.label || `${index + 1}. Rate`} Betaling Bekræftet`,
          description: `Ratebetaling på ${inst.amount} DKK er modtaget og registreret i afdragsplanen.`,
          details: [
            { label: 'Rate Betegnelse', value: inst.label || `${index + 1}. Rate` },
            { label: 'Beløb', value: `${inst.amount} DKK` },
            { label: 'Status', value: 'Betalt (Paid)' },
          ],
          performedBy: 'Stripe Online Payment',
        });
      } else {
        timeline.push({
          id: `event-installment-pending-${index}`,
          timestamp: inst.dueDate || order.updatedAt,
          isPending: true,
          type: 'SCHEDULED',
          icon: Clock,
          badge: `${inst.label} Afventer`,
          badgeColor: '#f59e0b', // amber
          title: `${inst.label || `${index + 1}. Rate`} Afventer Betaling`,
          description: `Planlagt ratebetaling på ${inst.amount} DKK.`,
          details: [
            { label: 'Forventet beløb', value: `${inst.amount} DKK` },
            { label: 'Status', value: 'Afventer forfaldsdato / trigger' },
          ],
          performedBy: 'Afdragsordning Plan',
        });
      }
    });
  }

  // 4. Production Batch Dispatch
  if (order.productionBatch) {
    const batch = order.productionBatch;
    if (batch.status === 'SENT' && batch.sentAt) {
      timeline.push({
        id: `event-batch-sent-${batch.id}`,
        timestamp: batch.sentAt,
        type: 'PRODUCTION',
        icon: Factory,
        badge: 'Sendt til Fabrik',
        badgeColor: '#d97706', // amber/orange
        title: `Eksporteret til Fabrikken (Batch #${batch.id})`,
        description: `Ordren blev overført til fabrikkens produktionskø og sendt til ${batch.recipientEmail || 'Fabrik'}.`,
        details: [
          { label: 'Batch ID', value: `#${batch.id}` },
          { label: 'Modtager Email', value: batch.recipientEmail || 'N/A' },
          { label: 'Batch Størrelse', value: `${batch.orderCount} ordrer` },
        ],
        performedBy: batch.sentByUser?.name || 'Admin Produktion',
      });
    } else if (batch.createdAt) {
      timeline.push({
        id: `event-batch-draft-${batch.id}`,
        timestamp: batch.createdAt,
        type: 'PRODUCTION_DRAFT',
        icon: Factory,
        badge: 'Tildelt Batch',
        badgeColor: '#6366f1',
        title: `Tildelt Produktionsbatch #${batch.id}`,
        description: `Ordren er inkluderet i batch #${batch.id} (Status: ${batch.status}).`,
        performedBy: 'System / Produktionskø',
      });
    }
  }

  // 5. Explicit Logged History (from customerDetails._history)
  if (Array.isArray(customerDetails._history)) {
    customerDetails._history.forEach((h, idx) => {
      timeline.push({
        id: h.id || `event-hist-${idx}`,
        timestamp: h.timestamp || h.createdAt || order.updatedAt,
        type: h.type || 'LOG',
        icon: h.type === 'STATUS_CHANGE' ? RefreshCw : Sparkles,
        badge: h.oldStatus && h.newStatus ? `${h.oldStatus} ➔ ${h.newStatus}` : (h.badge || 'Statusændring'),
        badgeColor: h.newStatusColor || '#8b5cf6',
        title: h.title || `Status opdateret til "${h.newStatus || 'Ukendt'}"`,
        description: h.description || '',
        details: h.details || [],
        performedBy: h.performedBy || 'Admin',
      });
    });
  }

  // 6. Current Status Milestone (if not in logged history)
  if (order.orderStatus && !customerDetails._history?.some((h) => h.newStatus === order.orderStatus?.name)) {
    timeline.push({
      id: `event-current-status-${order.id}`,
      timestamp: order.updatedAt || order.createdAt,
      type: 'STATUS_CURRENT',
      icon: CheckCircle2,
      badge: order.orderStatus.name,
      badgeColor: order.orderStatus.color || '#6366f1',
      title: `Nuværende Status: ${order.orderStatus.name}`,
      description: `Ordrens aktuelle status er sat til "${order.orderStatus.name}".`,
      details: [
        { label: 'Intern Status', value: order.orderStatus.isInternal ? 'Ja (Kun Admin)' : 'Nej (Kunde Synlig)' },
        { label: 'Produktionssynlig', value: order.orderStatus.isVisibleToProduction ? 'Ja' : 'Nej' },
      ],
      performedBy: 'System / Admin',
    });
  }

  // Sort timeline chronologically (latest events at the top)
  timeline.sort((a, b) => {
    const timeA = new Date(a.timestamp).getTime() || 0;
    const timeB = new Date(b.timestamp).getTime() || 0;
    return timeB - timeA;
  });

  return timeline;
};

const OrderHistoryTimeline = ({ order }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!order) return null;

  const timelineEvents = generateOrderTimeline(order);

  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm transition-all">
      {/* Header Bar with Accordion Toggle */}
      <button
        type="button"
        onClick={() => setIsExpanded((prev) => !prev)}
        className={cn(
          "w-full px-6 py-4.5 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between hover:bg-slate-50 transition-colors text-left",
          isExpanded && "border-b border-slate-200/80"
        )}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0 border border-blue-100 shadow-2xs">
            <History className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h3 className="text-sm md:text-base font-black text-slate-900 tracking-tight">
                Order History & Event Timeline
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                {timelineEvents.length} Events
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400" />
              <span>Dansk Tid / Europe (Copenhagen Timezone • CET/CEST)</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-bold text-slate-500 hidden sm:inline">
            {isExpanded ? 'Collapse' : 'Expand Timeline'}
          </span>
          <div className="p-1.5 rounded-md bg-slate-100 text-slate-600 hover:bg-slate-200 transition-colors">
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {/* Expandable Timeline Content */}
      {isExpanded && (
        <div className="p-6 md:p-8 animate-in fade-in duration-300">
          {/* Timezone Info Banner */}
          <div className="mb-6 p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center justify-between text-xs text-blue-900 font-medium">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-blue-600 shrink-0" />
              <span>
                Alle tidspunkter vises i <strong>dansk europæisk tidszone (Europe/Copenhagen)</strong> med 24-timers tidsformat.
              </span>
            </div>
            <span className="text-[11px] font-mono font-bold text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded shrink-0 hidden sm:inline">
              UTC+1 / UTC+2 (CET/CEST)
            </span>
          </div>

          {/* Vertical Timeline Stream */}
          <div className="relative pl-6 md:pl-8 space-y-8 before:absolute before:left-[11px] md:before:left-[15px] before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
            {timelineEvents.map((item, idx) => {
              const dt = getDenmarkDateTimeParts(item.timestamp);
              const Icon = item.icon || Clock;

              return (
                <div key={item.id || idx} className="relative group">
                  {/* Timeline Dot / Icon */}
                  <div
                    className={cn(
                      'absolute -left-[23px] md:-left-[27px] top-1.5 h-6 w-6 md:h-7 md:w-7 rounded-full flex items-center justify-center text-white shadow-md ring-4 ring-white transition-transform group-hover:scale-110 shrink-0',
                      item.isPending ? 'bg-amber-400' : 'bg-slate-800'
                    )}
                    style={{
                      backgroundColor: item.badgeColor || undefined,
                    }}
                  >
                    <Icon className="h-3.5 w-3.5 md:h-4 md:w-4" />
                  </div>

                  {/* Event Card */}
                  <div className="bg-[#fafafa] hover:bg-slate-50 border border-slate-200/90 rounded-xl p-4.5 transition-all hover:border-slate-300 shadow-2xs space-y-2.5">
                    
                    {/* Event Header: Badge, Date & Time */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shadow-2xs text-white"
                          style={{ backgroundColor: item.badgeColor || '#3b82f6' }}
                        >
                          {item.badge}
                        </span>
                        <h4 className="text-sm font-black text-slate-900 tracking-tight">
                          {item.title}
                        </h4>
                      </div>

                      {/* Danish European DateTime Stamp */}
                      <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{dt.date}</span>
                        <span className="text-slate-300">•</span>
                        <Clock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                        <span className="text-blue-700">{dt.time}</span>
                        <span className="text-[10px] text-slate-400 font-sans font-medium">({dt.relative})</span>
                      </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-slate-700 leading-relaxed font-medium">
                        {item.description}
                      </p>
                    )}

                    {/* Additional Metadata / Key-Value Details */}
                    {item.details && item.details.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 pt-2 border-t border-slate-200/60">
                        {item.details.map((d, dIdx) => (
                          <div key={dIdx} className="flex flex-col bg-white p-2 rounded border border-slate-100">
                            <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                              {d.label}
                            </span>
                            <span className="text-xs font-bold text-slate-800 truncate" title={String(d.value)}>
                              {String(d.value)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Footer: Performed By */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <User className="h-3 w-3 text-slate-400" />
                        Udført af: <strong className="text-slate-600">{item.performedBy || 'System'}</strong>
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Dansk Tid (Copenhagen)
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderHistoryTimeline;

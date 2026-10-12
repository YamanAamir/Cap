// @studentlife/tracking
import { io } from 'socket.io-client';

// Helper to generate a UUID (fallback for crypto.randomUUID if needed, though modern browsers support it)
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

let cachedVisitorId = null;

export const setVisitorId = (newVisitorId) => {
  if (!newVisitorId || typeof newVisitorId !== 'string') return;
  const cookieName = 'studentlife_visitor_id';
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 2);
  const domainString = window.location.hostname.includes('studentlife.dk') 
    ? '; domain=.studentlife.dk' 
    : '';
  const isSecure = window.location.protocol === 'https:' ? '; Secure' : '';

  document.cookie = `${cookieName}=${newVisitorId}; expires=${expires.toUTCString()}${domainString}; path=/; SameSite=Lax${isSecure}`;
  
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('studentlife_session_active');
  }

  const prevId = cachedVisitorId;
  cachedVisitorId = newVisitorId;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('studentlife:visitor_changed', {
      detail: { visitorId: newVisitorId, previousVisitorId: prevId }
    }));
  }

  return newVisitorId;
};

export const resetVisitorSession = () => {
  const newId = generateUUID();
  return setVisitorId(newId);
};

export const getOrCreateVisitorId = () => {
  const cookieName = 'studentlife_visitor_id';
  const match = typeof document !== 'undefined' ? document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)')) : null;
  
  let currentId = null;
  if (match) {
    currentId = match[2];
  } else {
    currentId = generateUUID();
    
    // Set cookie for 2 years
    const expires = new Date();
    expires.setFullYear(expires.getFullYear() + 2);
    
    // Determine domain. Use .studentlife.dk for production, omit domain for localhost
    const domainString = typeof window !== 'undefined' && window.location.hostname.includes('studentlife.dk') 
      ? '; domain=.studentlife.dk' 
      : '';
      
    const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:' ? '; Secure' : '';

    if (typeof document !== 'undefined') {
      document.cookie = `${cookieName}=${currentId}; expires=${expires.toUTCString()}${domainString}; path=/; SameSite=Lax${isSecure}`;
    }
  }

  // Detect runtime visitor ID transition
  if (cachedVisitorId && cachedVisitorId !== currentId && typeof window !== 'undefined') {
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('studentlife_session_active');
    }
    window.dispatchEvent(new CustomEvent('studentlife:visitor_changed', {
      detail: { visitorId: currentId, previousVisitorId: cachedVisitorId }
    }));
  }

  cachedVisitorId = currentId;
  return currentId;
};

// This needs to be configured based on the environment
export const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TRACKING_API_BASE) {
    return import.meta.env.VITE_TRACKING_API_BASE;
  }
  return 'http://localhost:3000'; // Default backend dev port
};

// --- WebSocket Tracking Client & In-Memory Queue ---
let trackingSocket = null;
let eventQueue = [];

const flushEventQueue = () => {
  if (!trackingSocket || !trackingSocket.connected || eventQueue.length === 0) return;
  const toFlush = [...eventQueue];
  eventQueue = [];

  toFlush.forEach(({ type, payload }) => {
    if (type === 'visitor:identify') {
      trackingSocket.emit('visitor:identify', payload);
    } else if (type === 'events:track') {
      trackingSocket.emit('events:track', payload);
    }
  });
};

export const getTrackingSocket = () => {
  if (typeof window === 'undefined') return null;
  if (!trackingSocket) {
    const url = getApiBaseUrl();
    trackingSocket = io(url, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling'],
    });

    trackingSocket.on('connect', () => {
      console.log('[Tracking] WebSocket connected:', trackingSocket.id);
      flushEventQueue();
    });

    trackingSocket.on('connect_error', (err) => {
      console.warn('[Tracking] WebSocket connection error:', err.message);
    });

    trackingSocket.on('disconnect', (reason) => {
      console.log('[Tracking] WebSocket disconnected:', reason);
    });
  }
  return trackingSocket;
};

// Automatically initiate socket connection early
if (typeof window !== 'undefined') {
  getTrackingSocket();
}

export const identifyVisitor = async (productInterest, sourceApp, options = {}) => {
  const visitorId = getOrCreateVisitorId();
  const { school, educationType, graduationYear, package: selectedPackage, packageName, pakke } = options;
  const packageVal = selectedPackage || packageName || pakke;
  
  // Check session storage to avoid double counting visits on page reloads
  let newSession = false;
  if (!sessionStorage.getItem('studentlife_session_active')) {
    sessionStorage.setItem('studentlife_session_active', 'true');
    newSession = true;
  }

  const payload = {
    visitorId,
    productInterest,
    sourceApp,
    newSession,
    school,
    educationType,
    graduationYear,
    package: packageVal,
    ...options
  };

  const socket = getTrackingSocket();
  if (socket && socket.connected) {
    socket.emit('visitor:identify', payload);
    return;
  }

  // If socket is connecting, enqueue the identification
  if (socket) {
    eventQueue.push({ type: 'visitor:identify', payload });
    return;
  }

  // Fallback to HTTP fetch if socket is not available
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/visitor/identify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      console.error('Failed to identify visitor', await response.text());
    }
  } catch (error) {
    console.error('Tracking API error:', error);
  }
};

export const pushEvent = (eventName, params = {}, sourceApp = '') => {
  const visitorId = getOrCreateVisitorId();

  // Event name aliases mapping
  const eventAliasMap = {
    'configurator_started': 'view_item',
    'checkout_started': 'begin_checkout',
    'purchase_completed': 'purchase'
  };

  const canonicalEvent = eventAliasMap[eventName] || eventName;

  // 1. Push to dataLayer for GTM & TikTok Pixel
  window.dataLayer = window.dataLayer || [];

  const ecomEvents = ['view_item', 'add_to_cart', 'begin_checkout', 'purchase'];

  if (ecomEvents.includes(canonicalEvent)) {
    // Clear previous ecommerce object per Google Tag Manager best practice
    window.dataLayer.push({ ecommerce: null });

    const items = params.items && params.items.length > 0 ? params.items : [{
      item_id: params.package || params.item_id || 'student_cap',
      item_name: params.item_name || `Studenterhue (${params.package || 'Standard'})`,
      price: params.value || params.price || 0,
      quantity: params.quantity || 1
    }];

    const currency = params.currency || 'DKK';
    const value = params.value || 0;

    const ecomData = {
      event: canonicalEvent,
      ecommerce: {
        currency: currency,
        value: value,
        transaction_id: params.transaction_id || params.order_ref || undefined,
        items: items
      },
      ...params
    };

    window.dataLayer.push(ecomData);

    // Also push direct TikTok / Meta Pixel Event Aliases to dataLayer
    const tikTokEventMap = {
      'view_item': 'ViewContent',
      'add_to_cart': 'AddToCart',
      'begin_checkout': 'InitiateCheckout',
      'purchase': 'Purchase'
    };

    if (tikTokEventMap[canonicalEvent]) {
      window.dataLayer.push({
        event: tikTokEventMap[canonicalEvent],
        content_type: 'product',
        content_name: items[0]?.item_name || 'Studenterhue',
        content_id: items[0]?.item_id || 'student_cap',
        value: value,
        currency: currency,
        quantity: items[0]?.quantity || 1,
        items: items,
        ...ecomData
      });
    }
  } else {
    window.dataLayer.push({
      event: eventName,
      ...params
    });
  }

  // 2. Send to GA4 / Google Ads when available
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...params,
      event_category: sourceApp || 'website'
    });
  }

  // 3. Push to Backend via WebSocket (reduces HTTP hits)
  const payload = {
    visitorId,
    eventName,
    eventParams: params,
    sourceApp
  };

  const socket = getTrackingSocket();
  if (socket && socket.connected) {
    socket.emit('events:track', payload);
    return;
  }

  // If socket is connecting, buffer the event
  if (socket) {
    eventQueue.push({ type: 'events:track', payload });
    return;
  }

  // Fallback to HTTP fetch if socket is unavailable
  try {
    fetch(`${getApiBaseUrl()}/api/events/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      keepalive: true,
      body: JSON.stringify(payload)
    }).catch(err => console.error('Tracking API keepalive error:', err));
  } catch (e) {
    console.error('Tracking API error:', e);
  }
};

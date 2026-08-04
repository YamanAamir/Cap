// @studentlife/tracking

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

export const getOrCreateVisitorId = () => {
  const cookieName = 'studentlife_visitor_id';
  const match = document.cookie.match(new RegExp('(^| )' + cookieName + '=([^;]+)'));
  
  if (match) {
    return match[2];
  }

  const newVisitorId = generateUUID();
  
  // Set cookie for 2 years
  const expires = new Date();
  expires.setFullYear(expires.getFullYear() + 2);
  
  // Determine domain. Use .studentlife.dk for production, omit domain for localhost
  const domainString = window.location.hostname.includes('studentlife.dk') 
    ? '; domain=.studentlife.dk' 
    : '';

  document.cookie = `${cookieName}=${newVisitorId}; expires=${expires.toUTCString()}${domainString}; path=/; SameSite=Lax; Secure`;
  
  return newVisitorId;
};

// This needs to be configured based on the environment
export const getApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_TRACKING_API_BASE) {
    return import.meta.env.VITE_TRACKING_API_BASE;
  }
  return 'http://localhost:3000'; // Default backend dev port
};

export const identifyVisitor = async (productInterest, sourceApp, options = {}) => {
  const visitorId = getOrCreateVisitorId();
  const { school, educationType, graduationYear } = options;
  
  // Check session storage to avoid double counting visits on page reloads
  let newSession = false;
  if (!sessionStorage.getItem('studentlife_session_active')) {
    sessionStorage.setItem('studentlife_session_active', 'true');
    newSession = true;
  }

  try {
    const response = await fetch(`${getApiBaseUrl()}/api/visitor/identify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId,
        productInterest,
        sourceApp,
        newSession,
        school,
        educationType,
        graduationYear
      })
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

  // 1. Push to dataLayer for GTM
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: eventName,
    ...params
  });

  // 2. Send to GA4 / Google Ads when available
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, {
      ...params,
      event_category: sourceApp || 'website'
    });
  }

  // 3. Push to our Backend via Keepalive fetch
  try {
    fetch(`${getApiBaseUrl()}/api/events/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId,
        eventName,
        eventParams: params,
        sourceApp
      })
    }).catch(err => console.error('Tracking API keepalive error:', err));
  } catch (e) {
    console.error('Tracking API error:', e);
  }
};

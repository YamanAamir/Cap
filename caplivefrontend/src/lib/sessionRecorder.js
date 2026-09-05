import * as rrweb from 'rrweb';
import { getOrCreateVisitorId, getApiBaseUrl } from './tracking';

let events = [];
let stopRecording = null;
let sessionStartTime = Date.now();
let recordingId = null;
const FLUSH_INTERVAL = 10000; // 10 seconds
let isFlushing = false;

const flushEvents = async () => {
  if (events.length === 0 || isFlushing) return;
  isFlushing = true;

  const eventsToSend = [...events];
  events = []; // Clear immediately to prevent infinite growth on failure

  const visitorId = getOrCreateVisitorId();
  const duration = Date.now() - sessionStartTime;
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/recordings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recordingId,
        visitorId,
        events: eventsToSend,
        duration,
        pageUrl: window.location.href,
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data.id) recordingId = data.id;
    } else {
      console.error('Failed to save session recording', await response.text());
    }
  } catch (error) {
    console.error('Recording API error:', error);
  } finally {
    isFlushing = false;
  }
};

export const startRecording = () => {
  // Session recording temporarily disabled
  return;
  
  /*
  if (stopRecording) return; // Already recording

  const isMobile = typeof window !== 'undefined' && (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || window.innerWidth < 768);

  try {
    stopRecording = rrweb.record({
      emit(event) {
        // Prevent unbounded memory accumulation on mobile
        if (events.length > 400) {
          events.splice(0, 100);
        }
        events.push(event);
      },
      inlineStylesheet: !isMobile,
      recordCanvas: false,
      collectFonts: false,
      sampling: {
        mousemove: isMobile ? false : 50,
        mouseInteraction: {
          MouseUp: false,
          MouseDown: false,
          Click: true,
          ContextMenu: false,
          DblClick: false,
          Focus: false,
          Blur: false,
          TouchStart: false,
          TouchEnd: false,
        },
        scroll: 300,
        input: 'last',
      },
    });

    // Flush events periodically
    setInterval(flushEvents, FLUSH_INTERVAL);

    // Attempt to flush remaining events when user leaves the page
    window.addEventListener('beforeunload', () => {
      flushEvents();
    });
  } catch (err) {
    console.warn('Session recording could not start:', err);
  }
  */
};

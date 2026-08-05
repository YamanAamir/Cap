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
  if (stopRecording) return; // Already recording

  stopRecording = rrweb.record({
    emit(event) {
      events.push(event);
    },
    inlineStylesheet: true,
    keepIframeSrcFn: (src) => {
      // Keep PlayCanvas iframe src so the 3D model loads in the replay
      if (typeof src === 'string' && src.includes('playcanv.as')) {
        return true;
      }
      return false;
    }
  });

  // Flush events periodically
  setInterval(flushEvents, FLUSH_INTERVAL);

  // Attempt to flush remaining events when user leaves the page
  window.addEventListener('beforeunload', () => {
    flushEvents();
  });
};

import * as rrweb from 'rrweb';
import { getOrCreateVisitorId, getApiBaseUrl } from './tracking';

let events = [];
let stopRecording = null;
let lastFlushTime = Date.now();
const FLUSH_INTERVAL = 10000; // 10 seconds
const FLUSH_LIMIT = 50; // Max events before flush

const flushEvents = async () => {
  if (events.length === 0) return;

  const eventsToSend = [...events];
  events = []; // Clear current buffer
  
  const visitorId = getOrCreateVisitorId();
  const duration = Date.now() - lastFlushTime;
  lastFlushTime = Date.now();
  
  try {
    const response = await fetch(`${getApiBaseUrl()}/api/recordings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        visitorId,
        events: eventsToSend,
        duration,
        pageUrl: window.location.href,
      }),
      keepalive: true, // Important for page unloads
    });

    if (!response.ok) {
      console.error('Failed to save session recording', await response.text());
    }
  } catch (error) {
    console.error('Recording API error:', error);
  }
};

export const startRecording = () => {
  if (stopRecording) return; // Already recording

  stopRecording = rrweb.record({
    emit(event) {
      events.push(event);
      if (events.length >= FLUSH_LIMIT) {
        flushEvents();
      }
    },
  });

  // Flush events periodically
  setInterval(flushEvents, FLUSH_INTERVAL);

  // Attempt to flush remaining events when user leaves the page
  window.addEventListener('beforeunload', () => {
    flushEvents();
  });
};

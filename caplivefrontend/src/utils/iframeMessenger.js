/**
 * Centralized iframe message dispatcher.
 * Ensures desktop messages go ONLY to the desktop iframe ('preview-iframe'),
 * and mobile messages go ONLY to the mobile iframe ('preview-iframe2').
 */

export function isDesktopDevice() {
  if (typeof window === 'undefined') return true;
  return window.innerWidth >= 768;
}

export function getActiveIframeId() {
  return isDesktopDevice() ? 'preview-iframe' : 'preview-iframe2';
}

export function getActiveIframe() {
  if (typeof document === 'undefined') return null;

  const primaryId = getActiveIframeId();
  const primaryIframe = document.getElementById(primaryId);
  if (primaryIframe?.contentWindow) {
    return primaryIframe;
  }

  // Fallback check
  const desktopIframe = document.getElementById('preview-iframe');
  const mobileIframe = document.getElementById('preview-iframe2');
  if (isDesktopDevice() && desktopIframe?.contentWindow) return desktopIframe;
  if (!isDesktopDevice() && mobileIframe?.contentWindow) return mobileIframe;

  return desktopIframe || mobileIframe || null;
}

export function sendToActiveIframe(message) {
  if (!message) return;
  const iframe = getActiveIframe();
  if (iframe?.contentWindow) {
    try {
      iframe.contentWindow.postMessage(message, '*');
    } catch (e) {
      console.warn('postMessage error:', e);
    }
  }
}

export function sendToTargetIframe(targetId, message) {
  if (!message || !targetId || typeof document === 'undefined') return;
  const iframe = document.getElementById(targetId);
  if (iframe?.contentWindow) {
    try {
      iframe.contentWindow.postMessage(message, '*');
    } catch (e) {
      console.warn('postMessage error to ' + targetId + ':', e);
    }
  }
}

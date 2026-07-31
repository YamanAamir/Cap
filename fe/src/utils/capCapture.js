const IFRAME_IDS = ['preview-iframe', 'preview-iframe2'];

const compressImage = (base64Str, maxWidth = 800, quality = 0.7) => {
  return new Promise((resolve) => {
    if (!base64Str) return resolve(null);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }
      
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      // White background for JPEG
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
};

const getActiveIframe = () => {
  for (const id of IFRAME_IDS) {
    const el = document.getElementById(id);
    if (el?.contentWindow && el.offsetParent !== null) return el;
  }
  return IFRAME_IDS.map((id) => document.getElementById(id)).find(Boolean) || null;
};

const postToIframe = (message) => {
  IFRAME_IDS.forEach((id) => {
    const iframe = document.getElementById(id);
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(message, '*');
    }
  });
};

/**
 * Capture all production views from the PlayCanvas preview iframe.
 * Sends 'SCREENSHOTS' and waits for { type: 'MODEL_SCREENSHOTS', screenshots: { front, back, top, bottom, left, right } }
 */
export async function captureCapViews({ timeoutMs = 15000 } = {}) {
  const iframe = getActiveIframe();
  if (!iframe?.contentWindow) {
    console.warn('[capCapture] No preview iframe found');
    return null;
  }

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      window.removeEventListener('message', handler);
      reject(new Error('Timeout waiting for PlayCanvas SCREENSHOTS'));
    }, timeoutMs);

    const handler = (event) => {
      let data = event.data;
      
      // Sometimes playcanvas sends JSON as string
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch (e) {
          // ignore non-json strings
        }
      }

      if (data && data.type === 'MODEL_SCREENSHOTS' && data.screenshots) {
        clearTimeout(timer);
        window.removeEventListener('message', handler);
        
        // Pick only front, back, top, bottom (exclude left and right)
        const { front, back, top, bottom } = data.screenshots;
        
        Promise.all([
          compressImage(front),
          compressImage(back),
          compressImage(top),
          compressImage(bottom)
        ]).then(([cFront, cBack, cTop, cBottom]) => {
          const result = {};
          if (cFront) result.front = cFront;
          if (cBack) result.back = cBack;
          if (cTop) result.top = cTop;
          if (cBottom) result.bottom = cBottom;
          
          resolve(result);
        });
      }
    };

    window.addEventListener('message', handler);
    
    // Trigger the capture in PlayCanvas
    postToIframe('SCREENSHOTS');
  });
}

export default captureCapViews;

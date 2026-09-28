import { getActiveIframe, sendToActiveIframe } from './iframeMessenger';

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

const postToIframe = (message) => {
  sendToActiveIframe(message);
};

const downloadBase64Image = (dataUrl, filename) => {
  if (!dataUrl) return;
  try {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (err) {
    console.error('[capCapture] Failed to download image:', err);
  }
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
          
          // Auto-download pictures in browser for temporary testing
          const timestamp = Date.now();
          const itemsToDownload = [
            { url: cFront || front, name: `cap_front_${timestamp}.jpg` },
            { url: cBack || back, name: `cap_back_${timestamp}.jpg` },
            { url: cTop || top, name: `cap_top_${timestamp}.jpg` },
            { url: cBottom || bottom, name: `cap_bottom_${timestamp}.jpg` },
          ];

          itemsToDownload.forEach((item, index) => {
            if (item.url) {
              setTimeout(() => {
                downloadBase64Image(item.url, item.name);
              }, index * 300);
            }
          });

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

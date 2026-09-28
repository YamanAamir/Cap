const IFRAME_IDS = ['preview-iframe', 'preview-iframe2'];

const compressImage = (base64Str, maxWidth = 1920, quality = 0.95) => {
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
          compressImage(front, 1920, 0.95),
          compressImage(back, 1920, 0.95),
          compressImage(top, 1920, 0.95),
          compressImage(bottom, 1920, 0.95)
        ]).then(([cFront, cBack, cTop, cBottom]) => {
          const result = {};
          if (cFront) result.front = cFront;
          if (cBack) result.back = cBack;
          if (cTop) result.top = cTop;
          if (cBottom) result.bottom = cBottom;
          
          // Auto-download Full HD pictures in browser
          const timestamp = Date.now();
          const itemsToDownload = [
            { url: front || cFront, name: `cap_front_fullhd_${timestamp}.jpg` },
            { url: back || cBack, name: `cap_back_fullhd_${timestamp}.jpg` },
            { url: top || cTop, name: `cap_top_fullhd_${timestamp}.jpg` },
            { url: bottom || cBottom, name: `cap_bottom_fullhd_${timestamp}.jpg` },
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

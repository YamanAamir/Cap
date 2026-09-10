import JSZip from 'jszip';

/**
 * Extracts all valid render and uploaded images from an order object.
 * Returns an array of image items with metadata.
 */
export const extractOrderImages = (order) => {
  if (!order) return [];
  const images = [];

  const safeParseJSON = (data) => {
    if (!data) return null;
    if (typeof data === 'object') return data;
    try {
      return JSON.parse(data);
    } catch {
      return null;
    }
  };

  const capImagesObj = safeParseJSON(order.capImages);
  const selectedOptionsObj = safeParseJSON(order.selectedOptions);

  const angleLabels = {
    front: 'Front Angle',
    back: 'Rear Angle',
    top: 'Top View',
    bottom: 'Underbrim View',
    left: 'Left View',
    right: 'Right View',
    inside: 'Inside View',
    lining: 'Lining View',
    mockup: '3D Mockup',
    render: 'Render View',
  };

  // 1. Process capImages (3D rendered views)
  if (capImagesObj && typeof capImagesObj === 'object') {
    Object.entries(capImagesObj).forEach(([key, val]) => {
      if (typeof val === 'string' && (val.startsWith('data:image') || val.startsWith('http://') || val.startsWith('https://') || val.startsWith('/'))) {
        const cleanKey = key.toLowerCase().trim();
        images.push({
          id: `order-${order.id}-cap-${cleanKey}`,
          category: 'render',
          key: cleanKey,
          label: angleLabels[cleanKey] || `${cleanKey.charAt(0).toUpperCase() + cleanKey.slice(1)} View`,
          src: val,
          orderId: order.id,
          orderNumber: order.orderNumber || String(order.id),
        });
      }
    });
  }

  // 2. Process selectedOptions for custom uploaded artwork / lining / logos
  if (selectedOptionsObj && typeof selectedOptionsObj === 'object') {
    // Check specific lining image
    const liningVal =
      selectedOptionsObj?.FOER?.['Indvendigt foer billede']?.[0]?.url ||
      selectedOptionsObj?.FOER?.['Indvendigt foer billede'] ||
      (typeof selectedOptionsObj?.FOER === 'object' &&
        Object.values(selectedOptionsObj.FOER).find(v => typeof v === 'string' && v.startsWith('data:image')));

    if (typeof liningVal === 'string' && (liningVal.startsWith('data:image') || liningVal.startsWith('http') || liningVal.startsWith('/'))) {
      if (!images.some(img => img.src === liningVal)) {
        images.push({
          id: `order-${order.id}-lining`,
          category: 'upload',
          key: 'custom_lining',
          label: 'Custom Inside Lining',
          src: liningVal,
          orderId: order.id,
          orderNumber: order.orderNumber || String(order.id),
        });
      }
    }

    // Recursive search for any other custom uploaded files / logos in options
    const scanForUploads = (obj, path = '') => {
      if (!obj) return;
      if (typeof obj === 'string') {
        const isImage = obj.startsWith('data:image') || /\.(png|jpe?g|webp|gif|svg)($|\?)/i.test(obj);
        if (isImage && !images.some(img => img.src === obj)) {
          images.push({
            id: `order-${order.id}-upload-${images.length}`,
            category: 'upload',
            key: path.toLowerCase().replace(/[^a-z0-9]/g, '_') || 'attachment',
            label: path || 'Custom Attachment',
            src: obj,
            orderId: order.id,
            orderNumber: order.orderNumber || String(order.id),
          });
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, idx) => scanForUploads(item, path ? `${path} #${idx + 1}` : `Item #${idx + 1}`));
      } else if (typeof obj === 'object') {
        Object.entries(obj).forEach(([k, v]) => {
          if (['id', 'color', 'price', 'name', 'label', 'description'].includes(k)) return;
          scanForUploads(v, path ? `${path} > ${k}` : k);
        });
      }
    };

    scanForUploads(selectedOptionsObj);
  }

  return images;
};

/**
 * Converts a data URL or remote URL to Blob
 */
export const urlToBlob = async (url) => {
  if (url.startsWith('data:image')) {
    const parts = url.split(';base64,');
    const contentType = parts[0].split(':')[1] || 'image/png';
    const raw = window.atob(parts[1]);
    const rawLength = raw.length;
    const uInt8Array = new Uint8Array(rawLength);
    for (let i = 0; i < rawLength; ++i) {
      uInt8Array[i] = raw.charCodeAt(i);
    }
    return new Blob([uInt8Array], { type: contentType });
  }

  const response = await fetch(url, { mode: 'cors' });
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  return await response.blob();
};

/**
 * Get file extension from image source or MIME type
 */
export const getImageExtension = (src) => {
  if (src.startsWith('data:image/jpeg') || src.startsWith('data:image/jpg')) return 'jpg';
  if (src.startsWith('data:image/png')) return 'png';
  if (src.startsWith('data:image/webp')) return 'webp';
  if (src.startsWith('data:image/svg')) return 'svg';
  if (src.startsWith('data:image/gif')) return 'gif';

  const match = src.match(/\.(png|jpe?g|webp|svg|gif)($|\?)/i);
  if (match) return match[1].toLowerCase().replace('jpeg', 'jpg');
  return 'png';
};

/**
 * Download a single image client-side
 */
export const downloadSingleImage = async (image, order) => {
  const ext = getImageExtension(image.src);
  const orderNum = order?.orderNumber || image.orderNumber || 'order';
  const cleanKey = (image.key || 'image').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${orderNum}_${cleanKey}.${ext}`;

  try {
    if (image.src.startsWith('data:image')) {
      const link = document.createElement('a');
      link.href = image.src;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return true;
    }

    const blob = await urlToBlob(image.src);
    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
    return true;
  } catch (error) {
    console.error('Download failed:', error);
    // Fallback: open in new tab
    window.open(image.src, '_blank');
    throw error;
  }
};

/**
 * Download all images of a single order as a ZIP archive
 */
export const downloadOrderZip = async (order, images, onProgress) => {
  if (!images || images.length === 0) {
    throw new Error('No images available for this order.');
  }

  const zip = new JSZip();
  const orderNum = order?.orderNumber || order?.id || 'order';
  const folder = zip.folder(`Order_${orderNum}`);

  // Create order info text file
  const customerName = `${order.customer?.name || order.customerEmail || 'Guest'}`;
  const statusName = order.orderStatus?.name || order.status || 'Pending';
  const orderDate = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();

  const infoContent = `=====================================================
STUDENTLIFE CAP ORDER - MEDIA DOSSIER
=====================================================
Order Number: #${orderNum}
Internal ID: ${order.id}
Customer: ${customerName} (${order.customerEmail || 'N/A'})
Status: ${statusName}
Date Created: ${orderDate}
Total Exported Images: ${images.length}
=====================================================
Generated on: ${new Date().toLocaleString()}
`;

  folder.file('order-details.txt', infoContent);

  // Add each image to the ZIP
  for (let i = 0; i < images.length; i++) {
    const img = images[i];
    if (onProgress) onProgress(i + 1, images.length, img.label);

    try {
      const blob = await urlToBlob(img.src);
      const ext = getImageExtension(img.src);
      const cleanKey = (img.key || `image_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${String(i + 1).padStart(2, '0')}_${cleanKey}.${ext}`;
      folder.file(filename, blob);
    } catch (err) {
      console.warn(`Could not add image ${img.label} to zip:`, err);
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = `Order_${orderNum}_Images.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);

  return true;
};

/**
 * Download multiple orders with their images in a single master ZIP
 */
export const downloadBatchOrdersZip = async (ordersWithImages, onProgress) => {
  if (!ordersWithImages || ordersWithImages.length === 0) {
    throw new Error('No orders selected for download.');
  }

  const zip = new JSZip();
  let totalImagesCount = ordersWithImages.reduce((sum, item) => sum + (item.images?.length || 0), 0);
  let processedCount = 0;

  for (const item of ordersWithImages) {
    const { order, images } = item;
    if (!images || images.length === 0) continue;

    const orderNum = order.orderNumber || order.id;
    const folder = zip.folder(`Order_${orderNum}`);

    // Add info file per order
    const customerName = `${order.customer?.name || order.customerEmail || 'Guest'}`;
    const statusName = order.orderStatus?.name || order.status || 'Pending';
    const orderDate = order.createdAt ? new Date(order.createdAt).toISOString() : new Date().toISOString();

    const infoContent = `Order Number: #${orderNum}
Customer: ${customerName} (${order.customerEmail || 'N/A'})
Status: ${statusName}
Date: ${orderDate}
`;
    folder.file('order-info.txt', infoContent);

    for (let i = 0; i < images.length; i++) {
      const img = images[i];
      processedCount++;
      if (onProgress) onProgress(processedCount, totalImagesCount, `#${orderNum} - ${img.label}`);

      try {
        const blob = await urlToBlob(img.src);
        const ext = getImageExtension(img.src);
        const cleanKey = (img.key || `image_${i + 1}`).replace(/[^a-zA-Z0-9_-]/g, '_');
        const filename = `${String(i + 1).padStart(2, '0')}_${cleanKey}.${ext}`;
        folder.file(filename, blob);
      } catch (err) {
        console.warn(`Could not add image ${img.label} to batch zip:`, err);
      }
    }
  }

  const zipBlob = await zip.generateAsync({
    type: 'blob',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  const zipUrl = URL.createObjectURL(zipBlob);
  const link = document.createElement('a');
  link.href = zipUrl;
  link.download = `Orders_Media_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(zipUrl), 2000);

  return true;
};

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

  const TARGET_RENDERS = [
    { key: 'front', aliases: ['front', 'front_angle', 'frontangle', 'frontview', 'front_view'], label: 'Front Angle' },
    { key: 'back', aliases: ['back', 'rear', 'rear_angle', 'rearangle', 'rearview', 'backview'], label: 'Rear Angle' },
    { key: 'top', aliases: ['top', 'top_view', 'topview', 'topangle'], label: 'Top View' },
    { key: 'bottom', aliases: ['bottom', 'underbrim', 'underbrim_view', 'underbrimview', 'bottomview'], label: 'Underbrim View' },
  ];

  // 1. Process 3D rendered views in exact specified order: Front Angle, Rear Angle, Top View, Underbrim View
  if (capImagesObj && typeof capImagesObj === 'object') {
    TARGET_RENDERS.forEach(({ key, aliases, label }) => {
      let val = null;
      for (const [k, v] of Object.entries(capImagesObj)) {
        const cleanK = k.toLowerCase().trim();
        if (aliases.includes(cleanK) || cleanK === key) {
          if (typeof v === 'string' && (v.startsWith('data:image') || v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/'))) {
            val = v;
            break;
          }
        }
      }

      if (val) {
        images.push({
          id: `order-${order.id}-cap-${key}`,
          category: 'render',
          key: key,
          label: label,
          src: val,
          orderId: order.id,
          orderNumber: order.orderNumber || String(order.id),
        });
      }
    });
  }

  // 2. Process Custom Inside Lining (only if custom uploaded inside lining artwork/photo exists)
  if (selectedOptionsObj && typeof selectedOptionsObj === 'object') {
    const liningVal =
      selectedOptionsObj?.FOER?.['Indvendigt foer billede']?.[0]?.url ||
      selectedOptionsObj?.FOER?.['Indvendigt foer billede'] ||
      (typeof selectedOptionsObj?.FOER === 'object' &&
        Object.entries(selectedOptionsObj.FOER).find(([k, v]) =>
          typeof v === 'string' &&
          (v.startsWith('data:image') || v.startsWith('http://') || v.startsWith('https://')) &&
          k.toLowerCase().includes('billede')
        )?.[1]) ||
      (typeof selectedOptionsObj?.FOER === 'object' &&
        Object.values(selectedOptionsObj.FOER).find(v => typeof v === 'string' && v.startsWith('data:image')));

    if (typeof liningVal === 'string' && (liningVal.startsWith('data:image') || liningVal.startsWith('http://') || liningVal.startsWith('https://') || liningVal.startsWith('/'))) {
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

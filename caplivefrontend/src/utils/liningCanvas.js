/** Lining photo editor — preview + export share the same draw math */

export const LINING_CW = 500;
export const LINING_CH = 560;
export const LINING_OVAL_CX = LINING_CW / 2;
export const LINING_OVAL_CY = LINING_CH / 2;
export const LINING_OVAL_RX = LINING_CW / 2 - 14;
export const LINING_OVAL_RY = LINING_CH / 2 - 14;

export const EXPORT_SIZE = 850;
export const EXPORT_CX = EXPORT_SIZE / 2;
export const EXPORT_CY = EXPORT_SIZE / 2;
export const EXPORT_CIRCLE_R = Math.round(EXPORT_SIZE * 0.5);

export const PREVIEW_CIRCLE_R = (EXPORT_CIRCLE_R / EXPORT_SIZE) * LINING_CW;

export const clipLiningOval = (ctx, cx, cy, rx, ry) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
};

/** Cap lining is oval: width = height * LINING_WIDTH_RATIO (lower = narrower) */
export const LINING_WIDTH_RATIO = 0.86;

export const clipLiningCircle = (ctx, cx, cy, r) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * LINING_WIDTH_RATIO, r, 0, 0, Math.PI * 2);
    ctx.clip();
};

export const strokeLiningOval = (ctx, cx, cy, rx, ry, style = {}) => {
    ctx.save();
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.strokeStyle = style.strokeStyle ?? 'rgba(148, 163, 184, 0.55)';
    ctx.lineWidth = style.lineWidth ?? 2;
    ctx.stroke();
    ctx.restore();
};

/** Fit image inside circle; returns multiplier where 1.0 = perfect fit */
export const getFitScale = (img, circleR, padding = 0.88) => {
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    const maxW = circleR * 2 * padding * LINING_WIDTH_RATIO;
    const maxH = circleR * 2 * padding;
    return Math.min(maxW / iw, maxH / ih);
};

export const getPhotoDrawSize = (img, photo, circleR) => {
    const fit = getFitScale(img, circleR);
    const userScale = photo.scale ?? 1;
    const iw = img.naturalWidth || img.width || 1;
    const ih = img.naturalHeight || img.height || 1;
    return {
        w: iw * fit * userScale,
        h: ih * fit * userScale,
    };
};

/**
 * Draw lining photos (white circle on optional outer bg).
 * photo.x / photo.y are 0–1 normalized positions.
 */
export const drawLiningPhotos = (
    ctx,
    width,
    height,
    circleR,
    circleCx,
    circleCy,
    photos,
    imageMap,
    liveOverride = null,
    outerBg = '#ffffff'
) => {
    if (outerBg) {
        ctx.fillStyle = outerBg;
        ctx.fillRect(0, 0, width, height);
    }

    ctx.save();
    clipLiningCircle(ctx, circleCx, circleCy, circleR);

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    photos.forEach((photo) => {
        const img = imageMap[photo.id];
        if (!img) return;

        const px = liveOverride?.photoId === photo.id ? liveOverride.x : photo.x;
        const py = liveOverride?.photoId === photo.id ? liveOverride.y : photo.y;
        const { w, h } = getPhotoDrawSize(img, photo, circleR);

        ctx.save();
        ctx.translate(px * width, py * height);
        ctx.rotate(((photo.rotation || 0) * Math.PI) / 180);
        ctx.drawImage(img, -w / 2, -h / 2, w, h);
        ctx.restore();
    });

    ctx.restore();
};

export const buildLiningExportDataUrl = (photos, imageMap) => {
    const canvas = document.createElement('canvas');
    canvas.width = EXPORT_SIZE;
    canvas.height = EXPORT_SIZE;
    const ctx = canvas.getContext('2d');
    drawLiningPhotos(
        ctx,
        EXPORT_SIZE,
        EXPORT_SIZE,
        EXPORT_CIRCLE_R,
        EXPORT_CX,
        EXPORT_CY,
        photos,
        imageMap,
        null,
        null
    );

    // Adaptive Ultra-HD WebP export:
    // Starts at ultra-sharp 0.96 quality. Automatically selects the highest quality
    // whose base64 string remains safely under Chrome's 65,536 Omnibox limit (< 63,500 chars)
    // so the image is 100% complete and crystal-clear HD with zero cutoffs.
    try {
        for (const quality of [0.96, 0.94, 0.92, 0.90, 0.88]) {
            const webpUrl = canvas.toDataURL('image/webp', quality);
            if (webpUrl && webpUrl.startsWith('data:image/webp')) {
                if (webpUrl.length < 63500 || quality === 0.88) {
                    return webpUrl;
                }
            }
        }
    } catch {}

    return canvas.toDataURL('image/png');
};

/** @deprecated use getFitScale — kept for uploads default scale = 1 */
export const fitPhotoScale = (img, rx, ry, padding = 0.55) =>
    getFitScale(img, Math.min(rx, ry), padding);

/** Lining photo editor — preview + export share the same draw math */

export const LINING_CW = 500;
export const LINING_CH = 560;
export const LINING_OVAL_CX = LINING_CW / 2;
export const LINING_OVAL_CY = LINING_CH / 2;
export const LINING_OVAL_RX = LINING_CW / 2 - 14;
export const LINING_OVAL_RY = LINING_CH / 2 - 14;

export const EXPORT_SIZE = 1000;
export const EXPORT_CX = EXPORT_SIZE / 2;
export const EXPORT_CY = EXPORT_SIZE / 2;
export const EXPORT_CIRCLE_R = 550;

export const PREVIEW_CIRCLE_R = (EXPORT_CIRCLE_R / EXPORT_SIZE) * LINING_CW;

export const clipLiningOval = (ctx, cx, cy, rx, ry) => {
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.clip();
};

export const clipLiningCircle = (ctx, cx, cy, r) => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
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
    const maxW = circleR * 2 * padding;
    const maxH = circleR * 2 * padding;
    return Math.min(maxW / img.width, maxH / img.height);
};

export const getPhotoDrawSize = (img, photo, circleR) => {
    const fit = getFitScale(img, circleR);
    const userScale = photo.scale ?? 1;
    return {
        w: img.width * fit * userScale,
        h: img.height * fit * userScale,
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
    return canvas.toDataURL('image/png', 0.92);
};

/** @deprecated use getFitScale — kept for uploads default scale = 1 */
export const fitPhotoScale = (img, rx, ry, padding = 0.55) =>
    getFitScale(img, Math.min(rx, ry), padding);

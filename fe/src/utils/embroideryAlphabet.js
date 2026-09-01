export function sanitizeEmbroideryLetters(text, max = 20) {
    if (!text) return '';
    
    let temp = text
        .replace(/Æ/g, '__AE_CAP__')
        .replace(/æ/g, '__AE_SML__')
        .replace(/Ø/g, '__O_CAP__')
        .replace(/ø/g, '__O_SML__')
        .replace(/Å/g, '__A_CAP__')
        .replace(/å/g, '__A_SML__');
        
    temp = temp
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s_]/g, '');
        
    temp = temp
        .replace(/__AE_CAP__/g, 'Æ')
        .replace(/__AE_SML__/g, 'æ')
        .replace(/__O_CAP__/g, 'Ø')
        .replace(/__O_SML__/g, 'ø')
        .replace(/__A_CAP__/g, 'Å')
        .replace(/__A_SML__/g, 'å');
        
    return temp.slice(0, max);
}


const LETTER_CONFIG = {
    ' ': { renderW: 15, renderH: 0, baselineFrac: 1.0 },

    // ── CAPITALS (renderH: 95) ────────────────────────────────
    A: { folder: 'Capital', renderW: 58, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    B: { folder: 'Capital', renderW: 42, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    C: { folder: 'Capital', renderW: 42, renderH: 62, baselineFrac: 1.0, overlap: 4 },
    D: { folder: 'Capital', renderW: 46, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    E: { folder: 'Capital', renderW: 42, renderH: 62, baselineFrac: 1.0, overlap: 4 },
    F: { folder: 'Capital', renderW: 50, renderH: 80, baselineFrac: 0.80, overlap: 8 },
    G: { folder: 'Capital', renderW: 50, renderH: 80, baselineFrac: 0.80, overlap: 4 },
    H: { folder: 'Capital', renderW: 70, renderH: 70, baselineFrac: 1.0, overlap: 4 },
    I: { folder: 'Capital', renderW: 30, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    J: { folder: 'Capital', renderW: 44, renderH: 80, baselineFrac: 0.80, overlap: 4 },
    K: { folder: 'Capital', renderW: 50, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    L: { folder: 'Capital', renderW: 40, renderH: 65, baselineFrac: 1.0, overlap: 2 },
    M: { folder: 'Capital', renderW: 53, renderH: 65, baselineFrac: 1.0, overlap: 2 },
    N: { folder: 'Capital', renderW: 53, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    O: { folder: 'Capital', renderW: 40, renderH: 65, baselineFrac: 1.0, overlap: 2 },
    P: { folder: 'Capital', renderW: 46, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    Q: { folder: 'Capital', renderW: 55, renderH: 80, baselineFrac: 0.80, overlap: 4 },
    R: { folder: 'Capital', renderW: 55, renderH: 65, baselineFrac: 1.0, overlap: 2 },
    S: { folder: 'Capital', renderW: 42, renderH: 62, baselineFrac: 1.0, overlap: 4 },
    T: { folder: 'Capital', renderW: 52, renderH: 65, baselineFrac: 1.0, overlap: 8 },
    U: { folder: 'Capital', renderW: 50, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    V: { folder: 'Capital', renderW: 50, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    W: { folder: 'Capital', renderW: 75, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    X: { folder: 'Capital', renderW: 50, renderH: 65, baselineFrac: 1.0, overlap: 2 },
    Y: { folder: 'Capital', renderW: 45, renderH: 80, baselineFrac: 0.80, overlap: 4, zIndex: 10 },
    Z: { folder: 'Capital', renderW: 44, renderH: 62, baselineFrac: 1.0, overlap: 4 },
    Æ: { folder: 'Capital', renderW: 65, renderH: 65, baselineFrac: 1.0, overlap: 4 },
    Ø: { folder: 'Capital', renderW: 45, renderH: 65, baselineFrac: 1.0, overlap: 2 },
    Å: { folder: 'Capital', renderW: 58, renderH: 75, baselineFrac: 0.85, overlap: 4 },

    // ── SMALL x-height (renderH: 45) ─────────────────────────
    a: { folder: 'Small', renderW: 34, renderH: 45, baselineFrac: 1.0, shiftX: -3, overlap: 3, zIndex: 10 },
    c: { folder: 'Small', renderW: 32, renderH: 45, baselineFrac: 1.0 },
    e: { folder: 'Small', renderW: 27, renderH: 45, baselineFrac: 1.0, shiftX: -7 },
    i: { folder: 'Small', renderW: 15, renderH: 60, baselineFrac: 1.0, zIndex: 10 },
    m: { folder: 'Small', renderW: 53, renderH: 45, baselineFrac: 1.0 },
    n: { folder: 'Small', renderW: 43, renderH: 45, baselineFrac: 1.0 },
    o: { folder: 'Small', renderW: 30, renderH: 45, baselineFrac: 1.0, zIndex: 10 },
    r: { folder: 'Small', renderW: 32, renderH: 45, baselineFrac: 1.0, overlap: 4, zIndex: 10 },
    s: { folder: 'Small', renderW: 27, renderH: 45, baselineFrac: 1.0, shiftX: -7 },
    u: { folder: 'Small', renderW: 43, renderH: 45, baselineFrac: 1.0 },
    v: { folder: 'Small', renderW: 43, renderH: 45, baselineFrac: 1.0 },
    w: { folder: 'Small', renderW: 45, renderH: 45, baselineFrac: 1.0 },
    x: { folder: 'Small', renderW: 43, renderH: 45, baselineFrac: 1.0 },
    z: { folder: 'Small', renderW: 48, renderH: 45, baselineFrac: 1.0 },
    æ: { folder: 'Small', renderW: 40, renderH: 60, baselineFrac: 0.9, overlap: 3 },
    ø: { folder: 'Small', renderW: 32, renderH: 45, baselineFrac: 1.0, zIndex: 10 },
    å: { folder: 'Small', renderW: 34, renderH: 60, baselineFrac: 1.0, shiftX: -3, overlap: 3, zIndex: 10 },

    // ── SMALL ascenders (renderH: 70) ─────────────────────────
    b: { folder: 'Small', renderW: 38, renderH: 70, baselineFrac: 1.0 },
    d: { folder: 'Small', renderW: 48, renderH: 70, baselineFrac: 1.0, overlap: 10 },
    f: { folder: 'Small', renderW: 46, renderH: 98, baselineFrac: 0.7, shiftX: -10 },
    h: { folder: 'Small', renderW: 30, renderH: 70, baselineFrac: 1.0 },
    k: { folder: 'Small', renderW: 30, renderH: 70, baselineFrac: 1.0 },
    l: { folder: 'Small', renderW: 27, renderH: 70, baselineFrac: 1.0, overlap: 8 },
    t: { folder: 'Small', renderW: 23, renderH: 65, baselineFrac: 1.0 },

    // ── SMALL descenders (renderH: 75, 60% above baseline) ───
    g: { folder: 'Small', renderW: 34, renderH: 75, baselineFrac: 0.60, shiftX: -8 },
    j: { folder: 'Small', renderW: 30, renderH: 95, baselineFrac: 0.65, shiftX: -15 },
    p: { folder: 'Small', renderW: 50, renderH: 75, baselineFrac: 0.60, shiftX: -17 },
    q: { folder: 'Small', renderW: 30, renderH: 75, baselineFrac: 0.60 },
    y: { folder: 'Small', renderW: 35, renderH: 75, baselineFrac: 0.60 },
};

// ============================================================
// UTILITIES & CACHING
// ============================================================

const imageCache = new Map();
const maskCache = new Map();

function loadImage(src) {
    if (!src) return Promise.resolve(null);
    if (imageCache.has(src)) {
        return imageCache.get(src);
    }
    const p = new Promise((resolve) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => {
            console.warn(`❌ Failed image load: ${src}`);
            resolve(null);
        };
        img.src = src;
    });
    imageCache.set(src, p);
    return p;
}

function getRenderScale() {
    if (typeof window === 'undefined') return 2;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) || (window.innerWidth && window.innerWidth < 768);
    return isMobile ? 1 : 2;
}

function getOrCreateLetterMask(cacheKey, opacityImg, dw, dh) {
    if (!opacityImg || dw <= 0 || dh <= 0) return null;
    
    const key = `${cacheKey}_${dw}_${dh}`;
    if (maskCache.has(key)) {
        return maskCache.get(key);
    }

    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = dw;
    maskCanvas.height = dh;
    const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
    maskCtx.drawImage(opacityImg, 0, 0, dw, dh);

    const maskData = maskCtx.getImageData(0, 0, dw, dh);
    const px = maskData.data;
    const len = px.length;

    const c1 = px[0];
    const c2 = px[(dw - 1) * 4];
    const c3 = px[(dh - 1) * dw * 4];
    const c4 = px[len - 4];
    const cornerAvg = (c1 + c2 + c3 + c4) / 4;
    const isInverted = cornerAvg > 128;

    for (let i = 0; i < len; i += 4) {
        const brightness = px[i];
        px[i + 3] = isInverted ? (255 - brightness) : brightness;
        px[i] = 255;
        px[i + 1] = 255;
        px[i + 2] = 255;
    }
    maskCtx.putImageData(maskData, 0, 0);

    maskCache.set(key, maskCanvas);
    return maskCanvas;
}

export function preloadAlphabetMaps() {
    // Background idle preload of common letters
    if (typeof window === 'undefined') return;
    const baseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5175/devstudentlife';
    const base = `${baseUrl}/alphabets`;
    const commonChars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'a', 'e', 'i', 'o', 'r', 's', 't', 'n'];
    
    const preloadLetters = () => {
        commonChars.forEach(char => {
            const cfg = LETTER_CONFIG[char];
            if (!cfg || !cfg.folder) return;
            const dir = `${base}/${cfg.folder}/${char}`;
            loadImage(`${dir}/BaseColor.jpg`);
            loadImage(`${dir}/Opacity.jpg`);
        });
    };

    if ('requestIdleCallback' in window) {
        window.requestIdleCallback(preloadLetters, { timeout: 3000 });
    } else {
        setTimeout(preloadLetters, 1000);
    }
}

// ============================================================
// MAIN GENERATOR (OPTIMIZED FOR MOBILE / IPHONE)
// ============================================================

export async function generateAllEmbroideryMaps(text) {
    if (!text) {
        const emptyCanvas = document.createElement('canvas');
        emptyCanvas.width = 1;
        emptyCanvas.height = 1;
        const ctx = emptyCanvas.getContext('2d');
        ctx.fillStyle = '#000000';
        ctx.fillRect(0, 0, 1, 1);
        const black1x1 = emptyCanvas.toDataURL('image/png');

        return {
            text: '',
            basecolor: null,
            normal: null,
            roughness: null,
            height: null,
            ambient: null,
            opacity: black1x1
        };
    }

    const chars = text.split('');
    const baseUrl = import.meta.env.VITE_FRONTEND_BASE_URL || 'http://localhost:5175/devstudentlife';
    const base = `${baseUrl}/alphabets`;

    // ── 1. Fetch images (direct cached Image objects) ────────
    const perLetter = await Promise.all(chars.map(async (char, idx) => {
        const cfg = LETTER_CONFIG[char];
        if (!cfg || !cfg.folder) {
            return {
                char,
                cfg: cfg || { renderW: 32, renderH: 0, baselineFrac: 1.0 },
                basecolor: null, normal: null, roughness: null,
                height_map: null, ambient: null, opacity: null,
                idx
            };
        }
        const dir = `${base}/${cfg.folder}/${char}`;
        const [basecolor, normal, roughness, height_map, ambient, opacity] =
            await Promise.all([
                loadImage(`${dir}/BaseColor.jpg`),
                loadImage(`${dir}/Normal.jpg`),
                loadImage(`${dir}/Roughness.jpg`),
                loadImage(`${dir}/Height.jpg`),
                loadImage(`${dir}/AmbientOcclusion.jpg`),
                loadImage(`${dir}/Opacity.jpg`),
            ]);
        return { char, cfg, basecolor, normal, roughness, height_map, ambient, opacity, idx };
    }));

    // ── 2. Canvas setup ──────────────────────────────────────
    const RENDER_SCALE = getRenderScale();
    const CANVAS_W = 1024 * RENDER_SCALE;
    const CANVAS_H = 300 * RENDER_SCALE;

    // ── 3. Shared BASELINE_Y ─────────────────────────────────
    const maxAbove = Math.max(
        ...perLetter.map(l => (l.cfg.renderH || 0) * (l.cfg.baselineFrac ?? 1.0)),
        1
    );
    const maxBelow = Math.max(
        ...perLetter.map(l => (l.cfg.renderH || 0) * (1 - (l.cfg.baselineFrac ?? 1.0))),
        0
    );

    const blockH = (maxAbove + maxBelow) * RENDER_SCALE;
    const BASELINE_Y = Math.round((CANVAS_H - blockH) / 2 + maxAbove * RENDER_SCALE);

    // ── 4. Horizontal layout ─────────────────────────────────
    let totalW = 0;
    perLetter.forEach((l, i) => {
        totalW += (l.cfg.renderW || 0) * RENDER_SCALE;
        totalW += (l.cfg.shiftX || 0) * RENDER_SCALE;
        if (i < perLetter.length - 1) {
            totalW -= (l.cfg.overlap || 0) * RENDER_SCALE;
        }
    });

    const fitScale = totalW > CANVAS_W * 0.94
        ? (CANVAS_W * 0.94) / totalW
        : 1.0;

    let curX = (CANVAS_W - totalW * fitScale) / 2;

    const drawQueue = perLetter.map(l => {
        const cfg = l.cfg;
        const bf = cfg.baselineFrac ?? 1.0;
        const dw = Math.round((cfg.renderW || 0) * RENDER_SCALE * fitScale);
        const dh = Math.round((cfg.renderH || 0) * RENDER_SCALE * fitScale);
        const sx = Math.round((cfg.shiftX || 0) * RENDER_SCALE * fitScale);

        const abovePx = Math.round(dh * bf);
        const drawX = Math.round(curX + sx);
        const drawY = BASELINE_Y - abovePx;

        curX += ((cfg.renderW || 0) - (cfg.overlap || 0)) * RENDER_SCALE * fitScale + sx;

        // Pre-compute the alpha mask ONCE for this letter
        const maskCanvas = l.opacity ? getOrCreateLetterMask(`${l.char}_${l.cfg.folder}`, l.opacity, dw, dh) : null;

        return { ...l, _drawX: drawX, _drawY: drawY, _dw: dw, _dh: dh, _z: cfg.zIndex || 1, _maskCanvas: maskCanvas };
    });

    const sorted = [...drawQueue].sort((a, b) => a._z - b._z);

    // Reusable pooled canvases for stitch operations
    const scratchCanvas = document.createElement('canvas');
    const scratchCtx = scratchCanvas.getContext('2d');

    const mainCanvas = document.createElement('canvas');
    mainCanvas.width = CANVAS_W;
    mainCanvas.height = CANVAS_H;
    const mainCtx = mainCanvas.getContext('2d');

    // ── 5. Fast Stitch ───────────────────────────────────────
    function stitchMapSync(key) {
        mainCtx.clearRect(0, 0, CANVAS_W, CANVAS_H);

        for (const item of sorted) {
            const mapKey = key === 'height' ? 'height_map' : key;
            const img = item[mapKey];

            if (!img || item._dw <= 0 || item._dh <= 0) continue;

            if (item._maskCanvas) {
                scratchCanvas.width = item._dw;
                scratchCanvas.height = item._dh;
                scratchCtx.clearRect(0, 0, item._dw, item._dh);

                scratchCtx.globalCompositeOperation = 'source-over';
                scratchCtx.drawImage(img, 0, 0, item._dw, item._dh);

                scratchCtx.globalCompositeOperation = 'destination-in';
                scratchCtx.drawImage(item._maskCanvas, 0, 0);

                scratchCtx.globalCompositeOperation = 'source-over';
                mainCtx.drawImage(scratchCanvas, item._drawX, item._drawY);
            } else {
                mainCtx.drawImage(img, item._drawX, item._drawY, item._dw, item._dh);
            }
        }

        return mainCanvas.toDataURL('image/png');
    }

    const basecolor = stitchMapSync('basecolor');
    const normal = stitchMapSync('normal');
    const roughness = stitchMapSync('roughness');
    const height = stitchMapSync('height');
    const ambient = stitchMapSync('ambient');
    const opacity = stitchMapSync('opacity');

    return { text, basecolor, normal, roughness, height, ambient, opacity };
}

// ============================================================
// SEND TO IFRAMES
// ============================================================
export function sendEmbroideryMapsToIframes(prefix, payload) {
    const ids = ['preview-iframe', 'preview-iframe2'];
    const send = msg => ids.forEach(id => {
        const iframe = document.getElementById(id);
        if (!iframe?.contentWindow) { console.warn(`❌ iframe not found: ${id}`); return; }
        iframe.contentWindow.postMessage(msg, '*');
    });
    if (payload.basecolor) send(`${prefix}EmbroideryBasecolor:${payload.basecolor}`);
    if (payload.normal) send(`${prefix}EmbroideryNormal:${payload.normal}`);
    if (payload.roughness) send(`${prefix}EmbroideryRoughness:${payload.roughness}`);
    if (payload.height) send(`${prefix}EmbroideryHeight:${payload.height}`);
    if (payload.ambient) send(`${prefix}EmbroideryAmbient:${payload.ambient}`);
    if (payload.opacity) send(`${prefix}EmbroideryOpacity:${payload.opacity}`);
}
export function sanitizeEmbroideryLetters(text, max = 20) {
    if (!text) return '';
    return text
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .slice(0, max);
}

export function preloadAlphabetMaps() {}

const RENDER_SCALE = 2;


const LETTER_CONFIG = {
    ' ': { renderW: 15,  renderH: 0,   baselineFrac: 1.0 },

    // ── CAPITALS (renderH: 95) ────────────────────────────────
    A: { folder: 'Capital', renderW: 88,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    B: { folder: 'Capital', renderW: 92,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    C: { folder: 'Capital', renderW: 82,  renderH: 92, baselineFrac: 1.0, overlap: 4 },
    D: { folder: 'Capital', renderW: 96,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    E: { folder: 'Capital', renderW: 82,  renderH: 92, baselineFrac: 1.0, overlap: 4 },
    F: { folder: 'Capital', renderW: 80,  renderH: 92, baselineFrac: 1.0, overlap: 15 },
    G: { folder: 'Capital', renderW: 90,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    H: { folder: 'Capital', renderW: 90,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    I: { folder: 'Capital', renderW: 45,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    J: { folder: 'Capital', renderW: 64,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    K: { folder: 'Capital', renderW: 90,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    L: { folder: 'Capital', renderW: 78,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    M: { folder: 'Capital', renderW: 115, renderH: 95, baselineFrac: 1.0, overlap: 4 },
    N: { folder: 'Capital', renderW: 100, renderH: 95, baselineFrac: 1.0, overlap: 4 },
    O: { folder: 'Capital', renderW: 90,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    P: { folder: 'Capital', renderW: 86,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    Q: { folder: 'Capital', renderW: 94,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    R: { folder: 'Capital', renderW: 90,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    S: { folder: 'Capital', renderW: 82,  renderH: 92, baselineFrac: 1.0, overlap: 4 },
    T: { folder: 'Capital', renderW: 82,  renderH: 95, baselineFrac: 1.0, overlap: 8 },
    U: { folder: 'Capital', renderW: 90,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    V: { folder: 'Capital', renderW: 90,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    W: { folder: 'Capital', renderW: 125, renderH: 95, baselineFrac: 1.0, overlap: 4 },
    X: { folder: 'Capital', renderW: 90,  renderH: 95, baselineFrac: 1.0, overlap: 4 },
    Y: { folder: 'Capital', renderW: 90,  renderH: 95, baselineFrac: 1.0, overlap: 15, zIndex: 10 },
    Z: { folder: 'Capital', renderW: 84,  renderH: 92, baselineFrac: 1.0, overlap: 4 },

    // ── SMALL x-height (renderH: 45) ─────────────────────────
    a: { folder: 'Small', renderW: 44,  renderH: 45, baselineFrac: 1.0, shiftX: -3, overlap: 3, zIndex: 10 },
    c: { folder: 'Small', renderW: 42,  renderH: 45, baselineFrac: 1.0 },
    e: { folder: 'Small', renderW: 42,  renderH: 45, baselineFrac: 1.0, shiftX: -7 },
    i: { folder: 'Small', renderW: 20,  renderH: 60, baselineFrac: 1.0, zIndex: 10 },
    m: { folder: 'Small', renderW: 78,  renderH: 45, baselineFrac: 1.0 },
    n: { folder: 'Small', renderW: 58,  renderH: 45, baselineFrac: 1.0 },
    o: { folder: 'Small', renderW: 44,  renderH: 45, baselineFrac: 1.0, zIndex: 10 },
    r: { folder: 'Small', renderW: 42,  renderH: 45, baselineFrac: 1.0, overlap: 6, zIndex: 10 },
    s: { folder: 'Small', renderW: 42,  renderH: 45, baselineFrac: 1.0, shiftX: -7 },
    u: { folder: 'Small', renderW: 58,  renderH: 45, baselineFrac: 1.0 },
    v: { folder: 'Small', renderW: 58,  renderH: 45, baselineFrac: 1.0 },
    w: { folder: 'Small', renderW: 85,  renderH: 45, baselineFrac: 1.0 },
    x: { folder: 'Small', renderW: 58,  renderH: 45, baselineFrac: 1.0 },
    z: { folder: 'Small', renderW: 48,  renderH: 45, baselineFrac: 1.0 },

    // ── SMALL ascenders (renderH: 70) ─────────────────────────
    b: { folder: 'Small', renderW: 48,  renderH: 70, baselineFrac: 1.0 },
    d: { folder: 'Small', renderW: 58,  renderH: 70, baselineFrac: 1.0, overlap: 8 },
    f: { folder: 'Small', renderW: 46,  renderH: 98, baselineFrac: 0.7, shiftX: -10 },
    h: { folder: 'Small', renderW: 40,  renderH: 70, baselineFrac: 1.0 },
    k: { folder: 'Small', renderW: 40,  renderH: 70, baselineFrac: 1.0 },
    l: { folder: 'Small', renderW: 32,  renderH: 70, baselineFrac: 1.0, overlap: 8 },
    t: { folder: 'Small', renderW: 34,  renderH: 70, baselineFrac: 1.0 },

    // ── SMALL descenders (renderH: 75, 60% above baseline) ───
    g: { folder: 'Small', renderW: 44,  renderH: 75, baselineFrac: 0.60, shiftX: -15 },
    j: { folder: 'Small', renderW: 32,  renderH: 95, baselineFrac: 0.60, shiftX: -15 },
    p: { folder: 'Small', renderW: 60,  renderH: 75, baselineFrac: 0.60, shiftX: -17 },
    q: { folder: 'Small', renderW: 40,  renderH: 75, baselineFrac: 0.67 },
    y: { folder: 'Small', renderW: 65,  renderH: 75, baselineFrac: 0.60 },
};

// ============================================================
// UTILITIES
// ============================================================

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload  = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed: ${src}`));
        img.src = src;
    });
}

async function toBase64(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) { console.warn(`❌ 404: ${url}`); return null; }
        const blob = await res.blob();
        return new Promise(r => {
            const reader = new FileReader();
            reader.onloadend = () => r(reader.result);
            reader.readAsDataURL(blob);
        });
    } catch (e) {
        console.warn(`❌ fetch error: ${url}`, e);
        return null;
    }
}

// ============================================================
// MAIN GENERATOR
// ============================================================

export async function generateAllEmbroideryMaps(text) {
    if (!text) return {
        text: '', basecolor: null, normal: null,
        roughness: null, height: null, ambient: null, opacity: null
    };

    const chars = text.split('');
    const baseUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5173/devstudentlife'
        : 'https://devstudentlife.netlify.app';
    const base = `${baseUrl}/alphabets`;

    // ── 1. Fetch all images ──────────────────────────────────
    const perLetter = await Promise.all(chars.map(async char => {
        const cfg = LETTER_CONFIG[char];
        if (!cfg || !cfg.folder) {
            return {
                char, cfg: cfg || { renderW: 32, renderH: 0, baselineFrac: 1.0 },
                basecolor: null, normal: null, roughness: null,
                height_map: null, ambient: null, opacity: null,
            };
        }
        const dir = `${base}/${cfg.folder}/${char}`;
        const [basecolor, normal, roughness, height_map, ambient, opacity] =
            await Promise.all([
                toBase64(`${dir}/BaseColor.jpg`),
                toBase64(`${dir}/Normal.jpg`),
                toBase64(`${dir}/Roughness.jpg`),
                toBase64(`${dir}/Height.jpg`),
                toBase64(`${dir}/AmbientOcclusion.jpg`),
                toBase64(`${dir}/Opacity.jpg`),
            ]);
        return { char, cfg, basecolor, normal, roughness, height_map, ambient, opacity };
    }));

    // ── 2. Canvas setup ──────────────────────────────────────
    const CANVAS_W = 1024 * RENDER_SCALE;
    const CANVAS_H = 300  * RENDER_SCALE;

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
    // totalW calculation mein bhi shiftX shamil karo
    let totalW = 0;
    perLetter.forEach((l, i) => {
        totalW += (l.cfg.renderW || 0) * RENDER_SCALE;
        totalW += (l.cfg.shiftX  || 0) * RENDER_SCALE; // FIX 1: shiftX totalW mein
        if (i < perLetter.length - 1) {
            totalW -= (l.cfg.overlap || 0) * RENDER_SCALE;
        }
    });

    const fitScale = totalW > CANVAS_W * 0.94
        ? (CANVAS_W * 0.94) / totalW
        : 1.0;

    let curX = (CANVAS_W - totalW * fitScale) / 2;

    const drawQueue = perLetter.map(l => {
        const cfg  = l.cfg;
        const bf   = cfg.baselineFrac ?? 1.0;
        const dw   = Math.round((cfg.renderW || 0) * RENDER_SCALE * fitScale);
        const dh   = Math.round((cfg.renderH || 0) * RENDER_SCALE * fitScale);
        const sx   = Math.round((cfg.shiftX  || 0) * RENDER_SCALE * fitScale);

        const abovePx = Math.round(dh * bf);
        const drawX = Math.round(curX + sx);
        const drawY = BASELINE_Y - abovePx;

        // FIX 2: curX mein sx bhi add — gap nahi aayega
        curX += ((cfg.renderW || 0) - (cfg.overlap || 0)) * RENDER_SCALE * fitScale + sx;

        return { ...l, _drawX: drawX, _drawY: drawY, _dw: dw, _dh: dh, _z: cfg.zIndex || 1 };
    });

    const sorted = [...drawQueue].sort((a, b) => a._z - b._z);

    // ── 5. Stitch one map ────────────────────────────────────


    // async function stitchMap(key) {
    //     const canvas = document.createElement('canvas');
    //     canvas.width  = CANVAS_W;
    //     canvas.height = CANVAS_H;
    //     const ctx = canvas.getContext('2d', { willReadFrequently: true });
    //     ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    //     for (const item of sorted) {
    //         const mapKey = key === 'height' ? 'height_map' : key;
    //         const src = item[mapKey];
    //         if (!src || item._dw <= 0 || item._dh <= 0) continue;
    //         try {
    //             const img = await loadImage(src);
    //             ctx.drawImage(img, item._drawX, item._drawY, item._dw, item._dh);
    //         } catch (e) {
    //             console.warn('draw error:', e);
    //         }
    //     }

    //     await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    //     return canvas.toDataURL('image/jpeg');
    // }

async function stitchMap(key) {
    const canvas = document.createElement('canvas');
    canvas.width  = CANVAS_W;
    canvas.height = CANVAS_H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

    for (const item of sorted) {
        const mapKey     = key === 'height' ? 'height_map' : key;
        const src        = item[mapKey];
        const opacitySrc = item['opacity'];

        if (!src || item._dw <= 0 || item._dh <= 0) continue;

        try {
            const img = await loadImage(src);

            if (opacitySrc) {
                // ── Texture canvas ────────────────────────────────
                const texCanvas = document.createElement('canvas');
                texCanvas.width  = item._dw;
                texCanvas.height = item._dh;
                const texCtx = texCanvas.getContext('2d');
                texCtx.drawImage(img, 0, 0, item._dw, item._dh);

                // ── Mask canvas ───────────────────────────────────
                const maskCanvas = document.createElement('canvas');
                maskCanvas.width  = item._dw;
                maskCanvas.height = item._dh;
                const maskCtx = maskCanvas.getContext('2d', { willReadFrequently: true });
                const opImg = await loadImage(opacitySrc);
                maskCtx.drawImage(opImg, 0, 0, item._dw, item._dh);

                const maskData = maskCtx.getImageData(0, 0, item._dw, item._dh);
                const px = maskData.data;

                // Auto-detect: corners = background
                // Agar corners bright hain → map inverted hai (white=bg, black=letter)
                const c1 = px[0];
                const c2 = px[(item._dw - 1) * 4];
                const c3 = px[(item._dh - 1) * item._dw * 4];
                const c4 = px[px.length - 4];
                const cornerAvg = (c1 + c2 + c3 + c4) / 4;
                const isInverted = cornerAvg > 128;

                for (let i = 0; i < px.length; i += 4) {
                    const brightness = px[i];
                    px[i + 3] = isInverted ? (255 - brightness) : brightness;
                    px[i]     = 255;
                    px[i + 1] = 255;
                    px[i + 2] = 255;
                }
                maskCtx.putImageData(maskData, 0, 0);

                // destination-in: texture RGB untouched, sirf alpha cut hoti hai
                texCtx.globalCompositeOperation = 'destination-in';
                texCtx.drawImage(maskCanvas, 0, 0);
                texCtx.globalCompositeOperation = 'source-over';

                ctx.drawImage(texCanvas, item._drawX, item._drawY);

            } else {
                ctx.drawImage(img, item._drawX, item._drawY, item._dw, item._dh);
            }

        } catch (e) {
            console.warn('draw error:', e);
        }
    }

    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
    return canvas.toDataURL('image/png');
}

    // ── 6. All 6 maps ────────────────────────────────────────
    
    
    const [basecolor, normal, roughness, height, ambient, opacity] =
        await Promise.all([
            stitchMap('basecolor'),
            stitchMap('normal'),
            stitchMap('roughness'),
            stitchMap('height'),
            stitchMap('ambient'),
            stitchMap('opacity'),
        ]);

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
    if (payload.basecolor)  send(`${prefix}EmbroideryBasecolor:${payload.basecolor}`);
    if (payload.normal)     send(`${prefix}EmbroideryNormal:${payload.normal}`);
    if (payload.roughness)  send(`${prefix}EmbroideryRoughness:${payload.roughness}`);
    if (payload.height)     send(`${prefix}EmbroideryHeight:${payload.height}`);
    if (payload.ambient)    send(`${prefix}EmbroideryAmbient:${payload.ambient}`);
    if (payload.opacity)    send(`${prefix}EmbroideryOpacity:${payload.opacity}`);
}
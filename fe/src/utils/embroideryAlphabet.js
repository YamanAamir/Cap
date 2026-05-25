// utils/embroideryAlphabet.js

// 1. sanitize input text
export function sanitizeEmbroideryLetters(text, max = 20) {
    if (!text) return '';

    return text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .slice(0, max);
}
const RENDER_SCALE = 2; //temp

// 2. preload hook
export function preloadAlphabetMaps() { }

// ============================================
// LETTER CONFIG
// ============================================

const LETTER_CONFIG = {

    // ===== SPACE =====
    ' ': {
        folder: null,
        width: 35,
        height: 0,
        yOffset: 0
    },

    // ========================================
    // CAPITAL LETTERS
    // ========================================

    A: { folder: 'Capital', width: 90, height: 90, yOffset: 80 },
    B: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    C: { folder: 'Capital', width: 85, height: 85, yOffset: 82 },
    D: { folder: 'Capital', width: 100, height: 100, yOffset: 78 },
    E: { folder: 'Capital', width: 88, height: 88, yOffset: 82 },
    F: { folder: 'Capital', width: 85, height: 85, yOffset: 82 },
    G: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    H: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    I: { folder: 'Capital', width: 50, height: 90, yOffset: 80 },
    J: { folder: 'Capital', width: 70, height: 95, yOffset: 80 },
    K: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    L: { folder: 'Capital', width: 80, height: 90, yOffset: 80 },
    M: { folder: 'Capital', width: 120, height: 95, yOffset: 80 },
    N: { folder: 'Capital', width: 105, height: 95, yOffset: 80 },
    O: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    P: { folder: 'Capital', width: 90, height: 90, yOffset: 80 },
    Q: { folder: 'Capital', width: 100, height: 100, yOffset: 80 },
    R: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    S: { folder: 'Capital', width: 85, height: 85, yOffset: 82 },
    T: { folder: 'Capital', width: 85, height: 90, yOffset: 80 },
    U: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    V: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    W: { folder: 'Capital', width: 130, height: 95, yOffset: 80 },
    X: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    Y: { folder: 'Capital', width: 95, height: 95, yOffset: 80 },
    Z: { folder: 'Capital', width: 90, height: 90, yOffset: 80 },

    // ========================================
    // SMALL LETTERS
    // ========================================

    a: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
    b: { folder: 'Small', width: 50, height: 70, yOffset: 100 },
    c: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
    d: { folder: 'Small', width: 60, height: 70, yOffset: 100, overlap: 10 },
    e: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
    f: { folder: 'Small', width: 50, height: 70, yOffset: 100, overlap: 25 },
    g: { folder: 'Small', width: 45, height: 75, yOffset: 125 },
    h: { folder: 'Small', width: 40, height: 70, yOffset: 100 },
    i: { folder: 'Small', width: 20, height: 45, yOffset: 125, overlap: 10, zIndex: 10 },
    j: { folder: 'Small', width: 35, height: 75, yOffset: 125 },
    k: { folder: 'Small', width: 40, height: 70, yOffset: 100 },
    l: { folder: 'Small', width: 35, height: 70, yOffset: 100, overlap: 10 },
    m: { folder: 'Small', width: 80, height: 45, yOffset: 125 },
    n: { folder: 'Small', width: 60, height: 45, yOffset: 125 },
    o: { folder: 'Small', width: 45, height: 45, yOffset: 125, overlap: 10, zIndex: 10 },
    p: { folder: 'Small', width: 55, height: 75, yOffset: 125 },
    q: { folder: 'Small', width: 45, height: 75, yOffset: 125 },
    r: { folder: 'Small', width: 45, height: 45, yOffset: 125, overlap: 8, zIndex: 10 },
    s: { folder: 'Small', width: 45, height: 45, yOffset: 125 },
    t: { folder: 'Small', width: 35, height: 70, yOffset: 100 },
    u: { folder: 'Small', width: 60, height: 45, yOffset: 125 },
    v: { folder: 'Small', width: 60, height: 45, yOffset: 125 },
    w: { folder: 'Small', width: 90, height: 45, yOffset: 125 },
    x: { folder: 'Small', width: 60, height: 45, yOffset: 125 },
    y: { folder: 'Small', width: 70, height: 75, yOffset: 125 },
    z: { folder: 'Small', width: 50, height: 45, yOffset: 125 },
};

// ============================================
// HELPERS
// ============================================

function getCharMeta(char) {
    return LETTER_CONFIG[char] || null;
}

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();

        img.crossOrigin = "anonymous";

        img.onload = () => resolve(img);

        img.onerror = () =>
            reject(new Error(`Failed to load: ${src}`));

        img.src = src;
    });
}

async function toBase64(url) {
    try {
        const res = await fetch(url);

        if (!res.ok) {
            console.warn(`❌ 404: ${url}`);
            return null;
        }

        const blob = await res.blob();

        return new Promise((resolve) => {
            const reader = new FileReader();

            reader.onloadend = () => resolve(reader.result);

            reader.readAsDataURL(blob);
        });

    } catch (e) {

        console.warn(`❌ fetch error: ${url}`, e);

        return null;
    }
}

// ============================================
// MAIN GENERATOR
// ============================================

export async function generateAllEmbroideryMaps(text) {

    if (!text) {
        return {
            text: '',
            basecolor: null,
            normal: null,
            roughness: null,
            height: null,
            ambient: null,
            opacity: null
        };
    }

    const chars = text.split('');

    const baseUrl =
        window.location.hostname === 'localhost'
            ? 'http://localhost:5173/devstudentlife'
            : 'https://devstudentlife.netlify.app';

    const base = `${baseUrl}/alphabets`;

    // ========================================
    // FETCH ALL LETTER MAPS
    // ========================================

    const perLetter = await Promise.all(

        chars.map(async (char) => {

            const meta = getCharMeta(char);

            if (!meta || !meta.folder) {

                return {
                    basecolor: null,
                    normal: null,
                    roughness: null,
                    height: null,
                    ambient: null,
                    opacity: null,

                    width: (meta?.width || 0) * RENDER_SCALE,
                    heightSize: (meta?.height || 0) * RENDER_SCALE,
                    yOffset: (meta?.yOffset || 0) * RENDER_SCALE,
                    overlap: meta?.overlap || 0,
                    shiftX: meta?.shiftX || 0,
                    zIndex: meta?.zIndex !== undefined ? meta.zIndex : 1
                };
            }

            const dir = `${base}/${meta.folder}/${char}`;
            const [
                basecolor,
                normal,
                roughness,
                height,
                ambient,
                opacity
            ] = await Promise.all([

                toBase64(`${dir}/BaseColor.jpg`),
                toBase64(`${dir}/Normal.jpg`),
                toBase64(`${dir}/Roughness.jpg`),
                toBase64(`${dir}/Height.jpg`),
                toBase64(`${dir}/AmbientOcclusion.jpg`),
                toBase64(`${dir}/Opacity.jpg`),
            ]);

            return {

                basecolor,
                normal,
                roughness,
                height,
                ambient,
                opacity,

                // width: meta.width,
                // heightSize: meta.height,
                width: meta.width * RENDER_SCALE,
                heightSize: meta.height * RENDER_SCALE,
                yOffset: meta.yOffset * RENDER_SCALE,
                overlap: meta.overlap || 0,
                shiftX: meta.shiftX || 0,
                zIndex: meta.zIndex !== undefined ? meta.zIndex : 1
            };
        })
    );

    // ========================================
    // STITCH FUNCTION
    // ========================================

    async function stitchSingleLine(key) {

        const items = perLetter.map((l) => ({
            src: l[key],
            width: l.width,
            height: l.heightSize,
            yOffset: l.yOffset,
            overlap: l.overlap,
            shiftX: l.shiftX || 0,
            zIndex: l.zIndex !== undefined ? l.zIndex : 1
        }));

        // const FIXED_WIDTH = 1024;
        // const FIXED_HEIGHT = 300;
        const FIXED_WIDTH = 1024 * RENDER_SCALE;
        const FIXED_HEIGHT = 300 * RENDER_SCALE;

        let contentWidth = 0;
        for (let i = 0; i < items.length; i++) {
            if (i === items.length - 1) {
                contentWidth += items[i].width;
            } else {
                // contentWidth += items[i].width - (items[i].overlap || 0);
                contentWidth += items[i].width - (items[i].overlap || 0) * RENDER_SCALE;
            }
        }

        if (contentWidth <= 0) return null;

        const canvas = document.createElement("canvas");

        canvas.width = FIXED_WIDTH;
        canvas.height = FIXED_HEIGHT;

        const ctx = canvas.getContext("2d", {
            willReadFrequently: true
        });

        ctx.clearRect(0, 0, FIXED_WIDTH, FIXED_HEIGHT);


        // Calculate pre-drawn layout positions in original left-to-right order
        let currentX = (FIXED_WIDTH - contentWidth) / 2;
        const drawQueue = items.map((item, index) => {
            const drawX = currentX;
            if (index < items.length - 1) {
                currentX += item.width - (item.overlap || 0);
            }
            return {
                ...item,
                drawX
            };
        });

        // Now sort the queue by zIndex so they are layered correctly
        drawQueue.sort((a, b) => a.zIndex - b.zIndex);

        // Draw each item at its pre-calculated position
        for (const item of drawQueue) {
            if (item.src) {
                try {
                    const img = await loadImage(item.src);
                    ctx.drawImage(
                        img,
                        item.drawX + item.shiftX * RENDER_SCALE,
                        item.yOffset,
                        item.width,
                        item.height
                    );
                } catch (e) {
                    console.warn(e);
                }
            }
        }

        // WAIT FOR CANVAS RENDER FLUSH
        await new Promise((resolve) =>
            requestAnimationFrame(() =>
                requestAnimationFrame(resolve)
            )
        );

        return canvas.toDataURL("image/jpeg");
    }

    // ========================================
    // GENERATE ALL MAPS
    // ========================================

    const [
        basecolor,
        normal,
        roughness,
        height,
        ambient,
        opacity
    ] = await Promise.all([

        stitchSingleLine("basecolor"),
        stitchSingleLine("normal"),
        stitchSingleLine("roughness"),
        stitchSingleLine("height"),
        stitchSingleLine("ambient"),
        stitchSingleLine("opacity"),
    ]);

    return {
        text,
        basecolor,
        normal,
        roughness,
        height,
        ambient,
        opacity
    };
}

// ============================================
// SEND TO IFRAMES
// ============================================

export function sendEmbroideryMapsToIframes(prefix, payload) {

    const ids = [
        'preview-iframe',
        'preview-iframe2'
    ];

    const send = (msg) => {

        ids.forEach((id) => {

            const iframe = document.getElementById(id);

            if (!iframe?.contentWindow) {

                console.warn(`❌ iframe not found: ${id}`);

                return;
            }

            iframe.contentWindow.postMessage(msg, "*");
        });
    };

    if (payload.basecolor) {
        send(`${prefix}EmbroideryBasecolor:${payload.basecolor}`);
    }

    if (payload.normal) {
        send(`${prefix}EmbroideryNormal:${payload.normal}`);
    }

    if (payload.roughness) {
        send(`${prefix}EmbroideryRoughness:${payload.roughness}`);
    }

    if (payload.height) {
        send(`${prefix}EmbroideryHeight:${payload.height}`);
    }

    if (payload.ambient) {
        send(`${prefix}EmbroideryAmbient:${payload.ambient}`);
    }

    if (payload.opacity) {
        send(`${prefix}EmbroideryOpacity:${payload.opacity}`);
    }
}

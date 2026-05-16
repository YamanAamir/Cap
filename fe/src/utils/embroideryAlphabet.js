// utils/embroideryAlphabet.js

// 1. sanitize input text
export function sanitizeEmbroideryLetters(text, max = 20) {
    if (!text) return '';
    return text
        .toUpperCase()
        .normalize("NFD")
        .replace(/[̀-ͯ]/g, "")
        .replace(/[^A-Z0-9\s]/g, '')
        .slice(0, max);
}

// 2. preload hook (no-op, kept for API compatibility)
export function preloadAlphabetMaps() { }

// --- helpers ---

function loadImage(src) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        img.src = src;
    });
}

async function toBase64(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) { console.warn(`❌ 404: ${url}`); return null; }
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

// stitch multiple base64 images side by side into one canvas → base64
async function stitchMaps(base64Images, tileSize = 256) {
    const valid = base64Images.filter(Boolean);
    if (!valid.length) return null;

    const canvas = document.createElement("canvas");
    canvas.width = valid.length * tileSize;
    canvas.height = tileSize;
    const ctx = canvas.getContext("2d");

    let x = 0;
    for (const src of valid) {
        try {
            const img = await loadImage(src);
            ctx.drawImage(img, x, 0, tileSize, tileSize);
        } catch (_) { }
        x += tileSize;
    }

    return canvas.toDataURL("image/png");
}

// 3. fetch all letter maps and stitch into 5 combined textures
// returns: { text, basecolor, normal, roughness, height, ambient }
// each value is a single base64 PNG with all letters stitched left→right
export async function generateAllEmbroideryMaps(text) {
    if (!text) return { text: '', basecolor: null, normal: null, roughness: null, height: null, ambient: null };

    const chars = text.split('');
    const baseUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5173/devstudentlife'
        : 'https://elipsestudio.com/devstudentlife';
    const base = `${baseUrl}/alphabets`;

    // fetch all 5 maps per letter in parallel
    const perLetter = await Promise.all(
        chars.map(async (char) => {
            const letter = char.toUpperCase();
            const dir = `${base}/${letter}`;
            const [basecolor, normal, roughness, height, ambient] = await Promise.all([
                toBase64(`${dir}/basecolor.png`),
                toBase64(`${dir}/normal.png`),
                toBase64(`${dir}/roughness.png`),
                toBase64(`${dir}/height.png`),
                toBase64(`${dir}/ambient.png`),
            ]);
            return { basecolor, normal, roughness, height, ambient };
        })
    );

    // stitch each map type into one combined image
    const [basecolor, normal, roughness, height, ambient] = await Promise.all([
        stitchMaps(perLetter.map(l => l.basecolor)),
        stitchMaps(perLetter.map(l => l.normal)),
        stitchMaps(perLetter.map(l => l.roughness)),
        stitchMaps(perLetter.map(l => l.height)),
        stitchMaps(perLetter.map(l => l.ambient)),
    ]);

    return { text, basecolor, normal, roughness, height, ambient };
}

// 4. send 5 stitched maps as separate postMessages (like YearImage)
// format: "EmbroideryBasecolor:<base64>", "EmbroideryNormal:<base64>", ...
export function sendEmbroideryMapsToIframes(payload) {
    const ids = ['preview-iframe', 'preview-iframe2'];

    const send = (msg) => {
        ids.forEach((id) => {
            const iframe = document.getElementById(id);
            if (!iframe?.contentWindow) { console.warn(`❌ iframe not found: ${id}`); return; }
            iframe.contentWindow.postMessage(msg, "*");
        });
    };

    if (payload.basecolor) send(`EmbroideryBasecolor:${payload.basecolor}`);
    if (payload.normal) send(`EmbroideryNormal:${payload.normal}`);
    if (payload.roughness) send(`EmbroideryRoughness:${payload.roughness}`);
    if (payload.height) send(`EmbroideryHeight:${payload.height}`);
    if (payload.ambient) send(`EmbroideryAmbient:${payload.ambient}`);
}

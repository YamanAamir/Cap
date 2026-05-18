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



// 3. fetch all letter maps and stitch into 5 combined textures
// returns: { text, basecolor, normal, roughness, height, ambient }
// each value is a single base64 PNG with all letters stitched left→right
export async function generateAllEmbroideryMaps(text) {
    if (!text) return { text: '', basecolor: null, normal: null, roughness: null, height: null, ambient: null, opacity: null };

    const chars = text.split('');
    const baseUrl = window.location.hostname === 'localhost'
        ? 'http://localhost:5173/devstudentlife'
        : 'https://elipsestudio.com/devstudentlife';
    const base = `${baseUrl}/alphabets`;

    function getCharMeta(char) {
        if (char === ' ') return { folder: null, size: 128, yOffset: 168 };
        if (/[A-Z]/.test(char)) return { folder: 'Capital', size: 120, yOffset: 50 };
        // Descenders lowered
        if (/[bdfhklt]/.test(char)) return { folder: 'Small', size: 75, yOffset: 95 };
        if (/[gjpqy]/.test(char)) return { folder: 'Small', size: 70, yOffset: 115 };
        // Normal small letters
        if (/[a-z]/.test(char)) return { folder: 'Small', size: 45, yOffset: 125 };
        return null;
    }

    // fetch all maps per letter in parallel
    const perLetter = await Promise.all(
        chars.map(async (char) => {
            const meta = getCharMeta(char);

            if (!meta || !meta.folder) {
                // space or unsupported character
                return { basecolor: null, normal: null, roughness: null, height: null, ambient: null, opacity: null, size: meta ? meta.size : 0, yOffset: meta ? meta.yOffset : 0 };
            }

            const dir = `${base}/${meta.folder}/${char}`;
            const [basecolor, normal, roughness, height, ambient, opacity] = await Promise.all([
                toBase64(`${dir}/BaseColor.jpg`),
                toBase64(`${dir}/Normal.jpg`),
                toBase64(`${dir}/Roughness.jpg`),
                toBase64(`${dir}/Height.jpg`),
                toBase64(`${dir}/AmbientOcclusion.jpg`),
                toBase64(`${dir}/Opacity.jpg`),
            ]);
            return { basecolor, normal, roughness, height, ambient, opacity, size: meta.size, yOffset: meta.yOffset };
        })
    );

    async function stitchSingleLine(key) {
        const items = perLetter.map(l => ({ src: l[key], size: l.size, yOffset: l.yOffset }));
        const width = items.reduce((sum, i) => sum + i.size, 0);
        if (width === 0) return null;

        const canvas = document.createElement("canvas");
        canvas.height = 300; // Enough height for Capital (256) + lowered descenders (160+128 = 288)
        canvas.width = width;
        const ctx = canvas.getContext("2d");

        let x = 0;
        for (const item of items) {
            if (item.src) {
                try {
                    const img = await loadImage(item.src);
                    ctx.drawImage(img, x, item.yOffset, item.size, item.size);
                } catch (e) { }
            }
            x += item.size;
        }

        return canvas.toDataURL("image/png");
    }

    // stitch each map type into one combined image
    const [basecolor, normal, roughness, height, ambient, opacity] = await Promise.all([
        stitchSingleLine("basecolor"),
        stitchSingleLine("normal"),
        stitchSingleLine("roughness"),
        stitchSingleLine("height"),
        stitchSingleLine("ambient"),
        stitchSingleLine("opacity"),
    ]);

    return { text, basecolor, normal, roughness, height, ambient, opacity };
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

    if (payload.basecolor) send(`frontEmbroideryBasecolor:${payload.basecolor}`);
    if (payload.normal) send(`frontEmbroideryNormal:${payload.normal}`);
    if (payload.roughness) send(`frontEmbroideryRoughness:${payload.roughness}`);
    if (payload.height) send(`frontEmbroideryHeight:${payload.height}`);
    if (payload.ambient) send(`frontEmbroideryAmbient:${payload.ambient}`);
    if (payload.opacity) send(`frontEmbroideryOpacity:${payload.opacity}`);
}

const PLAYCANVAS_ORIGIN = 'https://playcanv.as';

const AREA_TYPES = {
    front: 'EMBROIDERY_CONFIG',
    back: 'BACK_EMBROIDERY_CONFIG',
    bottom: 'BACK_BOTTOM_EMBROIDERY_CONFIG',
};

// UI colour name (Danish / Program / English) → PlayCanvas preset id
export const PRESET_BY_NAME = {
    // Standard Danish thread colours
    guld: 'gold',
    gold: 'gold',

    'sølv': 'silver',
    solv: 'silver',
    slv: 'silver',
    's\u00a0lv': 'silver',
    'sa,lv': 'silver',
    silver: 'silver',

    hvid: 'white',
    white: 'white',

    sort: 'black',
    black: 'black',

    'rød': 'red',
    rod: 'red',
    red: 'red',

    // Education program thread colours (Broderi foran & Navne broderi)
    stx: 'red', // STX program thread is Red
    hhx: 'hhx',
    htx: 'htx',
    hf: 'hf',
    eux: 'eux',
    eud: 'eud',
    landmand: 'landmand',
};

// "Back" does not support these presets in PlayCanvas → falls back to gold
// (same rule as the standalone configurator).
const RESTRICTED_BACK_COLORS = new Set(['red', 'black']);

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;

const state = {
    front: { name: '', colorName: 'Guld', hex: null, sent: false, lastKey: '' },
    back: { name: '', colorName: 'Guld', hex: null, sent: false, lastKey: '' },
    bottom: { name: '', colorName: 'Guld', hex: null, sent: false, lastKey: '' },
};

const bridgeWindows = new Set();
let requestId = 0;

export const toBridgeColor = (area, colorName) => {
    const lower = String(colorName || '').trim().toLowerCase();
    let id = PRESET_BY_NAME[lower] || lower || 'gold';
    if (area === 'back' && RESTRICTED_BACK_COLORS.has(id)) id = 'gold';
    return id;
};

const liveWindows = () => {
    bridgeWindows.forEach((w) => {
        try {
            if (!w || w.closed) bridgeWindows.delete(w);
        } catch {
            bridgeWindows.delete(w);
        }
    });
    return Array.from(bridgeWindows);
};

const buildPayload = (area) => {
    const s = state[area];
    return {
        type: AREA_TYPES[area],
        name: s.name,
        color: toBridgeColor(area, s.colorName),
        hex: s.hex || undefined,
        lang: ARABIC_RE.test(s.name) ? 'ar' : 'en',
        requestId: ++requestId,
    };
};

const post = (win, payload) => {
    try {
        win.postMessage(payload, PLAYCANVAS_ORIGIN);
        console.info('[Embroidery Bridge] Sent to PlayCanvas:', payload);
        return true;
    } catch (err) {
        console.warn('[Embroidery Bridge] postMessage error:', err);
        return false;
    }
};

// Nothing is sent for an area that never had text (no empty "clear" spam),
// but once text was sent, clearing it (name '') is sent too.
const shouldSend = (s) => s.name !== '' || s.sent;

const flush = (area, onlyWindow = null) => {
    const s = state[area];
    if (!s || !shouldSend(s)) return;

    const targets = onlyWindow ? [onlyWindow] : liveWindows();
    if (targets.length === 0) return; // will be flushed on CAP_BRIDGE_READY

    const key = `${s.name}|${toBridgeColor(area, s.colorName)}|${s.hex || ''}`;
    if (!onlyWindow && key === s.lastKey) return; // identical to what was already sent

    const payload = buildPayload(area);
    targets.forEach((w) => post(w, payload));
    s.lastKey = key;
    s.sent = s.name !== '';
};

/**
 * Update one area and push it to PlayCanvas.
 * @param {'front'|'back'|'bottom'} area
 * @param {{ name?: string, colorName?: string, hex?: string }} patch
 */
export const updateEmbroidery = (area, patch = {}) => {
    const s = state[area];
    if (!s) return;
    if (patch.name !== undefined) s.name = String(patch.name || '').trim();
    if (patch.colorName !== undefined) s.colorName = patch.colorName;
    if (patch.hex !== undefined) s.hex = patch.hex;
    flush(area);
};

const handleMessage = (event) => {
    if (event.origin !== PLAYCANVAS_ORIGIN) return;
    const data = event.data;
    if (!data || typeof data !== 'object') return;

    if (data.type === 'CAP_BRIDGE_READY') {
        // event.source is the real inner PlayCanvas app (not the outer /p/ wrapper)
        bridgeWindows.add(event.source);
        console.info('[Embroidery Bridge] CAP_BRIDGE_READY received');
        Object.keys(state).forEach((area) => flush(area, event.source));
        return;
    }

    if (data.type === 'CAP_BRIDGE_RESULT') {
        if (data.ok) {
            console.info('[Embroidery Bridge] PlayCanvas accepted', data.areaType, data.name, data.color);
        } else {
            console.warn('[Embroidery Bridge] PlayCanvas rejected:', data.error, data);
        }
    }
};

if (typeof window !== 'undefined' && !window.__capEmbroideryBridgeInstalled) {
    window.__capEmbroideryBridgeInstalled = true;
    window.addEventListener('message', handleMessage);
}


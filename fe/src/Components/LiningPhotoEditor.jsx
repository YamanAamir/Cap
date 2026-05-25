import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
    LINING_CW,
    LINING_CH,
    LINING_OVAL_CX,
    LINING_OVAL_CY,
    LINING_OVAL_RX,
    LINING_OVAL_RY,
    PREVIEW_CIRCLE_R,
    strokeLiningOval,
    drawLiningPhotos,
    getPhotoDrawSize,
} from '../utils/liningCanvas';

const LiningPhotoEditor = ({
    label,
    disabled,
    liningPhotos,
    imageObjects,
    selectedPhotoId,
    onSelectPhoto,
    onUpload,
    onRemove,
    onUpdatePhoto,
    onAdjustStart,
    onAdjustEnd,
}) => {
    const canvasRef = useRef(null);
    const dragState = useRef({ active: false, photoId: null, live: null, rafId: null });
    const liveAdjustRef = useRef(null);
    const adjustDebounceRef = useRef(null);
    const [scaleDraft, setScaleDraft] = useState('');
    const [rotationDraft, setRotationDraft] = useState('');

    const CW = LINING_CW;
    const CH = LINING_CH;

    const selectedPhoto = liningPhotos.find((p) => p.id === selectedPhotoId);

    const getPhotosForDraw = useCallback(() => {
        const livePos = dragState.current.live;
        const liveAdj = liveAdjustRef.current;
        return liningPhotos.map((p) => {
            let merged = { ...p };
            if (livePos?.photoId === p.id) {
                merged.x = livePos.x;
                merged.y = livePos.y;
            }
            if (liveAdj?.photoId === p.id) {
                merged = { ...merged, ...liveAdj.patch };
            }
            return merged;
        });
    }, [liningPhotos]);

    const hitImage = (px, py, photo) => {
        const img = imageObjects[photo.id];
        const { w, h } = img
            ? getPhotoDrawSize(img, photo, PREVIEW_CIRCLE_R)
            : { w: 80, h: 80 };
        const cx = photo.x * CW;
        const cy = photo.y * CH;
        const rad = -(photo.rotation || 0) * Math.PI / 90;
        const dx = px - cx;
        const dy = py - cy;
        const lx = dx * Math.cos(rad) - dy * Math.sin(rad);
        const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
        return Math.abs(lx) <= w / 2 && Math.abs(ly) <= h / 2;
    };

    // const drawPreviewCanvas = useCallback(() => {
    //     const canvas = canvasRef.current;
    //     if (!canvas) return;
    //     const ctx = canvas.getContext('2d');

    //     if (liningPhotos.length === 0) {
    //         ctx.fillStyle = '#f1f5f9';
    //         ctx.fillRect(0, 0, CW, CH);
    //         ctx.fillStyle = '#94a3b8';
    //         ctx.font = '600 13px system-ui, sans-serif';
    //         ctx.textAlign = 'center';
    //         ctx.textBaseline = 'middle';
    //         ctx.fillText('Upload Design', CW / 2, CH / 2 + 22);
    //         return;
    //     }

    //     drawLiningPhotos(
    //         ctx,
    //         CW,
    //         CH,
    //         PREVIEW_CIRCLE_R,
    //         LINING_OVAL_CX,
    //         LINING_OVAL_CY,
    //         getPhotosForDraw(),
    //         imageObjects,
    //         null,
    //         '#f1f5f9'
    //     );

    //     strokeLiningOval(ctx, LINING_OVAL_CX, LINING_OVAL_CY, LINING_OVAL_RX, LINING_OVAL_RY);
    // }, [liningPhotos, imageObjects, getPhotosForDraw]);
const drawPreviewCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    // ✅ CLEAR OLD FRAME
    ctx.clearRect(0, 0, CW, CH);

    // optional reset
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (liningPhotos.length === 0) {
        ctx.fillStyle = '#f1f5f9';
        ctx.fillRect(0, 0, CW, CH);

        ctx.fillStyle = '#94a3b8';
        ctx.font = '600 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        ctx.fillText('Upload Design', CW / 2, CH / 2 + 22);
        return;
    }

    drawLiningPhotos(
        ctx,
        CW,
        CH,
        PREVIEW_CIRCLE_R,
        LINING_OVAL_CX,
        LINING_OVAL_CY,
        getPhotosForDraw(),
        imageObjects,
        null,
        '#f1f5f9'
    );

    strokeLiningOval(
        ctx,
        1,
        1,
        1,
        1
    );
}, [liningPhotos, imageObjects, getPhotosForDraw]);
    const schedulePreviewRedraw = useCallback(() => {
        if (dragState.current.rafId) return;
        dragState.current.rafId = requestAnimationFrame(() => {
            dragState.current.rafId = null;
            drawPreviewCanvas();
        });
    }, [drawPreviewCanvas]);

    useEffect(() => {
        drawPreviewCanvas();
    }, [drawPreviewCanvas, selectedPhotoId]);

    useEffect(() => {
        if (!selectedPhoto) return;
        setScaleDraft(String(Math.round((selectedPhoto.scale || 1) * 100)));
        setRotationDraft(
            String(Math.round(((selectedPhoto.rotation || 0) % 360 + 360) % 360))
        );
    }, [selectedPhotoId]);

    const commitAdjust = (patch) => {
        if (!selectedPhotoId) return;
        liveAdjustRef.current = null;
        onUpdatePhoto(selectedPhotoId, patch);
        onAdjustEnd();
    };

    const scheduleAdjustCommit = (patch) => {
        onAdjustStart();
        clearTimeout(adjustDebounceRef.current);
        adjustDebounceRef.current = setTimeout(() => {
            commitAdjust(patch);
        }, 450);
    };

    const applyScaleDraft = (raw) => {
        setScaleDraft(raw);
        const pct = parseFloat(raw);
        if (Number.isNaN(pct) || !selectedPhotoId) return;
        const scale = Math.max(0.25, Math.min(5, pct / 100));
        liveAdjustRef.current = { photoId: selectedPhotoId, patch: { scale } };
        schedulePreviewRedraw();
        scheduleAdjustCommit({ scale });
    };

    const applyRotationDraft = (raw) => {
        setRotationDraft(raw);
        const deg = parseFloat(raw);
        if (Number.isNaN(deg) || !selectedPhotoId) return;
        const rotation = ((Math.round(deg) % 360) + 360) % 360;
        liveAdjustRef.current = { photoId: selectedPhotoId, patch: { rotation } };
        schedulePreviewRedraw();
        scheduleAdjustCommit({ rotation });
    };

    const flushAdjustOnBlur = () => {
        clearTimeout(adjustDebounceRef.current);
        const adj = liveAdjustRef.current;
        if (adj?.photoId && adj.patch) {
            commitAdjust(adj.patch);
        } else {
            onAdjustEnd();
        }
    };

    const getCanvasPos = (clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return { x: 0, y: 0 };
        const rect = canvas.getBoundingClientRect();
        return {
            x: (clientX - rect.left) * (CW / rect.width),
            y: (clientY - rect.top) * (CH / rect.height),
        };
    };

    const getCursor = (px, py) => {
        if (disabled) return 'default';
        for (let i = liningPhotos.length - 1; i >= 0; i--) {
            const photo = liningPhotos[i];
            if (imageObjects[photo.id] && hitImage(px, py, photo)) return 'grab';
        }
        return 'default';
    };

    const endDrag = () => {
        if (!dragState.current.active) return;
        const listeners = dragState.current.listeners;
        if (listeners) {
            window.removeEventListener('mousemove', listeners.onMove);
            window.removeEventListener('mouseup', listeners.onUp);
            window.removeEventListener('touchmove', listeners.onTouchMove);
            window.removeEventListener('touchend', listeners.onTouchEnd);
        }
        const live = dragState.current.live;
        if (live) {
            onUpdatePhoto(live.photoId, { x: live.x, y: live.y });
        }
        if (dragState.current.rafId) {
            cancelAnimationFrame(dragState.current.rafId);
        }
        dragState.current = { active: false, photoId: null, listeners: null, live: null, rafId: null };
        onAdjustEnd();
    };

    const onPointerMove = (clientX, clientY) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const { x: px, y: py } = getCanvasPos(clientX, clientY);
        canvas.style.cursor = dragState.current.active ? 'grabbing' : getCursor(px, py);
        if (!dragState.current.active || !dragState.current.photoId) return;
        const { startX, startY, photoStartX, photoStartY, photoId } = dragState.current;
        dragState.current.live = {
            photoId,
            x: Math.max(0, Math.min(1, photoStartX + (px - startX) / CW)),
            y: Math.max(0, Math.min(1, photoStartY + (py - startY) / CH)),
        };
        schedulePreviewRedraw();
    };

    const startDrag = (photo, px, py) => {
        onAdjustStart();
        const onMove = (e) => onPointerMove(e.clientX, e.clientY);
        const onUp = () => endDrag();
        const onTouchMove = (e) => {
            e.preventDefault();
            const t = e.touches[0];
            if (t) onPointerMove(t.clientX, t.clientY);
        };
        const onTouchEnd = () => endDrag();
        dragState.current = {
            active: true,
            photoId: photo.id,
            startX: px,
            startY: py,
            photoStartX: photo.x,
            photoStartY: photo.y,
            listeners: { onMove, onUp, onTouchMove, onTouchEnd },
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onUp);
        window.addEventListener('touchmove', onTouchMove, { passive: false });
        window.addEventListener('touchend', onTouchEnd);
    };

    useEffect(() => () => endDrag(), []);

    const onPointerDown = (clientX, clientY) => {
        if (disabled) return;
        const { x: px, y: py } = getCanvasPos(clientX, clientY);
        for (let i = liningPhotos.length - 1; i >= 0; i--) {
            const photo = liningPhotos[i];
            if (!imageObjects[photo.id]) continue;
            if (hitImage(px, py, photo)) {
                onSelectPhoto(photo.id);
                startDrag(photo, px, py);
                return;
            }
        }
        onSelectPhoto(null);
    };

    return (
        <div className={`space-y-4 mt-8 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
            <label className="text-sm font-semibold text-slate-700">{label}</label>

            <div
                className="relative mx-auto w-full max-w-[280px] rounded-2xl overflow-hidden"
                style={{
                    boxShadow: '0 8px 32px rgba(0,0,0,0.13), 0 1.5px 4px rgba(0,0,0,0.08)',
                }}
            >
                <canvas
                    ref={canvasRef}
                    width={CW}
                    height={CH}
                    className="w-full h-auto block"
                    style={{ display: 'block', touchAction: 'none' }}
                    onMouseDown={(e) => {
                        e.preventDefault();
                        onPointerDown(e.clientX, e.clientY);
                    }}
                    onMouseMove={(e) => {
                        if (!dragState.current.active) onPointerMove(e.clientX, e.clientY);
                    }}
                    onTouchStart={(e) => {
                        e.preventDefault();
                        const t = e.touches[0];
                        if (t) onPointerDown(t.clientX, t.clientY);
                    }}
                />
            </div>

            {liningPhotos.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 max-w-[280px] mx-auto">
                    {liningPhotos.map((photo, index) => (
                        <div key={photo.id} className="relative">
                            <button
                                type="button"
                                onClick={() => onSelectPhoto(photo.id)}
                                className={`block h-14 w-14 overflow-hidden rounded-xl border-2 transition-all ${
                                    selectedPhotoId === photo.id
                                        ? 'border-blue-500 ring-2 ring-blue-200'
                                        : 'border-slate-200 hover:border-slate-300'
                                }`}
                            >
                                <img
                                    src={photo.url}
                                    alt={`Billede ${index + 1}`}
                                    className="h-full w-full object-cover"
                                />
                            </button>
                            <button
                                type="button"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onRemove(photo.id);
                                }}
                                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-md ring-2 ring-white hover:bg-red-600"
                                title="Slet"
                                aria-label="Slet billede"
                            >
                                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex justify-center pt-1">
                <label className="w-full max-w-sm flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white text-blue-600 border-2 border-blue-100 cursor-pointer hover:bg-blue-50 hover:border-blue-300 transition-all shadow-sm">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
                    </svg>
                    <span className="text-sm font-bold">Tilf&#248;j flere billeder</span>
                    <input type="file" className="hidden" accept="image/*" multiple onChange={onUpload} />
                </label>
            </div>

            {selectedPhoto && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
                        <span className="text-sm font-bold text-slate-800">Justering</span>
                        <div className="flex gap-3">
                            <button
                                type="button"
                                onClick={() => onRemove(selectedPhotoId)}
                                className="text-xs font-bold text-red-500 hover:text-red-600 transition-colors"
                            >
                                Fjern
                            </button>
                            <button
                                type="button"
                                onClick={() => onSelectPhoto(null)}
                                className="text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                F&#230;rdig
                            </button>
                        </div>
                    </div>

                    <div
                        className="px-5 py-4 space-y-4"
                        onMouseDown={(e) => e.stopPropagation()}
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    St&#248;rrelse (%)
                                </label>
                                <input
                                    type="number"
                                    min={25}
                                    max={500}
                                    step={1}
                                    value={scaleDraft}
                                    onChange={(e) => applyScaleDraft(e.target.value)}
                                    onBlur={flushAdjustOnBlur}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-mono text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                                    Rotation (&#176;)
                                </label>
                                <input
                                    type="number"
                                    min={0}
                                    max={360}
                                    step={1}
                                    value={rotationDraft}
                                    onChange={(e) => applyRotationDraft(e.target.value)}
                                    onBlur={flushAdjustOnBlur}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    className="w-full px-3 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-mono text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">Centrer</span>
                            <button
                                type="button"
                                onClick={() => onUpdatePhoto(selectedPhotoId, { x: 0.5 })}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                            >
                                Vandret
                            </button>
                            <button
                                type="button"
                                onClick={() => onUpdatePhoto(selectedPhotoId, { y: 0.5 })}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                            >
                                Lodret
                            </button>
                            <button
                                type="button"
                                onClick={() => onUpdatePhoto(selectedPhotoId, { x: 0.5, y: 0.5 })}
                                className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 transition-colors"
                            >
                                Begge
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <p className="text-xs text-center text-slate-400 px-4 leading-relaxed">
                Klik for at v&#230;lge &middot; Tr&#230;k for at flytte &middot; Tal-felter til st&#248;rrelse og rotation
            </p>
        </div>
    );
};

export default LiningPhotoEditor;

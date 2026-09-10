import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, RotateCw, RotateCcw,
  FlipHorizontal, FlipVertical, RefreshCw, Download, Maximize2, Minimize2,
  Package, Tag, Check, Loader2, Sparkles, FolderArchive
} from 'lucide-react';
import { downloadSingleImage, downloadOrderZip } from '../../utils/mediaUtils';
import toast from 'react-hot-toast';

const ImageLightboxModal = ({
  isOpen,
  onClose,
  images = [],
  initialIndex = 0,
  order = null,
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [zipProgress, setZipProgress] = useState(null);

  const containerRef = useRef(null);
  const imageRef = useRef(null);

  // Sync initial index
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      resetTransform();
    }
  }, [isOpen, initialIndex]);

  const resetTransform = useCallback(() => {
    setZoom(1);
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setPosition({ x: 0, y: 0 });
  }, []);

  const currentImage = images[currentIndex] || images[0];

  // Navigate images
  const handlePrev = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    resetTransform();
  }, [images.length, resetTransform]);

  const handleNext = useCallback(() => {
    if (images.length <= 1) return;
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    resetTransform();
  }, [images.length, resetTransform]);

  // Zoom controls
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.3, 4));
  const handleZoomOut = () => {
    setZoom((z) => {
      const next = Math.max(z - 0.3, 0.5);
      if (next <= 1) setPosition({ x: 0, y: 0 });
      return next;
    });
  };

  // Rotation & Flip
  const handleRotateCW = () => setRotation((r) => (r + 90) % 360);
  const handleRotateCCW = () => setRotation((r) => (r - 90 + 360) % 360);
  const handleFlipH = () => setFlipH((f) => !f);
  const handleFlipV = () => setFlipV((f) => !f);

  // Pan / Dragging
  const handleMouseDown = (e) => {
    if (zoom <= 1) return;
    e.preventDefault();
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e) => {
    if (!isDragging || zoom <= 1) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Wheel zoom
  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Keyboard navigation & shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === '+' || e.key === '=') {
        handleZoomIn();
      } else if (e.key === '-') {
        handleZoomOut();
      } else if (e.key.toLowerCase() === 'r') {
        handleRotateCW();
      } else if (e.key.toLowerCase() === 'f') {
        handleFlipH();
      } else if (e.key === '0') {
        resetTransform();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, handlePrev, handleNext, onClose, resetTransform]);

  // Single Image Download
  const handleDownloadSingle = async () => {
    if (!currentImage) return;
    try {
      toast.loading('Preparing download...', { id: 'dl-single' });
      await downloadSingleImage(currentImage, order);
      toast.success(`Downloaded ${currentImage.label}`, { id: 'dl-single' });
    } catch (err) {
      toast.error('Failed to download image', { id: 'dl-single' });
    }
  };

  // Order ZIP Download
  const handleDownloadZip = async () => {
    if (!order || !images.length) return;
    setIsDownloadingZip(true);
    try {
      toast.loading('Packing ZIP archive...', { id: 'dl-zip' });
      await downloadOrderZip(order, images, (curr, total, label) => {
        setZipProgress(`Processing ${curr}/${total}: ${label}`);
      });
      toast.success(`Downloaded #${order.orderNumber} All Images ZIP`, { id: 'dl-zip' });
    } catch (err) {
      toast.error(err.message || 'Failed to generate ZIP archive', { id: 'dl-zip' });
    } finally {
      setIsDownloadingZip(false);
      setZipProgress(null);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  if (!isOpen || !currentImage) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[9999] bg-slate-950/95 backdrop-blur-md flex flex-col select-none text-white animate-in fade-in duration-200 overflow-hidden"
    >
      {/* Top Header Bar */}
      <div className="h-16 px-4 md:px-6 flex items-center justify-between border-b border-slate-800/80 bg-slate-900/60 shrink-0 z-20">
        <div className="flex items-center gap-3 md:gap-4 truncate">
          {order && (
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 text-xs font-black tracking-wider uppercase">
                #{order.orderNumber || order.id}
              </span>
              <span className="text-slate-400 text-xs hidden sm:inline">
                {order.customer?.name || order.customerEmail}
              </span>
            </div>
          )}
          <div className="h-4 w-px bg-slate-700 hidden sm:block" />
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-sm md:text-base text-white truncate">
              {currentImage.label}
            </span>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                currentImage.category === 'render'
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {currentImage.category === 'render' ? '3D Render' : 'Upload'}
            </span>
          </div>
        </div>

        {/* Header Right Actions */}
        <div className="flex items-center gap-2 md:gap-3 shrink-0">
          <span className="text-xs font-mono font-bold text-slate-400 px-2 py-1 bg-slate-800 rounded">
            {currentIndex + 1} / {images.length}
          </span>

          {order && (
            <button
              onClick={handleDownloadZip}
              disabled={isDownloadingZip}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-bold transition-colors shadow-sm disabled:opacity-50"
              title="Download all images for this order as ZIP"
            >
              {isDownloadingZip ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <FolderArchive className="h-3.5 w-3.5" />
              )}
              <span className="hidden md:inline">ZIP All</span>
            </button>
          )}

          <button
            onClick={handleDownloadSingle}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors"
            title="Download current view image"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700 rounded transition-colors hidden sm:flex"
            title="Toggle fullscreen"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>

          <button
            onClick={onClose}
            className="p-2 text-slate-300 hover:text-white bg-red-600/80 hover:bg-red-600 rounded transition-colors ml-1"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div
        className="flex-1 relative flex items-center justify-center overflow-hidden cursor-grab active:cursor-grabbing p-4"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handlePrev();
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-slate-700/50 hover:border-blue-500 transition-all shadow-xl backdrop-blur-sm group"
              title="Previous Image (Left Arrow)"
            >
              <ChevronLeft className="h-6 w-6 transition-transform group-hover:-translate-x-0.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                handleNext();
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-30 p-3.5 rounded-full bg-slate-900/80 hover:bg-blue-600 text-white border border-slate-700/50 hover:border-blue-500 transition-all shadow-xl backdrop-blur-sm group"
              title="Next Image (Right Arrow)"
            >
              <ChevronRight className="h-6 w-6 transition-transform group-hover:translate-x-0.5" />
            </button>
          </>
        )}

        {/* The Transformed Image */}
        <div
          className="transition-transform duration-100 ease-out flex items-center justify-center max-w-full max-h-full"
          style={{
            transform: `translate(${position.x}px, ${position.y}px)`,
          }}
        >
          <img
            ref={imageRef}
            src={currentImage.src}
            alt={currentImage.label}
            draggable={false}
            className="max-h-[72vh] max-w-[85vw] object-contain rounded-lg shadow-2xl transition-all pointer-events-none"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg) scaleX(${flipH ? -1 : 1}) scaleY(${flipV ? -1 : 1})`,
              transformOrigin: 'center center',
            }}
          />
        </div>

        {/* Zoom & Rotation Floating Control Pill */}
        <div className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-30 bg-slate-900/90 border border-slate-700/80 backdrop-blur-md rounded-full shadow-2xl px-3 py-1.5 flex items-center gap-1 sm:gap-2">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut className="h-4 w-4" />
          </button>
          <button
            onClick={() => {
              setZoom(1);
              setPosition({ x: 0, y: 0 });
            }}
            className="px-2 py-0.5 text-xs font-mono font-bold text-slate-300 hover:text-blue-400 transition-colors"
            title="Click to reset zoom to 100%"
          >
            {Math.round(zoom * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5 sm:mx-1" />

          {/* Rotation controls */}
          <button
            onClick={handleRotateCCW}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="Rotate 90° Left"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
          <button
            onClick={handleRotateCW}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="Rotate 90° Right (R)"
          >
            <RotateCw className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5 sm:mx-1" />

          {/* Flip controls */}
          <button
            onClick={handleFlipH}
            className={`p-1.5 rounded-full transition-colors ${
              flipH ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Flip Horizontal (F)"
          >
            <FlipHorizontal className="h-4 w-4" />
          </button>
          <button
            onClick={handleFlipV}
            className={`p-1.5 rounded-full transition-colors ${
              flipV ? 'bg-blue-600 text-white' : 'text-slate-300 hover:text-white hover:bg-slate-800'
            }`}
            title="Flip Vertical"
          >
            <FlipVertical className="h-4 w-4" />
          </button>

          <div className="h-4 w-px bg-slate-700 mx-0.5 sm:mx-1" />

          {/* Reset all transforms */}
          <button
            onClick={resetTransform}
            className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-full transition-colors"
            title="Reset All Adjustments (0)"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Bottom Thumbnails Strip */}
      {images.length > 1 && (
        <div className="h-20 bg-slate-900/90 border-t border-slate-800/80 px-4 flex items-center justify-center gap-2 overflow-x-auto custom-scrollbar z-20 shrink-0">
          {images.map((img, idx) => {
            const isActive = idx === currentIndex;
            return (
              <button
                key={img.id || idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  resetTransform();
                }}
                className={`relative group h-14 w-14 rounded-lg overflow-hidden border-2 transition-all shrink-0 bg-slate-800 ${
                  isActive
                    ? 'border-blue-500 scale-105 shadow-md shadow-blue-500/30'
                    : 'border-slate-700/60 opacity-60 hover:opacity-100 hover:border-slate-500'
                }`}
              >
                <img src={img.src} alt={img.label} className="w-full h-full object-cover" />
                <span className="absolute inset-x-0 bottom-0 bg-slate-950/80 text-[8px] font-bold text-center text-slate-200 py-0.5 truncate px-0.5">
                  {img.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageLightboxModal;

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getOrders } from '../services/auth.service';
import { getOrderStatuses } from '../services/admin.service';
import { useAuth } from '../context/AuthContext';
import {
  Search, Filter, Loader2, RefreshCw, FolderArchive, Download,
  Eye, ExternalLink, Package, Image as ImageIcon, Sparkles,
  CheckSquare, Square, Layers, Calendar, User, ArrowUpDown,
  Maximize2, RotateCw, CheckCircle2, ChevronRight, SlidersHorizontal,
  Factory, ListOrdered
} from 'lucide-react';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';
import { extractOrderImages, downloadSingleImage, downloadOrderZip, downloadBatchOrdersZip } from '../utils/mediaUtils';
import ImageLightboxModal from '../components/media/ImageLightboxModal';

const MediaPage = ({ isFactoryView = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isFactoryMode = isFactoryView || location.pathname.includes('/factory') || user?.role === 'production';

  // State
  const [orders, setOrders] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [debounceSearch, setDebounceSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [mediaTypeFilter, setMediaTypeFilter] = useState('all'); // 'all', 'render', 'upload'
  const [sortBy, setSortBy] = useState('createdAt');
  const [orderSort, setOrderSort] = useState('desc');
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [pagination, setPagination] = useState({});

  // Selection & Batch Action State
  const [selectedOrderIds, setSelectedOrderIds] = useState(new Set());
  const [isBatchDownloading, setIsBatchDownloading] = useState(false);
  const [batchProgress, setBatchProgress] = useState(null);

  // Single Order ZIP Downloading Map
  const [downloadingZipMap, setDownloadingZipMap] = useState({});

  // Lightbox Modal State
  const [lightbox, setLightbox] = useState({
    isOpen: false,
    order: null,
    images: [],
    initialIndex: 0,
  });

  // Load Statuses
  useEffect(() => {
    getOrderStatuses()
      .then((res) => {
        if (isFactoryMode) {
          setStatuses((res || []).filter((s) => s.isVisibleToProduction));
        } else {
          setStatuses(res || []);
        }
      })
      .catch(console.error);
  }, [isFactoryMode]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebounceSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Orders
  const fetchOrdersData = async () => {
    setLoading(true);
    try {
      const queryParams = {
        page,
        search: debounceSearch,
        sortBy,
        order: orderSort,
        limit,
        statusId: statusFilter,
      };
      if (isFactoryMode) {
        queryParams.isVisibleToProduction = 'true';
      }
      const response = await getOrders(queryParams);

      setOrders(response.orders || []);
      setPagination(response.pagination || {});
    } catch (error) {
      console.error('Failed to fetch orders for media:', error);
      toast.error('Failed to load order media');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
  }, [debounceSearch, statusFilter, limit]);

  useEffect(() => {
    fetchOrdersData();
  }, [page, debounceSearch, sortBy, orderSort, statusFilter, limit, isFactoryMode]);

  // Extract media items for each order and apply filters
  const ordersWithMedia = useMemo(() => {
    return orders
      .map((order) => {
        const allImages = extractOrderImages(order);
        let filteredImages = allImages;
        if (mediaTypeFilter === 'render') {
          filteredImages = allImages.filter((img) => img.category === 'render');
        } else if (mediaTypeFilter === 'upload') {
          filteredImages = allImages.filter((img) => img.category === 'upload');
        }
        return {
          order,
          allImages,
          images: filteredImages,
        };
      })
      .filter((item) => item.images.length > 0);
  }, [orders, mediaTypeFilter]);

  // Global Media Metrics
  const metrics = useMemo(() => {
    let totalImages = 0;
    let renderCount = 0;
    let uploadCount = 0;

    orders.forEach((order) => {
      const imgs = extractOrderImages(order);
      totalImages += imgs.length;
      imgs.forEach((img) => {
        if (img.category === 'render') renderCount++;
        else uploadCount++;
      });
    });

    return {
      totalOrdersWithMedia: ordersWithMedia.length,
      totalImages,
      renderCount,
      uploadCount,
    };
  }, [orders, ordersWithMedia]);

  // Handle Select All / Deselect All
  const handleToggleSelectAll = () => {
    if (selectedOrderIds.size === ordersWithMedia.length && ordersWithMedia.length > 0) {
      setSelectedOrderIds(new Set());
    } else {
      setSelectedOrderIds(new Set(ordersWithMedia.map((item) => item.order.id)));
    }
  };

  const handleToggleSelectOrder = (orderId) => {
    setSelectedOrderIds((prev) => {
      const next = new Set(prev);
      if (next.has(orderId)) {
        next.delete(orderId);
      } else {
        next.add(orderId);
      }
      return next;
    });
  };

  // Open Lightbox
  const handleOpenLightbox = (order, images, index = 0) => {
    setLightbox({
      isOpen: true,
      order,
      images,
      initialIndex: index,
    });
  };

  // Single Order ZIP Download
  const handleDownloadOrderZip = async (order, images) => {
    setDownloadingZipMap((prev) => ({ ...prev, [order.id]: true }));
    try {
      toast.loading(`Packaging #${order.orderNumber} images...`, { id: `zip-${order.id}` });
      await downloadOrderZip(order, images);
      toast.success(`Downloaded #${order.orderNumber} All Images ZIP`, { id: `zip-${order.id}` });
    } catch (err) {
      toast.error(err.message || 'Failed to download ZIP', { id: `zip-${order.id}` });
    } finally {
      setDownloadingZipMap((prev) => ({ ...prev, [order.id]: false }));
    }
  };

  // Batch Download Selected Orders ZIP
  const handleDownloadBatchZip = async () => {
    const selectedItems = ordersWithMedia.filter((item) => selectedOrderIds.has(item.order.id));
    if (selectedItems.length === 0) {
      toast.error('Please select at least one order to download');
      return;
    }

    setIsBatchDownloading(true);
    try {
      toast.loading(`Creating Master Batch ZIP for ${selectedItems.length} orders...`, { id: 'batch-zip' });
      await downloadBatchOrdersZip(selectedItems, (curr, total, label) => {
        setBatchProgress(`Processing ${curr}/${total}: ${label}`);
      });
      toast.success(`Batch ZIP downloaded successfully!`, { id: 'batch-zip' });
    } catch (err) {
      toast.error(err.message || 'Batch download failed', { id: 'batch-zip' });
    } finally {
      setIsBatchDownloading(false);
      setBatchProgress(null);
    }
  };

  // Helper for status badge
  const getStatusBadge = (orderStatus, fallbackStatus) => {
    const name = orderStatus?.name || fallbackStatus?.replace(/_/g, ' ') || 'Unknown';
    const color = orderStatus?.color || '#3b82f6';
    return (
      <span
        className="px-2.5 py-1 rounded text-[11px] font-bold uppercase tracking-wider flex items-center shrink-0"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <span className="w-1.5 h-1.5 rounded-full mr-1.5 inline-block" style={{ backgroundColor: color }} />
        {name}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-[1440px] mx-auto pb-12 animate-in fade-in duration-300">
      {/* Factory Mode Banner */}
      {isFactoryMode && (
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white rounded-xl p-4.5 shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-blue-700/40">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-blue-500/20 text-blue-300 rounded-xl border border-blue-400/30 shrink-0">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Factory Media Gallery
                <span className="text-[10px] bg-blue-500/30 text-blue-200 border border-blue-400/30 px-2.5 py-0.5 rounded-full uppercase tracking-wider font-bold">
                  Factory Queue Only
                </span>
              </h3>
              <p className="text-xs text-blue-200 mt-0.5">
                Exclusively displaying 3D renders, cap images, and custom uploaded assets for orders sent to the factory.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate('/dashboard/factory')}
            className="text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 px-4 py-2 rounded-lg shadow transition-colors flex items-center gap-1.5 self-start sm:self-center shrink-0 cursor-pointer"
          >
            <ListOrdered className="w-4 h-4 text-blue-900" /> Back to Factory Queue
          </button>
        </div>
      )}

      {/* Top Banner / Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Orders with Media</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Package className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-2">{ordersWithMedia.length}</p>
          <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">Categorized by order</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Media Assets</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <ImageIcon className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-indigo-600 mt-2">{metrics.totalImages}</p>
          <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">Renders & custom uploads</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">3D Cap Renders</span>
            <span className="p-2 bg-purple-50 text-purple-600 rounded-lg">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-purple-600 mt-2">{metrics.renderCount}</p>
          <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">Multi-angle visual renders</span>
        </div>

        <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Custom Uploads</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <Layers className="h-4 w-4" />
            </span>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-2">{metrics.uploadCount}</p>
          <span className="text-[11px] font-semibold text-slate-400 mt-0.5 block">Linings, artwork & badges</span>
        </div>
      </div>

      {/* Control & Filter Bar */}
      <div className="bg-white border border-slate-200/80 rounded-xl p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
          
          {/* Search Input */}
          <div className="relative flex-1 min-w-[260px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by Order # (e.g. 1002), Customer Name, or Email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
            />
          </div>

          {/* Filters Group */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 outline-none cursor-pointer"
              >
                <option value="all">All Order Statuses</option>
                {statuses.filter((s) => s.isActive).map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Media Type Filter Toggle */}
            <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setMediaTypeFilter('all')}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-md transition-all',
                  mediaTypeFilter === 'all'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                All Assets
              </button>
              <button
                onClick={() => setMediaTypeFilter('render')}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-md transition-all',
                  mediaTypeFilter === 'render'
                    ? 'bg-white text-purple-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                3D Renders
              </button>
              <button
                onClick={() => setMediaTypeFilter('upload')}
                className={cn(
                  'px-3 py-1 text-xs font-bold rounded-md transition-all',
                  mediaTypeFilter === 'upload'
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                )}
              >
                Uploads
              </button>
            </div>

            {/* Refresh Button */}
            <button
              onClick={fetchOrdersData}
              disabled={loading}
              className="p-2.5 text-slate-500 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors"
              title="Refresh Media Gallery"
            >
              <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin text-blue-600')} />
            </button>
          </div>
        </div>

        {/* Action Header: Bulk Selection & ZIP Download */}
        <div className="flex flex-wrap items-center justify-between pt-3 border-t border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={handleToggleSelectAll}
              className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors"
            >
              {selectedOrderIds.size === ordersWithMedia.length && ordersWithMedia.length > 0 ? (
                <CheckSquare className="h-4 w-4 text-blue-600" />
              ) : (
                <Square className="h-4 w-4 text-slate-400" />
              )}
              <span>
                Select All Visible ({selectedOrderIds.size}/{ordersWithMedia.length})
              </span>
            </button>

            {selectedOrderIds.size > 0 && (
              <span className="text-xs bg-blue-50 text-blue-700 font-bold px-2 py-0.5 rounded-full border border-blue-200">
                {selectedOrderIds.size} Orders Selected
              </span>
            )}
          </div>

          <div className="flex items-center gap-3">
            {selectedOrderIds.size > 0 && (
              <button
                onClick={handleDownloadBatchZip}
                disabled={isBatchDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50"
              >
                {isBatchDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderArchive className="h-4 w-4" />
                )}
                <span>Download Selected as ZIP ({selectedOrderIds.size})</span>
              </button>
            )}

            <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
              <span>Show</span>
              <select
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value))}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 text-slate-700 outline-none font-bold"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span>orders</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Order-Wise Categorized Gallery List */}
      {loading ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center space-y-4">
          <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
          <p className="text-slate-600 font-bold text-sm">Loading Order Media Library...</p>
        </div>
      ) : ordersWithMedia.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-16 flex flex-col items-center justify-center text-center space-y-3">
          <div className="p-4 bg-slate-50 rounded-full text-slate-400">
            <ImageIcon className="h-10 w-10" />
          </div>
          <h3 className="text-lg font-bold text-slate-800">No Order Media Found</h3>
          <p className="text-slate-500 text-xs max-w-sm">
            {search || statusFilter !== 'all' || mediaTypeFilter !== 'all'
              ? 'No media matches your current filters. Try changing your search or filter settings.'
              : 'When orders are placed with 3D cap renders or custom uploads, they will appear here organized order by order.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {ordersWithMedia.map(({ order, images, allImages }) => {
            const isSelected = selectedOrderIds.has(order.id);
            const isDownloadingThisZip = downloadingZipMap[order.id];

            return (
              <div
                key={order.id}
                className={cn(
                  'bg-white border rounded-xl shadow-sm transition-all overflow-hidden',
                  isSelected ? 'border-blue-400 ring-2 ring-blue-500/10' : 'border-slate-200/90 hover:border-slate-300'
                )}
              >
                {/* Order Header Container */}
                <div className="px-5 py-4 bg-slate-50/80 border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-4">
                  
                  {/* Left: Order Info & Checkbox */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <button
                      onClick={() => handleToggleSelectOrder(order.id)}
                      className="text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    >
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-400" />
                      )}
                    </button>

                    <div className="flex flex-wrap items-center gap-2 sm:gap-3 truncate">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-base font-black text-slate-900 tracking-tight">
                          #{order.orderNumber || order.id}
                        </span>
                        {getStatusBadge(order.orderStatus, order.status)}
                      </div>

                      <div className="h-4 w-px bg-slate-300 hidden sm:block" />

                      <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium truncate">
                        <User className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-800">
                          {order.customer?.name || `${order.customer?.firstName || ''} ${order.customer?.lastName || ''}`.trim() || 'Customer'}
                        </span>
                        <span className="text-slate-400 hidden md:inline">({order.customerEmail})</span>
                      </div>

                      <div className="h-4 w-px bg-slate-300 hidden md:block" />

                      <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                        <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>
                          {order.createdAt
                            ? new Date(order.createdAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                              })
                            : 'N/A'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Order Actions */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2.5 py-1 rounded-md shadow-2xs">
                      {images.length} {images.length === 1 ? 'Image' : 'Images'}
                    </span>

                    <button
                      onClick={() => handleDownloadOrderZip(order, images)}
                      disabled={isDownloadingThisZip}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs disabled:opacity-50"
                      title="Download all images for this order in a ZIP archive"
                    >
                      {isDownloadingThisZip ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <FolderArchive className="h-3.5 w-3.5" />
                      )}
                      <span>Download ZIP</span>
                    </button>

                    <button
                      onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 bg-white hover:bg-blue-50 border border-slate-200 rounded-lg transition-colors"
                      title="View full order details"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                {/* Order Images Grid */}
                <div className="p-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {images.map((image, idx) => {
                      return (
                        <div
                          key={image.id || idx}
                          className="group relative bg-[#fafafa] border border-slate-200 rounded-xl overflow-hidden hover:shadow-md hover:border-blue-400 transition-all duration-200 flex flex-col"
                        >
                          {/* Image Thumbnail Container */}
                          <div
                            onClick={() => handleOpenLightbox(order, images, idx)}
                            className="aspect-square w-full p-2 flex items-center justify-center relative cursor-pointer overflow-hidden bg-white"
                          >
                            <img
                              src={image.src}
                              alt={image.label}
                              className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                              loading="lazy"
                            />

                            {/* Hover Overlay with Action Buttons */}
                            <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 backdrop-blur-xs">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleOpenLightbox(order, images, idx);
                                }}
                                className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
                                title="Zoom & Fullscreen View"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  try {
                                    toast.loading(`Downloading ${image.label}...`, { id: `dl-${image.id}` });
                                    await downloadSingleImage(image, order);
                                    toast.success(`Downloaded ${image.label}`, { id: `dl-${image.id}` });
                                  } catch {
                                    toast.error('Download failed', { id: `dl-${image.id}` });
                                  }
                                }}
                                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-full transition-transform hover:scale-110 shadow-lg"
                                title="Download this image"
                              >
                                <Download className="h-4 w-4" />
                              </button>
                            </div>
                          </div>

                          {/* Image Footer / Label */}
                          <div className="p-2.5 bg-slate-50/90 border-t border-slate-100 flex flex-col gap-1">
                            <span className="font-bold text-xs text-slate-800 truncate" title={image.label}>
                              {image.label}
                            </span>
                            <div className="flex items-center justify-between text-[10px]">
                              <span
                                className={`font-extrabold uppercase px-1.5 py-0.5 rounded ${
                                  image.category === 'render'
                                    ? 'bg-purple-100 text-purple-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {image.category === 'render' ? '3D Render' : 'Upload'}
                              </span>
                              <button
                                onClick={() => handleOpenLightbox(order, images, idx)}
                                className="text-slate-400 hover:text-blue-600 font-bold transition-colors"
                              >
                                Zoom & View
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Footer */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
          <span className="text-xs font-bold text-slate-500">
            Page {pagination.currentPage} of {pagination.totalPages} ({pagination.totalCount} total orders)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={page >= pagination.totalPages}
              className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Interactive Lightbox Modal */}
      <ImageLightboxModal
        isOpen={lightbox.isOpen}
        onClose={() => setLightbox((prev) => ({ ...prev, isOpen: false }))}
        images={lightbox.images}
        initialIndex={lightbox.initialIndex}
        order={lightbox.order}
      />
    </div>
  );
};

export default MediaPage;

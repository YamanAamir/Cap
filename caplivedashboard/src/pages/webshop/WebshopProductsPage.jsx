import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Package, Check, X, Image as ImageIcon, ExternalLink, RefreshCw, Upload } from 'lucide-react';
import toast from 'react-hot-toast';
import RichTextEditor from '../../components/RichTextEditor';
import ConfirmModal from '../../components/common/ConfirmModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const WebshopProductsPage = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'primary',
    confirmText: 'Confirm',
    loading: false,
    onConfirm: null,
  });

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    shortDescription: '',
    longDescription: '',
    price: '',
    stockCount: 10,
    isActive: true,
    isOutOfStock: false,
    images: [],
  });

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/webshop/admin/products`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error(data.message || 'Failed to fetch products');
      }
    } catch (error) {
      console.error('Error fetching webshop products:', error);
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingProduct(null);
    setFormData({
      title: '',
      slug: '',
      shortDescription: '',
      longDescription: '',
      price: '',
      stockCount: 10,
      isActive: true,
      isOutOfStock: false,
      images: [],
    });
    setIsModalOpen(true);
  };

  const getImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
      return url;
    }
    const backendBase = API_URL.replace(/\/api\/?$/, '');
    return `${backendBase}${url.startsWith('/') ? '' : '/'}${url}`;
  };

  const parseImages = (imagesVal) => {
    if (Array.isArray(imagesVal)) return imagesVal.filter((img) => typeof img === 'string' && img.trim() !== '');
    if (typeof imagesVal === 'string') {
      try {
        const parsed = JSON.parse(imagesVal);
        if (Array.isArray(parsed)) return parsed.filter((img) => typeof img === 'string' && img.trim() !== '');
      } catch (e) {
        return imagesVal.trim() !== '' ? [imagesVal] : [];
      }
    }
    return [];
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      title: product.title || '',
      slug: product.slug || '',
      shortDescription: product.shortDescription || '',
      longDescription: product.longDescription || '',
      price: product.price || 0,
      stockCount: product.stockCount !== undefined ? product.stockCount : 0,
      isActive: product.isActive !== undefined ? product.isActive : true,
      isOutOfStock: product.isOutOfStock !== undefined ? product.isOutOfStock : false,
      images: parseImages(product.images),
    });
    setIsModalOpen(true);
  };

  // Handle Local File Selection (Preview only)
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    const newItems = [];
    files.forEach((file) => {
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`File "${file.name}" exceeds 10MB limit`);
        return;
      }
      newItems.push({
        file,
        preview: URL.createObjectURL(file),
        isNew: true,
      });
    });

    setFormData((prev) => ({
      ...prev,
      images: [...prev.images, ...newItems],
    }));

    e.target.value = '';
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData((prev) => {
      const target = prev.images[indexToRemove];
      if (typeof target === 'object' && target !== null && target.preview) {
        URL.revokeObjectURL(target.preview);
      }
      return {
        ...prev,
        images: prev.images.filter((_, idx) => idx !== indexToRemove),
      };
    });
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    if (!formData.title || !formData.price) {
      toast.error('Title and price are required');
      return;
    }

    const isEdit = Boolean(editingProduct);
    if (!isEdit) {
      executeSubmitProduct();
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Update Product',
        message: `Are you sure you want to save changes for "${formData.title}"?`,
        type: 'primary',
        confirmText: 'Save Changes',
        loading: false,
        onConfirm: executeSubmitProduct,
      });
    }
  };

  const executeSubmitProduct = async () => {
    try {
      setSubmitting(true);
      setConfirmModal((prev) => ({ ...prev, loading: true }));

      // Upload any new image files first
      const finalImages = [];
      for (const item of formData.images) {
        if (typeof item === 'string' && item.trim() !== '') {
          finalImages.push(item.trim());
        } else if (typeof item === 'object' && item !== null && item.file) {
          const uploadData = new FormData();
          uploadData.append('image', item.file);

          const res = await fetch(`${API_URL}/webshop/admin/upload`, {
            method: 'POST',
            body: uploadData,
          });

          const data = await res.json();
          if (data.success && data.url) {
            finalImages.push(data.url);
          } else {
            throw new Error(data.message || `Failed to upload image "${item.file.name}"`);
          }
        }
      }

      const payload = {
        ...formData,
        price: parseFloat(formData.price),
        stockCount: parseInt(formData.stockCount) || 0,
        images: finalImages,
      };

      const url = editingProduct
        ? `${API_URL}/webshop/admin/products/${editingProduct.id}`
        : `${API_URL}/webshop/admin/products`;
      const method = editingProduct ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(editingProduct ? 'Product updated successfully' : 'Product created successfully');
        setIsModalOpen(false);
        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        fetchProducts();
      } else {
        toast.error(data.message || 'Operation failed');
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error(error.message || 'Failed to save product');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestDelete = (product) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Product',
      message: `Are you sure you want to delete "${product.title}"? This product will be permanently removed from the store.`,
      type: 'danger',
      confirmText: 'Delete Product',
      loading: false,
      onConfirm: () => executeDeleteProduct(product.id),
    });
  };

  const executeDeleteProduct = async (id) => {
    try {
      setDeletingId(id);
      setConfirmModal((prev) => ({ ...prev, loading: true }));
      const res = await fetch(`${API_URL}/webshop/admin/products/${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Product deleted successfully');
        setConfirmModal((prev) => ({ ...prev, isOpen: false, loading: false }));
        fetchProducts();
      } else {
        toast.error(data.message || 'Delete failed');
        setConfirmModal((prev) => ({ ...prev, loading: false }));
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Failed to delete product');
      setConfirmModal((prev) => ({ ...prev, loading: false }));
    } finally {
      setDeletingId(null);
    }
  };

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);

  useEffect(() => {
    setPage(1);
  }, [searchQuery, limit]);

  const filteredProducts = products.filter(
    (p) =>
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.slug.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / limit) || 1;
  const paginatedProducts = filteredProducts.slice((page - 1) * limit, page * limit);

  return (
    <div className="animate-in fade-in duration-500 max-w-[1400px] mx-auto pb-12">
      {/* Confirm Action Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
      />

      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
        <div className="relative w-full md:w-[300px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="flex items-center gap-2 text-white text-xs font-bold px-4 py-2.5 rounded shadow-sm transition-colors bg-[#1e3a8a] hover:bg-blue-900"
        >
          <Plus className="h-4 w-4" /> ADD NEW PRODUCT
        </button>
      </div>

      {/* Table Section */}
      <div className="bg-white rounded border border-slate-200 overflow-x-auto relative">
        {loading && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-blue-100 overflow-hidden z-20">
            <div className="h-full bg-blue-500 animate-pulse w-1/3 rounded-r-full"></div>
          </div>
        )}

        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-[#fafafa] border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-bold text-slate-500">Product</th>
              <th className="px-6 py-4 font-bold text-slate-500">Slug</th>
              <th className="px-6 py-4 font-bold text-slate-500">Price</th>
              <th className="px-6 py-4 font-bold text-slate-500">Stock</th>
              <th className="px-6 py-4 font-bold text-slate-500">Status</th>
              <th className="px-6 py-4 font-bold text-slate-500 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.length === 0 && !loading ? (
              <tr>
                <td colSpan="6" className="px-6 py-8 text-center text-slate-500 font-medium">No products found.</td>
              </tr>
            ) : (
              paginatedProducts.map((product) => {
                const imgs = parseImages(product.images);
                const firstImg = imgs.length > 0 ? imgs[0] : null;
                const isDeletingThis = deletingId === product.id;
                return (
                  <tr key={product.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded bg-slate-100 border border-slate-200 overflow-hidden shrink-0 flex items-center justify-center">
                          {firstImg ? (
                            <img src={getImageUrl(firstImg)} alt={product.title} className="w-full h-full object-cover" />
                          ) : (
                            <ImageIcon className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-700">{product.title}</div>
                          <div className="text-xs text-slate-400 line-clamp-1 max-w-xs">
                            {product.shortDescription || 'No short description'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-600">{product.slug}</td>
                    <td className="px-6 py-4 font-bold text-slate-800">{product.price} DKK</td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          product.stockCount > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}
                      >
                        {product.stockCount} in stock
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`px-2.5 py-1 rounded text-xs font-bold ${
                          product.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenEditModal(product)}
                          disabled={isDeletingThis}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors disabled:opacity-50"
                          title="Edit Product"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleRequestDelete(product)}
                          disabled={isDeletingThis}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors disabled:opacity-50"
                          title="Delete Product"
                        >
                          {isDeletingThis ? (
                            <RefreshCw className="w-4 h-4 animate-spin text-red-600" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="mt-4 px-5 py-4 bg-slate-50 border border-slate-200 rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4 text-sm shrink-0">
        <div className="flex items-center gap-2 text-slate-600">
          <span>Show</span>
          <select
            value={limit}
            onChange={(e) => {
              setLimit(Number(e.target.value));
              setPage(1);
            }}
            className="px-2 py-1 text-xs border border-slate-200 rounded focus:outline-none focus:border-blue-500 bg-white font-bold"
          >
            {[5, 10, 20, 50, 100].map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>entries</span>
        </div>

        <div className="text-slate-500 font-medium">
          {filteredProducts.length > 0 ? (
            <>
              Showing <span className="font-bold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
              <span className="font-bold text-slate-800">{Math.min(page * limit, filteredProducts.length)}</span> of{' '}
              <span className="font-bold text-slate-800">{filteredProducts.length}</span> products
            </>
          ) : (
            'No products to display'
          )}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={page === 1}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, index, array) => {
                const showEllipsis = index > 0 && p - array[index - 1] > 1;
                return (
                  <React.Fragment key={p}>
                    {showEllipsis && <span className="px-2 text-slate-400">...</span>}
                    <button
                      onClick={() => setPage(p)}
                      className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                        page === p
                          ? 'bg-[#1e3a8a] text-white shadow-sm'
                          : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {p}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={page === totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded text-xs font-bold hover:bg-slate-50 transition-colors disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">
                {editingProduct ? 'Edit Product' : 'Add New Webshop Product'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                disabled={submitting}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors disabled:opacity-50"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRequestSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Product Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Premium Grad Cap"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Slug (URL Key)
                  </label>
                  <input
                    type="text"
                    placeholder="auto-generated-from-title"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Price (DKK) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 299.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    placeholder="10"
                    value={formData.stockCount}
                    onChange={(e) => setFormData({ ...formData, stockCount: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Short Description
                </label>
                <input
                  type="text"
                  placeholder="Brief 1-sentence summary"
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full px-3.5 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-[#1e3a8a] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Detailed Description (Rich Text)
                </label>
                <RichTextEditor
                  value={formData.longDescription}
                  onChange={(html) => setFormData({ ...formData, longDescription: html })}
                  placeholder="Describe product details, specifications, etc..."
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-[#1e3a8a] rounded border-slate-300 focus:ring-[#1e3a8a]"
                  />
                  Active (Visible in Webshop)
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-700 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isOutOfStock}
                    onChange={(e) => setFormData({ ...formData, isOutOfStock: e.target.checked })}
                    className="w-4 h-4 text-red-600 rounded border-slate-300 focus:ring-red-500"
                  />
                  Mark as Out of Stock
                </label>
              </div>

              {/* Product Images File Upload Section */}
              <div className="space-y-3 pt-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Product Images (Upload Files)
                </label>

                {/* Previews Grid */}
                {formData.images.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                    {formData.images.map((item, index) => {
                      const isObj = typeof item === 'object' && item !== null && item.preview;
                      const displaySrc = isObj ? item.preview : getImageUrl(item);
                      return (
                        <div
                          key={index}
                          className="relative w-full h-24 rounded-xl border border-slate-200 overflow-hidden group bg-slate-50 shadow-sm"
                        >
                          <img src={displaySrc} alt={`Product image ${index + 1}`} className="w-full h-full object-cover" />
                          {index === 0 && (
                            <span className="absolute top-1 left-1 bg-[#1e3a8a] text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow">
                              Main
                            </span>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(index)}
                            className="absolute inset-0 bg-slate-900/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            title="Remove image"
                          >
                            <Trash2 className="w-5 h-5 text-red-400 hover:text-red-200" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* File Dropzone Input */}
                <label className="border-2 border-dashed border-slate-300 hover:border-[#1e3a8a] bg-slate-50 hover:bg-blue-50/50 rounded-xl p-5 text-center cursor-pointer flex flex-col items-center justify-center gap-2 transition-colors">
                  <Upload className="w-6 h-6 text-[#1e3a8a]" />
                  <div>
                    <span className="text-sm font-bold text-slate-800">Click to upload product images</span>
                    <p className="text-xs text-slate-400">Supports JPG, PNG, WEBP files</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  disabled={submitting}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-[#1e3a8a] text-white rounded-lg text-sm font-semibold hover:bg-blue-900 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        type={confirmModal.type}
        confirmText={confirmModal.confirmText}
        loading={confirmModal.loading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default WebshopProductsPage;

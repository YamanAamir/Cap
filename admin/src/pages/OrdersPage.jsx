import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getOrders } from '../services/auth.service';
import { Card, Button, Input, Badge } from '../components/ui';
import { Search, RefreshCw, ChevronLeft, ChevronRight, MoreHorizontal, ArrowUpDown, Eye, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const OrdersPage = () => {
  const [data, setData] = useState({ orders: [], pagination: {} });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('createdAt');
  const [order, setOrder] = useState('desc');
  const [debounceSearch, setDebounceSearch] = useState('');
  const navigate = useNavigate();

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebounceSearch(search), 500);
    return () => clearTimeout(timer);
  }, [search]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await getOrders({
        page,
        search: debounceSearch,
        sortBy,
        order,
        limit: 50
      });
      setData(response);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, debounceSearch, sortBy, order]);

  const handleSort = (field) => {
    if (sortBy === field) {
      setOrder(order === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setOrder('desc');
    }
  };

  const renderPagination = () => {
    const { totalPages, currentPage } = data.pagination;
    if (!totalPages || totalPages <= 1) return null;

    const pages = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');

      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        if (!pages.includes(i)) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center justify-center space-x-1 mt-4">
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage === 1}
          onClick={() => setPage(currentPage - 1)}
          className="rounded-md"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        {pages.map((p, i) => (
          p === '...' ? (
            <span key={`dots-${i}`} className="px-3 py-2 text-muted-foreground">...</span>
          ) : (
            <Button
              key={p}
              variant={currentPage === p ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setPage(p)}
              className={cn(
                "w-10 h-10 p-0 rounded-md transition-all font-medium text-xs",
                currentPage === p ? "shadow-md scale-105" : "hover:text-primary"
              )}
            >
              {p}
            </Button>
          )
        ))}
        <Button
          variant="outline"
          size="icon"
          disabled={currentPage === totalPages}
          onClick={() => setPage(currentPage + 1)}
          className="rounded-md"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input
            placeholder="Search all orders..."
            className="pl-10 h-11 border-gray-200 bg-white shadow-sm focus:border-primary focus:ring-1 focus:ring-primary/20"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchOrders}
            className={cn("rounded-md shadow-sm bg-white", loading && "opacity-50 pointer-events-none")}
          >
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Refresh
          </Button>
        </div>
      </div>

      <Card className="relative overflow-hidden shadow-lg border-none ring-1 ring-black/5 bg-white rounded-xl">
        {loading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/80 border-b">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('orderNumber')}>
                  <div className="flex items-center">Order # <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest">Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors" onClick={() => handleSort('customerEmail')}>
                  <div className="flex items-center">Customer <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest cursor-pointer hover:text-primary transition-colors text-right" onClick={() => handleSort('totalPrice')}>
                  <div className="flex items-center justify-end">Amount <ArrowUpDown className="ml-2 h-3 w-3 opacity-50" /></div>
                </th>
                <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {data.orders.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500 font-medium bg-gray-50/30">
                    No orders found matching your criteria.
                  </td>
                </tr>
              ) : (
                data.orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/80 transition-all group">
                    <td className="px-6 py-5 whitespace-nowrap">
                      <span className="font-bold text-gray-900 group-hover:text-primary transition-colors">{order.orderNumber}</span>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-gray-800">{order.customerEmail}</span>
                        <span className="text-[10px] text-gray-400 font-mono">ID: #{order.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right font-bold text-gray-900">
                      {new Intl.NumberFormat('en-US', { style: 'currency', currency: order.currency }).format(order.totalPrice)}
                    </td>
                    <td className="px-6 py-5 whitespace-nowrap text-right">
                      <Button
                        variant="primary"
                        size="sm"
                        className="rounded-lg h-9 px-4 shadow-sm hover:shadow-md transition-all active:scale-95"
                        onClick={() => navigate(`/dashboard/orders/${order.id}`)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </td>
                  </tr>
                ))
              )}
              {loading && data.orders.length === 0 && (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan="5" className="px-6 py-5 h-16">
                      <div className="h-4 bg-gray-100 rounded w-full"></div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="flex flex-col items-center justify-between pb-8">
        <p className="text-sm text-muted-foreground font-medium mb-4">
          Showing <span className="text-foreground font-bold">{data.orders.length}</span> of <span className="text-foreground font-bold">{data.pagination.totalCount || 0}</span> orders
        </p>
        {renderPagination()}
      </div>
    </div>
  );
};

export default OrdersPage;

'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Price from '@/components/Price';
import Toast from '@/components/Toast';
import { getPusherClient } from '@/lib/pusher-client';

type OrderTab = 'active' | 'history' | 'stats';

export default function AdminOrdersPage() {
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  
  const [activeTab, setActiveTab] = useState<OrderTab>('active');
  const [orders, setOrders] = useState<any[]>([]);
  const [historyOrders, setHistoryOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // CSV Export functions
  const generateCSVExport = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayOrders = orders.filter(o => {
      const orderDate = new Date(o.createdAt).toISOString().split('T')[0];
      return orderDate === today && o.status === 'completed';
    });
    
    const headers = ['Поръчка #', 'Маса', 'Дата/Час', 'Продукт', 'Количество', 'Цена', 'Общо поръчка', 'Статус'];
    const rows = todayOrders.flatMap(order => 
      order.items.map((item: any, idx: number) => [
        order.orderNumber,
        order.tableNumber,
        new Date(order.createdAt).toLocaleString('bg-BG'),
        item.productName,
        item.quantity,
        Number(item.priceBgn).toFixed(2),
        idx === 0 ? Number(order.totalBgn).toFixed(2) : '',
        idx === 0 ? order.status : ''
      ])
    );
    
    return [headers, ...rows];
  };
  
  const downloadCSV = (data: any[][], filename: string) => {
    const csvContent = data.map(row => row.join(',')).join('\n');
    const BOM = '\uFEFF'; // UTF-8 BOM for Excel
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  // Filters for history (temporary state - not applied yet)
  const [tempFilters, setTempFilters] = useState({
    dateFrom: new Date().toISOString().split('T')[0], // Today
    dateTo: new Date().toISOString().split('T')[0],
    tableNumber: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  // Applied filters (used for API calls)
  const [appliedFilters, setAppliedFilters] = useState({
    dateFrom: new Date().toISOString().split('T')[0],
    dateTo: new Date().toISOString().split('T')[0],
    tableNumber: '',
    status: '',
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 50,
    totalCount: 0,
    totalPages: 0
  });
  
  const [historyRevenue, setHistoryRevenue] = useState({
    totalBgn: 0,
    totalEur: 0,
    ordersCount: 0
  });
  
  // Stats data
  const [revenueStats, setRevenueStats] = useState<any>(null);
  const [productStats, setProductStats] = useState<any>(null);
  const [tableStats, setTableStats] = useState<any>(null);
  const [statsLoading, setStatsLoading] = useState(false);
  
  // Selected order for modal
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);

  // Load active orders
  useEffect(() => {
    loadActiveOrders();
    
    // Setup Pusher for real-time updates
    const pusher = getPusherClient();
    const channel = pusher.subscribe('staff-channel');
    
    channel.bind('new-order', (data: any) => {
      setOrders(prev => [data, ...prev]);
    });
    
    channel.bind('order-status-change', (data: any) => {
      setOrders(prev => prev.map(order => 
        order.id === data.orderId 
          ? { ...order, status: data.status }
          : order
      ));
    });
    
    return () => {
      channel.unbind_all();
      pusher.unsubscribe('staff-channel');
    };
  }, []);
  
  // Load history when applied filters or page changes
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistory();
    }
  }, [activeTab, appliedFilters, pagination.page]);
  
  // Load stats when tab changes
  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats();
    }
  }, [activeTab]);

  async function loadActiveOrders() {
    try {
      const response = await fetch('/api/orders/all');
      const data = await response.json();
      setOrders(data.orders || []);
      setLoading(false);
    } catch (error) {
      console.error('Load active orders error:', error);
      setToast({ message: 'Грешка при зареждане на поръчките', type: 'error' });
      setLoading(false);
    }
  }

  async function loadHistory() {
    setHistoryLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(appliedFilters.dateFrom && { dateFrom: appliedFilters.dateFrom }),
        ...(appliedFilters.dateTo && { dateTo: appliedFilters.dateTo }),
        ...(appliedFilters.tableNumber && { tableNumber: appliedFilters.tableNumber }),
        ...(appliedFilters.status && { status: appliedFilters.status }),
        sortBy: appliedFilters.sortBy,
        sortOrder: appliedFilters.sortOrder
      });
      
      const response = await fetch(`/api/orders/history?${params}`);
      const data = await response.json();
      
      setHistoryOrders(data.orders || []);
      setPagination(prev => ({ ...prev, ...data.pagination }));
      setHistoryRevenue(data.revenue);
      setHistoryLoading(false);
    } catch (error) {
      console.error('Load history error:', error);
      setToast({ message: 'Грешка при зареждане на историята', type: 'error' });
      setHistoryLoading(false);
    }
  }

  async function loadStats() {
    setStatsLoading(true);
    try {
      const [revenueRes, productsRes, tablesRes] = await Promise.all([
        fetch('/api/stats/revenue'),
        fetch('/api/stats/products?period=today'),
        fetch('/api/stats/tables?period=today')
      ]);
      
      const [revenueData, productsData, tablesData] = await Promise.all([
        revenueRes.json(),
        productsRes.json(),
        tablesRes.json()
      ]);
      
      setRevenueStats(revenueData);
      setProductStats(productsData);
      setTableStats(tablesData);
      setStatsLoading(false);
    } catch (error) {
      console.error('Load stats error:', error);
      setToast({ message: 'Грешка при зареждане на статистиките', type: 'error' });
      setStatsLoading(false);
    }
  }

  const handleFilterChange = (key: string, value: string) => {
    setTempFilters(prev => ({ ...prev, [key]: value }));
  };
  
  const applyFilters = () => {
    setAppliedFilters(tempFilters);
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('Сигурен ли си, че искаш да изтриеш тази поръчка?\n\nТова действие е необратимо!')) {
      return;
    }
    
    try {
      const response = await fetch(`/api/orders/${orderId}/delete`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setToast({ message: '✅ Поръчката е изтрита успешно', type: 'success' });
        setShowOrderModal(false);
        if (activeTab === 'active') {
          loadActiveOrders();
        } else {
          loadHistory();
        }
      } else {
        const data = await response.json();
        setToast({ message: data.error || 'Грешка при изтриване', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Грешка при връзка', type: 'error' });
    }
  };

  const activeOrders = orders.filter(o => o.status !== 'completed' && o.status !== 'cancelled');
  const completedTodayOrders = orders.filter(o => o.status === 'completed');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="logo-container h-64 w-64 md:h-96 md:w-96 mx-auto mb-10 animate-pulse-glow">
            <Image 
              src="/bg/luna-logo.svg"
              alt="LUNA Logo" 
              width={384}
              height={384}
              className="h-64 w-64 md:h-96 md:w-96"
              priority
            />
          </div>
          <p className="text-white text-3xl font-medium">Зареждане на поръчки...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      
      {/* Header with Tabs */}
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Поръчки & Статистики</h1>
        
        <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab('active')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'active'
                ? 'bg-white text-black'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            🟢 Активни ({activeOrders.length})
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'history'
                ? 'bg-white text-black'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            📋 История
          </button>
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex-1 px-6 py-3 rounded-lg font-semibold transition-all ${
              activeTab === 'stats'
                ? 'bg-white text-black'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            📊 Статистики
          </button>
        </div>
      </div>

      {/* Active Orders Tab */}
      {activeTab === 'active' && (
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-white mb-4">
              Активни поръчки ({activeOrders.length})
            </h2>
          </div>
          
          {activeOrders.length === 0 ? (
            <div className="text-center py-20 bg-gray-800 rounded-xl">
              <p className="text-gray-200 text-xl">Няма активни поръчки</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeOrders.map((order: any) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderModal(true);
                  }}
                  className="bg-gray-800 rounded-xl p-6 border-2 border-gray-700 cursor-pointer hover:border-white/40 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        Поръчка #{order.orderNumber}
                      </div>
                      <div className="text-lg text-gray-300">
                        Маса {order.tableNumber}
                      </div>
                      {order.createdAt && (
                        <div className="text-sm text-gray-400 mt-1">
                          {new Date(order.createdAt).toLocaleString('bg-BG', {
                            day: '2-digit',
                            month: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </div>
                      )}
                    </div>
                    <div className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      order.status === 'pending' ? 'bg-yellow-500/20 text-yellow-300' :
                      order.status === 'preparing' ? 'bg-blue-500/20 text-blue-300' :
                      order.status === 'ready' ? 'bg-green-500/20 text-green-300' : ''
                    }`}>
                      {order.status === 'pending' ? 'Нова' :
                       order.status === 'preparing' ? 'В процес' :
                       order.status === 'ready' ? 'Готова' : order.status}
                    </div>
                  </div>

                  <div className="mb-4 space-y-2">
                    {order.items && order.items.slice(0, 3).map((item: any) => (
                      <div key={item.id} className="flex justify-between text-gray-200 text-sm">
                        <span>{item.quantity}x {item.productName}</span>
                        <Price priceBgn={Number(item.priceBgn)} className="text-gray-200" />
                      </div>
                    ))}
                    {order.items && order.items.length > 3 && (
                      <div className="text-gray-400 text-sm">
                        +{order.items.length - 3} още...
                      </div>
                    )}
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span>Общо:</span>
                      <Price priceBgn={Number(order.totalBgn)} className="text-xl font-bold text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* Today's Completed */}
          <div className="mt-10">
            <h2 className="text-2xl font-bold text-white mb-4">
              Завършени днес ({completedTodayOrders.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {completedTodayOrders.slice(0, 6).map((order: any) => (
                <div
                  key={order.id}
                  onClick={() => {
                    setSelectedOrder(order);
                    setShowOrderModal(true);
                  }}
                  className="bg-gray-800 rounded-xl p-6 border-2 border-green-500/50 opacity-75 cursor-pointer hover:opacity-100 transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-2xl font-bold text-white">
                        Поръчка #{order.orderNumber}
                      </div>
                      <div className="text-lg text-gray-300">
                        Маса {order.tableNumber}
                      </div>
                    </div>
                    <div className="px-3 py-1 rounded-full text-sm font-semibold bg-green-500/20 text-green-300">
                      ✓ Завършена
                    </div>
                  </div>

                  <div className="border-t border-gray-700 pt-3">
                    <div className="flex justify-between text-xl font-bold text-white">
                      <span>Общо:</span>
                      <Price priceBgn={Number(order.totalBgn)} className="text-xl font-bold text-white" />
                    </div>
                    {order.completedAt && (
                      <p className="text-sm text-gray-400 mt-2">
                        {new Date(order.completedAt).toLocaleTimeString('bg-BG')}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div>
          {/* Filters */}
          <div className="bg-gray-800 rounded-xl p-6 mb-6">
            <h3 className="text-xl font-bold text-white mb-4">Филтри</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-300 mb-2">От дата</label>
                <input
                  type="date"
                  value={tempFilters.dateFrom}
                  onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">До дата</label>
                <input
                  type="date"
                  value={tempFilters.dateTo}
                  onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Маса</label>
                <input
                  type="number"
                  value={tempFilters.tableNumber}
                  onChange={(e) => handleFilterChange('tableNumber', e.target.value)}
                  placeholder="Всички"
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-300 mb-2">Статус</label>
                <select
                  value={tempFilters.status}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
                >
                  <option value="">Всички</option>
                  <option value="completed">Завършени</option>
                  <option value="cancelled">Отменени</option>
                  <option value="pending">Чакащи</option>
                  <option value="preparing">В процес</option>
                  <option value="ready">Готови</option>
                </select>
              </div>
            </div>
            
            {/* Search Button */}
            <div className="mt-4 flex gap-3">
              <button
                onClick={applyFilters}
                className="px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg font-semibold transition-all shadow-lg"
              >
                🔍 Търси
              </button>
              <button
                onClick={() => {
                  const today = new Date().toISOString().split('T')[0];
                  setTempFilters({
                    dateFrom: today,
                    dateTo: today,
                    tableNumber: '',
                    status: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  });
                  setAppliedFilters({
                    dateFrom: today,
                    dateTo: today,
                    tableNumber: '',
                    status: '',
                    sortBy: 'createdAt',
                    sortOrder: 'desc'
                  });
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-all"
              >
                🔄 Изчисти
              </button>
            </div>
            
            {/* Revenue Summary */}
              <div className="mt-6 pt-6 border-t border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-1">Общ приход (BGN)</p>
                  <p className="text-2xl font-bold text-white">
                    {Number(historyRevenue.totalBgn).toFixed(2)} лв
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-1">Общ приход (EUR)</p>
                  <p className="text-2xl font-bold text-white">
                    €{Number(historyRevenue.totalEur).toFixed(2)}
                  </p>
                </div>
                <div className="bg-gray-700/50 rounded-lg p-4">
                  <p className="text-gray-300 text-sm mb-1">Брой поръчки</p>
                  <p className="text-2xl font-bold text-white">
                    {historyRevenue.ordersCount}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-gray-800 rounded-xl overflow-hidden">
            {historyLoading ? (
              <div className="flex items-center justify-center py-20">
                <div className="text-center">
                  <div className="inline-block w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
                  <p className="text-gray-300">Зареждане...</p>
                </div>
              </div>
            ) : historyOrders.length === 0 ? (
              <div className="text-center py-20">
                <p className="text-gray-300 text-xl">Няма поръчки за избрания период</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">#</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Маса</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Дата/Час</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Продукти</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Статус</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">Сума</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {historyOrders.map((order: any) => (
                    <tr
                      key={order.id}
                      onClick={() => {
                        setSelectedOrder(order);
                        setShowOrderModal(true);
                      }}
                      className="hover:bg-gray-700/50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4 text-white font-medium">#{order.orderNumber}</td>
                      <td className="px-6 py-4 text-gray-200">{order.tableNumber}</td>
                      <td className="px-6 py-4 text-gray-200 text-sm">
                        {new Date(order.createdAt).toLocaleString('bg-BG', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </td>
                      <td className="px-6 py-4 text-gray-200">
                        {order.items?.length || 0} бр.
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          order.status === 'completed' ? 'bg-green-500/20 text-green-300' :
                          order.status === 'cancelled' ? 'bg-red-500/20 text-red-300' :
                          'bg-gray-500/20 text-gray-300'
                        }`}>
                          {order.status === 'completed' ? '✓ Завършена' :
                           order.status === 'cancelled' ? '✗ Отменена' :
                           order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Price priceBgn={Number(order.totalBgn)} className="text-white font-semibold" />
                      </td>
                    </tr>
                    ))}
                </tbody>
              </table>
              
              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700">
                  <p className="text-gray-300 text-sm">
                    Страница {pagination.page} от {pagination.totalPages} ({pagination.totalCount} общо)
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                      disabled={!pagination.hasPrev}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      ← Назад
                    </button>
                    <button
                      onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                      disabled={!pagination.hasNext}
                      className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    >
                      Напред →
                    </button>
                  </div>
                </div>
              )}
            </div>
            )}
          </div>  {/* Close bg-gray-800 rounded-xl */}
        </div>
      )}

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div>
          {statsLoading ? (
            <div className="min-h-[60vh] flex items-center justify-center">
              <div className="text-center">
                <div className="logo-container h-32 w-32 md:h-48 md:w-48 mx-auto mb-6 animate-pulse-glow">
                  <Image 
                    src="/bg/luna-logo.svg"
                    alt="LUNA Logo" 
                    width={192}
                    height={192}
                    className="h-32 w-32 md:h-48 md:w-48"
                    priority
                  />
                </div>
                <p className="text-white text-2xl font-medium">Зареждане на статистики...</p>
              </div>
            </div>
          ) : revenueStats ? (
            <div className="space-y-8">
              {/* Revenue Cards */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">💰 Приходи</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
                    <p className="text-green-300 text-sm mb-2">Днес</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {Number(revenueStats.today.revenue || 0).toFixed(2)} лв
                    </p>
                    <p className="text-gray-300 text-sm">
                      {revenueStats.today.orders} поръчки
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
                    <p className="text-blue-300 text-sm mb-2">Тази седмица</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {Number(revenueStats.week.revenue || 0).toFixed(2)} лв
                    </p>
                    <p className="text-gray-300 text-sm">
                      {revenueStats.week.orders} поръчки
                    </p>
                  </div>
                  
                  <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
                    <p className="text-purple-300 text-sm mb-2">Този месец</p>
                    <p className="text-3xl font-bold text-white mb-1">
                      {Number(revenueStats.month.revenue || 0).toFixed(2)} лв
                    </p>
                    <p className="text-gray-300 text-sm">
                      {revenueStats.month.orders} поръчки
                    </p>
                  </div>
                </div>
              </div>

              {/* Last 7 Days Chart - Simple and Clean */}
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">📈 Последните 7 дни</h2>
                <div className="bg-gray-800 rounded-xl p-6">
                  {revenueStats.last7Days && revenueStats.last7Days.length > 0 ? (
                    <div>
                      {/* Chart Area */}
                      <div className="relative h-64 mb-4">
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between">
                          <div className="border-b border-dashed border-gray-700"></div>
                          <div className="border-b border-dashed border-gray-700"></div>
                          <div className="border-b border-dashed border-gray-700"></div>
                          <div className="border-b border-dashed border-gray-700"></div>
                        </div>
                        
                        {/* Bars with hover */}
                        <div className="absolute inset-0 flex items-end justify-between gap-2 px-2">
                          {revenueStats.last7Days.map((day: any, idx: number) => {
                            const maxRevenue = Math.max(...revenueStats.last7Days.map((d: any) => Number(d.revenue || 0)), 1);
                            const dayRevenue = Number(day.revenue || 0);
                            const heightPercent = (dayRevenue / maxRevenue) * 100;
                            
                            return (
                              <div key={idx} className="flex-1 relative group">
                                {/* Bar */}
                                <div 
                                  className="w-full bg-gradient-to-t from-green-600 to-green-400 rounded-t-lg transition-all hover:from-green-500 hover:to-green-300 relative"
                                  style={{ 
                                    height: `${heightPercent}%`,
                                    minHeight: dayRevenue > 0 ? '8px' : '2px'
                                  }}
                                >
                                  {/* Tooltip */}
                                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap shadow-xl border border-gray-700 z-20 pointer-events-none">
                                    <div className="font-bold mb-1">
                                      {new Date(day.date).toLocaleDateString('bg-BG', { 
                                        day: '2-digit', 
                                        month: 'short',
                                        weekday: 'short'
                                      })}
                                    </div>
                                    <div className="text-green-400 font-semibold">
                                      {dayRevenue.toFixed(2)} лв
                                    </div>
                                    <div className="text-gray-400">
                                      {day.orders} поръчки
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      
                      {/* Date labels */}
                      <div className="flex justify-between px-2">
                        {revenueStats.last7Days.map((day: any, idx: number) => (
                          <div key={idx} className="flex-1 text-center">
                            <p className="text-gray-400 text-xs">
                              {new Date(day.date).toLocaleDateString('bg-BG', { 
                                day: '2-digit', 
                                month: '2-digit' 
                              })}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-20">
                      <p className="text-gray-300">Няма данни за последните 7 дни</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Top Products */}
              {productStats && productStats.topProducts && productStats.topProducts.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">🏆 Топ продукти (днес)</h2>
                  <div className="bg-gray-800 rounded-xl overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-700">
                        <tr>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">#</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Продукт</th>
                          <th className="px-6 py-4 text-left text-sm font-semibold text-gray-200">Категория</th>
                          <th className="px-6 py-4 text-center text-sm font-semibold text-gray-200">Продадени</th>
                          <th className="px-6 py-4 text-right text-sm font-semibold text-gray-200">Приход</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-700">
                        {productStats.topProducts.slice(0, 10).map((product: any, idx: number) => (
                          <tr key={product.productId} className="hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4 text-gray-300 font-medium">{idx + 1}</td>
                            <td className="px-6 py-4 text-white font-medium">{product.productName}</td>
                            <td className="px-6 py-4 text-gray-300 text-sm">{product.category}</td>
                            <td className="px-6 py-4 text-center text-gray-200 font-semibold">
                              {product.quantitySold}
                            </td>
                            <td className="px-6 py-4 text-right text-white font-semibold">
                              {Number(product.revenue || 0).toFixed(2)} лв
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Table Performance */}
              {tableStats && tableStats.tables && tableStats.tables.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-4">🪑 Маси (днес)</h2>
                  <div className="bg-gray-800 rounded-xl p-6 mb-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-300 text-sm mb-1">Общо маси</p>
                        <p className="text-2xl font-bold text-white">
                          {tableStats.summary.totalTables}
                        </p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-300 text-sm mb-1">Активни днес</p>
                        <p className="text-2xl font-bold text-white">
                          {tableStats.summary.activeTables}
                        </p>
                      </div>
                      <div className="bg-gray-700/50 rounded-lg p-4">
                        <p className="text-gray-300 text-sm mb-1">Утилизация</p>
                        <p className="text-2xl font-bold text-white">
                          {tableStats.summary.utilizationPercent}%
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {tableStats.tables.slice(0, 6).map((table: any) => (
                      <div key={table.tableNumber} className="bg-gray-800 border border-gray-700 rounded-xl p-6">
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h3 className="text-xl font-bold text-white">
                              Маса {table.tableNumber}
                            </h3>
                            <p className="text-gray-400 text-sm">{table.location}</p>
                          </div>
                          <div className="text-2xl">🪑</div>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Поръчки:</span>
                            <span className="text-white font-semibold">{table.ordersCount}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Приход:</span>
                            <span className="text-white font-semibold">
                              {Number(table.totalRevenue || 0).toFixed(2)} лв
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-300">Ср. поръчка:</span>
                            <span className="text-white font-semibold">
                              {Number(table.avgOrderValue || 0).toFixed(2)} лв
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Export Button */}
              <div className="flex justify-center">
                <button
                  onClick={() => {
                    const csvData = generateCSVExport();
                    downloadCSV(csvData, `luna-orders-${new Date().toISOString().split('T')[0]}.csv`);
                    setToast({ message: '✅ Експорт завършен успешно!', type: 'success' });
                  }}
                  className="px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-xl font-bold text-lg transition-all shadow-lg"
                >
                  📥 Експорт CSV (Днес)
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-20 bg-gray-800 rounded-xl">
              <p className="text-gray-200 text-xl">Няма данни за статистики</p>
            </div>
          )}
        </div>
      )}

      {/* Order Details Modal - Coming in next response */}
      {showOrderModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-gray-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-700">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Поръчка #{selectedOrder.orderNumber}
                  </h2>
                  <p className="text-gray-300">
                    Маса {selectedOrder.tableNumber}
                  </p>
                </div>
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Order Details */}
              <div className="space-y-6">
                {/* Items */}
                <div>
                  <h3 className="text-xl font-semibold text-white mb-3">Продукти</h3>
                  <div className="space-y-2">
                    {selectedOrder.items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between items-center bg-gray-800 p-4 rounded-lg">
                        <div className="flex-1">
                          <p className="text-white font-medium">{item.productName}</p>
                          <p className="text-gray-400 text-sm">Количество: {item.quantity}</p>
                        </div>
                        <Price priceBgn={Number(item.priceBgn) * item.quantity} className="text-white font-semibold" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total */}
                <div className="border-t border-gray-700 pt-4">
                  <div className="flex justify-between items-center text-2xl font-bold">
                    <span className="text-white">Общо:</span>
                    <Price priceBgn={Number(selectedOrder.totalBgn)} className="text-white" />
                  </div>
                </div>

                {/* Timestamps */}
                <div className="bg-gray-800 rounded-lg p-4 space-y-2">
                  <p className="text-gray-300 text-sm">
                    Създадена: {new Date(selectedOrder.createdAt).toLocaleString('bg-BG')}
                  </p>
                  {selectedOrder.completedAt && (
                    <p className="text-gray-300 text-sm">
                      Завършена: {new Date(selectedOrder.completedAt).toLocaleString('bg-BG')}
                    </p>
                  )}
                  <p className="text-gray-300 text-sm">
                    Статус: <span className="font-semibold text-white">{selectedOrder.status}</span>
                  </p>
                </div>

                {/* Admin Actions */}
                <div className="flex gap-4">
                  <button
                    onClick={() => handleDeleteOrder(selectedOrder.id)}
                    className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-semibold transition-colors"
                  >
                    🗑️ Изтрий поръчка
                  </button>
                  <button
                    onClick={() => setShowOrderModal(false)}
                    className="flex-1 px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition-colors"
                  >
                    Затвори
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


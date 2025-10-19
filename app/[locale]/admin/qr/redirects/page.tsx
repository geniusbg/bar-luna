'use client';

import { useEffect, useState } from 'react';
import { Toast } from '@/components/Toast';

interface QRTable {
  id: string;
  tableNumber: number;
  tableName: string | null;
  isActive: boolean;
  redirectUrl: string | null;
  scanCount: number;
  lastScannedAt: string | null;
  qrCodeUrl: string | null;
}

export default function QRRedirectsPage() {
  const [tables, setTables] = useState<QRTable[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingTable, setEditingTable] = useState<number | null>(null);
  const [editUrl, setEditUrl] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/qr/redirects');
      const data = await response.json();
      setTables(data.tables || []);
    } catch (error) {
      console.error('Error loading tables:', error);
      setToast({ message: 'Грешка при зареждане', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (table: QRTable) => {
    setEditingTable(table.tableNumber);
    setEditUrl(table.redirectUrl || `/order?table=${table.tableNumber}`);
  };

  const cancelEditing = () => {
    setEditingTable(null);
    setEditUrl('');
  };

  const saveRedirect = async (tableNumber: number) => {
    try {
      const response = await fetch('/api/qr/redirects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          redirectUrl: editUrl
        })
      });

      if (response.ok) {
        setToast({ message: '✅ URL успешно запазен', type: 'success' });
        await loadTables();
        cancelEditing();
      } else {
        setToast({ message: 'Грешка при запазване', type: 'error' });
      }
    } catch (error) {
      console.error('Error saving redirect:', error);
      setToast({ message: 'Грешка при запазване', type: 'error' });
    }
  };

  const toggleActive = async (tableNumber: number, currentStatus: boolean) => {
    try {
      const response = await fetch('/api/qr/redirects', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tableNumber,
          isActive: !currentStatus
        })
      });

      if (response.ok) {
        setToast({ 
          message: !currentStatus ? '✅ Маса активирана' : '⛔ Маса деактивирана', 
          type: 'success' 
        });
        await loadTables();
      } else {
        setToast({ message: 'Грешка при промяна на статус', type: 'error' });
      }
    } catch (error) {
      console.error('Error toggling status:', error);
      setToast({ message: 'Грешка при промяна на статус', type: 'error' });
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Никога';
    const date = new Date(dateString);
    return date.toLocaleString('bg-BG', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-gray-400">Зареждане...</p>
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

      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">🔗 QR Redirects</h1>
        <p className="text-gray-400">
          Управление на URL адресите на QR кодовете. Промените се прилагат веднага без да принтирате нови кодове.
        </p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Всички маси</div>
          <div className="text-3xl font-bold text-white">{tables.length}</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Активни</div>
          <div className="text-3xl font-bold text-green-500">
            {tables.filter(t => t.isActive).length}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Деактивирани</div>
          <div className="text-3xl font-bold text-red-500">
            {tables.filter(t => !t.isActive).length}
          </div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Общо сканирания</div>
          <div className="text-3xl font-bold text-blue-500">
            {tables.reduce((sum, t) => sum + t.scanCount, 0)}
          </div>
        </div>
      </div>

      {/* Tables List */}
      <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-950 border-b border-gray-800">
              <tr>
                <th className="text-left px-4 py-3 text-gray-400 font-semibold">Маса</th>
                <th className="text-left px-4 py-3 text-gray-400 font-semibold">Статус</th>
                <th className="text-left px-4 py-3 text-gray-400 font-semibold">QR Link</th>
                <th className="text-left px-4 py-3 text-gray-400 font-semibold">Redirect URL</th>
                <th className="text-left px-4 py-3 text-gray-400 font-semibold">Сканирания</th>
                <th className="text-left px-4 py-3 text-gray-400 font-semibold">Последно</th>
                <th className="text-left px-4 py-3 text-gray-400 font-semibold">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {tables.map((table) => (
                <tr key={table.id} className={!table.isActive ? 'opacity-50' : ''}>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-white">
                      Маса {table.tableNumber}
                    </div>
                    {table.tableName && (
                      <div className="text-sm text-gray-400">{table.tableName}</div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(table.tableNumber, table.isActive)}
                      className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                        table.isActive
                          ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
                          : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                      }`}
                    >
                      {table.isActive ? '✓ Активна' : '✗ Спряна'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <code className="text-sm text-blue-400 bg-blue-500/10 px-2 py-1 rounded">
                      /t/{table.tableNumber}
                    </code>
                  </td>
                  <td className="px-4 py-3">
                    {editingTable === table.tableNumber ? (
                      <input
                        type="text"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full px-3 py-1 bg-gray-800 border border-gray-700 rounded text-white text-sm focus:border-white focus:outline-none"
                        placeholder="/order?table=1"
                      />
                    ) : (
                      <code className="text-sm text-gray-300">
                        {table.redirectUrl || `/order?table=${table.tableNumber}`}
                      </code>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-white font-semibold">{table.scanCount}</span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">
                    {formatDate(table.lastScannedAt)}
                  </td>
                  <td className="px-4 py-3">
                    {editingTable === table.tableNumber ? (
                      <div className="flex gap-2">
                        <button
                          onClick={() => saveRedirect(table.tableNumber)}
                          className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors"
                        >
                          ✓ Запази
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-sm rounded transition-colors"
                        >
                          ✗ Откажи
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => startEditing(table)}
                        className="px-3 py-1 bg-white hover:bg-gray-200 text-black text-sm rounded transition-colors"
                      >
                        ✎ Редактирай
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-8 bg-blue-500/10 border border-blue-500/30 rounded-lg p-6">
        <h3 className="text-blue-400 font-semibold mb-2">💡 Как работят динамичните QR кодове?</h3>
        <ul className="text-gray-300 space-y-2 text-sm">
          <li>• QR кодът винаги води към <code className="bg-blue-500/20 px-1 rounded">/t/[номер]</code> (кратък линк)</li>
          <li>• Кратият линк redirect-ва към URL-а който сте настроили тук</li>
          <li>• Можете да сменяте URL-а по всяко време без да принтирате нови кодове</li>
          <li>• Можете да спрете временно маса като я деактивирате</li>
          <li>• Статистиките показват колко пъти е сканиран всеки код</li>
        </ul>
      </div>
    </div>
  );
}


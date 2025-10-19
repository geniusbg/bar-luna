'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';

export default function QRCodesPage() {
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generated, setGenerated] = useState(false);

  // Load existing QR codes on mount
  useEffect(() => {
    loadExistingQRCodes();
  }, []);

  const loadExistingQRCodes = async () => {
    setLoading(true);
    try {
      // Fetch all tables from database
      const response = await fetch('/api/tables');
      const data = await response.json();
      
      console.log('📊 Loaded tables:', data.tables?.length || 0);
      
      if (data.tables && data.tables.length > 0) {
        // Filter tables that have QR codes already generated
        const tablesWithQR = data.tables.filter((t: any) => t.qrCodeDataUrl);
        
        console.log('✅ Tables with QR codes:', tablesWithQR.length);
        
        if (tablesWithQR.length > 0) {
          setTables(tablesWithQR);
          setGenerated(true);
        }
      }
    } catch (error) {
      console.error('Error loading QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateQRCodes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/qr/generate');
      const data = await response.json();
      setTables(data.tables);
      setGenerated(true);
    } catch (error) {
      console.error('Error generating QR codes:', error);
    } finally {
      setLoading(false);
    }
  };

  const printAllQRCodes = () => {
    window.print();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8 no-print">
        <div>
          <h1 className="text-4xl font-bold text-white">QR Кодове за маси</h1>
          {generated && tables.length > 0 && (
            <p className="text-gray-300 mt-2">
              ✅ {tables.length} QR кода запазени в базата
            </p>
          )}
        </div>
        <div className="flex gap-4">
          <button
            onClick={generateQRCodes}
            disabled={loading}
            className="px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all disabled:opacity-50"
          >
            {loading ? 'Генериране...' : generated ? '🔄 Регенерирай QR кодове' : '✨ Генерирай QR кодове'}
          </button>
          {generated && (
            <button
              onClick={printAllQRCodes}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-all"
            >
              🖨️ Принтирай всички
            </button>
          )}
        </div>
      </div>

      {loading && !generated && (
        <div className="text-center py-20">
          <p className="text-gray-200 text-xl">Зареждане...</p>
        </div>
      )}

      {!loading && !generated && (
        <div className="text-center py-20 bg-slate-800 rounded-xl border border-slate-700">
          <div className="text-6xl mb-4">📱</div>
          <p className="text-gray-200 text-xl mb-4">
            Няма генерирани QR кодове
          </p>
          <p className="text-gray-400 text-sm mb-2">
            Кликнете "Генерирай QR кодове" за да създадете QR кодове за всички 30 маси
          </p>
          <p className="text-gray-400 text-sm">
            QR кодовете ще се запазят в базата данни и ще са достъпни винаги
          </p>
        </div>
      )}

      {generated && (
        <>
          <style jsx global>{`
            @media print {
              .no-print { display: none; }
              .qr-card { 
                page-break-after: always; 
                page-break-inside: avoid;
              }
            }
          `}</style>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div
                key={table.tableNumber}
                className="qr-card bg-white rounded-2xl p-8 text-center border-4 border-slate-300"
              >
                <div className="mb-6">
                  <h2 className="text-4xl font-bold text-gray-900 mb-2">
                    𝐋.𝐔.𝐍.𝐀 🌙
                  </h2>
                  <p className="text-sm text-slate-600">Bar & Coffee - Русе</p>
                </div>

                <div className="bg-white p-4 rounded-xl inline-block mb-6">
                  <img
                    src={table.qrCodeDataUrl}
                    alt={`QR Code for ${table.tableName}`}
                    className="w-64 h-64"
                  />
                </div>

                <div className="mb-4">
                  <div className="text-6xl font-bold text-gray-900 mb-2">
                    МАСА {table.tableNumber}
                  </div>
                  <p className="text-lg text-slate-700 font-semibold">
                    {table.tableName}
                  </p>
                </div>

                <div className="border-t-2 border-slate-300 pt-4">
                  <p className="text-slate-700 font-medium mb-1">
                    📱 Сканирай за меню и поръчка
                  </p>
                  <p className="text-sm text-slate-500">
                    Scan for menu & order
                  </p>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}



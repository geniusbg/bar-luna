import { prisma } from '@/lib/prisma';

async function getStats() {
  const [categories, products, events] = await Promise.all([
    prisma.category.count(),
    prisma.product.count(),
    prisma.event.count()
  ]);

  return { categories, products, events };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Welcome Header */}
      <div className="mb-10">
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">Dashboard</h1>
        <p className="text-gray-400 text-lg">Управление на LUNA Bar</p>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-8 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide mb-3">Категории</p>
              <p className="text-4xl md:text-5xl font-bold text-white">{stats.categories}</p>
            </div>
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">📁</div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-8 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide mb-3">Продукти</p>
              <p className="text-4xl md:text-5xl font-bold text-white">{stats.products}</p>
            </div>
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🍸</div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-8 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide mb-3">Събития</p>
              <p className="text-4xl md:text-5xl font-bold text-white">{stats.events}</p>
            </div>
            <div className="text-6xl group-hover:scale-110 transition-transform duration-300">🎉</div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-12">
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-6">Бързи действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <a
            href="/bg/admin/products/new"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🍸</div>
            <h3 className="text-white font-bold text-lg">Добави продукт</h3>
          </a>
          <a
            href="/bg/admin/events/new"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">🎉</div>
            <h3 className="text-white font-bold text-lg">Добави събитие</h3>
          </a>
          <a
            href="/bg/admin/categories"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">📁</div>
            <h3 className="text-white font-bold text-lg">Категории</h3>
          </a>
          <a
            href="/bg/admin/qr"
            className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-6 hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 text-center"
          >
            <div className="text-5xl mb-3 group-hover:scale-110 transition-transform duration-300">📱</div>
            <h3 className="text-white font-bold text-lg">QR Кодове</h3>
          </a>
        </div>
      </div>
    </div>
  );
}



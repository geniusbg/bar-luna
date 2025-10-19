import { prisma } from '@/lib/prisma';
import Link from 'next/link';

async function getEvents() {
  const events = await prisma.event.findMany({
    orderBy: { eventDate: 'desc' }
  });

  return events;
}

export default async function AdminEventsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const events = await getEvents();

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 md:mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-white">Събития</h1>
        <Link
          href={`/${locale}/admin/events/new`}
          className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all text-center"
        >
          + Добави събитие
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map((event: any) => {
          const eventDate = new Date(event.eventDate);
          const isPast = eventDate < new Date();

          return (
            <div
              key={event.id}
              className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl overflow-hidden hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300"
            >
              {event.imageUrl && (
                <div className="h-48 bg-gradient-to-br from-gray-900/80 to-gray-900/40 relative overflow-hidden">
                  <img
                    src={event.imageUrl}
                    alt={event.titleBg}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                </div>
              )}
              
              <div className="p-6">
                <div className="flex items-center gap-2 mb-3">
                  {event.isPublished ? (
                    <span className="px-3 py-1 bg-green-500/20 text-green-300 rounded-full text-sm">
                      Публикувано
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-gray-500/20 text-gray-300 rounded-full text-sm">
                      Чернова
                    </span>
                  )}
                  
                  {event.isExternal && (
                    <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                      Партньорско
                    </span>
                  )}
                  
                  {isPast && (
                    <span className="px-3 py-1 bg-red-500/20 text-red-300 rounded-full text-sm">
                      Минало
                    </span>
                  )}
                </div>
                
                <h3 className="text-xl font-bold text-white mb-2">
                  {event.titleBg}
                </h3>
                
                <p className="text-gray-200 text-sm mb-3">
                  {eventDate.toLocaleDateString('bg-BG', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                
                <p className="text-gray-200 text-sm mb-4 line-clamp-2">
                  {event.descriptionBg}
                </p>
                
                <div className="flex gap-2">
                  <Link
                    href={`/${locale}/admin/events/${event.id}/edit`}
                    className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm text-center transition-all"
                  >
                    Редактирай
                  </Link>
                  <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm transition-all">
                    Изтрий
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {events.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-200 text-xl">Няма създадени събития</p>
        </div>
      )}
    </div>
  );
}


import { prisma } from '@/lib/prisma';
import Link from 'next/link';

export default async function EventsPage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  const events = await prisma.event.findMany({
    where: {
      eventDate: { gte: new Date() },
      isPublished: true
    },
    orderBy: { eventDate: 'asc' }
  });

  return (
    <main className="min-h-screen bg-black py-20">
      <div className="container mx-auto px-4">
        <h1 className="text-5xl font-bold text-white text-center mb-4">
          {locale === 'bg' ? 'Събития' : locale === 'en' ? 'Events' : 'Veranstaltungen'}
        </h1>
        <p className="text-xl text-gray-300 text-center mb-12">
          {locale === 'bg' ? 'Предстоящи събития' : locale === 'en' ? 'Upcoming Events' : 'Kommende Veranstaltungen'}
        </p>

        {events.length === 0 ? (
          <div className="text-center text-gray-300 py-20">
            <p className="text-xl">Няма предстоящи събития в момента</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {events.map((event: any) => {
              const eventTitle = locale === 'bg' ? event.titleBg : locale === 'en' ? event.titleEn : event.titleDe;
              const eventDesc = locale === 'bg' ? event.descriptionBg : locale === 'en' ? event.descriptionEn : event.descriptionDe;
              const eventLocation = event.isExternal 
                ? (locale === 'bg' ? (event.locationBg || event.location) : 
                   locale === 'en' ? (event.locationEn || event.location) : 
                   (event.locationDe || event.location))
                : event.location;
              const eventDate = new Date(event.eventDate);

              return (
                <Link
                  key={event.id}
                  href={`/${locale}/events/${event.id}`}
                  className="bg-white/10 backdrop-blur-lg rounded-2xl overflow-hidden hover:bg-white/15 transition-all block group"
                >
                  {event.imageUrl && (
                    <div className="relative h-64 w-full overflow-hidden bg-gray-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={event.imageUrl}
                        alt={eventTitle}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )}
                  
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-3">
                      {event.isExternal ? (
                        <span className="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-sm">
                          Партньорско събитие
                        </span>
                      ) : (
                        <span className="px-3 py-1 bg-white/20 text-white rounded-full text-sm font-medium">
                          В LUNA Bar
                        </span>
                      )}
                    </div>
                    
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {eventTitle}
                    </h3>
                    
                    <div className="flex items-center gap-2 text-gray-300 mb-3">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span>
                        {eventDate.toLocaleDateString(locale, {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-gray-300 mb-4">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      <span>{eventLocation}</span>
                    </div>
                    
                    <p className="text-gray-300 mb-4 line-clamp-3">
                      {eventDesc}
                    </p>
                    
                    <div className="mt-4 text-center">
                      <span className="text-white font-semibold group-hover:text-gray-300 transition-colors">
                        {locale === 'bg' ? 'Научи повече →' : locale === 'en' ? 'Learn more →' : 'Mehr erfahren →'}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}

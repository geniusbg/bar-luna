import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';

export default async function HomePage({
  params
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Fetch next 3 upcoming published events
  const events = await prisma.event.findMany({
    where: {
      eventDate: { gte: new Date() },
      isPublished: true
    },
    orderBy: { eventDate: 'asc' },
    take: 3
  });

  return (
    <main className="min-h-screen bg-black">
      {/* Hero Section with gradient background */}
      <div className="relative overflow-hidden">
        {/* Animated gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black opacity-50"></div>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gray-700/20 via-black to-black"></div>
        
        <div className="relative container mx-auto px-4 py-12 md:py-20">
          <div className="text-center">
            {/* Logo with animation */}
            <div className="mb-8 md:mb-12 flex justify-center animate-fade-in">
              <div className="logo-container h-48 w-48 md:h-80 md:w-80 luna-glow-strong transform hover:scale-105 transition-transform duration-500">
                <Image 
                  src={`/${locale}/luna-logo.svg`} 
                  alt="L.U.N.A." 
                  width={500}
                  height={500}
                  className="h-48 w-48 md:h-80 md:w-80 animate-pulse-glow"
                  priority
                />
              </div>
            </div>

            {/* Tagline */}
            <p className="text-xl md:text-2xl text-gray-300 mb-8 md:mb-12 font-light tracking-wide">
              {locale === 'bg' ? 'Bar • Coffee • Lunch • Shisha & Good Mood' : 
               locale === 'en' ? 'Bar • Coffee • Lunch • Shisha & Good Mood' : 
               'Bar • Kaffee • Mittagessen • Shisha & Gute Stimmung'}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-10 md:mb-16">
              <Link 
                href={`/${locale}/menu`}
                className="group relative px-8 py-4 bg-white text-black rounded-xl font-bold text-lg luna-glow-strong hover:bg-gray-100 transition-all duration-300 overflow-hidden w-full sm:w-auto"
              >
                <span className="relative z-10 flex items-center justify-center gap-2">
                  🍸 {locale === 'bg' ? 'Виж менюто' : locale === 'en' ? 'View Menu' : 'Menü ansehen'}
                </span>
              </Link>
              <Link 
                href={`/${locale}/events`}
                className="px-8 py-4 bg-gray-800 text-white rounded-xl font-bold text-lg border-2 border-gray-700 hover:border-white/50 transition-all duration-300 w-full sm:w-auto"
              >
                🎉 {locale === 'bg' ? 'Събития' : locale === 'en' ? 'Events' : 'Veranstaltungen'}
              </Link>
            </div>
            
            {/* Location with enhanced styling */}
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900/50 border border-gray-700 rounded-full text-gray-300 backdrop-blur-sm">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span className="font-medium">Русе, ул. Александровска 97</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">

        {/* Featured Categories Preview */}
        <div className="mt-16 md:mt-24">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-3">
              {locale === 'bg' ? 'Какво предлагаме' : locale === 'en' ? 'What We Offer' : 'Was wir anbieten'}
            </h2>
            <p className="text-gray-400 text-lg">
              {locale === 'bg' ? 'Открий нашето разнообразие' : 
               locale === 'en' ? 'Discover our variety' : 
               'Entdecken Sie unsere Vielfalt'}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-8 md:p-10 luna-glow hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">🍸</div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Cocktails</h3>
                <p className="text-gray-300 text-base md:text-lg">Свежи коктейли и класики</p>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-8 md:p-10 luna-glow hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">☕</div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Coffee</h3>
                <p className="text-gray-300 text-base md:text-lg">Costa & Richard кафе</p>
              </div>
            </div>
            
            <div className="group relative bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl p-8 md:p-10 luna-glow hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 transform hover:-translate-y-1 sm:col-span-2 lg:col-span-1 overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -translate-y-16 translate-x-16 group-hover:scale-150 transition-transform duration-500"></div>
              <div className="relative">
                <div className="text-6xl mb-6 transform group-hover:scale-110 transition-transform duration-300">💨</div>
                <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">Shisha</h3>
                <p className="text-gray-300 text-base md:text-lg">Разнообразие от вкусове</p>
              </div>
            </div>
          </div>
        </div>

        {/* Upcoming Events Preview */}
        {events.length > 0 && (
          <div className="mt-16 md:mt-24">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-10 md:mb-12 gap-4">
              <div>
                <h2 className="text-3xl md:text-5xl font-bold text-white mb-2">
                  {locale === 'bg' ? 'Предстоящи събития' : locale === 'en' ? 'Upcoming Events' : 'Kommende Veranstaltungen'}
                </h2>
                <p className="text-gray-400">
                  {locale === 'bg' ? 'Не пропускай нашите специални вечери' : 
                   locale === 'en' ? 'Don\'t miss our special nights' : 
                   'Verpassen Sie nicht unsere besonderen Abende'}
                </p>
              </div>
              <Link 
                href={`/${locale}/events`}
                className="group px-6 py-3 bg-gray-800 text-white rounded-xl font-semibold border-2 border-gray-700 hover:border-white/50 transition-all flex items-center gap-2"
              >
                {locale === 'bg' ? 'Виж всички' : locale === 'en' ? 'View all' : 'Alle ansehen'}
                <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {events.map((event: any) => {
                const eventTitle = locale === 'bg' ? event.titleBg : locale === 'en' ? event.titleEn : event.titleDe;
                const eventDesc = locale === 'bg' ? event.descriptionBg : locale === 'en' ? event.descriptionEn : event.descriptionDe;
                const eventDate = new Date(event.eventDate);

                return (
                  <Link
                    key={event.id}
                    href={`/${locale}/events/${event.id}`}
                    className="group bg-gradient-to-br from-gray-900/80 to-gray-900/40 border border-gray-700 rounded-2xl overflow-hidden hover:border-white/40 hover:shadow-2xl hover:shadow-white/5 transition-all duration-300 transform hover:-translate-y-1 block"
                  >
                    {event.imageUrl && (
                      <div className="relative h-56 w-full overflow-hidden bg-gradient-to-br from-gray-900/80 to-gray-900/40">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={event.imageUrl}
                          alt={eventTitle}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent opacity-60"></div>
                      </div>
                    )}
                    
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-white/10 rounded-full w-fit backdrop-blur-sm">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-white text-sm font-medium">
                          {eventDate.toLocaleDateString(locale === 'bg' ? 'bg-BG' : locale === 'en' ? 'en-US' : 'de-DE', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </span>
                      </div>

                      <h3 className="text-xl md:text-2xl font-bold text-white mb-3 group-hover:text-gray-200 transition-colors line-clamp-2">
                        {eventTitle}
                      </h3>
                      
                      {eventDesc && (
                        <p className="text-gray-400 text-sm md:text-base line-clamp-2 mb-4">
                          {eventDesc}
                        </p>
                      )}

                      <div className="flex items-center text-white font-semibold text-sm group-hover:gap-3 gap-2 transition-all">
                        {locale === 'bg' ? 'Научи повече' : locale === 'en' ? 'Learn more' : 'Mehr erfahren'}
                        <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

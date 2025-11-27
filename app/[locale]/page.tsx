import Link from 'next/link';
import Image from 'next/image';
import { prisma } from '@/lib/prisma';
import { getLocationSettings } from '@/lib/location-settings';
import { getHomepageSettings, getHomepageOfferingCards } from '@/lib/homepage-settings';
import ChefsPicksCarousel from '@/components/ChefsPicksCarousel';

export const revalidate = 0;
export const dynamic = 'force-dynamic';

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

  // Fetch working hours
  const workingHours = await prisma.workingHours.findMany({
    orderBy: { dayOfWeek: 'asc' }
  });

  // Fetch location settings
  const locationSettings = await getLocationSettings();

  // Fetch homepage settings and cards
  const [homepageSettings, homepageCards] = await Promise.all([
    getHomepageSettings(),
    getHomepageOfferingCards()
  ]);

  // Fetch featured products for Chef's Picks
  const featuredProducts = await prisma.product.findMany({
    where: {
      isFeatured: true,
      isHidden: false,
      isAvailable: true
    },
    include: {
      category: {
        select: {
          nameBg: true,
          nameEn: true,
          nameDe: true
        }
      }
    },
    orderBy: { order: 'asc' },
    take: 8
  });

  // Get current day
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const todayHours = workingHours.find(wh => wh.dayOfWeek === currentDay);

  const localeContent = {
    bg: {
      sectionLabel: 'Предложения',
      title: 'Какво предлагаме',
      subtitle: 'Открий нашето разнообразие',
      description:
        'От сутрешно specialty кафе до вечерни авторски коктейли, вкусни сандвичи и ароматни шиши – създаваме настроение през целия ден.',
      stats: [
        { label: 'Signature коктейли', value: '25+' },
        { label: 'Селектирани кафета', value: '12' },
        { label: 'Шиша вкуса', value: '18' }
      ],
      cards: [
        {
          icon: '🍸',
          title: 'Коктейли - Миксове за пиене, миксове за слушане',
          description: 'Премиум спиртни напитки, първокласни сиропи и много фантазия. В бара може да играете карти, морски шах и други настолни игри. Разполагаме и със сепаре с телевизор за гледане на срещи.',
          highlights: ['Margarita de la Luna', 'Smoky Negroni', 'Espresso Martini'],
          badge: 'Signature'
        },
        {
          icon: '☕',
          title: 'Кафе & дневен бар',
          description: 'Costa & Richard селекция, филтърни методи и изкушения с десерт.',
          highlights: ['Flat White', 'Cold Brew Tonic', 'Affogato'],
          badge: locale === 'bg' ? 'Дневен ритуал' : locale === 'en' ? 'Daily ritual' : 'Tägliches Ritual'
        },
        {
          icon: '🥪',
          title: 'Сандвичи',
          description: 'Вкусни сандвичи с 3 вида сос – перфектна комбинация за всеки момент.',
          highlights: ['Класически', 'Специални', 'Вегетариански'],
          badge: locale === 'bg' ? 'Дневно меню' : locale === 'en' ? 'Day menu' : 'Tagesmenü'
        },
        {
          icon: '💨',
          title: 'Shisha Lounge',
          description: 'Балансирани смеси, охлаждащи аксесоари и релаксираща атмосфера.',
          highlights: ['Double Apple', 'Grape Mint', 'Blue Ice'],
          badge: locale === 'bg' ? 'Вечерно настроение' : locale === 'en' ? 'Night mood' : 'Abendstimmung'
        }
      ],
      ctaPrimary: 'Разгледай менюто',
      ctaSecondary: 'Резервирай вечер'
    },
    en: {
      sectionLabel: 'Experiences',
      title: 'What We Offer',
      subtitle: 'Discover our variety',
      description:
        'From specialty coffee mornings to signature cocktail nights, delicious sandwiches and aromatic shisha – we craft moods for every hour. In the bar you can play cards, backgammon and other board games. We also have a separate area with a TV for watching matches.',
      stats: [
        { label: 'Signature cocktails', value: '25+' },
        { label: 'Curated coffees', value: '12' },
        { label: 'Shisha blends', value: '18' }
      ],
      cards: [
        {
          icon: '🍸',
          title: 'Cocktails - Mixes for drinking, mixes for listening',
          description: 'Premium spirits, first-class syrups and bold imagination. In the bar you can play cards, backgammon and other board games. We also have a separate area with a TV for watching matches.',
          highlights: ['Margarita de la Luna', 'Smoky Negroni', 'Espresso Martini'],
          badge: 'Signature'
        },
        {
          icon: '☕',
          title: 'Coffee & Day Bar',
          description: 'Costa & Richard beans, filter methods and dessert pairings.',
          highlights: ['Flat White', 'Cold Brew Tonic', 'Affogato'],
          badge: locale === 'bg' ? 'Дневен ритуал' : locale === 'en' ? 'Daily ritual' : 'Tägliches Ritual'
        },
        {
          icon: '🥪',
          title: 'Sandwiches',
          description: 'Delicious sandwiches with 3 types of sauces – perfect combination for any moment.',
          highlights: ['Classic', 'Special', 'Vegetarian'],
          badge: locale === 'bg' ? 'Дневно меню' : locale === 'en' ? 'Day menu' : 'Tagesmenü'
        },
        {
          icon: '💨',
          title: 'Shisha Lounge',
          description: 'Balanced blends, cooling accessories and a relaxed vibe.',
          highlights: ['Double Apple', 'Grape Mint', 'Blue Ice'],
          badge: locale === 'bg' ? 'Вечерно настроение' : locale === 'en' ? 'Night mood' : 'Abendstimmung'
        }
      ],
      ctaPrimary: 'View the menu',
      ctaSecondary: 'Book an evening'
    },
    de: {
      sectionLabel: 'Erlebnisse',
      title: 'Was wir anbieten',
      subtitle: 'Entdecken Sie unsere Vielfalt',
      description:
        'Von Specialty Coffee am Morgen bis zu Signature Cocktails, leckeren Sandwiches und aromatischer Shisha am Abend – wir gestalten jede Stimmung.',
      stats: [
        { label: 'Signature-Cocktails', value: '25+' },
        { label: 'Kuratiertes Kaffeeangebot', value: '12' },
        { label: 'Shisha-Mischungen', value: '18' }
      ],
      cards: [
        {
          icon: '🍸',
          title: 'Cocktails - Mixes zum Trinken, Mixes zum Hören',
          description: 'Premium-Spirituosen, erstklassige Sirupe und viel Kreativität. In der Bar können Sie Karten, Backgammon und andere Brettspiele spielen. Wir haben auch einen separaten Bereich mit einem Fernseher zum Ansehen von Spielen.',
          highlights: ['Margarita de la Luna', 'Smoky Negroni', 'Espresso Martini'],
          badge: 'Signature'
        },
        {
          icon: '☕',
          title: 'Coffee & Day Bar',
          description: 'Costa & Richard Bohnen, Filtermethoden und Dessert-Begleiter.',
          highlights: ['Flat White', 'Cold Brew Tonic', 'Affogato'],
          badge: locale === 'bg' ? 'Дневен ритуал' : locale === 'en' ? 'Daily ritual' : 'Tägliches Ritual'
        },
        {
          icon: '🥪',
          title: 'Sandwiches',
          description: 'Leckere Sandwiches mit 3 Saucenarten – perfekte Kombination für jeden Moment.',
          highlights: ['Klassisch', 'Spezial', 'Vegetarisch'],
          badge: locale === 'bg' ? 'Дневно меню' : locale === 'en' ? 'Day menu' : 'Tagesmenü'
        },
        {
          icon: '💨',
          title: 'Shisha Lounge',
          description: 'Ausbalancierte Mischungen, Cooling-Accessories und entspannte Atmosphäre.',
          highlights: ['Double Apple', 'Grape Mint', 'Blue Ice'],
          badge: locale === 'bg' ? 'Вечерно настроение' : locale === 'en' ? 'Night mood' : 'Abendstimmung'
        }
      ],
      ctaPrimary: 'Menü ansehen',
      ctaSecondary: 'Abend reservieren'
    }
  } as const;

  // Use database settings if available, otherwise fallback to hardcoded
  // Check if we have settings in DB (by checking if homepageSettings has an id)
  const useDbSettings = !!homepageSettings.id;
  
  const offerings = localeContent[locale as 'bg' | 'en' | 'de'] ?? localeContent.bg;
  
  // Get section header from DB or fallback
  const sectionLabel = useDbSettings 
    ? (locale === 'bg' ? homepageSettings.sectionLabelBg : locale === 'en' ? homepageSettings.sectionLabelEn : homepageSettings.sectionLabelDe)
    : offerings.sectionLabel;
  const offeringsTitle = useDbSettings
    ? (locale === 'bg' ? homepageSettings.titleBg : locale === 'en' ? homepageSettings.titleEn : homepageSettings.titleDe)
    : offerings.title;
  const offeringsSubtitle = useDbSettings
    ? (locale === 'bg' ? homepageSettings.subtitleBg : locale === 'en' ? homepageSettings.subtitleEn : homepageSettings.subtitleDe)
    : offerings.subtitle;
  const offeringsDescription = useDbSettings
    ? (locale === 'bg' ? homepageSettings.descriptionBg : locale === 'en' ? homepageSettings.descriptionEn : homepageSettings.descriptionDe)
    : offerings.description;
  const moodText = useDbSettings
    ? (locale === 'bg' ? homepageSettings.moodTextBg : locale === 'en' ? homepageSettings.moodTextEn : homepageSettings.moodTextDe)
    : (locale === 'bg' 
      ? 'Бар, кафе, сандвичи, шиша – перфектната атмосфера за деня и вечерта' 
      : locale === 'en' 
      ? 'Bar, coffee, sandwiches, shisha – the perfect atmosphere for day and evening'
      : 'Bar, Kaffee, Sandwiches, Shisha – die perfekte Atmosphäre für Tag und Abend');
  
  // Get stats from DB or fallback
  const stats = useDbSettings 
    ? (locale === 'bg' ? homepageSettings.stats.bg : locale === 'en' ? homepageSettings.stats.en : homepageSettings.stats.de)
    : offerings.stats;
  
  // Get cards from DB or fallback
  const cards = useDbSettings
    ? homepageCards.map(card => ({
        icon: card.icon,
        title: locale === 'bg' ? card.titleBg : locale === 'en' ? card.titleEn : card.titleDe,
        description: locale === 'bg' ? card.descriptionBg : locale === 'en' ? card.descriptionEn : card.descriptionDe,
        highlights: locale === 'bg' ? card.highlights.bg : locale === 'en' ? card.highlights.en : card.highlights.de,
        badge: locale === 'bg' ? card.badgeBg : locale === 'en' ? card.badgeEn : card.badgeDe
      }))
    : offerings.cards;
  
  const ctaPrimary = useDbSettings
    ? (locale === 'bg' ? homepageSettings.ctaPrimaryBg : locale === 'en' ? homepageSettings.ctaPrimaryEn : homepageSettings.ctaPrimaryDe)
    : offerings.ctaPrimary;
  const ctaSecondary = useDbSettings
    ? (locale === 'bg' ? homepageSettings.ctaSecondaryBg : locale === 'en' ? homepageSettings.ctaSecondaryEn : homepageSettings.ctaSecondaryDe)
    : offerings.ctaSecondary;

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
                  className="h-48 w-48 md:h-80 md:w-80"
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
            
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
              {/* Location with enhanced styling */}
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900/50 border border-gray-700 rounded-full text-gray-300 backdrop-blur-sm">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="font-medium">
                  {locale === 'bg' ? locationSettings.addressBg : 
                   locale === 'en' ? locationSettings.addressEn : 
                   locationSettings.addressDe}
                </span>
              </div>
              
              {/* Today's working hours */}
              {todayHours && todayHours.isOpen && todayHours.openTime && todayHours.closeTime && (
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gray-900/50 border border-gray-700 rounded-full text-gray-300 backdrop-blur-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="font-medium">
                    {locale === 'bg' ? 'Днес' : locale === 'en' ? 'Today' : 'Heute'}: {todayHours.openTime} - {todayHours.closeTime}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-20">

        {/* Offerings Section */}
        <section className="mt-16 md:mt-24 relative">
          <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-transparent backdrop-blur-xl px-6 py-12 md:px-16 md:py-16">
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute -top-24 right-0 w-72 h-72 bg-white/10 blur-3xl opacity-40"></div>
              <div className="absolute -bottom-10 left-10 w-56 h-56 bg-purple-500/20 blur-3xl opacity-50"></div>
            </div>

            <div className="relative flex flex-col items-center text-center max-w-4xl mx-auto">
              <span className="inline-flex items-center px-4 py-1 rounded-full text-xs font-semibold uppercase tracking-[0.3em] text-gray-200 bg-white/10 border border-white/10">
                {sectionLabel}
              </span>
              <h2 className="mt-6 text-3xl md:text-5xl font-semibold text-white tracking-tight">
                {offeringsTitle}
              </h2>
              <p className="mt-4 text-lg md:text-xl text-gray-300">
                {offeringsSubtitle}
              </p>
              <p className="mt-6 text-base md:text-lg text-gray-400 leading-relaxed max-w-3xl">
                {offeringsDescription}
              </p>
              {/* Mood paragraph */}
              <p className="mt-8 text-lg md:text-xl text-white/90 font-light italic max-w-2xl">
                {moodText}
              </p>
            </div>

            <div className="relative mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {stats.map(stat => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-white/10 bg-black/30 px-6 py-5 text-center"
                >
                  <div className="text-3xl md:text-4xl font-semibold text-white">{stat.value}</div>
                  <div className="mt-2 text-sm uppercase tracking-[0.2em] text-gray-400">{stat.label}</div>
                </div>
              ))}
            </div>

            <div className="relative mt-12 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
              {cards.map(card => (
                <div
                  key={card.title}
                  className="group flex flex-col rounded-2xl border border-white/10 bg-black/40 p-6 md:p-7 shadow-[0_20px_40px_rgba(0,0,0,0.35)] hover:border-white/30 hover:-translate-y-[6px] hover:shadow-[0_12px_24px_rgba(0,0,0,0.25)] transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="relative group/icon">
                      {/* Icon circle with glow */}
                      <div className="absolute inset-0 w-16 h-16 rounded-full bg-white/8 blur-md group-hover/icon:bg-white/15 transition-all duration-300 -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2"></div>
                      <div className="relative w-16 h-16 rounded-full bg-white/8 flex items-center justify-center group-hover/icon:bg-white/12 transition-all duration-300">
                        <div className="text-3xl md:text-4xl transform group-hover/icon:scale-110 transition-transform duration-300">
                          {card.icon}
                        </div>
                      </div>
                      {/* Micro interaction - hover tooltip with suggestions */}
                      <div className="absolute left-1/2 -translate-x-1/2 top-full mt-4 opacity-0 group-hover/icon:opacity-100 pointer-events-none transition-opacity duration-300 z-10">
                        <div className="bg-black/90 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 whitespace-nowrap">
                          <p className="text-xs text-white/90 font-medium">
                            {card.highlights.slice(0, 3).join(' • ')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <span className="text-[11px] uppercase tracking-[0.25em] text-white/80 bg-white/10 px-3 py-1 rounded-full group-hover:bg-white/20 transition-colors">
                      {card.badge}
                    </span>
                  </div>
                  <h3 className="mt-6 text-2xl text-white font-semibold group-hover:text-gray-100 transition-colors">{card.title}</h3>
                  <p className="mt-3 text-gray-400 text-sm md:text-base leading-relaxed group-hover:text-gray-300 transition-colors">
                    {card.description}
                  </p>

                  <div className="mt-6">
                    <p className="text-xs uppercase tracking-[0.3em] text-white/60 mb-3 group-hover:text-white/70 transition-colors">Highlights</p>
                    <ul className="space-y-2 text-sm md:text-base text-gray-200">
                      {card.highlights.map((item, index) => (
                        <li key={`${card.title}-${index}`} className="flex items-center gap-2 group-hover:translate-x-1 transition-transform duration-200" style={{ transitionDelay: `${index * 50}ms` }}>
                          <span className="inline-block h-[2px] w-6 bg-white/40 group-hover:bg-white/60 group-hover:w-8 transition-all"></span>
                          <span className="truncate group-hover:text-white transition-colors">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ))}
            </div>

            <div className="relative mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href={`/${locale}/menu`}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white text-black px-8 py-3 font-semibold tracking-wide transition hover:bg-gray-100"
              >
                {ctaPrimary}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </Link>
              <Link
                href={`/${locale}/events`}
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/30 px-8 py-3 font-semibold tracking-wide text-white transition hover:border-white/60"
              >
                {ctaSecondary}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14m-7-7l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>
        </section>

        {/* Chef's Picks Carousel */}
        {featuredProducts.length > 0 && (
          <ChefsPicksCarousel 
            products={featuredProducts.map((p: any) => ({
              id: p.id,
              nameBg: p.nameBg,
              nameEn: p.nameEn,
              nameDe: p.nameDe,
              descriptionBg: p.descriptionBg,
              descriptionEn: p.descriptionEn,
              descriptionDe: p.descriptionDe,
              priceBgn: Number(p.priceBgn),
              imageUrl: p.imageUrl,
              categoryId: p.categoryId,
              category: {
                nameBg: p.category.nameBg,
                nameEn: p.category.nameEn,
                nameDe: p.category.nameDe
              }
            }))}
            locale={locale}
          />
        )}

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

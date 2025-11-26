import type { Prisma } from '@prisma/client';
import { prisma } from './prisma';

export interface HomepageStats {
  bg: { label: string; value: string }[];
  en: { label: string; value: string }[];
  de: { label: string; value: string }[];
}

export interface HomepageOfferingCard {
  id: string;
  order: number;
  icon: string;
  titleBg: string;
  titleEn: string;
  titleDe: string;
  descriptionBg: string;
  descriptionEn: string;
  descriptionDe: string;
  badgeBg: string;
  badgeEn: string;
  badgeDe: string;
  highlights: {
    bg: string[];
    en: string[];
    de: string[];
  };
  isActive: boolean;
}

export interface HomepageSettings {
  id: string;
  sectionLabelBg: string;
  sectionLabelEn: string;
  sectionLabelDe: string;
  titleBg: string;
  titleEn: string;
  titleDe: string;
  subtitleBg: string;
  subtitleEn: string;
  subtitleDe: string;
  descriptionBg: string;
  descriptionEn: string;
  descriptionDe: string;
  moodTextBg: string;
  moodTextEn: string;
  moodTextDe: string;
  stats: HomepageStats;
  ctaPrimaryBg: string;
  ctaPrimaryEn: string;
  ctaPrimaryDe: string;
  ctaSecondaryBg: string;
  ctaSecondaryEn: string;
  ctaSecondaryDe: string;
}

const DEFAULT_HOMEPAGE_SETTINGS: Omit<HomepageSettings, 'id' | 'stats'> = {
  sectionLabelBg: 'Предложения',
  sectionLabelEn: 'Experiences',
  sectionLabelDe: 'Erlebnisse',
  titleBg: 'Какво предлагаме',
  titleEn: 'What We Offer',
  titleDe: 'Was wir anbieten',
  subtitleBg: 'Открий нашето разнообразие',
  subtitleEn: 'Discover our variety',
  subtitleDe: 'Entdecken Sie unsere Vielfalt',
  descriptionBg: 'От сутрешно specialty кафе до вечерни авторски коктейли, вкусни сандвичи и ароматни шиши – създаваме настроение през целия ден.',
  descriptionEn: 'From specialty coffee mornings to signature cocktail nights, delicious sandwiches and aromatic shisha – we craft moods for every hour.',
  descriptionDe: 'Von Specialty Coffee am Morgen bis zu Signature Cocktails, leckeren Sandwiches und aromatischer Shisha am Abend – wir gestalten jede Stimmung.',
  moodTextBg: 'Бар, кафе, сандвичи, шиша – перфектната атмосфера за деня и вечерта',
  moodTextEn: 'Bar, coffee, sandwiches, shisha – the perfect atmosphere for day and evening',
  moodTextDe: 'Bar, Kaffee, Sandwiches, Shisha – die perfekte Atmosphäre für Tag und Abend',
  ctaPrimaryBg: 'Разгледай менюто',
  ctaPrimaryEn: 'View the menu',
  ctaPrimaryDe: 'Menü ansehen',
  ctaSecondaryBg: 'Резервирай вечер',
  ctaSecondaryEn: 'Book an evening',
  ctaSecondaryDe: 'Abend reservieren'
};

const DEFAULT_STATS: HomepageStats = {
  bg: [
    { label: 'Signature коктейли', value: '25+' },
    { label: 'Селектирани кафета', value: '12' },
    { label: 'Шиша вкуса', value: '18' }
  ],
  en: [
    { label: 'Signature cocktails', value: '25+' },
    { label: 'Curated coffees', value: '12' },
    { label: 'Shisha blends', value: '18' }
  ],
  de: [
    { label: 'Signature-Cocktails', value: '25+' },
    { label: 'Kuratiertes Kaffeeangebot', value: '12' },
    { label: 'Shisha-Mischungen', value: '18' }
  ]
};

const DEFAULT_STATS_JSON = DEFAULT_STATS as unknown as Prisma.InputJsonValue;

export async function getHomepageSettings(): Promise<HomepageSettings> {
  try {
    const settings = await prisma.homepageSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (settings) {
      return {
        id: settings.id,
        sectionLabelBg: settings.sectionLabelBg || DEFAULT_HOMEPAGE_SETTINGS.sectionLabelBg,
        sectionLabelEn: settings.sectionLabelEn || DEFAULT_HOMEPAGE_SETTINGS.sectionLabelEn,
        sectionLabelDe: settings.sectionLabelDe || DEFAULT_HOMEPAGE_SETTINGS.sectionLabelDe,
        titleBg: settings.titleBg || DEFAULT_HOMEPAGE_SETTINGS.titleBg,
        titleEn: settings.titleEn || DEFAULT_HOMEPAGE_SETTINGS.titleEn,
        titleDe: settings.titleDe || DEFAULT_HOMEPAGE_SETTINGS.titleDe,
        subtitleBg: settings.subtitleBg || DEFAULT_HOMEPAGE_SETTINGS.subtitleBg,
        subtitleEn: settings.subtitleEn || DEFAULT_HOMEPAGE_SETTINGS.subtitleEn,
        subtitleDe: settings.subtitleDe || DEFAULT_HOMEPAGE_SETTINGS.subtitleDe,
        descriptionBg: settings.descriptionBg || DEFAULT_HOMEPAGE_SETTINGS.descriptionBg,
        descriptionEn: settings.descriptionEn || DEFAULT_HOMEPAGE_SETTINGS.descriptionEn,
        descriptionDe: settings.descriptionDe || DEFAULT_HOMEPAGE_SETTINGS.descriptionDe,
        moodTextBg: settings.moodTextBg || DEFAULT_HOMEPAGE_SETTINGS.moodTextBg,
        moodTextEn: settings.moodTextEn || DEFAULT_HOMEPAGE_SETTINGS.moodTextEn,
        moodTextDe: settings.moodTextDe || DEFAULT_HOMEPAGE_SETTINGS.moodTextDe,
        stats: (settings.stats as any) || DEFAULT_STATS,
        ctaPrimaryBg: settings.ctaPrimaryBg || DEFAULT_HOMEPAGE_SETTINGS.ctaPrimaryBg,
        ctaPrimaryEn: settings.ctaPrimaryEn || DEFAULT_HOMEPAGE_SETTINGS.ctaPrimaryEn,
        ctaPrimaryDe: settings.ctaPrimaryDe || DEFAULT_HOMEPAGE_SETTINGS.ctaPrimaryDe,
        ctaSecondaryBg: settings.ctaSecondaryBg || DEFAULT_HOMEPAGE_SETTINGS.ctaSecondaryBg,
        ctaSecondaryEn: settings.ctaSecondaryEn || DEFAULT_HOMEPAGE_SETTINGS.ctaSecondaryEn,
        ctaSecondaryDe: settings.ctaSecondaryDe || DEFAULT_HOMEPAGE_SETTINGS.ctaSecondaryDe
      };
    }

    // Create default if none exists
    const newSettings = await prisma.homepageSettings.create({
      data: {
        ...DEFAULT_HOMEPAGE_SETTINGS,
        stats: DEFAULT_STATS_JSON
      }
    });

    return {
      id: newSettings.id,
      ...DEFAULT_HOMEPAGE_SETTINGS,
      stats: DEFAULT_STATS
    };
  } catch (error) {
    console.error('Error fetching homepage settings:', error);
    return {
      id: '',
      ...DEFAULT_HOMEPAGE_SETTINGS,
      stats: DEFAULT_STATS
    };
  }
}

export async function getHomepageOfferingCards(): Promise<HomepageOfferingCard[]> {
  try {
    const cards = await prisma.homepageOfferingCard.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' }
    });

    return cards.map(card => ({
      id: card.id,
      order: card.order,
      icon: card.icon,
      titleBg: card.titleBg,
      titleEn: card.titleEn,
      titleDe: card.titleDe,
      descriptionBg: card.descriptionBg,
      descriptionEn: card.descriptionEn,
      descriptionDe: card.descriptionDe,
      badgeBg: card.badgeBg,
      badgeEn: card.badgeEn,
      badgeDe: card.badgeDe,
      highlights: card.highlights as { bg: string[]; en: string[]; de: string[] },
      isActive: card.isActive
    }));
  } catch (error) {
    console.error('Error fetching homepage offering cards:', error);
    return [];
  }
}

export async function updateHomepageSettings(data: Partial<HomepageSettings>): Promise<HomepageSettings> {
  try {
    const existing = await prisma.homepageSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      const updated = await prisma.homepageSettings.update({
        where: { id: existing.id },
        data: {
          sectionLabelBg: data.sectionLabelBg ?? existing.sectionLabelBg,
          sectionLabelEn: data.sectionLabelEn ?? existing.sectionLabelEn,
          sectionLabelDe: data.sectionLabelDe ?? existing.sectionLabelDe,
          titleBg: data.titleBg ?? existing.titleBg,
          titleEn: data.titleEn ?? existing.titleEn,
          titleDe: data.titleDe ?? existing.titleDe,
          subtitleBg: data.subtitleBg ?? existing.subtitleBg,
          subtitleEn: data.subtitleEn ?? existing.subtitleEn,
          subtitleDe: data.subtitleDe ?? existing.subtitleDe,
          descriptionBg: data.descriptionBg ?? existing.descriptionBg,
          descriptionEn: data.descriptionEn ?? existing.descriptionEn,
          descriptionDe: data.descriptionDe ?? existing.descriptionDe,
          moodTextBg: data.moodTextBg ?? existing.moodTextBg,
          moodTextEn: data.moodTextEn ?? existing.moodTextEn,
          moodTextDe: data.moodTextDe ?? existing.moodTextDe,
          stats: data.stats ? (data.stats as unknown as Prisma.InputJsonValue) : (existing.stats as Prisma.InputJsonValue),
          ctaPrimaryBg: data.ctaPrimaryBg ?? existing.ctaPrimaryBg,
          ctaPrimaryEn: data.ctaPrimaryEn ?? existing.ctaPrimaryEn,
          ctaPrimaryDe: data.ctaPrimaryDe ?? existing.ctaPrimaryDe,
          ctaSecondaryBg: data.ctaSecondaryBg ?? existing.ctaSecondaryBg,
          ctaSecondaryEn: data.ctaSecondaryEn ?? existing.ctaSecondaryEn,
          ctaSecondaryDe: data.ctaSecondaryDe ?? existing.ctaSecondaryDe
        }
      });

      return {
        id: updated.id,
        sectionLabelBg: updated.sectionLabelBg,
        sectionLabelEn: updated.sectionLabelEn,
        sectionLabelDe: updated.sectionLabelDe,
        titleBg: updated.titleBg,
        titleEn: updated.titleEn,
        titleDe: updated.titleDe,
        subtitleBg: updated.subtitleBg,
        subtitleEn: updated.subtitleEn,
        subtitleDe: updated.subtitleDe,
        descriptionBg: updated.descriptionBg,
        descriptionEn: updated.descriptionEn,
        descriptionDe: updated.descriptionDe,
        moodTextBg: updated.moodTextBg,
        moodTextEn: updated.moodTextEn,
        moodTextDe: updated.moodTextDe,
        stats: updated.stats as unknown as HomepageStats,
        ctaPrimaryBg: updated.ctaPrimaryBg,
        ctaPrimaryEn: updated.ctaPrimaryEn,
        ctaPrimaryDe: updated.ctaPrimaryDe,
        ctaSecondaryBg: updated.ctaSecondaryBg,
        ctaSecondaryEn: updated.ctaSecondaryEn,
        ctaSecondaryDe: updated.ctaSecondaryDe
      };
    }

    const created = await prisma.homepageSettings.create({
      data: {
        ...DEFAULT_HOMEPAGE_SETTINGS,
        stats: data.stats ? (data.stats as unknown as Prisma.InputJsonValue) : DEFAULT_STATS_JSON
      }
    });

    return {
      id: created.id,
      ...DEFAULT_HOMEPAGE_SETTINGS,
      stats: created.stats as unknown as HomepageStats
    };
  } catch (error) {
    console.error('Error updating homepage settings:', error);
    throw error;
  }
}


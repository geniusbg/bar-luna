import { prisma } from './prisma';

export interface MenuSettings {
  id: string;
  titleBg: string;
  titleEn: string;
  titleDe: string;
  subtitleBg: string;
  subtitleEn: string;
  subtitleDe: string;
  backgroundImageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

const DEFAULT_SETTINGS = {
  titleBg: '🍸 Нашето Меню',
  titleEn: '🍸 Our Menu',
  titleDe: '🍸 Unser Menü',
  subtitleBg: 'Открийте нашата селекция от напитки и деликатеси',
  subtitleEn: 'Discover our selection of drinks and delicacies',
  subtitleDe: 'Entdecken Sie unsere Auswahl an Getränken und Köstlichkeiten',
  backgroundImageUrl: null
};

export async function getMenuSettings(): Promise<MenuSettings | null> {
  try {
    const settings = await prisma.menuSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });
    return settings;
  } catch (error) {
    console.error('Error fetching menu settings:', error);
    return null;
  }
}

export async function updateMenuSettings(data: {
  titleBg?: string;
  titleEn?: string;
  titleDe?: string;
  subtitleBg?: string;
  subtitleEn?: string;
  subtitleDe?: string;
  backgroundImageUrl?: string | null;
}): Promise<MenuSettings> {
  const existing = await prisma.menuSettings.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (existing) {
    return await prisma.menuSettings.update({
      where: { id: existing.id },
      data: {
        titleBg: data.titleBg ?? existing.titleBg,
        titleEn: data.titleEn ?? existing.titleEn,
        titleDe: data.titleDe ?? existing.titleDe,
        subtitleBg: data.subtitleBg ?? existing.subtitleBg,
        subtitleEn: data.subtitleEn ?? existing.subtitleEn,
        subtitleDe: data.subtitleDe ?? existing.subtitleDe,
        backgroundImageUrl: data.backgroundImageUrl !== undefined ? data.backgroundImageUrl : existing.backgroundImageUrl
      }
    });
  } else {
    return await prisma.menuSettings.create({
      data: {
        titleBg: data.titleBg ?? DEFAULT_SETTINGS.titleBg,
        titleEn: data.titleEn ?? DEFAULT_SETTINGS.titleEn,
        titleDe: data.titleDe ?? DEFAULT_SETTINGS.titleDe,
        subtitleBg: data.subtitleBg ?? DEFAULT_SETTINGS.subtitleBg,
        subtitleEn: data.subtitleEn ?? DEFAULT_SETTINGS.subtitleEn,
        subtitleDe: data.subtitleDe ?? DEFAULT_SETTINGS.subtitleDe,
        backgroundImageUrl: data.backgroundImageUrl ?? DEFAULT_SETTINGS.backgroundImageUrl
      }
    });
  }
}


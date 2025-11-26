import { prisma } from './prisma';

export interface LocationSettings {
  id: string;
  addressBg: string;
  addressEn: string;
  addressDe: string;
}

const DEFAULT_ADDRESS = {
  addressBg: 'Русе, ул. Александровска 97',
  addressEn: 'Ruse, 97 Alexandrovska St',
  addressDe: 'Ruse, Alexandrovska Str. 97'
};

export async function getLocationSettings(): Promise<LocationSettings> {
  try {
    const settings = await prisma.locationSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (settings) {
      return {
        id: settings.id,
        addressBg: settings.addressBg || DEFAULT_ADDRESS.addressBg,
        addressEn: settings.addressEn || DEFAULT_ADDRESS.addressEn,
        addressDe: settings.addressDe || DEFAULT_ADDRESS.addressDe
      };
    }

    // Create default if none exists
    const newSettings = await prisma.locationSettings.create({
      data: DEFAULT_ADDRESS
    });

    return {
      id: newSettings.id,
      addressBg: newSettings.addressBg,
      addressEn: newSettings.addressEn,
      addressDe: newSettings.addressDe
    };
  } catch (error) {
    console.error('Error fetching location settings:', error);
    return {
      id: '',
      ...DEFAULT_ADDRESS
    };
  }
}

export async function updateLocationSettings(data: {
  addressBg: string;
  addressEn: string;
  addressDe: string;
}): Promise<LocationSettings> {
  try {
    const existing = await prisma.locationSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    if (existing) {
      const updated = await prisma.locationSettings.update({
        where: { id: existing.id },
        data: {
          addressBg: data.addressBg,
          addressEn: data.addressEn,
          addressDe: data.addressDe
        }
      });

      return {
        id: updated.id,
        addressBg: updated.addressBg,
        addressEn: updated.addressEn,
        addressDe: updated.addressDe
      };
    }

    const created = await prisma.locationSettings.create({
      data: {
        addressBg: data.addressBg,
        addressEn: data.addressEn,
        addressDe: data.addressDe
      }
    });

    return {
      id: created.id,
      addressBg: created.addressBg,
      addressEn: created.addressEn,
      addressDe: created.addressDe
    };
  } catch (error) {
    console.error('Error updating location settings:', error);
    throw error;
  }
}


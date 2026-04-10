import { prisma } from './prisma';
import { getDefaultBrandId } from './brand';

export interface LocationSettings {
  id: string;
  addressBg: string;
  addressEn: string;
  addressRo: string;
}

const DEFAULT_ADDRESS = {
  addressBg: 'Русе, ул. Александровска 97',
  addressEn: 'Ruse, 97 Alexandrovska St',
  addressRo: 'Ruse, str. Alexandrovska 97',
};

export async function getLocationSettings(): Promise<LocationSettings> {
  try {
    const brandId = await getDefaultBrandId();
    const settings = await prisma.locationSettings.findUnique({
      where: { brandId },
    });

    if (settings) {
      return {
        id: settings.id,
        addressBg: settings.addressBg || DEFAULT_ADDRESS.addressBg,
        addressEn: settings.addressEn || DEFAULT_ADDRESS.addressEn,
        addressRo: settings.addressRo || DEFAULT_ADDRESS.addressRo,
      };
    }

    const newSettings = await prisma.locationSettings.create({
      data: {
        brandId,
        ...DEFAULT_ADDRESS,
      },
    });

    return {
      id: newSettings.id,
      addressBg: newSettings.addressBg,
      addressEn: newSettings.addressEn,
      addressRo: newSettings.addressRo,
    };
  } catch (error) {
    console.error('Error fetching location settings:', error);
    return {
      id: '',
      ...DEFAULT_ADDRESS,
    };
  }
}

export async function updateLocationSettings(data: {
  addressBg: string;
  addressEn: string;
  addressRo: string;
}): Promise<LocationSettings> {
  try {
    const brandId = await getDefaultBrandId();
    const existing = await prisma.locationSettings.findUnique({
      where: { brandId },
    });

    if (existing) {
      const updated = await prisma.locationSettings.update({
        where: { id: existing.id },
        data: {
          addressBg: data.addressBg,
          addressEn: data.addressEn,
          addressRo: data.addressRo,
        },
      });

      return {
        id: updated.id,
        addressBg: updated.addressBg,
        addressEn: updated.addressEn,
        addressRo: updated.addressRo,
      };
    }

    const created = await prisma.locationSettings.create({
      data: {
        brandId,
        addressBg: data.addressBg,
        addressEn: data.addressEn,
        addressRo: data.addressRo,
      },
    });

    return {
      id: created.id,
      addressBg: created.addressBg,
      addressEn: created.addressEn,
      addressRo: created.addressRo,
    };
  } catch (error) {
    console.error('Error updating location settings:', error);
    throw error;
  }
}

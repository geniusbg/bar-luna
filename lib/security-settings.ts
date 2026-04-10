import { prisma } from './prisma';
import { getDefaultBrandId } from './brand';

export interface SecuritySettingsValues {
  id?: string;
  approvalOrderThreshold: number;
  approvalTimeWindowMinutes: number;
  sessionDurationHours: number;
  autoRejectMinutes: number;
}

export const DEFAULT_SECURITY_SETTINGS: SecuritySettingsValues = {
  approvalOrderThreshold: 5,
  approvalTimeWindowMinutes: 5,
  sessionDurationHours: 3,
  autoRejectMinutes: 30,
};

export async function getSecuritySettings(): Promise<SecuritySettingsValues> {
  try {
    const brandId = await getDefaultBrandId();
    let settings = await prisma.securitySettings.findUnique({
      where: { brandId },
    });

    if (!settings) {
      settings = await prisma.securitySettings.create({
        data: {
          brandId,
          approvalOrderThreshold: DEFAULT_SECURITY_SETTINGS.approvalOrderThreshold,
          approvalTimeWindowMinutes: DEFAULT_SECURITY_SETTINGS.approvalTimeWindowMinutes,
          sessionDurationHours: DEFAULT_SECURITY_SETTINGS.sessionDurationHours,
          autoRejectMinutes: DEFAULT_SECURITY_SETTINGS.autoRejectMinutes,
        },
      });
    }

    return {
      id: settings.id,
      approvalOrderThreshold: settings.approvalOrderThreshold ?? DEFAULT_SECURITY_SETTINGS.approvalOrderThreshold,
      approvalTimeWindowMinutes: settings.approvalTimeWindowMinutes ?? DEFAULT_SECURITY_SETTINGS.approvalTimeWindowMinutes,
      sessionDurationHours: settings.sessionDurationHours ?? DEFAULT_SECURITY_SETTINGS.sessionDurationHours,
      autoRejectMinutes: settings.autoRejectMinutes ?? DEFAULT_SECURITY_SETTINGS.autoRejectMinutes,
    };
  } catch (error) {
    console.error('Failed to load security settings:', error);
    return { ...DEFAULT_SECURITY_SETTINGS };
  }
}

export async function updateSecuritySettings(values: SecuritySettingsValues) {
  const brandId = await getDefaultBrandId();
  const {
    approvalOrderThreshold,
    approvalTimeWindowMinutes,
    sessionDurationHours,
    autoRejectMinutes,
  } = {
    ...DEFAULT_SECURITY_SETTINGS,
    ...values,
  };

  const updated = await prisma.securitySettings.upsert({
    where: { brandId },
    update: {
      approvalOrderThreshold,
      approvalTimeWindowMinutes,
      sessionDurationHours,
      autoRejectMinutes,
    },
    create: {
      brandId,
      approvalOrderThreshold,
      approvalTimeWindowMinutes,
      sessionDurationHours,
      autoRejectMinutes,
    },
  });

  return {
    id: updated.id,
    approvalOrderThreshold: updated.approvalOrderThreshold,
    approvalTimeWindowMinutes: updated.approvalTimeWindowMinutes,
    sessionDurationHours: updated.sessionDurationHours,
    autoRejectMinutes: updated.autoRejectMinutes,
  };
}

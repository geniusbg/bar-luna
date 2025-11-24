import { prisma } from '@/lib/prisma';

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
  autoRejectMinutes: 30
};

export async function getSecuritySettings(): Promise<SecuritySettingsValues> {
  try {
    let settings = await prisma.securitySettings.findFirst();

    if (!settings) {
      settings = await prisma.securitySettings.create({
        data: {
          approvalOrderThreshold: DEFAULT_SECURITY_SETTINGS.approvalOrderThreshold,
          approvalTimeWindowMinutes: DEFAULT_SECURITY_SETTINGS.approvalTimeWindowMinutes,
          sessionDurationHours: DEFAULT_SECURITY_SETTINGS.sessionDurationHours,
          autoRejectMinutes: DEFAULT_SECURITY_SETTINGS.autoRejectMinutes
        }
      });
    }

    return {
      id: settings.id,
      approvalOrderThreshold: settings.approvalOrderThreshold ?? DEFAULT_SECURITY_SETTINGS.approvalOrderThreshold,
      approvalTimeWindowMinutes: settings.approvalTimeWindowMinutes ?? DEFAULT_SECURITY_SETTINGS.approvalTimeWindowMinutes,
      sessionDurationHours: settings.sessionDurationHours ?? DEFAULT_SECURITY_SETTINGS.sessionDurationHours,
      autoRejectMinutes: settings.autoRejectMinutes ?? DEFAULT_SECURITY_SETTINGS.autoRejectMinutes
    };
  } catch (error) {
    console.error('Failed to load security settings:', error);
    return { ...DEFAULT_SECURITY_SETTINGS };
  }
}

export async function updateSecuritySettings(values: SecuritySettingsValues) {
  const {
    approvalOrderThreshold,
    approvalTimeWindowMinutes,
    sessionDurationHours,
    autoRejectMinutes
  } = {
    ...DEFAULT_SECURITY_SETTINGS,
    ...values
  };

  const updated = await prisma.securitySettings.upsert({
    where: { id: values.id ?? (await getExistingSettingsId()) ?? 'security-settings-singleton' },
    update: {
      approvalOrderThreshold,
      approvalTimeWindowMinutes,
      sessionDurationHours,
      autoRejectMinutes
    },
    create: {
      id: values.id ?? undefined,
      approvalOrderThreshold,
      approvalTimeWindowMinutes,
      sessionDurationHours,
      autoRejectMinutes
    }
  });

  return {
    id: updated.id,
    approvalOrderThreshold: updated.approvalOrderThreshold,
    approvalTimeWindowMinutes: updated.approvalTimeWindowMinutes,
    sessionDurationHours: updated.sessionDurationHours,
    autoRejectMinutes: updated.autoRejectMinutes
  };
}

async function getExistingSettingsId(): Promise<string | null> {
  const existing = await prisma.securitySettings.findFirst({
    select: { id: true }
  });
  return existing?.id ?? null;
}



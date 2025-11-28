import crypto from 'crypto';
import { prisma } from './prisma';

const CLEANUP_THRESHOLD_HOURS = 24;
export const TABLE_SESSION_COOKIE_NAME = 'table_session';

export type TableSessionInvalidReason = 'missing' | 'revoked' | 'expired' | 'invalid';

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export async function createTableSession(tableNumber: number, durationHours: number) {
  const rawToken = `${crypto.randomUUID()}-${crypto.randomBytes(8).toString('hex')}`;
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000);

  await prisma.$transaction([
    prisma.tableSession.updateMany({
      where: { tableNumber, revokedAt: null },
      data: { revokedAt: new Date() }
    }),
    prisma.tableSession.create({
      data: {
        tableNumber,
        tokenHash,
        expiresAt
      }
    }),
    prisma.tableSession.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(Date.now() - CLEANUP_THRESHOLD_HOURS * 60 * 60 * 1000)
        }
      }
    })
  ]);

  return { token: rawToken, expiresAt };
}

export async function validateTableSession(rawToken?: string) {
  if (!rawToken) {
    return { valid: false, reason: 'missing' as TableSessionInvalidReason } as const;
  }

  const tokenHash = hashToken(rawToken);

  const session = await prisma.tableSession.findUnique({
    where: { tokenHash }
  });

  if (!session) {
    return { valid: false, reason: 'invalid' as TableSessionInvalidReason } as const;
  }

  if (session.revokedAt) {
    return { valid: false, reason: 'revoked' as TableSessionInvalidReason } as const;
  }

  if (session.expiresAt.getTime() < Date.now()) {
    await prisma.tableSession.updateMany({
      where: { id: session.id, revokedAt: null },
      data: { revokedAt: new Date() }
    }).catch(() => {});
    return { valid: false, reason: 'expired' as TableSessionInvalidReason } as const;
  }

  return { valid: true, session } as const;
}

export async function revokeSessionByToken(rawToken: string) {
  const tokenHash = hashToken(rawToken);
  await prisma.tableSession.updateMany({
    where: { tokenHash, revokedAt: null },
    data: { revokedAt: new Date() }
  });
}


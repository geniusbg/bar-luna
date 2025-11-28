import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { TABLE_SESSION_COOKIE_NAME, TableSessionInvalidReason, validateTableSession } from '@/lib/table-sessions';

const ERROR_MESSAGES: Record<TableSessionInvalidReason | 'error', string> = {
  missing: 'Сесията е изтекла. Моля, сканирайте QR кода отново.',
  expired: 'Сесията е изтекла. Моля, сканирайте QR кода отново.',
  revoked: 'Сесията е невалидна. Моля, сканирайте QR кода отново.',
  invalid: 'Невалидна сесия. Моля, сканирайте QR кода отново.',
  error: 'Неуспешна проверка на сесията. Моля, опитайте отново.'
};

function buildErrorResponse(reason: TableSessionInvalidReason | 'error') {
  const response = NextResponse.json(
    { ok: false, reason, error: ERROR_MESSAGES[reason] ?? ERROR_MESSAGES.error },
    { status: reason === 'error' ? 500 : 401 }
  );
  response.cookies.delete(TABLE_SESSION_COOKIE_NAME);
  return response;
}

async function handleValidation() {
  try {
    const cookieStore = await cookies();
    const rawToken = cookieStore.get(TABLE_SESSION_COOKIE_NAME)?.value;

    const validation = await validateTableSession(rawToken);

    if (!validation.valid) {
      return buildErrorResponse(validation.reason);
    }

    const { tableNumber, expiresAt } = validation.session;
    return NextResponse.json({
      ok: true,
      tableNumber,
      expiresAt
    });
  } catch (error) {
    console.error('Table session validation error:', error);
    return buildErrorResponse('error');
  }
}

export async function POST() {
  return handleValidation();
}

export async function GET() {
  return handleValidation();
}


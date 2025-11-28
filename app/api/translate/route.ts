import { NextResponse } from 'next/server';

type TranslateRequest = {
  text?: string;
  targetLang?: string;
  sourceLang?: string;
};

export async function POST(request: Request) {
  try {
    const body: TranslateRequest = await request.json();
    const text = body.text?.toString().trim();
    const targetLang = body.targetLang?.toString().trim();
    const sourceLang = body.sourceLang?.toString().trim() || 'auto';

    if (!text || !targetLang) {
      return NextResponse.json(
            { error: 'Липсва текст или език за превод.' },
            { status: 400 }
          );
    }

    const params = new URLSearchParams({
      client: 'gtx',
      sl: sourceLang,
      tl: targetLang,
      dt: 't',
      q: text
    });

    const response = await fetch(
      `https://translate.googleapis.com/translate_a/single?${params.toString()}`
    );

    if (!response.ok) {
      throw new Error('Failed to translate');
    }

    const data = await response.json();
    const translated = Array.isArray(data)
      ? data[0].map((entry: any) => entry[0]).join('')
      : '';

    if (!translated) {
      return NextResponse.json(
        { error: 'Не бе получен превод.' },
        { status: 502 }
      );
    }

    return NextResponse.json({ text: translated });
  } catch (error) {
    console.error('Translation API error:', error);
    return NextResponse.json(
      { error: 'Възникна грешка при превода. Моля, опитайте отново.' },
      { status: 500 }
    );
  }
}


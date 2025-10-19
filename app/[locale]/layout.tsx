import { notFound } from 'next/navigation';
import { locales } from '@/i18n';
import ConditionalNav from '@/components/ConditionalNav';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  
  // Validate locale
  if (!locales.includes(locale as any)) {
    notFound();
  }

  return <ConditionalNav>{children}</ConditionalNav>;
}

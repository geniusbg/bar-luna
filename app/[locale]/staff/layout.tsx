import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Luna Bar Staff Dashboard',
  manifest: '/manifest-staff.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Luna Staff'
  }
};

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1
};

export default async function StaffLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // Note: Authentication check moved to individual pages to avoid redirect loops
  // Login page has its own layout that doesn't check auth

  return (
    <>
      <link rel="manifest" href="/manifest-staff.json" />
      {children}
    </>
  );
}


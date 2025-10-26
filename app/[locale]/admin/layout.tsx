import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import AdminNav from '@/components/AdminNav';
import ServiceWorkerUpdater from '@/components/ServiceWorkerUpdater';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { Metadata } from 'next';

interface AdminLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export const metadata: Metadata = {
  title: 'Admin Panel - Luna Bar',
  manifest: '/manifest-admin.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Luna Admin'
  }
};

export default async function AdminLayout({ children, params }: AdminLayoutProps) {
  const { locale } = await params;
  
  // Note: Session check is handled in app/[locale]/admin/page.tsx to avoid redirect loops

  return (
    <>
      <link rel="manifest" href="/manifest-admin.json" />
      <div className="min-h-screen bg-black">
        <ServiceWorkerUpdater />
        <AdminNav locale={locale} />
        
        <main className="pt-28 px-4 pb-8 md:px-8">
          {children}
        </main>
      </div>
    </>
  );
}


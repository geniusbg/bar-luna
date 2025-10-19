import { redirect } from 'next/navigation';
import AdminNav from '@/components/AdminNav';

// Simple auth check - in production, use proper Supabase auth
async function checkAuth() {
  // TODO: Implement proper Supabase authentication
  // For now, this is a placeholder
  return true;
}

export default async function AdminLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const isAuthenticated = await checkAuth();

  if (!isAuthenticated) {
    redirect(`/${locale}/admin/login`);
  }

  return (
    <div className="min-h-screen bg-black">
      <AdminNav locale={locale} />
      
      <main className="pt-24 px-4 pb-8 md:px-8">
        {children}
      </main>
    </div>
  );
}


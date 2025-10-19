'use client';

import { useRouter, usePathname } from 'next/navigation';
import EventForm from '@/components/EventForm';

export default function NewEventPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';

  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      router.push(`/${locale}/admin/events`);
    }
  };

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8">Добави събитие</h1>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
        <EventForm onSubmit={handleSubmit} locale={locale} />
      </div>
    </div>
  );
}


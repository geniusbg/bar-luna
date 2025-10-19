'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProductForm from '@/components/ProductForm';

export default function NewProductPage() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  const [categories, setCategories] = useState<any[]>([]);

  useEffect(() => {
    async function fetchCategories() {
      const response = await fetch('/api/categories');
      const data = await response.json();
      setCategories(data.categories || []);
    }
    fetchCategories();
  }, []);

  const handleSubmit = async (data: any) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (response.ok) {
      router.push(`/${locale}/admin/products`);
    }
  };

  if (categories.length === 0) {
    return <div className="text-white">Loading...</div>;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-white mb-8">Добави продукт</h1>
      
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-8">
        <ProductForm
          categories={categories}
          onSubmit={handleSubmit}
          locale={locale}
        />
      </div>
    </div>
  );
}


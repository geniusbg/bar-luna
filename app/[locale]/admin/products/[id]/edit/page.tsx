'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import Image from 'next/image';
import ProductForm from '@/components/ProductForm';
import LoadingScreen from '@/components/LoadingScreen';

export default function EditProductPage({
  params
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname.split('/')[1] || 'bg';
  const [productId, setProductId] = useState<string>('');
  const [categories, setCategories] = useState<any[]>([]);
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function init() {
      const resolvedParams = await params;
      setProductId(resolvedParams.id);

      // Fetch categories and product in parallel
      const [categoriesRes, productRes] = await Promise.all([
        fetch('/api/categories'),
        fetch(`/api/products/${resolvedParams.id}`)
      ]);

      const categoriesData = await categoriesRes.json();
      const productData = await productRes.json();

      setCategories(categoriesData.categories || []);
      
      // Map camelCase to snake_case for form
      if (productData.product) {
        const p = productData.product;
        setProduct({
          category_id: p.categoryId,
          name_bg: p.nameBg,
          name_en: p.nameEn,
          name_ro: p.nameRo,
          description_bg: p.descriptionBg || '',
          description_en: p.descriptionEn || '',
          description_ro: p.descriptionRo || '',
          price_bgn: Number(p.priceBgn),
          price_eur: Number(p.priceEur),
          image_url: p.imageUrl || '',
          unit: p.unit || 'pcs',
          quantity: p.quantity || 1,
          is_available: p.isAvailable,
          is_hidden: p.isHidden,
          is_featured: p.isFeatured,
          order: p.order,
          allergens: p.allergens || []
        });
      }

      setLoading(false);
    }

    init();
  }, [params]);

  const handleSubmit = async (data: any) => {
    try {
      const response = await fetch(`/api/products/${productId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      // Check if server is offline (503 or network error)
      if (response.status === 503 || !response.ok) {
        // Trigger offline banner
        if (typeof window !== 'undefined' && (window as any).__setOfflineState) {
          (window as any).__setOfflineState(true);
        }
        if (typeof window !== 'undefined' && (window as any).__setServerDown) {
          (window as any).__setServerDown(true);
        }
        throw new Error('Server is offline');
      }

      if (response.ok) {
        router.push(`/${locale}/admin/products`);
      }
    } catch (error: any) {
      // Network error or server offline
      if (error.name === 'TypeError' || error.message === 'Server is offline') {
        // Trigger offline banner
        if (typeof window !== 'undefined' && (window as any).__setOfflineState) {
          (window as any).__setOfflineState(true);
        }
        if (typeof window !== 'undefined' && (window as any).__setServerDown) {
          (window as any).__setServerDown(true);
        }
      }
      throw error; // Re-throw to let form handle it
    }
  };

  if (loading || !product || categories.length === 0) {
    return <LoadingScreen locale={locale} />;
  }

  return (
    <div>
      <h1 className="text-4xl font-bold text-[var(--malts-ink)] mb-8">Редактирай продукт</h1>
      
      <div className="malts-card rounded-xl p-8">
        <ProductForm
          categories={categories}
          initialData={product}
          onSubmit={handleSubmit}
          locale={locale}
        />
      </div>
    </div>
  );
}


'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import LoadingScreen from '@/components/LoadingScreen';

type PromoRow = {
  id: string;
  productId: string;
  startsAt: string;
  endsAt: string;
  priceBgn: number;
  priceEur: number;
  label: string | null;
  product: { nameBg: string; nameEn: string; nameRo: string };
};

type ProductOpt = { id: string; nameBg: string; nameEn: string; nameRo: string; priceBgn: number; priceEur: number };

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminPromotionsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = React.use(params);
  const { status } = useSession();
  const [loading, setLoading] = useState(true);
  const [promotions, setPromotions] = useState<PromoRow[]>([]);
  const [products, setProducts] = useState<ProductOpt[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const [form, setForm] = useState({
    productId: '',
    startsAt: '',
    endsAt: '',
    priceBgn: '',
    priceEur: '',
    label: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing] = useState<{
    id: string;
    startsAt: string;
    endsAt: string;
    priceBgn: string;
    priceEur: string;
    label: string;
  } | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);

  const load = useCallback(async () => {
    setErr(null);
    try {
      const [pr, prod] = await Promise.all([
        fetch('/api/promotions').then((r) => r.json()),
        fetch('/api/products').then((r) => r.json()),
      ]);
      if (pr.promotions) setPromotions(pr.promotions);
      if (prod.products) {
        setProducts(
          prod.products.map((p: ProductOpt & { priceBgn: unknown }) => ({
            ...p,
            priceBgn: Number(p.priceBgn),
            priceEur: Number(p.priceEur),
          }))
        );
      }
    } catch {
      setErr('Грешка при зареждане');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === 'unauthenticated') {
      window.location.href = `/${locale}/admin/login`;
      return;
    }
    if (status === 'authenticated') load();
  }, [status, load, locale]);

  const createPromo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.startsAt || !form.endsAt || !form.priceBgn || !form.priceEur) {
      setErr('Попълнете всички полета');
      return;
    }
    setSubmitting(true);
    setErr(null);
    try {
      const res = await fetch('/api/promotions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: form.productId,
          startsAt: new Date(form.startsAt).toISOString(),
          endsAt: new Date(form.endsAt).toISOString(),
          priceBgn: parseFloat(form.priceBgn),
          priceEur: parseFloat(form.priceEur),
          label: form.label.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Грешка');
      setForm({
        productId: '',
        startsAt: '',
        endsAt: '',
        priceBgn: '',
        priceEur: '',
        label: '',
      });
      await load();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Грешка');
    } finally {
      setSubmitting(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Изтриване на промоцията?')) return;
    try {
      const res = await fetch(`/api/promotions/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Грешка');
      setEditing((e) => (e?.id === id ? null : e));
      await load();
    } catch {
      setErr('Изтриването неуспешно');
    }
  };

  const startEdit = (p: PromoRow) => {
    setErr(null);
    setEditing({
      id: p.id,
      startsAt: toDatetimeLocalValue(p.startsAt),
      endsAt: toDatetimeLocalValue(p.endsAt),
      priceBgn: String(p.priceBgn),
      priceEur: String(p.priceEur),
      label: p.label ?? '',
    });
  };

  const cancelEdit = () => {
    setEditing(null);
    setErr(null);
  };

  const saveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editing) return;
    setSavingEdit(true);
    setErr(null);
    try {
      const res = await fetch(`/api/promotions/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startsAt: new Date(editing.startsAt).toISOString(),
          endsAt: new Date(editing.endsAt).toISOString(),
          priceBgn: parseFloat(editing.priceBgn),
          priceEur: parseFloat(editing.priceEur),
          label: editing.label.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Грешка при запис');
      setEditing(null);
      await load();
    } catch (err: unknown) {
      setErr(err instanceof Error ? err.message : 'Грешка при запис');
    } finally {
      setSavingEdit(false);
    }
  };

  if (status === 'loading' || loading) {
    return <LoadingScreen locale={locale} />;
  }

  const now = Date.now();

  return (
    <div className="p-4 md:p-8 pt-24 md:pt-28 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Промоции</h1>
      <p className="malts-muted text-sm mb-8">
        Промо цена в зададен период. На менюто се показва ефективната цена и бадж „Промо“.
      </p>

      {err && <div className="mb-4 malts-alert malts-alert-error" role="alert">{err}</div>}

      <form
        onSubmit={createPromo}
        className="malts-card p-6 mb-10 space-y-4"
      >
        <h2 className="font-semibold text-lg">Нова промоция</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block malts-subtle text-sm mb-1">Продукт</label>
            <select
              required
              value={form.productId}
              onChange={(e) => {
                const id = e.target.value;
                const p = products.find((x) => x.id === id);
                setForm((f) => ({
                  ...f,
                  productId: id,
                  priceBgn: p ? String(p.priceBgn) : f.priceBgn,
                  priceEur: p ? String(p.priceEur) : f.priceEur,
                }));
              }}
              className="w-full malts-inset px-3 py-2"
            >
              <option value="">— избери —</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nameBg}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block malts-subtle text-sm mb-1">Етикет (по избор)</label>
            <input
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
              placeholder="Промо"
              className="w-full malts-inset px-3 py-2"
            />
          </div>
          <div>
            <label className="block malts-subtle text-sm mb-1">Начало (локално време)</label>
            <input
              type="datetime-local"
              required
              value={form.startsAt}
              onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))}
              className="w-full malts-inset px-3 py-2"
            />
          </div>
          <div>
            <label className="malts-label">Край</label>
            <input
              type="datetime-local"
              required
              value={form.endsAt}
              onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))}
              className="w-full malts-inset px-3 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="malts-label">Цена лв.</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.priceBgn}
              onChange={(e) => setForm((f) => ({ ...f, priceBgn: e.target.value }))}
              className="w-full malts-inset px-3 py-2 rounded-lg"
            />
          </div>
          <div>
            <label className="malts-label">Цена €</label>
            <input
              required
              type="number"
              step="0.01"
              min="0"
              value={form.priceEur}
              onChange={(e) => setForm((f) => ({ ...f, priceEur: e.target.value }))}
              className="w-full malts-inset px-3 py-2 rounded-lg"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="px-6 py-2 malts-btn-primary font-semibold rounded-lg disabled:opacity-50"
        >
          {submitting ? 'Запис…' : 'Добави промоция'}
        </button>
      </form>

      <div className="overflow-x-auto border border-[var(--malts-hairline)] rounded-xl malts-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[var(--malts-hairline)] text-left malts-subtle bg-[var(--malts-inset)]">
              <th className="p-3">Продукт</th>
              <th className="p-3">Период</th>
              <th className="p-3">Цена</th>
              <th className="p-3">Статус</th>
              <th className="p-3 w-[200px]">Действия</th>
            </tr>
          </thead>
          <tbody>
            {promotions.map((p) => {
              const start = new Date(p.startsAt).getTime();
              const end = new Date(p.endsAt).getTime();
              const active = now >= start && now <= end;
              const isEditing = editing?.id === p.id;

              if (isEditing && editing) {
                return (
                  <tr key={p.id} className="border-b border-[var(--malts-hairline)] bg-[var(--malts-inset)]">
                    <td className="p-3 align-top" colSpan={5}>
                      <form onSubmit={saveEdit} className="space-y-3">
                        <p className="text-[var(--malts-ink)] font-medium">{p.product.nameBg}</p>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div>
                            <label className="malts-label text-xs">Начало</label>
                            <input
                              type="datetime-local"
                              required
                              value={editing.startsAt}
                              onChange={(e) => setEditing((x) => (x ? { ...x, startsAt: e.target.value } : x))}
                              className="w-full malts-inset rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="malts-label text-xs">Край</label>
                            <input
                              type="datetime-local"
                              required
                              value={editing.endsAt}
                              onChange={(e) => setEditing((x) => (x ? { ...x, endsAt: e.target.value } : x))}
                              className="w-full malts-inset rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="malts-label text-xs">Цена лв.</label>
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="0"
                              value={editing.priceBgn}
                              onChange={(e) => setEditing((x) => (x ? { ...x, priceBgn: e.target.value } : x))}
                              className="w-full malts-inset rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>
                          <div>
                            <label className="malts-label text-xs">Цена €</label>
                            <input
                              type="number"
                              required
                              step="0.01"
                              min="0"
                              value={editing.priceEur}
                              onChange={(e) => setEditing((x) => (x ? { ...x, priceEur: e.target.value } : x))}
                              className="w-full malts-inset rounded-lg px-2 py-1.5 text-sm"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="malts-label text-xs">Етикет</label>
                          <input
                            value={editing.label}
                            onChange={(e) => setEditing((x) => (x ? { ...x, label: e.target.value } : x))}
                            className="w-full max-w-md malts-inset rounded-lg px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="submit"
                            disabled={savingEdit}
                            className="px-4 py-1.5 malts-btn-primary text-sm font-semibold rounded-lg disabled:opacity-50"
                          >
                            {savingEdit ? 'Запис…' : 'Запази'}
                          </button>
                          <button
                            type="button"
                            onClick={cancelEdit}
                            className="px-4 py-1.5 malts-btn-secondary text-sm rounded-lg"
                          >
                            Отказ
                          </button>
                        </div>
                      </form>
                    </td>
                  </tr>
                );
              }

              return (
                <tr key={p.id} className="border-b border-[var(--malts-hairline)]">
                  <td className="p-3">{p.product.nameBg}</td>
                  <td className="p-3 whitespace-nowrap">
                    {new Date(p.startsAt).toLocaleString('bg')} – {new Date(p.endsAt).toLocaleString('bg')}
                  </td>
                  <td className="p-3">
                    {p.priceBgn.toFixed(2)} лв / €{p.priceEur.toFixed(2)}
                  </td>
                  <td className="p-3">
                    {active ? (
                      <span className="text-[var(--malts-success)] font-semibold">активна</span>
                    ) : now < start ? (
                      <span className="text-[var(--malts-warning)] font-semibold">предстои</span>
                    ) : (
                      <span className="malts-muted">приключила</span>
                    )}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => startEdit(p)}
                      className="text-[var(--malts-accent)] hover:underline mr-4"
                    >
                      Редактирай
                    </button>
                    <button
                      type="button"
                      onClick={() => remove(p.id)}
                      className="text-[var(--malts-danger)] hover:underline"
                    >
                      Изтрий
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {promotions.length === 0 && (
          <p className="p-6 malts-muted text-center">Няма записани промоции.</p>
        )}
      </div>
    </div>
  );
}

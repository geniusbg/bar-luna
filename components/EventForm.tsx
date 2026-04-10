'use client';

import { useState } from 'react';

interface EventFormProps {
  initialData?: Partial<EventFormData>;
  onSubmit: (data: any) => Promise<void>;
  locale: string;
}

type EventFormData = {
  title_bg: string;
  title_en: string;
  title_ro: string;
  description_bg: string;
  description_en: string;
  description_ro: string;
  event_date: string;
  location: string;
  location_bg: string;
  location_en: string;
  location_ro: string;
  is_external: boolean;
  external_url: string;
  contact_phone: string;
  contact_email: string;
  contact_facebook: string;
  is_published: boolean;
  image_url: string;
};

const defaultEventFormData: EventFormData = {
  title_bg: '',
  title_en: '',
  title_ro: '',
  description_bg: '',
  description_en: '',
  description_ro: '',
  event_date: '',
  location: '',
  location_bg: '',
  location_en: '',
  location_ro: '',
  is_external: false,
  external_url: '',
  contact_phone: '',
  contact_email: '',
  contact_facebook: '',
  is_published: false,
  image_url: ''
};

export default function EventForm({ initialData, onSubmit, locale }: EventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    ...defaultEventFormData,
    ...(initialData || {})
  });

  const [loading, setLoading] = useState(false);
  const [translatingField, setTranslatingField] = useState<string | null>(null);
  const [translationError, setTranslationError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  type TranslatableField =
    | 'title_en'
    | 'title_ro'
    | 'description_en'
    | 'description_ro'
    | 'location_en'
    | 'location_ro';

  type SourceField = 'title_bg' | 'description_bg' | 'location_bg';

  const handleTranslate = async (field: TranslatableField, targetLang: 'en' | 'ro') => {
    // Determine source field based on target; TypeScript knows these are valid keys
    const sourceField: SourceField = field.includes('title')
      ? 'title_bg'
      : field.includes('description')
      ? 'description_bg'
      : 'location_bg';
    
    const source = formData[sourceField]?.trim() || '';
    
    if (!source) {
      setTranslationError('Моля, въведете текст на български, за да използвате автоматичен превод.');
      return;
    }

    setTranslationError(null);
    setTranslatingField(field);

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: source,
          targetLang
        })
      });

      if (!response.ok) {
        throw new Error('Translation failed');
      }

      const data = await response.json();
      if (data?.text) {
        setFormData((prev) => ({
          ...prev,
          [field]: data.text
        }));
      } else {
        setTranslationError('Неуспешно получаване на превода. Опитайте отново.');
      }
    } catch (error) {
      setTranslationError('Неуспешен превод. Моля, опитайте отново.');
    } finally {
      setTranslatingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare location based on language or direct field
      let location = formData.location;
      let locationBg = null;
      let locationEn = null;
      let locationRo = null;
      
      if (formData.is_external) {
        // For external events, use language-specific fields
        location = formData.location_bg || formData.location || '';
        locationBg = formData.location_bg || null;
        locationEn = formData.location_en || null;
        locationRo = formData.location_ro || null;
      } else {
        // Internal venue: default location if empty
        location = formData.location || 'Malts, Русе';
      }

      // Build contact info from structured fields
      let contactInfo = null;
      if (formData.is_external) {
        const contacts = [];
        if (formData.contact_phone) contacts.push(`Телефон: ${formData.contact_phone}`);
        if (formData.contact_email) contacts.push(`Email: ${formData.contact_email}`);
        if (formData.contact_facebook) contacts.push(`Facebook: ${formData.contact_facebook}`);
        contactInfo = contacts.length > 0 ? contacts.join('\n') : null;
      }

      // Convert snake_case to camelCase for Prisma
      const prismaData = {
        titleBg: formData.title_bg,
        titleEn: formData.title_en,
        titleRo: formData.title_ro,
        descriptionBg: formData.description_bg,
        descriptionEn: formData.description_en,
        descriptionRo: formData.description_ro,
        eventDate: new Date(formData.event_date).toISOString(),
        location: location,
        locationBg: locationBg,
        locationEn: locationEn,
        locationRo: locationRo,
        isExternal: formData.is_external,
        externalUrl: formData.external_url || null,
        contactInfo: contactInfo,
        isPublished: formData.is_published,
        imageUrl: formData.image_url || ''
      };
      
      await onSubmit(prismaData);
    } catch (error) {
      console.error('Error submitting form:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Titles */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="malts-label">Заглавие (БГ) *</label>
          <input
            type="text"
            name="title_bg"
            value={formData.title_bg}
            onChange={handleChange}
            className="malts-field"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="malts-label mb-0">Title (EN) *</label>
            <button
              type="button"
              onClick={() => handleTranslate('title_en', 'en')}
              disabled={!formData.title_bg || translatingField === 'title_en'}
              className="text-sm px-3 py-1 rounded-md border border-[var(--malts-hairline)] text-[var(--malts-ink)] hover:bg-[var(--malts-accent-tint)] disabled:opacity-50"
            >
              {translatingField === 'title_en' ? 'Превеждам...' : 'Авто превод'}
            </button>
          </div>
          <input
            type="text"
            name="title_en"
            value={formData.title_en}
            onChange={handleChange}
            className="malts-field"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="malts-label mb-0">Title (RO) *</label>
            <button
              type="button"
              onClick={() => handleTranslate('title_ro', 'ro')}
              disabled={!formData.title_bg || translatingField === 'title_ro'}
              className="text-sm px-3 py-1 rounded-md border border-[var(--malts-hairline)] text-[var(--malts-ink)] hover:bg-[var(--malts-accent-tint)] disabled:opacity-50"
            >
              {translatingField === 'title_ro' ? 'Превеждам...' : 'Авто превод'}
            </button>
          </div>
          <input
            type="text"
            name="title_ro"
            value={formData.title_ro}
            onChange={handleChange}
            className="malts-field"
            required
          />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="malts-label">Описание (БГ) *</label>
          <textarea
            name="description_bg"
            value={formData.description_bg}
            onChange={handleChange}
            rows={4}
            className="malts-field"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="malts-label mb-0">Description (EN) *</label>
            <button
              type="button"
              onClick={() => handleTranslate('description_en', 'en')}
              disabled={!formData.description_bg || translatingField === 'description_en'}
              className="text-sm px-3 py-1 rounded-md border border-[var(--malts-hairline)] text-[var(--malts-ink)] hover:bg-[var(--malts-accent-tint)] disabled:opacity-50"
            >
              {translatingField === 'description_en' ? 'Превеждам...' : 'Авто превод'}
            </button>
          </div>
          <textarea
            name="description_en"
            value={formData.description_en}
            onChange={handleChange}
            rows={4}
            className="malts-field"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="malts-label mb-0">Description (RO) *</label>
            <button
              type="button"
              onClick={() => handleTranslate('description_ro', 'ro')}
              disabled={!formData.description_bg || translatingField === 'description_ro'}
              className="text-sm px-3 py-1 rounded-md border border-[var(--malts-hairline)] text-[var(--malts-ink)] hover:bg-[var(--malts-accent-tint)] disabled:opacity-50"
            >
              {translatingField === 'description_ro' ? 'Превеждам...' : 'Авто превод'}
            </button>
          </div>
          <textarea
            name="description_ro"
            value={formData.description_ro}
            onChange={handleChange}
            rows={4}
            className="malts-field"
            required
          />
        </div>
      </div>

      {/* Event Date */}
      <div>
        <label className="malts-label">Дата и час *</label>
        <input
          type="datetime-local"
          name="event_date"
          value={formData.event_date}
          onChange={handleChange}
          className="malts-field"
          required
        />
      </div>

      {/* Location - Different for external events */}
      {formData.is_external ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block malts-subtle font-semibold mb-2">Локация (БГ) *</label>
            <input
              type="text"
              name="location_bg"
              value={formData.location_bg}
              onChange={handleChange}
              className="w-full px-4 py-3 malts-inset focus:outline-none focus:ring-2 focus:ring-[var(--malts-accent-tint-border)]"
              placeholder="София, бул. Витоша 1"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block malts-subtle font-semibold">Location (EN)</label>
              <button
                type="button"
                onClick={() => handleTranslate('location_en', 'en')}
                disabled={!formData.location_bg || translatingField === 'location_en'}
                className="text-sm px-3 py-1 rounded-md border border-[var(--malts-hairline)] text-[var(--malts-ink)] hover:bg-[var(--malts-accent-tint)] disabled:opacity-50"
              >
                {translatingField === 'location_en' ? 'Превеждам...' : 'Авто превод'}
              </button>
            </div>
            <input
              type="text"
              name="location_en"
              value={formData.location_en}
              onChange={handleChange}
              className="w-full px-4 py-3 malts-inset focus:outline-none focus:ring-2 focus:ring-[var(--malts-accent-tint-border)]"
              placeholder="Sofia, Vitosha Blvd 1"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block malts-subtle font-semibold">Location (RO)</label>
              <button
                type="button"
                onClick={() => handleTranslate('location_ro', 'ro')}
                disabled={!formData.location_bg || translatingField === 'location_ro'}
                className="text-sm px-3 py-1 rounded-md border border-[var(--malts-hairline)] text-[var(--malts-ink)] hover:bg-[var(--malts-accent-tint)] disabled:opacity-50"
              >
                {translatingField === 'location_ro' ? 'Превеждам...' : 'Авто превод'}
              </button>
            </div>
            <input
              type="text"
              name="location_ro"
              value={formData.location_ro}
              onChange={handleChange}
              className="w-full px-4 py-3 malts-inset focus:outline-none focus:ring-2 focus:ring-[var(--malts-accent-tint-border)]"
              placeholder="Sofia, Vitosha Blvd 1"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="malts-label">Локация *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="malts-field"
            placeholder="Malts, Русе"
            required
          />
        </div>
      )}

      {translationError && (
        <div className="malts-alert malts-alert-error text-sm">
          {translationError}
        </div>
      )}

      {/* Image URL */}
      <div>
        <label className="malts-label">URL на снимка</label>
        <input
          type="text"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          className="malts-field"
          placeholder="https://..."
        />
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col md:flex-row gap-6">
        <label className="flex items-center gap-2 text-[var(--malts-ink)] cursor-pointer">
          <input
            type="checkbox"
            name="is_external"
            checked={formData.is_external}
            onChange={handleChange}
            className="w-5 h-5 rounded border-[var(--malts-hairline)] bg-[var(--malts-card)] text-[var(--malts-ink)] focus:ring-[var(--malts-accent-tint-border)]"
          />
          <span>Партньорско събитие (не в Malts)</span>
        </label>
        <label className="flex items-center gap-2 text-[var(--malts-ink)] cursor-pointer">
          <input
            type="checkbox"
            name="is_published"
            checked={formData.is_published}
            onChange={handleChange}
            className="w-5 h-5 rounded border-[var(--malts-hairline)] bg-[var(--malts-card)] text-[var(--malts-ink)] focus:ring-[var(--malts-accent-tint-border)]"
          />
          <span>Публикувано</span>
        </label>
      </div>

      {/* External Event Fields - Show only when is_external is checked */}
      {formData.is_external && (
        <div className="malts-card p-6 space-y-4">
          <h3 className="text-xl font-bold text-[var(--malts-ink)] mb-4">📌 Информация за партньорско събитие</h3>
          
          <div>
            <label className="malts-label">URL на събитието</label>
            <input
              type="url"
              name="external_url"
              value={formData.external_url}
              onChange={handleChange}
              className="malts-field"
              placeholder="https://example.com/event"
            />
            <p className="malts-help mt-1">Линк към страницата на събитието</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="malts-label">Телефон</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="malts-field"
                placeholder="+359 888 123 456"
              />
            </div>
            
            <div>
              <label className="malts-label">Email</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="malts-field"
                placeholder="contact@example.com"
              />
            </div>
            
            <div>
              <label className="malts-label">Facebook</label>
              <input
                type="text"
                name="contact_facebook"
                value={formData.contact_facebook}
                onChange={handleChange}
                className="malts-field"
                placeholder="/eventpage"
              />
            </div>
          </div>
        </div>
      )}

      {/* Submit */}
      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="px-8 py-3 malts-btn-primary font-semibold transition-all disabled:opacity-50"
        >
          {loading ? 'Запазване...' : 'Запази'}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-8 py-3 malts-btn-secondary font-semibold transition-all"
        >
          Отказ
        </button>
      </div>
    </form>
  );
}



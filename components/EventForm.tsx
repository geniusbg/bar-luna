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
  title_de: string;
  description_bg: string;
  description_en: string;
  description_de: string;
  event_date: string;
  location: string;
  location_bg: string;
  location_en: string;
  location_de: string;
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
  title_de: '',
  description_bg: '',
  description_en: '',
  description_de: '',
  event_date: '',
  location: '',
  location_bg: '',
  location_en: '',
  location_de: '',
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
    | 'title_de'
    | 'description_en'
    | 'description_de'
    | 'location_en'
    | 'location_de';

  type SourceField = 'title_bg' | 'description_bg' | 'location_bg';

  const handleTranslate = async (field: TranslatableField, targetLang: 'en' | 'de') => {
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
      let locationDe = null;
      
      if (formData.is_external) {
        // For external events, use language-specific fields
        location = formData.location_bg || formData.location || '';
        locationBg = formData.location_bg || null;
        locationEn = formData.location_en || null;
        locationDe = formData.location_de || null;
      } else {
        // For LUNA events, use default location
        location = formData.location || 'LUNA Bar, Русе';
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
        titleDe: formData.title_de,
        descriptionBg: formData.description_bg,
        descriptionEn: formData.description_en,
        descriptionDe: formData.description_de,
        eventDate: new Date(formData.event_date).toISOString(),
        location: location,
        locationBg: locationBg,
        locationEn: locationEn,
        locationDe: locationDe,
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
          <label className="block text-gray-300 font-semibold mb-2">Заглавие (БГ) *</label>
          <input
            type="text"
            name="title_bg"
            value={formData.title_bg}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-300 font-semibold">Title (EN) *</label>
            <button
              type="button"
              onClick={() => handleTranslate('title_en', 'en')}
              disabled={!formData.title_bg || translatingField === 'title_en'}
              className="text-sm px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {translatingField === 'title_en' ? 'Превеждам...' : 'Авто превод'}
            </button>
          </div>
          <input
            type="text"
            name="title_en"
            value={formData.title_en}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-300 font-semibold">Titel (DE) *</label>
            <button
              type="button"
              onClick={() => handleTranslate('title_de', 'de')}
              disabled={!formData.title_bg || translatingField === 'title_de'}
              className="text-sm px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {translatingField === 'title_de' ? 'Превеждам...' : 'Авто превод'}
            </button>
          </div>
          <input
            type="text"
            name="title_de"
            value={formData.title_de}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Descriptions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Описание (БГ) *</label>
          <textarea
            name="description_bg"
            value={formData.description_bg}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-300 font-semibold">Description (EN) *</label>
            <button
              type="button"
              onClick={() => handleTranslate('description_en', 'en')}
              disabled={!formData.description_bg || translatingField === 'description_en'}
              className="text-sm px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {translatingField === 'description_en' ? 'Превеждам...' : 'Авто превод'}
            </button>
          </div>
          <textarea
            name="description_en"
            value={formData.description_en}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-gray-300 font-semibold">Beschreibung (DE) *</label>
            <button
              type="button"
              onClick={() => handleTranslate('description_de', 'de')}
              disabled={!formData.description_bg || translatingField === 'description_de'}
              className="text-sm px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
            >
              {translatingField === 'description_de' ? 'Превеждам...' : 'Авто превод'}
            </button>
          </div>
          <textarea
            name="description_de"
            value={formData.description_de}
            onChange={handleChange}
            rows={4}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white500 focus:outline-none"
            required
          />
        </div>
      </div>

      {/* Event Date */}
      <div>
        <label className="block text-gray-300 font-semibold mb-2">Дата и час *</label>
        <input
          type="datetime-local"
          name="event_date"
          value={formData.event_date}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
          required
        />
      </div>

      {/* Location - Different for external events */}
      {formData.is_external ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-gray-300 font-semibold mb-2">Локация (БГ) *</label>
            <input
              type="text"
              name="location_bg"
              value={formData.location_bg}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
              placeholder="София, бул. Витоша 1"
              required
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-300 font-semibold">Location (EN)</label>
              <button
                type="button"
                onClick={() => handleTranslate('location_en', 'en')}
                disabled={!formData.location_bg || translatingField === 'location_en'}
                className="text-sm px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
              >
                {translatingField === 'location_en' ? 'Превеждам...' : 'Авто превод'}
              </button>
            </div>
            <input
              type="text"
              name="location_en"
              value={formData.location_en}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
              placeholder="Sofia, Vitosha Blvd 1"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-gray-300 font-semibold">Standort (DE)</label>
              <button
                type="button"
                onClick={() => handleTranslate('location_de', 'de')}
                disabled={!formData.location_bg || translatingField === 'location_de'}
                className="text-sm px-3 py-1 rounded-md border border-gray-600 text-gray-200 hover:bg-gray-800 disabled:opacity-50"
              >
                {translatingField === 'location_de' ? 'Превеждам...' : 'Авто превод'}
              </button>
            </div>
            <input
              type="text"
              name="location_de"
              value={formData.location_de}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
              placeholder="Sofia, Vitosha Blvd 1"
            />
          </div>
        </div>
      ) : (
        <div>
          <label className="block text-gray-300 font-semibold mb-2">Локация *</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
            placeholder="LUNA Bar, Русе"
            required
          />
        </div>
      )}

      {translationError && (
        <div className="bg-red-500/20 border border-red-500/30 text-red-300 px-4 py-3 rounded-lg text-sm">
          {translationError}
        </div>
      )}

      {/* Image URL */}
      <div>
        <label className="block text-gray-300 font-semibold mb-2">URL на снимка</label>
        <input
          type="text"
          name="image_url"
          value={formData.image_url}
          onChange={handleChange}
          className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-white focus:outline-none"
          placeholder="https://..."
        />
      </div>

      {/* Checkboxes */}
      <div className="flex flex-col md:flex-row gap-6">
        <label className="flex items-center gap-2 text-white cursor-pointer">
          <input
            type="checkbox"
            name="is_external"
            checked={formData.is_external}
            onChange={handleChange}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-gray-600 focus:ring-white"
          />
          <span>Партньорско събитие (не в LUNA)</span>
        </label>
        <label className="flex items-center gap-2 text-white cursor-pointer">
          <input
            type="checkbox"
            name="is_published"
            checked={formData.is_published}
            onChange={handleChange}
            className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-gray-600 focus:ring-white"
          />
          <span>Публикувано</span>
        </label>
      </div>

      {/* External Event Fields - Show only when is_external is checked */}
      {formData.is_external && (
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">📌 Информация за партньорско събитие</h3>
          
          <div>
            <label className="block text-gray-300 font-semibold mb-2">URL на събитието</label>
            <input
              type="url"
              name="external_url"
              value={formData.external_url}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
              placeholder="https://example.com/event"
            />
            <p className="text-gray-400 text-sm mt-1">Линк към страницата на събитието</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Телефон</label>
              <input
                type="tel"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
                placeholder="+359 888 123 456"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Email</label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
                placeholder="contact@example.com"
              />
            </div>
            
            <div>
              <label className="block text-gray-300 font-semibold mb-2">Facebook</label>
              <input
                type="text"
                name="contact_facebook"
                value={formData.contact_facebook}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-700 text-white rounded-lg border border-gray-600 focus:border-blue-400 focus:outline-none"
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
          className="px-8 py-3 bg-white hover:bg-gray-200 text-black rounded-lg font-semibold transition-all disabled:opacity-50"
        >
          {loading ? 'Запазване...' : 'Запази'}
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-semibold transition-all"
        >
          Отказ
        </button>
      </div>
    </form>
  );
}



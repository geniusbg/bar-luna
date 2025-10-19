export interface Category {
  id: string;
  name_bg: string;
  name_en: string;
  name_de: string;
  slug: string;
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: string;
  category_id: string;
  name_bg: string;
  name_en: string;
  name_de: string;
  description_bg?: string;
  description_en?: string;
  description_de?: string;
  price_bgn: number;
  price_eur: number;
  image_url?: string;
  is_available: boolean;
  is_featured: boolean;
  allergens?: string[];
  order: number;
  created_at: string;
  updated_at: string;
}

export interface Event {
  id: string;
  title_bg: string;
  title_en: string;
  title_de: string;
  description_bg: string;
  description_en: string;
  description_de: string;
  event_date: string;
  location: string;
  is_external: boolean; // true for partner events, false for Luna events
  image_url?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface LocalizedText {
  bg: string;
  en: string;
  de: string;
}



// CMS client — backend tayyor bo'lmasa null qaytaradi (fallback uchun).
//
// Backend endpointlar:
//   GET /api/v1/cms/site-config
//   GET /api/v1/cms/footer-links
//   GET /api/v1/cms/testimonials
//   GET /api/v1/cms/faq

export interface SiteConfig {
  site_name: string;
  contact_phone: string;
  contact_email: string;
  contact_website: string;
  telegram_handle: string;
  address: string;
  footer_about: string;
  hero_title: string;
  hero_subtitle: string;
}

export interface FooterLink {
  id: number;
  section: 'product' | 'company' | 'help';
  label: string;
  url: string;
  sort_order: number;
}

export interface Testimonial {
  id: number;
  name: string;
  region: string;
  text: string;
  avatar_color: string;
}

export interface FAQItem {
  id: number;
  question: string;
  answer: string;
}

// Loyihada `VITE_API_URL` allaqachon `/api/v1` bilan tugaydi
// (masalan: http://localhost:8000/api/v1). Shuning uchun `API_BASE`
// shu base'ga `/cms/...` qo'shadi. Agar env yo'q bo'lsa — bo'sh qator,
// va barcha fetch'lar disabled (fallback ishlatiladi).
const RAW_API = (import.meta.env.VITE_API_URL as string | undefined) ?? '';
const API = RAW_API.replace(/\/+$/, ''); // trailing slashlarni olib tashlash

// `API` allaqachon `/api/v1` bilan tugagan deb hisoblanadi.
// Agar undamas — uni qo'shamiz (himoyaviy).
function cmsUrl(path: string): string {
  if (!API) return '';
  const hasV1 = /\/api\/v1$/.test(API);
  const base = hasV1 ? API : `${API}/api/v1`;
  return `${base}/cms/${path.replace(/^\/+/, '')}`;
}

async function safeGet<T>(path: string): Promise<T | null> {
  const url = cmsUrl(path);
  if (!url) return null;
  try {
    const r = await fetch(url, { headers: { Accept: 'application/json' } });
    if (!r.ok) return null;
    return (await r.json()) as T;
  } catch {
    return null;
  }
}

export function fetchSiteConfig(): Promise<SiteConfig | null> {
  return safeGet<SiteConfig>('site-config');
}

export function fetchFooterLinks(): Promise<FooterLink[] | null> {
  return safeGet<FooterLink[]>('footer-links');
}

export function fetchTestimonials(): Promise<Testimonial[] | null> {
  return safeGet<Testimonial[]>('testimonials');
}

export function fetchFAQ(): Promise<FAQItem[] | null> {
  return safeGet<FAQItem[]>('faq');
}

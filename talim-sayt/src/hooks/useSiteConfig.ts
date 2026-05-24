import { useEffect, useState } from 'react';
import {
  fetchSiteConfig,
  fetchFooterLinks,
  fetchTestimonials,
  type SiteConfig,
  type FooterLink,
  type Testimonial,
} from '../lib/cms';

// ----------------------- DEFAULTS (fallback) -----------------------

export const SITE_CONFIG_DEFAULTS: SiteConfig = {
  site_name: 'MF Platform',
  contact_phone: '+998 90 123 45 67',
  contact_email: 'info@mfplatform.uz',
  contact_website: 'www.mfplatform.uz',
  telegram_handle: 'mfplatform_uz',
  address: '',
  footer_about:
    'O‘zbekiston abituriyentlari uchun gamifikatsiyalangan, interaktiv va natijaga yo‘naltirilgan ta’lim platformasi.',
  hero_title: '',
  hero_subtitle: '',
};

export const FOOTER_LINKS_DEFAULTS: FooterLink[] = [
  { id: 1, section: 'product', label: 'Imkoniyatlar', url: '/#imkoniyatlar', sort_order: 1 },
  { id: 2, section: 'product', label: 'Tariflar', url: '/#tariflar', sort_order: 2 },
  { id: 3, section: 'product', label: 'Darslar', url: '/app/lessons', sort_order: 3 },
  { id: 4, section: 'product', label: 'Reyting', url: '/app/leaderboard', sort_order: 4 },
  { id: 5, section: 'company', label: 'Biz haqimizda', url: '/#haqimizda', sort_order: 1 },
  { id: 6, section: 'company', label: 'Roadmap', url: '#', sort_order: 2 },
  { id: 7, section: 'company', label: 'Hamkorlik', url: '#', sort_order: 3 },
  { id: 8, section: 'company', label: 'Karyera', url: '#', sort_order: 4 },
];

export const TESTIMONIALS_DEFAULTS: Testimonial[] = [
  { id: 1, name: 'Sevinch M.', region: 'Farg‘ona', avatar_color: '#fcd34d', text: 'MF Platform darslarni juda qiziqarli va tushunarli qiladi. Mening natijam sezilarli darajada oshdi!' },
  { id: 2, name: 'Asadbek T.', region: 'Andijon', avatar_color: '#86efac', text: 'Gamification tizimi meni har kuni o‘qishga undaydi. Do‘stlarim bilan raqobat zo‘r motivatsiya beradi!' },
  { id: 3, name: 'Malika Y.', region: 'Samarqand', avatar_color: '#fda4af', text: 'Onlayn darslarni juda chiroyli qilingan, AI yordamchi ham foydali. Tavsiya qilaman!' },
  { id: 4, name: 'Sardor A.', region: 'Toshkent', avatar_color: '#a5b4fc', text: 'Mobil ilovaning oddiyligi va testlarning sifati a’lo. Universitetga tayyorgarlikni shu yerdan boshladim.' },
  { id: 5, name: 'Dilnoza K.', region: 'Buxoro', avatar_color: '#c4b5fd', text: 'Streak va reyting tizimi har kuni meni faollikka undaydi. Sinfimdagi do‘stlarim ham qo‘shilishdi.' },
  { id: 6, name: 'Jasur Q.', region: 'Namangan', avatar_color: '#7dd3fc', text: 'Mashqlar va testlar mana shunday qiziqarli bo‘lishini kutmagandim. Endi o‘qishga vaqt ayamayman.' },
];

// ----------------------- In-memory cache --------------------------
// Komponentlar orasida qayta fetch qilmaslik uchun oddiy SWR-style cache.

let cachedConfig: SiteConfig | null = null;
let cachedFooter: FooterLink[] | null = null;
let cachedTestimonials: Testimonial[] | null = null;

let inflightConfig: Promise<SiteConfig | null> | null = null;
let inflightFooter: Promise<FooterLink[] | null> | null = null;
let inflightTestimonials: Promise<Testimonial[] | null> | null = null;

// ----------------------- hooks ------------------------------------

export function useSiteConfig(): SiteConfig {
  // initial state cache'dan o'qiydi (agar bor bo'lsa) — fetch takror urinmaydi
  const [cfg, setCfg] = useState<SiteConfig>(cachedConfig ?? SITE_CONFIG_DEFAULTS);

  useEffect(() => {
    if (cachedConfig) return; // allaqachon yuklangan
    let cancelled = false;
    if (!inflightConfig) {
      inflightConfig = fetchSiteConfig();
    }
    inflightConfig.then((data) => {
      if (cancelled) return;
      if (data) {
        cachedConfig = data;
        setCfg(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return cfg;
}

export function useFooterLinks(): FooterLink[] {
  const [links, setLinks] = useState<FooterLink[]>(
    cachedFooter ?? FOOTER_LINKS_DEFAULTS,
  );

  useEffect(() => {
    if (cachedFooter) return;
    let cancelled = false;
    if (!inflightFooter) {
      inflightFooter = fetchFooterLinks();
    }
    inflightFooter.then((data) => {
      if (cancelled) return;
      if (data && data.length > 0) {
        cachedFooter = data;
        setLinks(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return links;
}

export function useTestimonials(): Testimonial[] {
  const [items, setItems] = useState<Testimonial[]>(
    cachedTestimonials ?? TESTIMONIALS_DEFAULTS,
  );

  useEffect(() => {
    if (cachedTestimonials) return;
    let cancelled = false;
    if (!inflightTestimonials) {
      inflightTestimonials = fetchTestimonials();
    }
    inflightTestimonials.then((data) => {
      if (cancelled) return;
      if (data && data.length > 0) {
        cachedTestimonials = data;
        setItems(data);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return items;
}

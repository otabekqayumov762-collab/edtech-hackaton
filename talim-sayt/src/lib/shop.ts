import type { User } from './types';

export type ShopCategory = 'heart' | 'booster' | 'hint' | 'cosmetic' | 'special';
export type ShopCurrency = 'coin' | 'gem';

export interface ShopItem {
  slug: string;
  category: ShopCategory;
  name: string;
  description: string;
  icon: string;
  cost: number;
  currency: ShopCurrency;
  payload?: Record<string, unknown>;
}

export const CATEGORY_META: Record<ShopCategory, { label: string; icon: string; color: string }> = {
  heart: { label: 'Jonlar', icon: 'Heart', color: '#fb7185' },
  booster: { label: 'Booster', icon: 'Zap', color: '#a78bfa' },
  hint: { label: 'Yordamchi', icon: 'Lightbulb', color: '#fcd34d' },
  cosmetic: { label: 'Bezak', icon: 'Palette', color: '#34d399' },
  special: { label: 'Maxsus', icon: 'Sparkles', color: '#60a5fa' },
};

export const SHOP_ITEMS: ShopItem[] = [
  { slug: 'heart-1', category: 'heart', name: '+1 Jon', description: 'Bitta jonni qaytaring', icon: 'Heart', cost: 20, currency: 'coin', payload: { hearts: 1 } },
  { slug: 'heart-3', category: 'heart', name: '+3 Jon', description: 'Uchta jonni qaytaring', icon: 'Heart', cost: 50, currency: 'coin', payload: { hearts: 3 } },
  { slug: 'heart-unlimited', category: 'heart', name: 'Cheksiz jon (1 kun)', description: '24 soat cheksiz jon', icon: 'Sparkles', cost: 10, currency: 'gem', payload: { unlimited: true, duration_h: 24 } },

  { slug: 'boost-2xp-30m', category: 'booster', name: 'Double XP (30 daqiqa)', description: '30 daqiqa 2x XP', icon: 'Zap', cost: 15, currency: 'gem' },
  { slug: 'boost-2coin-30m', category: 'booster', name: 'Coin booster x2', description: '30 daqiqa 2x tanga', icon: 'Coins', cost: 10, currency: 'gem' },
  { slug: 'boost-streak-saver', category: 'booster', name: 'Streak saver', description: 'Streakni saqlaydi', icon: 'Flame', cost: 8, currency: 'gem' },

  { slug: 'hint-5050', category: 'hint', name: '50/50', description: 'Ikki noto‘g‘rini o‘chiradi', icon: 'SplitSquareHorizontal', cost: 5, currency: 'coin' },
  { slug: 'hint-skip', category: 'hint', name: 'Skip', description: 'Savolni o‘tkazadi', icon: 'SkipForward', cost: 10, currency: 'coin' },
  { slug: 'hint-show', category: 'hint', name: 'Maslahat', description: 'Maslahat ko‘rsatadi', icon: 'Lightbulb', cost: 7, currency: 'coin' },

  { slug: 'cos-avatar-frame', category: 'cosmetic', name: 'Avatar ramka', description: 'Oltin ramka', icon: 'Frame', cost: 20, currency: 'coin' },
  { slug: 'cos-badge', category: 'cosmetic', name: 'Profil belgisi', description: 'Maxsus belgi', icon: 'Medal', cost: 30, currency: 'coin' },
  { slug: 'cos-name-color', category: 'cosmetic', name: 'Ism rangi', description: 'Rangli ism', icon: 'Palette', cost: 25, currency: 'coin' },

  { slug: 'spec-second-chance', category: 'special', name: 'Yana imkoniyat', description: 'Xato bo‘lsa ham davom', icon: 'RotateCcw', cost: 12, currency: 'gem' },
  { slug: 'spec-time-freeze', category: 'special', name: 'Vaqt to‘xtatish', description: '30 sek taymer to‘xtaydi', icon: 'Snowflake', cost: 10, currency: 'gem' },
];

export function canAfford(user: User, item: ShopItem): boolean {
  if (item.currency === 'coin') return (user.coins ?? 0) >= item.cost;
  return (user.gems ?? 0) >= item.cost;
}

export interface TournamentPrize {
  rank: number;
  reward: string;
  xp: number;
}

export interface TournamentEntry {
  id: string;
  name: string;
  region: string;
  xp: number;
  avatarColor: string;
  isCurrent?: boolean;
}

export interface Tournament {
  id: string;
  title: string;
  desc: string;
  /** ISO date string. */
  endsAt: string;
  prize: string;
  participants: number;
  topPrizes: TournamentPrize[];
  joined: boolean;
  myRank?: number;
  /** Optional accent for cards / podium. */
  accent?: string;
  icon?: string;
  /** Leaderboard snapshot for the detail view. */
  entries: TournamentEntry[];
}

function inDays(days: number, hours = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(d.getHours() + hours);
  return d.toISOString();
}

const WEEKLY_ENTRIES: TournamentEntry[] = [
  { id: 'wk1', name: 'Sardor Aliyev', region: 'Toshkent', xp: 4820, avatarColor: '#6d4aff' },
  { id: 'wk2', name: 'Malika Yusupova', region: 'Samarqand', xp: 4510, avatarColor: '#f43f5e' },
  { id: 'wk3', name: 'Asadbek Tursunov', region: 'Andijon', xp: 4280, avatarColor: '#22c55e' },
  { id: 'wk4', name: 'Siz', region: 'Toshkent', xp: 3960, avatarColor: '#6d4aff', isCurrent: true },
  { id: 'wk5', name: 'Sevinch Mahmudova', region: 'Farg‘ona', xp: 3740, avatarColor: '#fbbf24' },
  { id: 'wk6', name: 'Jasur Qodirov', region: 'Buxoro', xp: 3510, avatarColor: '#38bdf8' },
  { id: 'wk7', name: 'Dilnoza Islomova', region: 'Namangan', xp: 3280, avatarColor: '#a855f7' },
  { id: 'wk8', name: 'Bekzod Rasulov', region: 'Qashqadaryo', xp: 3110, avatarColor: '#f97316' },
  { id: 'wk9', name: 'Nodira Saidova', region: 'Xorazm', xp: 2840, avatarColor: '#6d4aff' },
  { id: 'wk10', name: 'Otabek Yo‘ldoshev', region: 'Navoiy', xp: 2620, avatarColor: '#22c55e' },
];

const FIZIKA_ENTRIES: TournamentEntry[] = [
  { id: 'fz1', name: 'Asadbek Tursunov', region: 'Andijon', xp: 6210, avatarColor: '#22c55e' },
  { id: 'fz2', name: 'Sardor Aliyev', region: 'Toshkent', xp: 5980, avatarColor: '#6d4aff' },
  { id: 'fz3', name: 'Jasur Qodirov', region: 'Buxoro', xp: 5610, avatarColor: '#38bdf8' },
  { id: 'fz4', name: 'Madina Olimova', region: 'Surxondaryo', xp: 5240, avatarColor: '#f43f5e' },
  { id: 'fz5', name: 'Shahzod Ergashev', region: 'Jizzax', xp: 4890, avatarColor: '#38bdf8' },
  { id: 'fz6', name: 'Siz', region: 'Toshkent', xp: 4620, avatarColor: '#6d4aff', isCurrent: true },
  { id: 'fz7', name: 'Gulnoza Tosheva', region: 'Sirdaryo', xp: 4310, avatarColor: '#fbbf24' },
  { id: 'fz8', name: 'Otabek Yo‘ldoshev', region: 'Navoiy', xp: 4080, avatarColor: '#22c55e' },
];

const ENG_ENTRIES: TournamentEntry[] = [
  { id: 'en1', name: 'Sevinch Mahmudova', region: 'Farg‘ona', xp: 3120, avatarColor: '#fbbf24' },
  { id: 'en2', name: 'Dilnoza Islomova', region: 'Namangan', xp: 2940, avatarColor: '#a855f7' },
  { id: 'en3', name: 'Nodira Saidova', region: 'Xorazm', xp: 2810, avatarColor: '#6d4aff' },
  { id: 'en4', name: 'Malika Yusupova', region: 'Samarqand', xp: 2690, avatarColor: '#f43f5e' },
  { id: 'en5', name: 'Bekzod Rasulov', region: 'Qashqadaryo', xp: 2540, avatarColor: '#f97316' },
  { id: 'en6', name: 'Shahzod Ergashev', region: 'Jizzax', xp: 2380, avatarColor: '#38bdf8' },
];

export const TOURNAMENTS: Tournament[] = [
  {
    id: 'weekly-all',
    title: 'Haftalik bilim jangi',
    desc: 'Barcha fanlardan eng ko‘p XP to‘plang va hafta sovrindori bo‘ling.',
    endsAt: inDays(3, 6),
    prize: '100 000 so‘m',
    participants: 1248,
    accent: '#6d4aff',
    icon: 'Trophy',
    topPrizes: [
      { rank: 1, reward: '100 000 so‘m', xp: 500 },
      { rank: 2, reward: '50 000 so‘m', xp: 300 },
      { rank: 3, reward: '25 000 so‘m', xp: 150 },
    ],
    joined: true,
    myRank: 4,
    entries: WEEKLY_ENTRIES,
  },
  {
    id: 'fizika-monthly',
    title: 'Fizika oylik chempionati',
    desc: 'Bir oy davomida fizika fanidan eng kuchli o‘quvchini aniqlaymiz.',
    endsAt: inDays(18, 0),
    prize: '250 000 so‘m',
    participants: 612,
    accent: '#38bdf8',
    icon: 'Atom',
    topPrizes: [
      { rank: 1, reward: '250 000 so‘m', xp: 1000 },
      { rank: 2, reward: '120 000 so‘m', xp: 600 },
      { rank: 3, reward: '60 000 so‘m', xp: 300 },
    ],
    joined: true,
    myRank: 6,
    entries: FIZIKA_ENTRIES,
  },
  {
    id: 'eng-weekly',
    title: 'Ingliz tili — haftalik kubok',
    desc: 'Grammatika va so‘z boyligi testlaridan eng yuqori natija uchun kurashing.',
    endsAt: inDays(5, 12),
    prize: '75 000 so‘m',
    participants: 384,
    accent: '#fbbf24',
    icon: 'Languages',
    topPrizes: [
      { rank: 1, reward: '75 000 so‘m', xp: 400 },
      { rank: 2, reward: '40 000 so‘m', xp: 250 },
      { rank: 3, reward: '20 000 so‘m', xp: 120 },
    ],
    joined: false,
    entries: ENG_ENTRIES,
  },
];

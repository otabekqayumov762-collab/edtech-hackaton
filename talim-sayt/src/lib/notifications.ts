// In-app bildirishnoma templatelari va helperlar.
// Backend `/api/v1/notifications/user` endpointi tayyor bo'lganda
// `useNotifications` hookida fetch chaqirig'i ulanadi. Bu fayl pure mock layer.

export type NotifType =
  | 'daily'
  | 'motivation'
  | 'streak'
  | 'reward'
  | 'comeback';

export interface Notif {
  id: string;
  type: NotifType;
  title: string;
  body: string;
  createdAt: string; // ISO
  read: boolean;
}

export function notifTarget(type: NotifType): string {
  switch (type) {
    case 'daily':
      return '/app';
    case 'motivation':
      return '/app/ai';
    case 'streak':
      return '/app';
    case 'reward':
      return '/app/yutuqlar';
    case 'comeback':
      return '/app/fan';
    default:
      return '/app';
  }
}

/* ------------------------------------------------------------------ */
/* TEMPLATES — har category dan 10+ tayyor matn (uzbek)                */
/* ------------------------------------------------------------------ */
export const TEMPLATES: Record<
  NotifType,
  { title: string; body: string }[]
> = {
  daily: [
    {
      title: 'Bugungi planing seni kutyapti',
      body: 'Vazifalarni boshlash uchun eng yaxshi vaqt — hozir.',
    },
    {
      title: 'Bugun 20 minut ajrat',
      body: 'Atigi 20 minut — ertangi natija o‘zgaradi.',
    },
    {
      title: '1 kun ham bekorga ketmasin',
      body: 'Bugungi darslarni ochib, kichik qadam qo‘y.',
    },
    {
      title: 'Kunlik maqsadingni unutma',
      body: 'Bugun qilingan ish — ertangi muvaffaqiyat.',
    },
    {
      title: 'Tezroq boshlasang, tezroq tugatasan',
      body: 'Birinchi mashqni ochish — eng qiyini.',
    },
    {
      title: 'Bugun bittagina test yech',
      body: 'Bitta test ham streakni saqlab qoladi.',
    },
    {
      title: 'Bugungi darsing tayyor turibdi',
      body: 'O‘qishni davom ettir, sen yo‘ldasan.',
    },
    {
      title: 'Ertangi sen bugungidan kuchliroq',
      body: 'Bugun ajratgan vaqting — uning fundamenti.',
    },
    {
      title: 'Kichik daily, katta natija',
      body: '15 minut bugun — 1 yilga 90 soat o‘qish demak.',
    },
    {
      title: 'Daily goal’ni yopib qo‘y',
      body: 'Bugun qo‘shimcha bitta task qil — kifoya.',
    },
  ],
  motivation: [
    {
      title: 'Sen o‘ylagandan kuchlisan',
      body: 'Hozirgi kichik harakatlar — kelajakdagi katta natija.',
    },
    {
      title: 'Kichik qadamlar — katta natija',
      body: 'Har kun bir mavzu — bir oyda butun fan.',
    },
    {
      title: 'Bugungi effort — ertangi g‘alaba',
      body: 'Hech kim bir kunda o‘zgarmaydi, lekin har kun ozgina.',
    },
    {
      title: 'Hozir boshlasang, yutasan',
      body: 'Eng yaxshi vaqt — boshlangan vaqt.',
    },
    {
      title: 'O‘zingga ishon',
      body: 'Sen avval ham qiyinchiliklarni yenggansan, yana yengasan.',
    },
    {
      title: 'Charchaganing — o‘sayotganing belgisi',
      body: 'Qiyin bo‘lsa, demak to‘g‘ri yo‘ldasan.',
    },
    {
      title: 'Bitta sahifa, bitta savol',
      body: 'Hammasini birdaniga emas — kichikdan boshla.',
    },
    {
      title: 'Sen yolg‘iz emassan',
      body: 'Minglab o‘quvchilar bugun sen bilan o‘qiyapti.',
    },
    {
      title: 'Bugun yana bir qadam',
      body: 'Kechagi sendan ozgina kuchliroq bo‘l — kifoya.',
    },
    {
      title: 'Endi to‘xtama',
      body: 'Eng qiyini boshlash edi — uni o‘tding.',
    },
  ],
  streak: [
    {
      title: '3 kun ketma-ket — zo‘r!',
      body: 'Streaking yaxshi yo‘lda. Davom et, to‘xtama.',
    },
    {
      title: 'Streaking yo‘qolib qolmasin',
      body: 'Bugun bitta dars yoki test bilan saqlab qol.',
    },
    {
      title: 'Davom et — eng qiyini o‘tib bo‘ldi',
      body: 'Birinchi kunlar tugadi. Endi odat.',
    },
    {
      title: 'Streak alangasini o‘chirma',
      body: 'Bugun ham olov yondir — atigi 10 minut.',
    },
    {
      title: 'Streaking g‘ururlanarli',
      body: 'Bunday davomiylik aksariyat o‘quvchida bo‘lmaydi.',
    },
    {
      title: 'Yangi rekord yo‘lida',
      body: 'Avvalgi streakingdan o‘tishingga oz qoldi.',
    },
    {
      title: 'Bugungi kunni o‘tkazib yuborma',
      body: 'Bir kun tashlasang, streak nolga tushadi.',
    },
    {
      title: 'Streaking — disiplina belgisi',
      body: 'O‘qishda eng muhim narsa — davomiylik.',
    },
    {
      title: 'Ketma-ket kunlar — kuching',
      body: 'Har kun + 1 — yiliga 365 marta o‘zgarish.',
    },
    {
      title: 'Streaking seni reytingga olib chiqyapti',
      body: 'Top o‘quvchilar aynan shu yo‘l bilan ko‘tariladi.',
    },
  ],
  reward: [
    {
      title: 'Bugungi reward seni kutyapti',
      body: 'Daily reward’ni ochib coin yig‘.',
    },
    {
      title: 'Daily box’ni ochishni unutma',
      body: 'Bugun bo‘sh qoldirma — coin va bonus bor.',
    },
    {
      title: 'Coin yig‘ish vaqti',
      body: 'Mashq bajar, coin yig‘, do‘konda foydalan.',
    },
    {
      title: 'Top 10 ga kiramizmi?',
      body: 'Reytingga kichik dars bilan ko‘tarilish mumkin.',
    },
    {
      title: 'Yangi yutuq ochildi',
      body: 'Profilingda yangi achievement seni kutyapti.',
    },
    {
      title: 'Coinlaring to‘planib qoldi',
      body: 'Sarflashga ulgur — yangi boosterlar chiqdi.',
    },
    {
      title: 'Haftalik bonusga oz qoldi',
      body: 'Yana bir test — va bonus seniki.',
    },
    {
      title: 'Daily streak bonusi tayyor',
      body: 'Bugungi daily-ni yopib, ekstra XP ol.',
    },
    {
      title: 'Yangi level — yangi mukofot',
      body: 'Keyingi levelga oz qoldi. Davom et.',
    },
    {
      title: 'Lucky day',
      body: 'Bugungi mashqlarda XP biroz yuqori — foydalan.',
    },
  ],
  comeback: [
    {
      title: 'Seni sog‘indik',
      body: 'Bir necha kun yo‘q eding. Qaytishga arziydi.',
    },
    {
      title: 'Qayerdasan?',
      body: 'Darsing seni kutyapti. Bugun qaytib kel.',
    },
    {
      title: 'Bugun qaytib kel',
      body: 'Bir test — va eski o‘rning o‘zingda.',
    },
    {
      title: 'Yana boshlash — kuchli qaror',
      body: 'Hech kech emas. Bugun yangi boshlanish.',
    },
    {
      title: 'Streaking nolga tushdi',
      body: 'Lekin yangidan boshlash mumkin. Bugun start.',
    },
    {
      title: 'Bir hafta yo‘qolding',
      body: 'Endi qaytsang, eski sur’atga tezda yetib olasan.',
    },
    {
      title: 'O‘qish hech qachon kech emas',
      body: 'Bugungi 10 minut — kechikkan kunlardan a’lo.',
    },
    {
      title: 'Maqsadingni esla',
      body: 'Nimaga boshlaganingni — bugun yana bir qadam.',
    },
    {
      title: 'Kichik dars bilan qayt',
      body: 'Og‘ir mavzudan emas — eng yoqqanidan boshla.',
    },
    {
      title: 'Sen hali ham mumkin',
      body: 'Tanaffus ham o‘qish jarayonining bir qismi. Qayt.',
    },
  ],
};

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Random template tanlaydi (type bo'yicha). */
export function pickNotif(type: NotifType): { title: string; body: string } {
  const list = TEMPLATES[type];
  const i = Math.floor(Math.random() * list.length);
  return list[i];
}

function uid(): string {
  return (
    'n_' +
    Date.now().toString(36) +
    Math.random().toString(36).slice(2, 8)
  );
}

/** Yangi Notif obyektini yasaydi. createdAt = hozir, read = false. */
export function makeNotif(type: NotifType): Notif {
  const { title, body } = pickNotif(type);
  return {
    id: uid(),
    type,
    title,
    body,
    createdAt: new Date().toISOString(),
    read: false,
  };
}

/** Dastlabki 5-7 ta demo bildirishnomalar — yangi user uchun. */
export function buildDemoNotifs(user: {
  name: string;
  streak: number;
  xp: number;
}): Notif[] {
  const now = Date.now();
  const min = 60_000;
  const hour = 60 * min;

  const out: Notif[] = [];

  // 1. Daily — bugun ertalab
  const daily = pickNotif('daily');
  out.push({
    id: uid(),
    type: 'daily',
    title: daily.title,
    body: daily.body,
    createdAt: new Date(now - 25 * min).toISOString(),
    read: false,
  });

  // 2. Motivation — 2 soat oldin (personalized salom)
  const m = pickNotif('motivation');
  out.push({
    id: uid(),
    type: 'motivation',
    title: m.title,
    body: `${user.name}, ${m.body.toLowerCase()}`,
    createdAt: new Date(now - 2 * hour).toISOString(),
    read: false,
  });

  // 3. Streak (agar streak > 0)
  if (user.streak > 0) {
    const s = pickNotif('streak');
    out.push({
      id: uid(),
      type: 'streak',
      title: `${user.streak} kun ketma-ket!`,
      body: s.body,
      createdAt: new Date(now - 5 * hour).toISOString(),
      read: false,
    });
  }

  // 4. Reward — kecha
  const r = pickNotif('reward');
  out.push({
    id: uid(),
    type: 'reward',
    title: r.title,
    body: r.body,
    createdAt: new Date(now - 26 * hour).toISOString(),
    read: true,
  });

  // 5. Motivation — 2 kun oldin
  const m2 = pickNotif('motivation');
  out.push({
    id: uid(),
    type: 'motivation',
    title: m2.title,
    body: m2.body,
    createdAt: new Date(now - 2 * 24 * hour).toISOString(),
    read: true,
  });

  // 6. Daily — 3 kun oldin
  const d2 = pickNotif('daily');
  out.push({
    id: uid(),
    type: 'daily',
    title: d2.title,
    body: d2.body,
    createdAt: new Date(now - 3 * 24 * hour).toISOString(),
    read: true,
  });

  return out;
}

/** Uzbekcha relative vaqt — `5 daqiqa oldin`, `kecha`, ... */
export function formatRelativeUz(iso: string, nowMs?: number): string {
  const t = new Date(iso).getTime();
  const now = nowMs ?? Date.now();
  const diff = Math.max(0, now - t);
  const s = Math.floor(diff / 1000);
  if (s < 45) return 'hozir';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} daqiqa oldin`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'kecha';
  if (d < 7) return `${d} kun oldin`;
  const w = Math.floor(d / 7);
  if (w < 4) return `${w} hafta oldin`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} oy oldin`;
  const y = Math.floor(d / 365);
  return `${y} yil oldin`;
}

/** Notif type → Lucide ikon nomi (Icon component uchun). */
export function notifIcon(type: NotifType): string {
  switch (type) {
    case 'daily':
      return 'CalendarCheck';
    case 'motivation':
      return 'Sparkles';
    case 'streak':
      return 'Flame';
    case 'reward':
      return 'Gift';
    case 'comeback':
      return 'Heart';
  }
}

/** Notif type → ikon rangi (tailwind classlardan emas, inline color). */
export function notifIconColor(type: NotifType): string {
  switch (type) {
    case 'daily':
      return '#2563eb'; // blue-600
    case 'motivation':
      return '#f59e0b'; // amber-500
    case 'streak':
      return '#f97316'; // orange-500
    case 'reward':
      return '#f43f5e'; // rose-500
    case 'comeback':
      return '#fb7185'; // rose-400
  }
}

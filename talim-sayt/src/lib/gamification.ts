// XP -> Level matematikasi. Har level uchun kerakli XP bosqichma-bosqich oshadi.
export function levelFromXp(xp: number): number {
  let level = 1;
  let need = 200;
  let acc = 0;
  while (xp >= acc + need) {
    acc += need;
    level += 1;
    need = Math.round(need * 1.25);
  }
  return level;
}

export function levelBounds(xp: number): {
  level: number;
  curBase: number;
  nextAt: number;
  inLevel: number;
  span: number;
  pct: number;
} {
  let level = 1;
  let need = 200;
  let acc = 0;
  while (xp >= acc + need) {
    acc += need;
    level += 1;
    need = Math.round(need * 1.25);
  }
  const inLevel = xp - acc;
  return {
    level,
    curBase: acc,
    nextAt: acc + need,
    inLevel,
    span: need,
    pct: Math.min(100, Math.round((inLevel / need) * 100)),
  };
}

export const XP = {
  lesson: 30,
  testPerCorrect: 12,
  testPass: 25,
  perfectBonus: 50,
  dailyChallenge: 60,
  streakKeep: 15,
} as const;

/* Coin valyutasi — har 10 XP -> 1 coin.
   Kelajakda Shop, booster va kosmetika uchun ishlatiladi. */
export const XP_TO_COIN_RATIO = 10;

export function xpToCoins(amount: number): number {
  if (!amount || amount <= 0) return 0;
  return Math.floor(amount / XP_TO_COIN_RATIO);
}

/* Gem (olmos) valyutasi — premium reward, kamroq olinadi. */
export const GEM_PERFECT_BONUS = 1; // har test perfect → 1 gem
export const GEM_TEST_REWARD = 1; // o'rtacha natija (>= 60%) → 1 gem
export const GEM_DAILY_STREAK_7 = 3; // 7 kun streakda

export function rankTitle(level: number): string {
  if (level >= 30) return 'Afsona';
  if (level >= 22) return 'Grandmaster';
  if (level >= 16) return 'Usta';
  if (level >= 11) return 'Ekspert';
  if (level >= 7) return 'Tajribali';
  if (level >= 4) return 'O‘rganuvchi';
  return 'Yangi boshlovchi';
}

export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isYesterday(iso: string): boolean {
  const d = new Date(iso + 'T00:00:00');
  const y = new Date();
  y.setDate(y.getDate() - 1);
  return d.toISOString().slice(0, 10) === y.toISOString().slice(0, 10);
}

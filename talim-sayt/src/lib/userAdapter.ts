import type { SubjectId, User } from './types';
import type { User as BackendUser } from './api/auth';

const COLORS = ['#a5b4fc', '#7dd3fc', '#86efac', '#fdba74', '#fda4af', '#fcd34d'];

const EMPTY_SUBJECT_PROGRESS: Record<SubjectId, number> = {
  matematika: 0,
  'ona-tili': 0,
  adabiyot: 0,
  tarix: 0,
  fizika: 0,
  kimyo: 0,
  biologiya: 0,
  'ingliz-tili': 0,
};

type BackendUserExtras = BackendUser & {
  subject_progress?: Partial<Record<SubjectId, number>>;
  completed_lessons?: string[];
  results?: User['results'];
  consecutive_correct?: number;
  lives_reset?: string;
  coins?: number;
  gems?: number;
  avatar_url?: string | null;
  team_id?: string;
  daily_minutes?: number;
  weak_subjects?: SubjectId[];
  placement_level?: User['placementLevel'];
};

function pickColor(seed: string): string {
  let sum = 0;
  for (let i = 0; i < seed.length; i++) sum = (sum + seed.charCodeAt(i)) % 9973;
  return COLORS[sum % COLORS.length];
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function mapBackendUser(
  raw: BackendUser,
  previous?: User | null,
): User {
  const b = raw as BackendUserExtras;
  const id = String(b.id);
  const name = b.name || (b.email ? b.email.split('@')[0] : 'Foydalanuvchi');
  const avatarColor = b.avatar_color || previous?.avatarColor || pickColor(id);
  const subjectProgress: Record<SubjectId, number> = {
    ...EMPTY_SUBJECT_PROGRESS,
    ...(previous?.subjectProgress ?? {}),
    ...(b.subject_progress ?? {}),
  };
  const plan = (b.plan as User['plan']) || previous?.plan || 'Bepul';

  return {
    id,
    name,
    email: b.email,
    region: b.region || previous?.region || '',
    grade: b.grade || previous?.grade || '',
    avatarColor,
    avatarUrl: b.avatar_url ?? previous?.avatarUrl,
    plan,
    xp: b.xp ?? previous?.xp ?? 0,
    streak: b.streak ?? previous?.streak ?? 0,
    lastActiveISO: b.last_active ?? previous?.lastActiveISO ?? '',
    dailyGoal: b.daily_goal ?? previous?.dailyGoal ?? 5,
    dailyDone: b.daily_done ?? previous?.dailyDone ?? 0,
    completedLessons: b.completed_lessons ?? previous?.completedLessons ?? [],
    results: b.results ?? previous?.results ?? [],
    subjectProgress,
    joinedISO:
      b.joined ?? previous?.joinedISO ?? todayISO(),
    lives: b.lives ?? previous?.lives ?? 10,
    livesMax: b.lives_max ?? previous?.livesMax ?? 10,
    livesResetISO: b.lives_reset ?? previous?.livesResetISO ?? todayISO(),
    consecutiveCorrect:
      b.consecutive_correct ?? previous?.consecutiveCorrect ?? 0,
    teamId: b.team_id ?? previous?.teamId,
    coins: b.coins ?? previous?.coins ?? 0,
    gems: b.gems ?? previous?.gems ?? 0,
    placementLevel: b.placement_level ?? previous?.placementLevel,
    dailyMinutes: b.daily_minutes ?? previous?.dailyMinutes,
    weakSubjects: b.weak_subjects ?? previous?.weakSubjects,
  };
}

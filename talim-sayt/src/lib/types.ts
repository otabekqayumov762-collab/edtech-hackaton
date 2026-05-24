export type SubjectId =
  | 'matematika'
  | 'ona-tili'
  | 'adabiyot'
  | 'tarix'
  | 'fizika'
  | 'kimyo'
  | 'biologiya'
  | 'ingliz-tili';

export interface Subject {
  id: SubjectId;
  name: string;
  short: string;
  icon: string; // lucide ikon nomi
  color: string; // hex
  topics: number;
  tests: number;
}

export interface Lesson {
  id: string;
  subject: SubjectId;
  title: string;
  duration: number; // daqiqa
  level: 'Boshlang‘ich' | 'O‘rta' | 'Yuqori';
  summary: string;
  content: string[];
  xp: number;
}

export interface Question {
  id: string;
  text: string;
  options: string[];
  correct: number;
  explanation: string;
}

export interface Test {
  id: string;
  subject: SubjectId;
  title: string;
  difficulty: 'Oson' | 'O‘rta' | 'Qiyin';
  durationMin: number;
  xp: number;
  questions: Question[];
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  requirement: number;
  metric: 'xp' | 'streak' | 'tests' | 'lessons' | 'level' | 'perfect';
}

export interface LeaderUser {
  id: string;
  name: string;
  xp: number;
  level: number;
  streak: number;
  region: string;
  avatarColor: string;
  isCurrent?: boolean;
}

export interface TestResult {
  id: string;
  testId: string;
  subject: SubjectId;
  title: string;
  total: number;
  correct: number;
  xp: number;
  dateISO: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  region: string;
  grade: string;
  avatarColor: string;
  /** Profil rasmi (localStorage — data URL) */
  avatarUrl?: string;
  plan: 'Bepul' | 'Premium' | 'Premium+';
  xp: number;
  streak: number;
  lastActiveISO: string;
  dailyGoal: number;
  dailyDone: number;
  completedLessons: string[];
  results: TestResult[];
  subjectProgress: Record<SubjectId, number>;
  joinedISO: string;
  /* Jon (lives) tizimi */
  lives: number;
  livesMax: number;
  livesResetISO: string;
  consecutiveCorrect: number;
  /* Jamoa */
  teamId?: string;
  /* Valyuta — shop / boosterlar uchun */
  coins: number;
  /* Olmoslar — premium reward valyutasi */
  gems: number;
  /* Boshlang'ich placement test natijasi (yangi user → null) */
  placementLevel?: 'Boshlang‘ich' | 'O‘rta' | 'Yuqori';
  /* Kuniga ajratiladigan minutlar (onboarding'dan) */
  dailyMinutes?: number;
  /* Zaif fanlar (focus uchun, onboarding'dan) */
  weakSubjects?: SubjectId[];
}

export interface FlashCard {
  id: string;
  topicId: string;
  front: string;
  back: string;
  hint?: string;
}

export interface FlashTopic {
  id: string;
  subject: SubjectId;
  title: string;
  desc: string;
  cards: FlashCard[];
}

export interface Team {
  id: string;
  name: string;
  color: string;
  members: number;
  weeklyXp: number;
  totalXp: number;
  rank: number;
}

export interface Tournament {
  id: string;
  title: string;
  desc: string;
  endsAt: string; // ISO
  prize: string;
  participants: number;
  topPrizes: { rank: number; reward: string; xp: number }[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  text: string;
}

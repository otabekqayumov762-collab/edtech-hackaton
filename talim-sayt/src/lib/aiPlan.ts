import type { SubjectId, User } from './types';
import { APP_SUBJECTS, coursePathForAppSubject } from './courses';
import { LESSONS, TESTS } from './mockData';

export interface PlanTask {
  id: string;
  type: 'lesson' | 'test' | 'challenge';
  title: string;
  subject?: SubjectId;
  to: string;
  minutes: number;
  icon: string; // Lucide ikon nomi
}

/**
 * Bugungi shaxsiy AI rejani generatsiya qiladi.
 *
 * Algoritm:
 *  - Agar `weakSubjects` mavjud bo'lsa, birinchisidan 1 ta dars + 1 ta test taklif qilinadi.
 *    Aks holda — eng past progressga ega fan (yoki birinchi fan) tanlanadi.
 *  - `dailyMinutes >= 30` bo'lsa: 3 ta task (dars + test + kunlik challenge).
 *  - `dailyMinutes < 30` bo'lsa: 2 ta task (dars + challenge).
 *  - Default `dailyMinutes` — 20 daqiqa.
 *
 * Pure function: tashqi state, API yoki Date'ga bog'liq emas.
 */
export function generateDailyPlan(user: User): PlanTask[] {
  const minutes = typeof user.dailyMinutes === 'number' ? user.dailyMinutes : 20;
  const weak = user.weakSubjects ?? [];

  // Tanlangan fan: weakSubjects[0] yoki eng past progressli fan
  const appIds = new Set<string>(APP_SUBJECTS.map((s) => s.id));
  const weakApp = weak.find((id) => appIds.has(id));
  const focusSubject: SubjectId =
    weakApp ??
    (Object.entries(user.subjectProgress)
      .filter(([id]) => appIds.has(id))
      .sort((a, b) => Number(a[1]) - Number(b[1]))[0]?.[0] as SubjectId | undefined) ??
    APP_SUBJECTS[0].id;

  // Foydalanuvchi tugatmagan, focusSubject bo'yicha birinchi dars
  const lessonForSubject =
    LESSONS.find(
      (l) => l.subject === focusSubject && !user.completedLessons.includes(l.id),
    ) ??
    LESSONS.find((l) => l.subject === focusSubject) ??
    LESSONS[0];

  // Foydalanuvchi yechmagan, focusSubject bo'yicha birinchi test
  const solvedTestIds = new Set(user.results.map((r) => r.testId));
  const testForSubject =
    TESTS.find(
      (t) => t.subject === focusSubject && !solvedTestIds.has(t.id),
    ) ??
    TESTS.find((t) => t.subject === focusSubject) ??
    TESTS[0];

  const tasks: PlanTask[] = [];

  // 1) Lesson — har doim
  tasks.push({
    id: `plan-lesson-${lessonForSubject.id}`,
    type: 'lesson',
    title: lessonForSubject.title,
    subject: lessonForSubject.subject,
    to: coursePathForAppSubject(focusSubject as (typeof APP_SUBJECTS)[number]['id']),
    minutes: lessonForSubject.duration,
    icon: 'BookOpen',
  });

  // 2) >=30 min bo'lsa — test ham qo'shiladi
  if (minutes >= 30) {
    tasks.push({
      id: `plan-test-${testForSubject.id}`,
      type: 'test',
      title: testForSubject.title,
      subject: testForSubject.subject,
      to: `/app/testlar/${testForSubject.id}`,
      minutes: testForSubject.durationMin,
      icon: 'ClipboardCheck',
    });
  }

  // 3) Kunlik challenge — har doim oxirgi task
  tasks.push({
    id: 'plan-challenge-daily',
    type: 'challenge',
    title: 'Kunlik challenge — 10 savol',
    to: '/app/mashqlar',
    minutes: minutes >= 30 ? 10 : Math.max(5, minutes - lessonForSubject.duration),
    icon: 'Zap',
  });

  return tasks;
}

/**
 * Task turi bo'yicha rang qaytaradi (badge va ikonlar uchun).
 */
export function planTaskColor(type: PlanTask['type']): string {
  switch (type) {
    case 'lesson':
      return '#38bdf8';
    case 'test':
      return '#a855f7';
    case 'challenge':
      return '#f97316';
  }
}

/**
 * Task turi bo'yicha qisqa label.
 */
export function planTaskLabel(type: PlanTask['type']): string {
  switch (type) {
    case 'lesson':
      return 'Dars';
    case 'test':
      return 'Test';
    case 'challenge':
      return 'Challenge';
  }
}

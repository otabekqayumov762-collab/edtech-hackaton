import type { SubjectId } from './types';

export type QuestionKind = 'choice' | 'fill' | 'speech';

export interface AnsweredQuestion {
  index: number;
  subject?: SubjectId | string;
  kind: QuestionKind;
  question: string;
  options?: string[];
  correctAnswer: string;
  userAnswer: string | null;
  isCorrect: boolean;
  explanation?: string;
}

export interface AnalysisSummary {
  total: number;
  correct: number;
  wrong: number;
  skipped: number;
  percent: number;
  weakSubject?: string;
  message: string;
  tips: string[];
}

const MOTIVATIONAL: Record<'high' | 'mid' | 'low', string[]> = {
  high: [
    'Mukammal natija! Sen bu mavzuni juda yaxshi bilasan.',
    'Zo‘r ishlading! Endi yana qiyinroq daraja sinab ko‘r.',
  ],
  mid: [
    'Yaxshi natija. Bir nechta xatolar ustida ishlasak yetarli.',
    'Yo‘ldasan, davom et — yana mashq qilsak natija oshadi.',
  ],
  low: [
    'Bu mavzuni qayta ko‘rib chiqsak — yaxshi natija olamiz.',
    'Xato — eng kuchli o‘qituvchi. Endi izohlarni o‘qib, qayta urinib ko‘r.',
  ],
};

/* Sodda lokal AI tushuntirish — keyinroq Groq endpointiga ulanadi */
export function explainError(q: AnsweredQuestion): string {
  if (q.explanation) return q.explanation;
  if (q.kind === 'choice') {
    return `Sen «${q.userAnswer ?? "(javobsiz)"}» ni tanlading, lekin to‘g‘ri javob «${q.correctAnswer}». Mavzuni qayta ko‘rib chiqing.`;
  }
  if (q.kind === 'fill') {
    return `Sen «${q.userAnswer ?? "(bo‘sh)"}» deb yozding. To‘g‘ri javob: «${q.correctAnswer}». Yozma savollar uchun aniqlikka e’tibor bering.`;
  }
  return `Sen javobni to‘liq ifodalay olmading. To‘g‘ri yo‘nalish: «${q.correctAnswer}».`;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function analyze(answers: AnsweredQuestion[]): AnalysisSummary {
  const total = answers.length;
  const correct = answers.filter((a) => a.isCorrect).length;
  const skipped = answers.filter((a) => !a.isCorrect && (a.userAnswer == null || a.userAnswer === '')).length;
  const wrong = total - correct;
  const percent = total ? Math.round((correct / total) * 100) : 0;

  // weak subject
  const wrongBySubject = new Map<string, number>();
  answers.filter((a) => !a.isCorrect && a.subject).forEach((a) => {
    const k = String(a.subject);
    wrongBySubject.set(k, (wrongBySubject.get(k) ?? 0) + 1);
  });
  const weakSubject = [...wrongBySubject.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];

  const tier: 'high' | 'mid' | 'low' = percent >= 80 ? 'high' : percent >= 50 ? 'mid' : 'low';
  const message = pickRandom(MOTIVATIONAL[tier]);

  const tips: string[] = [];
  if (weakSubject) tips.push(`«${weakSubject}» mavzusiga ko‘proq vaqt ajrating — har kuni 10 daqiqa mashq qiling.`);
  if (wrong > 0 && wrong >= total * 0.4) tips.push('Izohlarni diqqat bilan o‘qing va keyin "Xatolarni qayta yechish" ni bosing.');
  if (correct === total) tips.push('Endi yuqori darajadagi savollarga o‘ting.');
  if (skipped > 0) tips.push('Vaqtni to‘g‘ri taqsimlang — savolni bo‘sh qoldirishdan saqlanish kerak.');
  if (tips.length === 0) tips.push('Bir necha kun ketma-ket mashq qiling — natija sezilarli yaxshilanadi.');

  return { total, correct, wrong, skipped, percent, weakSubject, message, tips };
}

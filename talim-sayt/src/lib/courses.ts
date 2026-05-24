import type { SubjectId } from './types';

/* Yangi birlashtirilgan ID — "Ona tili + Adabiyot" uchun.
   Mavjud `ona-tili` SubjectId bilan moslik uchun union ishlatamiz. */
export type CourseSubjectId =
  | SubjectId
  | 'ona-tili-adabiyot'
  | 'adabiyot'
  | 'tarix'
  | 'geografiya';

/** `/app` da ko‘rsatiladigan asosiy fanlar */
export type AppActiveSubjectId = 'matematika' | 'ona-tili' | 'adabiyot' | 'tarix';

export interface AppDashboardSubject {
  id: AppActiveSubjectId;
  name: string;
  short: string;
  icon: string;
  color: string;
  courseId: CourseSubjectId;
}

export const APP_SUBJECTS: AppDashboardSubject[] = [
  {
    id: 'matematika',
    name: 'Matematika',
    short: 'Mat',
    icon: 'Calculator',
    color: '#6366f1',
    courseId: 'matematika',
  },
  {
    id: 'ona-tili',
    name: 'Ona tili',
    short: 'OT',
    icon: 'BookText',
    color: '#0ea5e9',
    courseId: 'ona-tili',
  },
  {
    id: 'adabiyot',
    name: 'Adabiyot',
    short: 'Ad',
    icon: 'Feather',
    color: '#ec4899',
    courseId: 'adabiyot',
  },
  {
    id: 'tarix',
    name: 'Tarix',
    short: 'Tar',
    icon: 'Landmark',
    color: '#f59e0b',
    courseId: 'tarix',
  },
];

export function appSubjectProgress(
  progress: Record<string, number>,
  id: AppActiveSubjectId,
): number {
  return progress[id] ?? 0;
}

export function coursePathForAppSubject(id: AppActiveSubjectId): string {
  const s = APP_SUBJECTS.find((x) => x.id === id)!;
  return `/app/fan/${s.courseId}/sinf`;
}

export interface CourseSubject {
  id: CourseSubjectId;
  name: string;
  icon: string;        // Lucide ikon nomi
  color: string;       // hex
  available: boolean;  // false → "Tez kunda"
  description: string;
}

export const COURSE_SUBJECTS: CourseSubject[] = [
  {
    id: 'matematika',
    name: 'Matematika',
    icon: 'Calculator',
    color: '#6366f1',
    available: true,
    description: 'Algebra, geometriya, mantiq',
  },
  {
    id: 'ona-tili',
    name: 'Ona tili',
    icon: 'BookText',
    color: '#0ea5e9',
    available: true,
    description: 'Til qoidalari va imlo',
  },
  {
    id: 'adabiyot',
    name: 'Adabiyot',
    icon: 'Feather',
    color: '#ec4899',
    available: true,
    description: 'Badiiy asarlar va tahlil',
  },
  {
    id: 'ona-tili-adabiyot',
    name: 'Ona tili + Adabiyot',
    icon: 'BookText',
    color: '#0ea5e9',
    available: false,
    description: 'Eski havola — Ona tili va Adabiyot alohida',
  },
  {
    id: 'tarix',
    name: 'Tarix',
    icon: 'Landmark',
    color: '#f59e0b',
    available: true,
    description: 'Vatan tarixi va jahon',
  },
  {
    id: 'fizika',
    name: 'Fizika',
    icon: 'Atom',
    color: '#22c55e',
    available: false,
    description: 'Tez kunda...',
  },
  {
    id: 'kimyo',
    name: 'Kimyo',
    icon: 'FlaskConical',
    color: '#a855f7',
    available: false,
    description: 'Tez kunda...',
  },
  {
    id: 'biologiya',
    name: 'Biologiya',
    icon: 'Leaf',
    color: '#16a34a',
    available: false,
    description: 'Tez kunda...',
  },
  {
    id: 'ingliz-tili',
    name: 'Ingliz tili',
    icon: 'Globe',
    color: '#ec4899',
    available: false,
    description: 'Tez kunda...',
  },
];

/** Tarix — standart mavzular soni (6-sinfdan tashqari qolgan sinflar) */
export const TARIX_TOPIC_COUNT = 52;

/** Jahon tarixi yo'nalishi — mavzular soni */
export const TARIX_JAHON_TOPIC_COUNT = 23;

export type TarixUnitKind = 'mavzu' | 'dars';

export interface TarixGradeUnits {
  count: number;
  kind: TarixUnitKind;
}

/** Sinf bo‘yicha Tarix dars/mavzu ro‘yxati */
const TARIX_BY_GRADE: Partial<Record<Grade, TarixGradeUnits>> = {
  6: { count: 50, kind: 'dars' },
  7: { count: 56, kind: 'mavzu' },
};

export function getTarixGradeUnits(
  grade: string,
  trackId?: TarixTrackId | null,
): TarixGradeUnits {
  if (trackId === 'jahon') {
    return { count: TARIX_JAHON_TOPIC_COUNT, kind: 'mavzu' };
  }
  const n = Number(grade);
  if ((GRADES as readonly number[]).includes(n)) {
    return TARIX_BY_GRADE[n as Grade] ?? { count: TARIX_TOPIC_COUNT, kind: 'mavzu' };
  }
  return { count: TARIX_TOPIC_COUNT, kind: 'mavzu' };
}

export const GRADES = [5, 6, 7, 8, 9, 10, 11] as const;
export type Grade = (typeof GRADES)[number];

/** Fan bo‘yicha ko‘rsatilmaydigan sinflar */
const SUBJECT_EXCLUDED_GRADES: Partial<Record<CourseSubjectId, Grade[]>> = {
  tarix: [5],
  matematika: [5],
  'ona-tili': [5],
  adabiyot: [5],
};

function excludedGradesFor(subjectId: string | undefined): Grade[] {
  if (!subjectId) return [];
  return SUBJECT_EXCLUDED_GRADES[subjectId as CourseSubjectId] ?? [];
}

export function gradesForSubject(subjectId: string | undefined): Grade[] {
  const excluded = excludedGradesFor(subjectId);
  return GRADES.filter((g) => !excluded.includes(g));
}

export function isGradeAvailableForSubject(
  subjectId: string,
  grade: string,
): boolean {
  if (!isValidGrade(grade)) return false;
  const n = Number(grade) as Grade;
  return !excludedGradesFor(subjectId).includes(n);
}

/** Tarixda O‘zbekiston / Jahon tanlovi majburiy sinflar */
export const TARIX_TRACK_GRADES: Grade[] = [7, 8, 9, 10, 11];

export function isTarixTrackGrade(grade: string | number): boolean {
  const n = Number(grade) as Grade;
  return TARIX_TRACK_GRADES.includes(n);
}

export type TarixTrackId = 'uzbekiston' | 'jahon';

export interface TarixTrack {
  id: TarixTrackId;
  name: string;
  icon: string;
  description: string;
}

export const TARIX_TRACKS: TarixTrack[] = [
  {
    id: 'uzbekiston',
    name: "O'zbekiston tarixi",
    icon: 'MapPin',
    description: 'Vatanimiz tarixi va madaniyati',
  },
  {
    id: 'jahon',
    name: 'Jahon tarixi',
    icon: 'Globe',
    description: 'Jahon va qadimgi tsivilizatsiyalar',
  },
];

export function isValidTarixTrack(
  value: string | null,
): value is TarixTrackId {
  return value === 'uzbekiston' || value === 'jahon';
}

export function findTarixTrack(id: string | null): TarixTrack | undefined {
  if (!isValidTarixTrack(id)) return undefined;
  return TARIX_TRACKS.find((t) => t.id === id);
}

export function tarixRequiresTrack(grade: string): boolean {
  return isTarixTrackGrade(grade);
}

export type SectionKind = 'audio' | 'mashq' | 'test';

export interface CourseSection {
  kind: SectionKind;
  title: string;
  required: boolean;
  icon: string;
  desc: string;
  xp: number;
}

export const SECTIONS: CourseSection[] = [
  {
    kind: 'audio',
    title: 'Audio dars',
    required: false,
    icon: 'Headphones',
    desc: "Darsni eshitish (ixtiyoriy, bonus beradi)",
    xp: 10,
  },
  {
    kind: 'mashq',
    title: 'Majburiy mashq',
    required: true,
    icon: 'Gamepad2',
    desc: "Quiz, drag-drop, match — XP qo'l keladi",
    xp: 30,
  },
  {
    kind: 'test',
    title: 'Yakuniy test',
    required: true,
    icon: 'ClipboardCheck',
    desc: '5-10 savol, perfect → bonus gem',
    xp: 50,
  },
];

export function findCourseSubject(id: string | undefined): CourseSubject | undefined {
  if (!id) return undefined;
  return COURSE_SUBJECTS.find((s) => s.id === id);
}

export function isValidGrade(value: string | undefined): value is `${Grade}` {
  if (!value) return false;
  const n = Number(value);
  return (GRADES as readonly number[]).includes(n);
}

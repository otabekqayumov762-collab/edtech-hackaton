import { useEffect, useMemo, useState } from 'react';
import { Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Icon } from '../../../components/Icon';
import { PageHead } from '../_shared';
import {
  findCourseSubject,
  isGradeAvailableForSubject,
} from '../../../lib/courses';
import * as lessonsApi from '../../../lib/api/lessons';

function extractTopic(title: string): string {
  return (title ?? '').replace(/^\d+-sinf\s*·\s*/i, '').trim();
}

function extractVideoUrl(text: string): string | undefined {
  const m = (text ?? '').match(/https?:\/\/(?:youtu\.be\/|www\.youtube\.com\/watch\?v=)[\w-]+/);
  return m ? m[0] : undefined;
}

export function CourseSections() {
  const { subject, grade } = useParams<{ subject: string; grade: string }>();
  const [search, setSearch] = useSearchParams();
  const nav = useNavigate();
  const s = findCourseSubject(subject);

  if (
    !s ||
    !s.available ||
    !grade ||
    !subject ||
    !isGradeAvailableForSubject(subject, grade)
  ) {
    return <Navigate to="/app/fan" replace />;
  }

  const selectedLessonId = search.get('lesson');

  return (
    <div>
      <button
        onClick={() => {
          if (selectedLessonId) {
            setSearch({}, { replace: true });
          } else {
            nav(`/app/fan/${subject}/sinf`);
          }
        }}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-brand-500 hover:text-white"
      >
        <Icon name="ChevronLeft" size={14} />
        Orqaga
      </button>

      <PageHead
        title={`${s.name} — ${grade}-sinf`}
        desc={
          selectedLessonId
            ? 'Mavzu uchun: audio dars, mashq yoki yakuniy testdan o‘ting.'
            : 'Mavzuni tanlang.'
        }
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {selectedLessonId ? (
          <LessonActions
            subject={subject!}
            grade={grade!}
            color={s.color}
            lessonId={selectedLessonId}
            onNavAudio={(videoUrl) =>
              videoUrl
                ? window.open(videoUrl, '_blank', 'noopener,noreferrer')
                : nav(`/app/fan/${subject}/sinf/${grade}/audio`)
            }
            onNavFlash={(deckId, topic) => {
              const next = `/app/fan/${subject}/sinf/${grade}/test?topic=${encodeURIComponent(topic)}`;
              nav(`/app/flash?deck=${encodeURIComponent(deckId)}&next=${encodeURIComponent(next)}`);
            }}
          />
        ) : (
          <LessonList
            subject={subject!}
            grade={grade!}
            color={s.color}
            onPickLesson={(lesson) => {
              setSearch({ lesson: String(lesson.id) });
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

/* ---------- LessonActions — 3 cards (Audio/Mashq/Test) per lesson ---------- */
function LessonActions({
  subject,
  grade,
  color,
  lessonId,
  onNavAudio,
  onNavFlash,
}: {
  subject: string;
  grade: string;
  color: string;
  lessonId: string;
  onNavAudio: (videoUrl?: string) => void;
  onNavFlash: (deckId: string, topic: string) => void;
}) {
  const [lesson, setLesson] = useState<lessonsApi.Lesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    lessonsApi
      .list({ subject })
      .then((all) => {
        if (cancelled) return;
        const want = `${grade}-sinf`;
        const found =
          all.find((l) => String(l.id) === lessonId) ??
          all.find(
            (l) =>
              String(l.id) === lessonId &&
              (l.title ?? '').toLowerCase().includes(want),
          ) ??
          null;
        setLesson(found);
      })
      .catch(() => {
        if (!cancelled) setLesson(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subject, grade, lessonId]);

  const topic = useMemo(
    () => extractTopic(lesson?.title ?? ''),
    [lesson?.title],
  );
  const videoUrl = useMemo(
    () => extractVideoUrl(lesson?.summary ?? ''),
    [lesson?.summary],
  );

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 text-center text-sm text-white/55">
        Mavzu yuklanmoqda...
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-800/50 p-6 text-center text-sm text-white/55">
        Mavzu topilmadi.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Lesson header */}
      <div className="rounded-2xl border border-ink-700 bg-ink-800 p-5">
        <p className="text-xs font-bold uppercase tracking-wider text-white/45">
          {grade}-sinf · Mavzu
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-white">{topic}</h2>
        {lesson.summary && (
          <p className="mt-2 text-sm leading-relaxed text-white/65">
            {lesson.summary.replace(/^\d+-sinf\s*·\s*/i, '').replace(/\s*Video:\s*https?:\/\/\S+/i, '')}
          </p>
        )}
      </div>

      <div className="space-y-3">
        <ActionCard
          icon="Headphones"
          color={color}
          title="Audio dars"
          badge="IXTIYORIY"
          badgeTone="info"
          desc={videoUrl ? 'YouTube videoni tomosha qiling' : 'Darsni eshitish (ixtiyoriy)'}
          xp={10}
          onClick={() => onNavAudio(videoUrl)}
        />
        <ActionCard
          icon="Gamepad2"
          color={color}
          title="Majburiy mashq"
          badge="MAJBURIY"
          badgeTone="warn"
          desc="Flashcardlar — keyin avtomatik testga o‘tasiz"
          xp={50}
          bonus
          onClick={() => onNavFlash(String(lesson.id), topic)}
        />
      </div>
    </div>
  );
}

/* ---------- ActionCard (Yana section) — minimalist with Boshlash CTA ---------- */
function ActionCard({
  icon,
  color,
  title,
  badge,
  badgeTone,
  desc,
  xp,
  bonus,
  onClick,
}: {
  icon: string;
  color: string;
  title: string;
  badge: string;
  badgeTone: 'info' | 'warn';
  desc: string;
  xp: number;
  bonus?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl border border-ink-700 bg-ink-800 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-500"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `${color}26`, color }}
      >
        <Icon name={icon} size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-white">{title}</h3>
          <span
            className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
              badgeTone === 'warn'
                ? 'bg-rose-accent/15 text-rose-accent'
                : 'bg-brand-600/15 text-brand-300'
            }`}
          >
            {badge}
          </span>
        </div>
        <p className="mt-0.5 text-sm text-white/55">{desc}</p>
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-white/45">
          <span className="inline-flex items-center gap-1">
            <Icon name="Zap" size={11} color="#fbbf24" /> +{xp} XP
          </span>
          {bonus && (
            <span className="inline-flex items-center gap-1 text-amber-300">
              <Icon name="Gift" size={11} /> Perfect → bonus gem
            </span>
          )}
        </div>
      </div>
      <span
        className="hidden shrink-0 items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-bold shadow-md transition-transform group-hover:translate-x-0.5 sm:inline-flex"
        style={{
          background: color,
          color: '#ffffff',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ color: '#ffffff' }}>Boshlash</span>
        <Icon name="ArrowRight" size={13} color="#ffffff" />
      </span>
    </button>
  );
}

/* ---------- Lesson list from backend ---------- */
function LessonList({
  subject,
  grade,
  color,
  onPickLesson,
}: {
  subject: string;
  grade: string;
  color: string;
  onPickLesson: (lesson: lessonsApi.Lesson) => void;
}) {
  const [lessons, setLessons] = useState<lessonsApi.Lesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    lessonsApi
      .list({ subject })
      .then((all) => {
        if (cancelled) return;
        const want = `${grade}-sinf`;
        const mine = all.filter((l) =>
          (l.title ?? '').toLowerCase().includes(want),
        );
        setLessons(mine);
      })
      .catch(() => {
        if (!cancelled) setLessons([]);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [subject, grade]);

  if (loading) {
    return (
      <div className="rounded-2xl border border-ink-700 bg-ink-800 p-6 text-center text-sm text-white/55">
        Mavzular yuklanmoqda...
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-800/50 p-6 text-center text-sm text-white/55">
        Bu sinf uchun mavzular hali qo&apos;shilmagan.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">
          <span className="inline-flex items-center gap-2">
            <Icon name="BookOpen" size={16} color={color} />
            Mavzular ({lessons.length})
          </span>
        </h3>
      </div>
      <div className="space-y-2.5">
        {lessons.map((l, i) => (
          <LessonRow
            key={l.id}
            index={i + 1}
            lesson={l}
            color={color}
            onClick={() => onPickLesson(l)}
          />
        ))}
      </div>
    </div>
  );
}

function LessonRow({
  index,
  lesson,
  color,
  onClick,
}: {
  index: number;
  lesson: lessonsApi.Lesson;
  color: string;
  onClick: () => void;
}) {
  // Strip "N-sinf · " prefix so title is clean
  const cleanTitle = (lesson.title ?? '').replace(/^\d+-sinf\s*·\s*/i, '');
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-4 rounded-xl border border-ink-700 bg-ink-800 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-brand-500"
    >
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-black tabular-nums text-white"
        style={{
          background: `linear-gradient(145deg, ${color}, ${color}cc)`,
          boxShadow: `0 4px 14px ${color}55`,
          color: '#ffffff',
        }}
      >
        {index}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate font-bold text-white">{cleanTitle}</p>
        {lesson.summary && (
          <p className="mt-0.5 line-clamp-1 text-xs text-white/55">
            {lesson.summary.replace(/^\d+-sinf\s*·\s*/i, '')}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-3 text-[11px] text-white/45">
          <span className="inline-flex items-center gap-1">
            <Icon name="Clock" size={11} /> {lesson.duration ?? 15} daq
          </span>
          <span className="inline-flex items-center gap-1">
            <Icon name="Zap" size={11} color="#fbbf24" /> +{lesson.xp ?? 30} XP
          </span>
          {lesson.completed && (
            <span className="inline-flex items-center gap-1 text-emerald-300">
              <Icon name="CheckCircle2" size={11} /> Yakunlangan
            </span>
          )}
        </div>
      </div>
      <span
        className="hidden shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold shadow-md transition-transform group-hover:translate-x-0.5 sm:inline-flex"
        style={{
          background: color,
          color: '#ffffff',
          textShadow: '0 1px 3px rgba(0,0,0,0.5)',
        }}
      >
        <span style={{ color: '#ffffff' }}>Boshlash</span>
        <Icon name="ArrowRight" size={13} color="#ffffff" />
      </span>
      <Icon
        name="ArrowRight"
        size={18}
        className="shrink-0 text-white/30 transition-colors group-hover:text-brand-300 sm:hidden"
      />
    </button>
  );
}



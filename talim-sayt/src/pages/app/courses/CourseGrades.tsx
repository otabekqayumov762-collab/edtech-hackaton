import { useState } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Icon } from '../../../components/Icon';
import { PageHead } from '../_shared';
import {
  TARIX_TRACKS,
  findCourseSubject,
  gradesForSubject,
  isTarixTrackGrade,
} from '../../../lib/courses';

export function CourseGrades() {
  const { subject } = useParams<{ subject: string }>();
  const nav = useNavigate();
  const s = findCourseSubject(subject);
  const [pickedGrade, setPickedGrade] = useState<number | null>(null);

  if (!s || !s.available) return <Navigate to="/app/fan" replace />;

  const isTarix = subject === 'tarix';
  const grades = gradesForSubject(subject);

  const handleGradeClick = (g: number) => {
    if (isTarix && isTarixTrackGrade(g)) {
      setPickedGrade(g);
      return;
    }
    nav(`/app/fan/${subject}/sinf/${g}`);
  };

  const openTrack = (trackId: string) => {
    if (pickedGrade == null) return;
    nav(`/app/fan/${subject}/sinf/${pickedGrade}?track=${trackId}`);
  };

  const subjectCard = (
    <div className="mb-6 flex items-center gap-4 rounded-xl border border-ink-700 bg-ink-800 p-5">
      <span
        className="flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ background: `${s.color}1A`, color: s.color }}
      >
        <Icon name={s.icon} size={36} />
      </span>
      <div>
        <p className="text-xs uppercase tracking-wider text-white/40">Tanlangan fan</p>
        <h2 className="text-2xl font-extrabold text-white">{s.name}</h2>
        <p className="mt-0.5 text-sm text-white/50">{s.description}</p>
      </div>
    </div>
  );

  /* ── Yo'nalish tanlash ekrani (7–11 sinf bosilganda) ── */
  if (isTarix && pickedGrade != null && isTarixTrackGrade(pickedGrade)) {
    return (
      <div>
        <button
          type="button"
          onClick={() => setPickedGrade(null)}
          className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-brand-500 hover:text-white"
        >
          <Icon name="ChevronLeft" size={14} />
          Orqaga
        </button>

        {subjectCard}

        <PageHead
          title={`${pickedGrade}-sinf — Yo'nalishni tanlang`}
          desc="O'zbekiston tarixi yoki Jahon tarixi bo'limidan birini tanlang."
        />

        <div className="grid gap-4 sm:grid-cols-2">
          {TARIX_TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              onClick={() => openTrack(track.id)}
              className="group flex items-center gap-5 rounded-2xl border border-ink-700 bg-ink-800 p-6 text-left transition-all hover:-translate-y-0.5 hover:border-brand-500"
            >
              <span
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl text-white"
                style={{
                  background: `linear-gradient(145deg, ${s.color}, ${s.color}cc)`,
                }}
              >
                <Icon name={track.icon} size={26} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-lg font-bold text-white">{track.name}</p>
                <p className="mt-0.5 text-sm text-white/50">{track.description}</p>
              </div>
              <Icon
                name="ArrowRight"
                size={20}
                className="shrink-0 text-white/30 transition-colors group-hover:text-brand-300"
              />
            </button>
          ))}
        </div>
      </div>
    );
  }

  /* ── Sinf tanlash ekrani (asosiy) ── */
  return (
    <div>
      <button
        type="button"
        onClick={() => nav('/app/fan')}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-800 px-3 py-1.5 text-xs font-semibold text-white/70 transition-colors hover:border-brand-500 hover:text-white"
      >
        <Icon name="ChevronLeft" size={14} />
        Orqaga
      </button>

      <PageHead
        title="Sinfingizni tanlang"
        desc={
          isTarix
            ? "7–11 sinflar uchun yo'nalish tanlanadi. 6-sinf to'g'ridan ochiladi."
            : 'Sinf darajangizga mos materiallar yuklanadi.'
        }
      />

      {subjectCard}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {grades.map((g) => {
          const needsTrack = isTarix && isTarixTrackGrade(g);

          return (
            <button
              key={g}
              type="button"
              onClick={() => handleGradeClick(g)}
              className="group flex flex-col items-center gap-3 rounded-xl border border-ink-700 bg-ink-800 p-6 transition-colors hover-lift hover:border-brand-500"
            >
              <span
                className="flex h-16 w-16 items-center justify-center rounded-2xl text-2xl font-black text-white"
                style={{ background: s.color }}
              >
                {g}
              </span>
              <span className="text-base font-bold text-white">{g}-sinf</span>
              <span className="flex items-center gap-1 text-xs text-white/45 group-hover:text-brand-300">
                {needsTrack ? "Yo'nalish tanlang" : 'Boshlash'}
                <Icon name="ArrowRight" size={13} />
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

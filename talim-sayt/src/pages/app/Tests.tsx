import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from '../../components/Icon';
import { PageHead, Empty } from './_shared';
import { useApp } from '../../store/useApp';
import * as testsApi from '../../lib/api/tests';
import * as subjectsApi from '../../lib/api/subjects';

const DIFF_COLOR: Record<string, string> = {
  Oson: '#22c55e',
  'O‘rta': '#fbbf24',
  Qiyin: '#f43f5e',
};

function diffColor(d: string | undefined): string {
  if (!d) return '#a997ff';
  return DIFF_COLOR[d] ?? '#a997ff';
}

export function Tests() {
  const { user } = useApp();
  const [fan, setFan] = useState<string>('all');
  const [tests, setTests] = useState<testsApi.Test[]>([]);
  const [subjects, setSubjects] = useState<subjectsApi.Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([
      testsApi.list().catch(() => [] as testsApi.Test[]),
      subjectsApi.list().catch(() => [] as subjectsApi.Subject[]),
    ])
      .then(([t, s]) => {
        if (cancelled) return;
        setTests(t);
        setSubjects(s);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Testlarni yuklab bo‘lmadi');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered =
    fan === 'all'
      ? tests
      : tests.filter((t) => String(t.subject) === fan);

  const subjectById = (sid: string | number) =>
    subjects.find((s) => String(s.id) === String(sid) || s.slug === String(sid));

  return (
    <div>
      <PageHead
        icon="ClipboardList"
        title="Testlar"
        desc="Bilimingizni sinab ko‘ring va XP yig‘ing"
      />

      {subjects.length > 0 && (
        <div className="-mx-1 mb-6 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setFan('all')}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
              fan === 'all'
                ? 'border-brand-500 bg-brand-600 text-white'
                : 'border-ink-700 bg-ink-800 text-white/55'
            }`}
          >
            Barchasi
          </button>
          {subjects.map((s) => {
            const key = String(s.id);
            const active = fan === key;
            return (
              <button
                key={key}
                onClick={() => setFan(key)}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-4 py-2 text-sm font-semibold ${
                  active
                    ? 'border-brand-500 bg-brand-600 text-white'
                    : 'border-ink-700 bg-ink-800 text-white/55'
                }`}
              >
                {s.icon && (
                  <Icon
                    name={s.icon}
                    size={14}
                    color={active ? '#fff' : s.color ?? '#a997ff'}
                  />
                )}
                {s.name}
              </button>
            );
          })}
        </div>
      )}

      {loading && (
        <p className="py-10 text-center text-sm text-white/55">
          Yuklanmoqda...
        </p>
      )}

      {!loading && error && (
        <Empty icon="AlertTriangle" title="Xatolik" desc={error} />
      )}

      {!loading && !error && filtered.length === 0 && (
        <Empty
          icon="ClipboardList"
          title="Test topilmadi"
          desc="Hozircha bu fan bo‘yicha testlar mavjud emas."
        />
      )}

      {!loading && !error && filtered.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => {
            const s = subjectById(t.subject);
            const color = s?.color ?? '#a997ff';
            const icon = s?.icon ?? 'BookOpen';
            const prev = user?.results.find(
              (r) => String(r.testId) === String(t.id),
            );
            return (
              <Link
                key={t.id}
                to={`/app/testlar/${t.id}`}
                className="group flex flex-col rounded-xl border border-ink-700 bg-ink-800 p-5 transition-all hover-lift hover:border-brand-500"
              >
                <div className="flex items-center justify-between">
                  <span
                    className="flex h-11 w-11 items-center justify-center rounded-lg"
                    style={{ background: `${color}26`, color }}
                  >
                    <Icon name={icon} size={20} />
                  </span>
                  {t.difficulty && (
                    <span
                      className="rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{
                        background: `${diffColor(t.difficulty)}1f`,
                        color: diffColor(t.difficulty),
                      }}
                    >
                      {t.difficulty}
                    </span>
                  )}
                </div>
                <h3 className="mt-4 font-bold text-white">{t.title}</h3>
                <div className="mt-2 flex items-center gap-4 text-xs text-white/45">
                  <span className="flex items-center gap-1">
                    <Icon name="ClipboardCheck" size={13} />{' '}
                    {t.questions?.length ?? 0} savol
                  </span>
                  <span className="flex items-center gap-1">
                    <Icon name="Clock" size={13} /> {t.duration_min} daqiqa
                  </span>
                </div>
                {prev && (
                  <div className="mt-3 rounded-xl bg-ink-900 px-3 py-2 text-xs text-white/55">
                    Oxirgi natija:{' '}
                    <b className="text-brand-300">
                      {prev.correct}/{prev.total}
                    </b>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between border-t border-ink-700 pt-3">
                  <span className="flex items-center gap-1 text-sm font-bold text-gold">
                    <Icon name="Zap" size={14} /> +{t.xp} XP
                  </span>
                  <span className="flex items-center gap-1 text-sm font-semibold text-brand-300">
                    Boshlash <Icon name="ArrowRight" size={14} />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

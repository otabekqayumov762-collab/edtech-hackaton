import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from './Icon';
import {
  analyze,
  explainError,
  type AnsweredQuestion,
} from '../lib/errorAnalysis';

interface Props {
  answers: AnsweredQuestion[];
  onRetryWrong?: () => void;
  onClose?: () => void;
}

export function ErrorReview({ answers, onRetryWrong, onClose }: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'correct'>('wrong');
  const summary = analyze(answers);

  const filtered =
    filter === 'all'
      ? answers
      : filter === 'wrong'
        ? answers.filter((a) => !a.isCorrect)
        : answers.filter((a) => a.isCorrect);

  const tierColor =
    summary.percent >= 80
      ? 'bg-grass'
      : summary.percent >= 50
        ? 'bg-fire'
        : 'bg-rose-accent';

  return (
    <div className="mx-auto max-w-3xl">
      {/* Header */}
      <div className="overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-2xl font-extrabold text-white">
              Xatolar tahlili
            </h2>
            <p className="mt-1 text-sm text-white/55">
              AI har bir xato uchun izoh va maslahat tayyorladi
            </p>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-semibold text-white/65 hover:text-white"
            >
              Yopish
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs text-white/55">
            <span>{summary.correct} / {summary.total} to‘g‘ri</span>
            <span className="font-bold text-white">{summary.percent}%</span>
          </div>
          <div className="mt-2 h-3 overflow-hidden rounded-full bg-ink-950">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${summary.percent}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              className={`h-full ${tierColor}`}
            />
          </div>
        </div>

        {/* Smart summary */}
        <div className="mt-5 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <div className="flex items-start gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Icon name="Bot" size={18} />
            </span>
            <div>
              <p className="text-sm font-bold text-brand-900">
                AI xulosasi
              </p>
              <p className="mt-1 text-sm text-brand-800">{summary.message}</p>
              {summary.tips.length > 0 && (
                <ul className="mt-2 space-y-1 text-xs text-brand-700">
                  {summary.tips.map((t, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <Icon name="ArrowRight" size={12} className="mt-0.5 shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="mt-5 flex gap-1.5 rounded-xl border border-ink-700 bg-ink-900 p-1">
          {(
            [
              { key: 'wrong', label: `Xatolar (${summary.wrong})`, color: 'rose' },
              { key: 'correct', label: `To‘g‘ri (${summary.correct})`, color: 'grass' },
              { key: 'all', label: `Hammasi (${summary.total})`, color: 'brand' },
            ] as const
          ).map((t) => (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setFilter(t.key);
                setOpenIdx(null);
              }}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                filter === t.key
                  ? 'bg-brand-600 text-white'
                  : 'text-white/55 hover:text-white'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Answer list — accordion */}
      <div className="mt-5 space-y-2.5">
        {filtered.length === 0 && (
          <div className="rounded-xl border border-ink-700 bg-ink-800 p-8 text-center text-white/55">
            Bu kategoriyada savol yo‘q.
          </div>
        )}
        {filtered.map((a) => {
          const open = openIdx === a.index;
          const ok = a.isCorrect;
          return (
            <div
              key={a.index}
              className={`overflow-hidden rounded-xl border ${
                ok
                  ? 'border-grass/40 bg-grass/5'
                  : 'border-rose-accent/40 bg-rose-accent/5'
              }`}
            >
              <button
                type="button"
                onClick={() => setOpenIdx(open ? null : a.index)}
                className="flex w-full items-start gap-3 p-4 text-left"
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    ok
                      ? 'bg-grass text-white'
                      : 'bg-rose-accent text-white'
                  }`}
                  aria-hidden
                >
                  <Icon
                    name={ok ? 'CheckCircle2' : 'XCircle'}
                    size={18}
                  />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/45">
                    Savol {a.index + 1}
                    {a.subject ? ` · ${a.subject}` : ''}
                  </p>
                  <p className="mt-0.5 text-sm font-bold text-white">
                    {a.question}
                  </p>
                </div>
                <Icon
                  name={open ? 'ChevronUp' : 'ChevronDown'}
                  size={18}
                  className="mt-1 shrink-0 text-white/45"
                />
              </button>

              <AnimatePresence initial={false}>
                {open && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: 'easeOut' }}
                    className="overflow-hidden border-t border-ink-700 px-4 pb-4 pt-3"
                  >
                    {/* User answer */}
                    <div className="space-y-2 text-sm">
                      <div className="rounded-lg border border-rose-accent/40 bg-rose-accent/10 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-rose-accent">
                          Sizning javobingiz
                        </p>
                        <p className="mt-1 text-white">
                          {a.userAnswer || (
                            <span className="italic text-white/45">
                              (javob berilmagan)
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="rounded-lg border border-grass/40 bg-grass/10 p-3">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-grass">
                          To‘g‘ri javob
                        </p>
                        <p className="mt-1 text-white">{a.correctAnswer}</p>
                      </div>
                      {!ok && (
                        <div className="rounded-lg border border-brand-200 bg-brand-50 p-3">
                          <div className="flex items-start gap-2">
                            <Icon
                              name="Bot"
                              size={14}
                              className="mt-0.5 shrink-0 text-brand-600"
                            />
                            <p className="text-sm text-brand-900">
                              {explainError(a)}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Footer actions */}
      <div className="mt-6 flex flex-wrap gap-3">
        {onRetryWrong && summary.wrong > 0 && (
          <button
            type="button"
            onClick={onRetryWrong}
            className="flex-1 rounded-xl bg-brand-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-brand-700"
          >
            <Icon name="RotateCcw" size={15} className="mr-2 inline" />
            Faqat xatolarni qayta yechish
          </button>
        )}
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-ink-700 bg-ink-800 px-5 py-3 text-sm font-semibold text-white hover:bg-ink-900"
          >
            Yopish
          </button>
        )}
      </div>
    </div>
  );
}

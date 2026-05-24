import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { Button, Progress } from '../../components/ui';
import { PageHead } from './_shared';
import { Confetti } from '../../components/Confetti';

/* ============================================================
   Types
============================================================ */
type Phase = 'deck-pick' | 'studying' | 'result' | 'review';

interface FlashCard {
  id?: number | string;
  front: string;
  back: string;
  hint?: string;
}

interface Deck {
  slug: string;
  topicId?: number | string;
  title: string;
  description: string;
  icon: string;
  color: string; // hex
  cards: FlashCard[];
}

interface CardOutcome {
  index: number;
  correct: boolean;
}

const INITIAL_HEARTS = 3;

/* ============================================================
   Helpers
============================================================ */
function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, '0')}`;
}

/* ============================================================
   Sub-components
============================================================ */

/* ---------- DeckPicker (Phase 1) ---------- */
function DeckPicker({ onPick }: { onPick: (d: Deck) => void }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    import('../../lib/api/flashcards').then(({ list }) => {
      list()
        .then((topics) => {
          if (cancelled) return;
          const SUBJECT_META: Record<string, { icon: string; color: string }> = {
            matematika: { icon: 'Calculator', color: '#6366f1' },
            'ona-tili': { icon: 'BookText', color: '#0ea5e9' },
            adabiyot: { icon: 'Feather', color: '#ec4899' },
            tarix: { icon: 'Landmark', color: '#f59e0b' },
          };
          const mapped: Deck[] = topics.map((t) => {
            const meta = SUBJECT_META[String(t.subject)] ?? {
              icon: 'Layers',
              color: '#6366f1',
            };
            return {
              slug: String(t.id),
              topicId: t.id,
              title: t.title,
              description: t.desc ?? '',
              icon: meta.icon,
              color: meta.color,
              cards: (t.cards ?? []).map((c) => ({
                id: c.id,
                front: c.front,
                back: c.back,
                hint: c.hint,
              })),
            };
          });
          // Hide topics with no cards
          setDecks(mapped.filter((d) => d.cards.length > 0));
        })
        .catch(() => {
          if (!cancelled) setDecks([]);
        })
        .finally(() => {
          if (!cancelled) setLoading(false);
        });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      <PageHead
        icon="Layers"
        title="Flash kartalar"
        desc="Kartalar bilan o‘yin tarzida o‘rgan — combo to‘pla, XP va tanga yut!"
      />

      {loading ? (
        <div className="rounded-2xl border border-ink-700 bg-ink-800 p-8 text-center text-sm text-white/55">
          Kartochkalar yuklanmoqda...
        </div>
      ) : decks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-ink-700 bg-ink-800/50 p-8 text-center text-sm text-white/55">
          Hozircha hech qanday flashkarta yo&apos;q.
        </div>
      ) : (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {decks.map((d, i) => (
          <motion.button
            key={d.slug}
            type="button"
            onClick={() => onPick(d)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.35 }}
            className="hover-lift group flex flex-col rounded-2xl border border-ink-700 bg-ink-800 p-5 text-left transition-colors hover:border-brand-500"
          >
            <div className="flex items-center justify-between">
              <span
                className="flex h-12 w-12 items-center justify-center rounded-xl"
                style={{ background: `${d.color}22`, color: d.color }}
              >
                <Icon name={d.icon} size={22} />
              </span>
              <span
                className="rounded-full px-2.5 py-1 text-xs font-semibold"
                style={{ background: `${d.color}1f`, color: d.color }}
              >
                {d.cards.length} ta karta
              </span>
            </div>

            <h3 className="mt-4 text-base font-bold text-white">{d.title}</h3>
            <p className="mt-1.5 flex-1 text-sm text-white/55">{d.description}</p>

            <div className="mt-5 flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs text-white/45">
                <Icon name="Heart" size={13} /> 3 jon
              </span>
              <span
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold shadow-md transition-transform group-hover:translate-x-0.5"
                style={{
                  background: d.color,
                  color: '#ffffff',
                  textShadow: '0 1px 3px rgba(0,0,0,0.5)',
                }}
              >
                <span style={{ color: '#ffffff' }}>Boshlash</span>
                <Icon name="ArrowRight" size={14} color="#ffffff" />
              </span>
            </div>
          </motion.button>
        ))}
      </div>
      )}
    </div>
  );
}

/* ---------- FlipCard ---------- */
function FlipCard({
  card,
  flipped,
  onFlip,
  pulse,
  shake,
  deckColor,
}: {
  card: FlashCard;
  flipped: boolean;
  onFlip: () => void;
  pulse: 'success' | 'error' | null;
  shake: boolean;
  deckColor: string;
}) {
  return (
    <div className="relative" style={{ perspective: 1400 }}>
      <motion.div
        className={`relative h-72 w-full cursor-pointer select-none rounded-3xl ${
          pulse === 'success' ? 'glow-success' : pulse === 'error' ? 'glow-error' : ''
        } ${shake ? 'anim-shake' : ''}`}
        onClick={onFlip}
        style={{ transformStyle: 'preserve-3d' }}
        animate={{ rotateY: flipped ? 180 : 0 }}
        transition={{ duration: 0.55, type: 'spring', stiffness: 120, damping: 16 }}
      >
        {/* Front */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-brand-200 bg-brand-50 px-6 text-center"
          style={{ backfaceVisibility: 'hidden', WebkitBackfaceVisibility: 'hidden' }}
        >
          <span
            className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider"
            style={{ background: `${deckColor}1f`, color: deckColor }}
          >
            Savol
          </span>
          <p className="text-3xl font-extrabold text-brand-900 sm:text-4xl">
            {card.front}
          </p>
          {card.hint && (
            <p className="mt-3 text-xs italic text-brand-600/70">{card.hint}</p>
          )}
          <span className="absolute bottom-4 flex items-center gap-1.5 text-xs font-semibold text-brand-600">
            <Icon name="RefreshCw" size={12} /> Bosib aylantiring
          </span>
        </div>

        {/* Back */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center rounded-3xl border-2 border-brand-600 bg-brand-600/10 px-6 text-center"
          style={{
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        >
          <span className="absolute top-4 left-4 inline-flex items-center gap-1.5 rounded-full bg-brand-600 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
            Javob
          </span>
          <p className="text-3xl font-extrabold text-brand-900 sm:text-4xl">
            {card.back}
          </p>
          <span className="absolute bottom-4 text-xs font-semibold text-brand-700">
            Bildingizmi? Pastdagi tugmani bosing
          </span>
        </div>
      </motion.div>
    </div>
  );
}

/* ---------- Studying screen (Phase 2) ---------- */
function StudyingScreen({
  deck,
  onFinish,
  onExit,
}: {
  deck: Deck;
  onFinish: (outcomes: CardOutcome[], maxCombo: number, hearts: number, elapsed: number) => void;
  onExit: () => void;
}) {
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [outcomes, setOutcomes] = useState<CardOutcome[]>([]);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [hearts, setHearts] = useState(INITIAL_HEARTS);
  const [pulse, setPulse] = useState<'success' | 'error' | null>(null);
  const [shake, setShake] = useState(false);
  const [floatXp, setFloatXp] = useState<{ id: number; amount: number } | null>(null);
  const [comboToast, setComboToast] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const lockRef = useRef(false);

  const total = deck.cards.length;
  const card = deck.cards[idx];
  const progress = ((idx) / total) * 100;

  /* Timer */
  useEffect(() => {
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const advance = useCallback(
    (currentOutcomes: CardOutcome[], currentCombo: number, currentMax: number, currentHearts: number) => {
      if (idx + 1 >= total || currentHearts <= 0) {
        onFinish(currentOutcomes, currentMax, currentHearts, elapsed);
        return;
      }
      setIdx((i) => i + 1);
      setFlipped(false);
      setPulse(null);
      lockRef.current = false;
      void currentCombo;
    },
    [idx, total, onFinish, elapsed],
  );

  const handleKnown = useCallback(() => {
    if (!flipped || lockRef.current) return;
    lockRef.current = true;

    const next: CardOutcome[] = [...outcomes, { index: idx, correct: true }];
    const nextCombo = combo + 1;
    const nextMax = Math.max(maxCombo, nextCombo);

    setOutcomes(next);
    setCombo(nextCombo);
    setMaxCombo(nextMax);
    setPulse('success');

    const xpGain = 3 + (nextCombo >= 3 ? 2 : 0);
    setFloatXp({ id: Date.now(), amount: xpGain });
    setTimeout(() => setFloatXp(null), 750);

    if (nextCombo === 3 || nextCombo === 5 || nextCombo === 10) {
      setComboToast(`Combo x${nextCombo}!`);
      setTimeout(() => setComboToast(null), 1200);
    }

    setTimeout(() => advance(next, nextCombo, nextMax, hearts), 520);
  }, [flipped, outcomes, idx, combo, maxCombo, hearts, advance]);

  const handleUnknown = useCallback(() => {
    if (!flipped || lockRef.current) return;
    lockRef.current = true;

    const next: CardOutcome[] = [...outcomes, { index: idx, correct: false }];
    const newHearts = hearts - 1;

    setOutcomes(next);
    setCombo(0);
    setHearts(newHearts);
    setPulse('error');
    setShake(true);
    setTimeout(() => setShake(false), 420);

    setTimeout(() => advance(next, 0, maxCombo, newHearts), 540);
  }, [flipped, outcomes, idx, hearts, maxCombo, advance]);

  /* Keyboard shortcuts:
     Not flipped:  → = Bilaman (handleKnown)   ← = Bilmayman (flip)   Space = flip
     Flipped:      Space or → or Enter = Tushundim → keyingisi (handleUnknown)
     Esc = orqaga
  */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onExit();
        return;
      }
      if (!flipped) {
        if (e.key === 'ArrowRight' || e.key === 'r') {
          e.preventDefault();
          handleKnown();
        } else if (e.key === 'ArrowLeft' || e.key === 'l' || e.key === ' ') {
          e.preventDefault();
          setFlipped(true);
        }
      } else {
        if (e.key === ' ' || e.key === 'ArrowRight' || e.key === 'Enter') {
          e.preventDefault();
          handleUnknown();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [flipped, handleKnown, handleUnknown, onExit]);

  return (
    <div className="mx-auto max-w-2xl">
      {/* Top header */}
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={onExit}
          className="press-scale flex h-10 w-10 items-center justify-center rounded-lg border border-ink-700 bg-ink-800 text-white/70 transition-colors hover:text-white"
          aria-label="Orqaga"
        >
          <Icon name="ChevronLeft" size={18} />
        </button>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 text-xs font-semibold text-white/60">
            <span className="truncate">{deck.title}</span>
            <span className="shrink-0">
              {idx + 1} / {total}
            </span>
          </div>
          <Progress
            value={progress}
            color={deck.color}
            track="bg-ink-700"
            className="mt-2 smooth-bar"
          />
        </div>
      </div>

      {/* Status row */}
      <div className="mb-5 flex flex-wrap items-center gap-2">
        <AnimatePresence>
          {combo >= 2 && (
            <motion.span
              key="combo"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.7, opacity: 0 }}
              className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/15 px-3 py-1 text-xs font-bold text-amber-300"
            >
              <span aria-hidden>🔥</span> Combo x{combo}
            </motion.span>
          )}
        </AnimatePresence>

        <span className="inline-flex items-center gap-1 rounded-full bg-rose-500/10 px-3 py-1 text-xs font-bold text-rose-300">
          {Array.from({ length: INITIAL_HEARTS }).map((_, i) => (
            <Icon
              key={i}
              name={i < hearts ? 'Heart' : 'HeartOff'}
              size={13}
              className={i < hearts ? 'text-rose-400' : 'text-white/25'}
            />
          ))}
        </span>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-ink-800 border border-ink-700 px-3 py-1 text-xs font-semibold text-white/70">
          <Icon name="Clock" size={12} /> {formatTime(elapsed)}
        </span>
      </div>

      {/* Card area */}
      <div className="relative">
        {/* Floating +XP chip */}
        <AnimatePresence>
          {floatXp && (
            <div
              key={floatXp.id}
              className="anim-fly-up pointer-events-none absolute left-1/2 top-2 z-20 -translate-x-1/2"
            >
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500 px-3 py-1 text-sm font-bold text-white shadow-lg">
                <Icon name="Zap" size={13} /> +{floatXp.amount} XP
              </span>
            </div>
          )}
        </AnimatePresence>

        {/* Combo toast */}
        <AnimatePresence>
          {comboToast && (
            <motion.div
              key={comboToast}
              initial={{ y: -20, opacity: 0, scale: 0.8 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -10, opacity: 0 }}
              className="pointer-events-none absolute left-1/2 -top-3 z-20 -translate-x-1/2"
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-1.5 text-sm font-extrabold text-amber-950 shadow-lg">
                <Icon name="Sparkles" size={14} /> {comboToast}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={idx}
            initial={{ x: 60, opacity: 0, scale: 0.95 }}
            animate={{ x: 0, opacity: 1, scale: 1 }}
            exit={{ x: -60, opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <FlipCard
              card={card}
              flipped={flipped}
              onFlip={() => setFlipped((f) => !f)}
              pulse={pulse}
              shake={shake}
              deckColor={deck.color}
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Action buttons — front: [Bilaman | Bilmayman]  back: [Tushundim] */}
      <div className="mt-6">
        {!flipped ? (
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              type="button"
              onClick={handleKnown}
              aria-label="Bilaman"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              className="press-scale group relative flex h-20 cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-3xl font-extrabold shadow-2xl transition-all duration-200"
              style={{
                background:
                  'linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)',
                boxShadow:
                  '0 18px 40px -12px rgba(16,185,129,0.55), inset 0 1px 0 rgba(255,255,255,0.35)',
                color: '#ffffff',
              }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,255,255,0.35),transparent_55%)]" />
              <span
                className="relative z-10 flex items-center gap-2.5"
                style={{ color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.25)' }}
              >
                <Icon name="CheckCircle2" size={24} color="#ffffff" />
                <span className="text-base tracking-wide" style={{ color: '#ffffff' }}>
                  Bilaman
                </span>
              </span>
            </motion.button>

            <motion.button
              type="button"
              onClick={() => setFlipped(true)}
              aria-label="Bilmayman — javobni ko‘rish"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.02 }}
              className="press-scale group relative flex h-20 cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-3xl font-extrabold shadow-2xl transition-all duration-200"
              style={{
                background:
                  'linear-gradient(135deg, #f43f5e 0%, #e11d48 50%, #be123c 100%)',
                boxShadow:
                  '0 18px 40px -12px rgba(244,63,94,0.55), inset 0 1px 0 rgba(255,255,255,0.35)',
                color: '#ffffff',
              }}
            >
              <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,255,255,0.35),transparent_55%)]" />
              <span
                className="relative z-10 flex items-center gap-2.5"
                style={{ color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.25)' }}
              >
                <Icon name="XCircle" size={24} color="#ffffff" />
                <span className="text-base tracking-wide" style={{ color: '#ffffff' }}>
                  Bilmayman
                </span>
              </span>
            </motion.button>
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={handleUnknown}
            aria-label="Tushundim — keyingisi"
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: 1.015 }}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="press-scale group relative flex h-20 w-full cursor-pointer items-center justify-center gap-3 overflow-hidden rounded-3xl font-extrabold shadow-2xl transition-all duration-200"
            style={{
              background:
                'linear-gradient(135deg, #6366f1 0%, #4f46e5 50%, #4338ca 100%)',
              boxShadow:
                '0 20px 50px -12px rgba(99, 102, 241, 0.55), inset 0 1px 0 rgba(255,255,255,0.35)',
              color: '#ffffff',
            }}
          >
            <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_50%_0%,rgba(255,255,255,0.35),transparent_55%)]" />
            <span aria-hidden className="pointer-events-none absolute -bottom-3 left-1/2 h-12 w-1/2 -translate-x-1/2 rounded-full bg-white/10 blur-xl" />
            <span
              className="relative z-10 flex items-center gap-3"
              style={{ color: '#ffffff', textShadow: '0 2px 6px rgba(0,0,0,0.25)' }}
            >
              <Icon name="Sparkles" size={26} color="#ffffff" />
              <span className="text-lg tracking-wide" style={{ color: '#ffffff' }}>
                Tushundim — Keyingisi
              </span>
              <Icon name="ArrowRight" size={22} color="#ffffff" />
            </span>
          </motion.button>
        )}
      </div>

      <p className="mt-3 text-center text-[11px] text-white/40">
        <kbd className="rounded bg-ink-800 px-1.5 py-0.5 text-white/70">Space</kbd> aylantirish · <kbd className="rounded bg-ink-800 px-1.5 py-0.5 text-white/70">→</kbd> Bilaman · <kbd className="rounded bg-ink-800 px-1.5 py-0.5 text-white/70">←</kbd> Bilmayman · <kbd className="rounded bg-ink-800 px-1.5 py-0.5 text-white/70">Esc</kbd> orqaga
      </p>
    </div>
  );
}

/* ---------- Result screen (Phase 3) ---------- */
function ResultScreen({
  deck,
  outcomes,
  maxCombo,
  elapsed,
  xp,
  coins,
  perfect,
  onReview,
  onRetry,
  onAnotherDeck,
}: {
  deck: Deck;
  outcomes: CardOutcome[];
  maxCombo: number;
  elapsed: number;
  xp: number;
  coins: number;
  perfect: boolean;
  onReview: () => void;
  onRetry: () => void;
  onAnotherDeck: () => void;
}) {
  const correct = outcomes.filter((o) => o.correct).length;
  const total = deck.cards.length;
  const hasMistakes = outcomes.some((o) => !o.correct);

  const title = perfect
    ? 'Bayram!'
    : correct >= Math.ceil(total * 0.6)
    ? 'Yaxshi natija'
    : 'Yana urinib ko‘r';
  const titleIcon = perfect ? 'Trophy' : correct >= total * 0.6 ? 'Sparkles' : 'RotateCcw';

  return (
    <div className="mx-auto max-w-xl">
      {perfect && <Confetti count={60} />}
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="rounded-2xl border border-ink-700 bg-ink-800 p-7"
      >
        <div className="flex flex-col items-center text-center">
          <span
            className={`flex h-16 w-16 items-center justify-center rounded-2xl ${
              perfect ? 'bg-amber-400 text-amber-950' : 'bg-brand-600 text-white'
            }`}
          >
            <Icon name={titleIcon} size={30} />
          </span>
          <h2 className="mt-4 text-2xl font-extrabold text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1 text-sm text-white/55">{deck.title}</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <ResultTile
            icon="CheckCircle2"
            color="#16a34a"
            label="To‘g‘ri"
            value={`${correct}/${total}`}
          />
          <ResultTile
            icon="Flame"
            color="#f59e0b"
            label="Eng yaxshi combo"
            value={maxCombo}
          />
          <ResultTile icon="Zap" color="#1e3a8a" label="XP olingan" value={`+${xp}`} />
          <ResultTile icon="Coins" color="#fbbf24" label="Tanga" value={`+${coins}`} />
        </div>

        <p className="mt-4 text-center text-xs text-white/45">
          Vaqt: {formatTime(elapsed)}
        </p>

        <div className="mt-6 grid gap-2 sm:grid-cols-3">
          <Button
            variant="dark"
            size="md"
            icon="Eye"
            onClick={onReview}
            disabled={!hasMistakes}
            block
          >
            Xatolarni ko‘rish
          </Button>
          <Button variant="primary" size="md" icon="RotateCcw" onClick={onRetry} block>
            Qayta urinish
          </Button>
          <Button variant="dark" size="md" icon="Layers" onClick={onAnotherDeck} block>
            Boshqa deck
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

function ResultTile({
  icon,
  color,
  label,
  value,
}: {
  icon: string;
  color: string;
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-ink-700 bg-ink-900/40 p-3 text-center">
      <span
        className="mx-auto flex h-9 w-9 items-center justify-center rounded-lg"
        style={{ background: `${color}22`, color }}
      >
        <Icon name={icon} size={16} />
      </span>
      <div className="mt-2 text-xl font-black text-white">{value}</div>
      <div className="text-[11px] font-semibold text-white/50">{label}</div>
    </div>
  );
}

/* ---------- Review screen (Phase 4) ---------- */
function ReviewScreen({
  deck,
  outcomes,
  onBack,
  onAnotherDeck,
}: {
  deck: Deck;
  outcomes: CardOutcome[];
  onBack: () => void;
  onAnotherDeck: () => void;
}) {
  const mistakes = outcomes.filter((o) => !o.correct);
  const [open, setOpen] = useState<number | null>(mistakes[0]?.index ?? null);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-5 flex items-center gap-3">
        <button
          onClick={onBack}
          className="press-scale flex h-10 w-10 items-center justify-center rounded-lg border border-ink-700 bg-ink-800 text-white/70 transition-colors hover:text-white"
          aria-label="Orqaga"
        >
          <Icon name="ChevronLeft" size={18} />
        </button>
        <div>
          <h2 className="text-lg font-extrabold text-white">Xatolarni ko‘rib chiqing</h2>
          <p className="text-xs text-white/50">{mistakes.length} ta karta noto‘g‘ri javob</p>
        </div>
      </div>

      <div className="space-y-3">
        {mistakes.map((m) => {
          const card = deck.cards[m.index];
          const isOpen = open === m.index;
          return (
            <div
              key={m.index}
              className="rounded-xl border border-rose-500/30 bg-rose-500/5 overflow-hidden"
            >
              <button
                onClick={() => setOpen(isOpen ? null : m.index)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-500/15 text-rose-300">
                    <Icon name="XCircle" size={16} />
                  </span>
                  <span className="truncate font-semibold text-white">
                    {card.front}
                  </span>
                </div>
                <Icon
                  name="ChevronDown"
                  size={16}
                  className={`shrink-0 text-white/50 transition-transform ${
                    isOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>
              <AnimatePresence initial={false}>
                {isOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22 }}
                    className="border-t border-rose-500/20 px-4 py-3 text-sm"
                  >
                    <div className="flex items-start gap-2 text-white/70">
                      <Icon name="ArrowRight" size={14} className="mt-0.5 text-emerald-400" />
                      <div>
                        <div className="font-bold text-white">{card.back}</div>
                        {card.hint && (
                          <div className="mt-1 text-xs italic text-white/50">
                            {card.hint}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-2">
        <Button variant="primary" icon="RotateCcw" onClick={onBack} block>
          Natijaga qaytish
        </Button>
        <Button variant="dark" icon="Layers" onClick={onAnotherDeck} block>
          Boshqa deck
        </Button>
      </div>
    </div>
  );
}

/* ============================================================
   Main page
============================================================ */
export function FlashCards() {
  const { user, addXp, patchUser } = useApp();
  const [phase, setPhase] = useState<Phase>('deck-pick');
  const [deck, setDeck] = useState<Deck | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [outcomes, setOutcomes] = useState<CardOutcome[]>([]);
  const [maxCombo, setMaxCombo] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const rewardedRef = useRef<string | null>(null);

  // Optional deep-link params: ?deck=<topicId>&next=<encoded URL>
  const urlParams = useMemo(() => {
    if (typeof window === 'undefined') return { deckId: null as string | null, next: null as string | null };
    const p = new URLSearchParams(window.location.search);
    return { deckId: p.get('deck'), next: p.get('next') };
  }, []);

  // Auto-start a specific deck when ?deck=<topicId> is present
  useEffect(() => {
    if (!urlParams.deckId || deck || phase !== 'deck-pick') return;
    let cancelled = false;
    import('../../lib/api/flashcards').then(({ list }) => {
      list()
        .then((topics) => {
          if (cancelled) return;
          const found = topics.find((t) => String(t.id) === urlParams.deckId);
          if (!found) return;
          const SUBJECT_META: Record<string, { icon: string; color: string }> = {
            matematika: { icon: 'Calculator', color: '#6366f1' },
            'ona-tili': { icon: 'BookText', color: '#0ea5e9' },
            adabiyot: { icon: 'Feather', color: '#ec4899' },
            tarix: { icon: 'Landmark', color: '#f59e0b' },
          };
          const meta = SUBJECT_META[String(found.subject)] ?? { icon: 'Layers', color: '#6366f1' };
          const d: Deck = {
            slug: String(found.id),
            topicId: found.id,
            title: found.title,
            description: found.desc ?? '',
            icon: meta.icon,
            color: meta.color,
            cards: (found.cards ?? []).map((c) => ({ id: c.id, front: c.front, back: c.back, hint: c.hint })),
          };
          if (d.cards.length > 0) {
            setDeck(d);
            setSessionKey((k) => k + 1);
            setPhase('studying');
          }
        })
        .catch(() => {});
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlParams.deckId]);

  const correct = useMemo(
    () => outcomes.filter((o) => o.correct).length,
    [outcomes],
  );
  const totalCards = deck?.cards.length ?? 0;
  const perfect = totalCards > 0 && correct === totalCards;

  const xpReward = useMemo(
    () => correct * 3 + maxCombo * 2 + (perfect ? 25 : 0),
    [correct, maxCombo, perfect],
  );
  const coinsReward = useMemo(() => Math.floor(correct / 2), [correct]);

  const startDeck = (d: Deck) => {
    setDeck(d);
    setOutcomes([]);
    setMaxCombo(0);
    setElapsed(0);
    setSessionKey((k) => k + 1);
    setPhase('studying');
    rewardedRef.current = null;
  };

  const finishStudying = (
    finalOutcomes: CardOutcome[],
    finalMaxCombo: number,
    _hearts: number,
    finalElapsed: number,
  ) => {
    setOutcomes(finalOutcomes);
    setMaxCombo(finalMaxCombo);
    setElapsed(finalElapsed);
    setPhase('result');
    void _hearts;

    // Persist to backend (best-effort, non-blocking)
    if (deck?.topicId) {
      const known: (number | string)[] = [];
      const unknown: (number | string)[] = [];
      finalOutcomes.forEach((o) => {
        const cardId = deck.cards[o.index]?.id;
        if (cardId == null) return;
        (o.correct ? known : unknown).push(cardId);
      });
      import('../../lib/api/flashcards')
        .then(({ finish }) =>
          finish({
            topic_id: deck.topicId!,
            known_card_ids: known,
            unknown_card_ids: unknown,
          }),
        )
        .catch((err) => {
          console.warn('FlashCards finish save failed:', err);
        });
    }
  };

  /* Award XP + coins once per session when result mounts */
  useEffect(() => {
    if (phase !== 'result' || !deck) return;
    const key = `${deck.slug}-${sessionKey}`;
    if (rewardedRef.current === key) return;
    rewardedRef.current = key;

    if (xpReward > 0) addXp(xpReward, 'Flash kartalar');
    if (coinsReward > 0)
      patchUser({ coins: (user?.coins ?? 0) + coinsReward });
  }, [phase, deck, sessionKey, xpReward, coinsReward, addXp, patchUser, user?.coins]);

  /* Render */
  if (phase === 'deck-pick' || !deck) {
    return <DeckPicker onPick={startDeck} />;
  }

  if (phase === 'studying') {
    return (
      <StudyingScreen
        key={sessionKey}
        deck={deck}
        onFinish={finishStudying}
        onExit={() => setPhase('deck-pick')}
      />
    );
  }

  if (phase === 'result') {
    return (
      <ResultScreen
        deck={deck}
        outcomes={outcomes}
        maxCombo={maxCombo}
        elapsed={elapsed}
        xp={xpReward}
        coins={coinsReward}
        perfect={perfect}
        onReview={() => setPhase('review')}
        onRetry={() => startDeck(deck)}
        onAnotherDeck={() => setPhase('deck-pick')}
      />
    );
  }

  /* review */
  return (
    <ReviewScreen
      deck={deck}
      outcomes={outcomes}
      onBack={() => setPhase('result')}
      onAnotherDeck={() => setPhase('deck-pick')}
    />
  );
}

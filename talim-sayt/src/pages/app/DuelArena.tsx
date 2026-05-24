import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { Button, Avatar } from '../../components/ui';
import { PageHead } from './_shared';
import { Confetti } from '../../components/Confetti';
import { CountUp } from '../../components/motion/CountUp';
import * as friendsApi from '../../lib/api/friends';
import { COURSE_SUBJECTS } from '../../lib/courses';

type Friend = {
  id: string;
  name: string;
  avatarColor: string;
  level: number;
  xp: number;
  online?: boolean;
};

function adaptFriend(f: friendsApi.Friend): Friend {
  return {
    id: String(f.id),
    name: f.name,
    avatarColor: f.avatar_color ?? '#a997ff',
    level: f.level,
    xp: f.xp,
    online: f.online,
  };
}

/* =================================================================
 * DuelArena — to'liq qayta yozilgan 1vs1 battle
 * URL: /app/duel
 *
 * Phaselar: lobby → countdown → playing → result → review
 * ================================================================= */

type Phase = 'lobby' | 'countdown' | 'playing' | 'result' | 'review';

type SubjectKey = 'matematika' | 'ona-tili' | 'adabiyot' | 'tarix';

interface BaseQ {
  q: string;
  type: 'choice' | 'fill';
  options?: string[];
  correct: number | string;
  explanation: string;
}

interface AnswerLog {
  qIndex: number;
  picked: string | null;
  correctValue: string;
  isCorrect: boolean;
}

/* ---------- Subject chip data ---------- */
const SUBJECTS = COURSE_SUBJECTS.filter((s) =>
  ['matematika', 'ona-tili', 'adabiyot', 'tarix'].includes(s.id),
) as Array<{ id: SubjectKey; name: string; icon: string; color: string }>;

const GRADES = [5, 6, 7, 8, 9, 10, 11] as const;

/* ---------- Mock savollar ---------- */
const MATH_QUESTIONS: BaseQ[] = [
  {
    q: '15 + 27 = ?',
    type: 'choice',
    options: ['32', '42', '35', '40'],
    correct: 1,
    explanation: '15 + 27 = 42. Avval birliklarni qo‘shamiz: 5+7=12, keyin 10+10+10=30, jami 42.',
  },
  {
    q: '9 × 8 ifodaning qiymati?',
    type: 'fill',
    correct: '72',
    explanation: 'Ko‘paytirish jadvalidan: 9 × 8 = 72.',
  },
  {
    q: '144 ning kvadrat ildizi?',
    type: 'choice',
    options: ['10', '11', '12', '14'],
    correct: 2,
    explanation: '12 × 12 = 144, demak √144 = 12.',
  },
  {
    q: 'x + 7 = 15 bo‘lsa, x = ?',
    type: 'fill',
    correct: '8',
    explanation: 'x = 15 − 7 = 8.',
  },
  {
    q: 'Aylananing yuzini topish formulasi:',
    type: 'choice',
    options: ['2πr', 'πr²', 'πd', '4πr²'],
    correct: 1,
    explanation: 'Aylana yuzasi S = π · r². 2πr — bu uzunlik.',
  },
  {
    q: '25% dan 200 ning qiymati?',
    type: 'fill',
    correct: '50',
    explanation: '200 ning 25% = 200 × 0.25 = 50.',
  },
  {
    q: 'Quyidagilardan qaysi biri tub son?',
    type: 'choice',
    options: ['15', '21', '17', '25'],
    correct: 2,
    explanation: '17 — tub son, faqat 1 va o‘ziga bo‘linadi. Boshqalari murakkab.',
  },
  {
    q: '3³ = ?',
    type: 'fill',
    correct: '27',
    explanation: '3 × 3 × 3 = 27.',
  },
  {
    q: 'To‘g‘ri burchakli uchburchakda gipotenuza topish:',
    type: 'choice',
    options: ['a + b', 'a² + b²', '√(a² + b²)', 'a · b / 2'],
    correct: 2,
    explanation: 'Pifagor teoremasi: c = √(a² + b²).',
  },
  {
    q: '5! (5 faktorial) qiymati?',
    type: 'fill',
    correct: '120',
    explanation: '5! = 1 · 2 · 3 · 4 · 5 = 120.',
  },
];

const LANG_QUESTIONS: BaseQ[] = [
  {
    q: '«Yugurmoq» so‘zining so‘z turkumi?',
    type: 'choice',
    options: ['Fe’l', 'Sifat', 'Ot', 'Olmosh'],
    correct: 0,
    explanation: '«Yugurmoq» — harakat bildirgani uchun fe’l.',
  },
  {
    q: '«Tez» so‘zi qaysi so‘z turkumiga kiradi?',
    type: 'fill',
    correct: 'ravish',
    explanation: '«Tez» — fe’lga belgi beradi, demak ravish.',
  },
  {
    q: '«O‘tkan kunlar» romani muallifi?',
    type: 'choice',
    options: ['Cho‘lpon', 'A. Qodiriy', 'O. Yoqubov', 'O‘. Hoshimov'],
    correct: 1,
    explanation: 'Abdulla Qodiriy — «O‘tkan kunlar» romanining muallifi (1925).',
  },
  {
    q: '«Kitob» so‘zining ko‘plik shakli?',
    type: 'fill',
    correct: 'kitoblar',
    explanation: '-lar qo‘shimchasi orqali ko‘plik yasaladi: kitob + lar.',
  },
  {
    q: '«Bahor» so‘ziga qarama-qarshi ma’nodagi so‘z (antonim)?',
    type: 'choice',
    options: ['Yoz', 'Kuz', 'Qish', 'Tong'],
    correct: 2,
    explanation: 'Bahor (issiq) ↔ Qish (sovuq) — antonim juftligi.',
  },
  {
    q: 'Cho‘lpon qaysi taxallus bilan ijod qilgan shoir?',
    type: 'fill',
    correct: 'cho‘lpon',
    explanation: 'Abdulhamid Sulaymon o‘g‘li adabiyotda Cho‘lpon taxallusi bilan tanilgan.',
  },
  {
    q: 'Qaysi gap mukammal undov gap?',
    type: 'choice',
    options: ['Bahor keldi.', 'Qanday go‘zal!', 'U keldimi?', 'Borib kel.'],
    correct: 1,
    explanation: 'Undov belgisi (!) bilan tugagan his-tuyg‘u ifoda gapi — undov gap.',
  },
  {
    q: '«Maktabga» so‘zidagi -ga qo‘shimchasi qaysi kelishik?',
    type: 'choice',
    options: ['Bosh', 'Tushum', 'Jo‘nalish', 'O‘rin'],
    correct: 2,
    explanation: '-ga, -ka, -qa — jo‘nalish kelishigi qo‘shimchalari.',
  },
  {
    q: 'A. Navoiyning «Xamsa» asari nechta dostondan iborat?',
    type: 'fill',
    correct: '5',
    explanation: 'Xamsa — 5 doston: Hayrat ul-Abror, Farhod va Shirin, Layli va Majnun, Sab’ai Sayyor, Saddi Iskandariy.',
  },
  {
    q: '«Boburnoma» — qanday asar?',
    type: 'choice',
    options: ['Doston', 'Memuar', 'Roman', 'Drama'],
    correct: 1,
    explanation: '«Boburnoma» — Zahiriddin Muhammad Bobur yozgan tarixiy-memuar asar.',
  },
];

const HISTORY_QUESTIONS: BaseQ[] = [
  {
    q: 'Amir Temur saltanati poytaxti?',
    type: 'choice',
    options: ['Buxoro', 'Samarqand', 'Toshkent', 'Hirot'],
    correct: 1,
    explanation: 'Amir Temur 1370-yilda Samarqandni o‘z saltanati poytaxti qilib tayinlagan.',
  },
  {
    q: 'O‘zbekiston mustaqilligi qaysi yilda e’lon qilingan?',
    type: 'fill',
    correct: '1991',
    explanation: '1991-yil 31-avgustda O‘zbekiston Respublikasi mustaqilligi e’lon qilingan.',
  },
  {
    q: 'Mirzo Saydalixon qaysi sohada mashhur?',
    type: 'choice',
    options: ['Tibbiyot', 'Astronomiya', 'Geografiya', 'Falsafa'],
    correct: 1,
    explanation: 'Mirzo Saydalixon mashhur astronom, Samarqandda rasadxona qurgan.',
  },
  {
    q: 'Buyuk Ipak yo‘li qaysi qit’alarni bog‘lagan?',
    type: 'choice',
    options: ['Osiyo va Afrika', 'Osiyo va Yevropa', 'Yevropa va Amerika', 'Afrika va Yevropa'],
    correct: 1,
    explanation: 'Buyuk Ipak yo‘li Sharq (Osiyo) bilan G‘arb (Yevropa) o‘rtasidagi savdo yo‘li edi.',
  },
  {
    q: 'Sohibqiron unvoni kimga berilgan?',
    type: 'fill',
    correct: 'amir temur',
    explanation: '«Sohibqiron» — «baxtli yulduz egasi» ma’nosida Amir Temurga berilgan unvon.',
  },
  {
    q: 'Ikkinchi jahon urushi qaysi yillarda bo‘lgan?',
    type: 'choice',
    options: ['1914-1918', '1939-1945', '1941-1945', '1945-1949'],
    correct: 1,
    explanation: 'Ikkinchi jahon urushi 1939-1945 yillarda davom etgan jahon miqyosidagi urush.',
  },
  {
    q: 'Bobur «Boburnoma» asarini qaysi tilda yozgan?',
    type: 'choice',
    options: ['Fors', 'Arab', 'Chig‘atoy turkiy', 'Hind'],
    correct: 2,
    explanation: 'Bobur asarini chig‘atoy turkiy (eski o‘zbek) tilida yozgan.',
  },
  {
    q: 'Buxoro amirligi nechanchi asrda tashkil topgan?',
    type: 'choice',
    options: ['XVI', 'XVII', 'XVIII', 'XIX'],
    correct: 2,
    explanation: 'Buxoro amirligi 1747-yilda — XVIII asrda Manghit sulolasi tomonidan tashkil topgan.',
  },
  {
    q: 'Konstitutsiya kuni nishonlanadigan sana?',
    type: 'fill',
    correct: '8 dekabr',
    explanation: '1992-yil 8-dekabrda O‘zbekiston Respublikasi Konstitutsiyasi qabul qilingan.',
  },
  {
    q: 'Ibn Sino qaysi mashhur asari bilan tanilgan?',
    type: 'choice',
    options: ['Qonun fi-t-tib', 'Devon', 'Boburnoma', 'Xamsa'],
    correct: 0,
    explanation: '«Qonun fi-t-tib» (Tib qonunlari) — Ibn Sinoning tibbiyotga oid asosiy asari.',
  },
];

function getQuestionPool(subject: SubjectKey): BaseQ[] {
  if (subject === 'matematika') return MATH_QUESTIONS;
  if (subject === 'ona-tili' || subject === 'adabiyot') return LANG_QUESTIONS;
  return HISTORY_QUESTIONS;
}

function correctAsText(q: BaseQ): string {
  if (q.type === 'choice' && q.options) {
    return q.options[q.correct as number];
  }
  return String(q.correct);
}

function normalizeFill(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, ' ');
}

function isAnswerCorrect(q: BaseQ, picked: string | null): boolean {
  if (picked === null) return false;
  if (q.type === 'choice') return picked === correctAsText(q);
  return normalizeFill(picked) === normalizeFill(String(q.correct));
}

function analyze(answers: AnswerLog[]): string {
  const correct = answers.filter((a) => a.isCorrect).length;
  if (correct >= 8) return 'Sen bu fanda kuchlisan! Davom et 🔥';
  if (correct >= 5) return 'Yaxshi natija. Yana mashq qiling.';
  return 'Bu mavzuni qaytadan ko‘rib chiqing — orqasidan yetib olasiz.';
}

/* =================================================================
 * Component
 * ================================================================= */
export function DuelArena() {
  const { user, addXp, recordAnswer, patchUser } = useApp();

  /* ---- phase machine ---- */
  const [phase, setPhase] = useState<Phase>('lobby');

  /* ---- opponents (from friends API) ---- */
  const [opponentPool, setOpponentPool] = useState<Friend[]>([]);
  const [, setLoadingOpponents] = useState(true);
  useEffect(() => {
    let cancelled = false;
    setLoadingOpponents(true);
    friendsApi
      .list()
      .then((list) => {
        if (cancelled) return;
        setOpponentPool(list.slice(0, 5).map(adaptFriend));
      })
      .catch(() => {
        if (!cancelled) setOpponentPool([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingOpponents(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---- lobby selection ---- */
  const [opponent, setOpponent] = useState<Friend | null>(null);
  const [subject, setSubject] = useState<SubjectKey | null>(null);
  const [grade, setGrade] = useState<number | null>(null);

  /* ---- countdown ---- */
  const [count, setCount] = useState(3);

  /* ---- playing state ---- */
  const TOTAL_TIME = 300; // 5 daqiqa
  const [timeLeft, setTimeLeft] = useState(TOTAL_TIME);
  const [idx, setIdx] = useState(0);
  const [myScore, setMyScore] = useState(0);
  const [oppScore, setOppScore] = useState(0);
  const [oppProgress, setOppProgress] = useState(0); // 0..10 — raqib qaysi savolda
  const [picked, setPicked] = useState<string | null>(null);
  const [fillValue, setFillValue] = useState('');
  const [feedback, setFeedback] = useState<'none' | 'correct' | 'wrong'>('none');
  const [floatChip, setFloatChip] = useState<{ key: number; text: string } | null>(null);
  const [answers, setAnswers] = useState<AnswerLog[]>([]);
  const lockRef = useRef(false);
  const finalizedRef = useRef(false);

  /* ---- result rewards ---- */
  const [reward, setReward] = useState<{ xp: number; coins: number; rating: number; won: boolean } | null>(null);
  const myRating = (user as unknown as { duelRating?: number } | null)?.duelRating ?? 1000;

  /* ---- derived ---- */
  const pool = useMemo<BaseQ[]>(() => (subject ? getQuestionPool(subject) : []), [subject]);
  const currentQ = pool[idx];

  const canStart = Boolean(opponent && subject && grade);

  /* =================== RESET ALL =================== */
  const resetMatch = useCallback(() => {
    setIdx(0);
    setMyScore(0);
    setOppScore(0);
    setOppProgress(0);
    setPicked(null);
    setFillValue('');
    setFeedback('none');
    setFloatChip(null);
    setAnswers([]);
    setTimeLeft(TOTAL_TIME);
    setReward(null);
    lockRef.current = false;
    finalizedRef.current = false;
  }, []);

  /* =================== COUNTDOWN =================== */
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (count <= 0) {
      const t = setTimeout(() => {
        setPhase('playing');
        setCount(3);
      }, 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, count]);

  /* =================== GLOBAL TIMER =================== */
  useEffect(() => {
    if (phase !== 'playing') return;
    if (timeLeft <= 0) return;
    const t = setTimeout(() => setTimeLeft((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [phase, timeLeft]);

  /* =================== AI OPPONENT (live progress) =================== */
  useEffect(() => {
    if (phase !== 'playing') return;
    if (oppProgress >= pool.length) return;
    // 3-10s har savol
    const delay = 3000 + Math.random() * 7000;
    const t = setTimeout(() => {
      const correctChance = 0.6 + Math.random() * 0.1; // 60-70%
      const ok = Math.random() < correctChance;
      setOppProgress((p) => p + 1);
      if (ok) setOppScore((s) => s + 1);
    }, delay);
    return () => clearTimeout(t);
  }, [phase, oppProgress, pool.length]);

  /* =================== FINISH (auto when all answered or time up) =================== */
  const finishMatch = useCallback(() => {
    if (finalizedRef.current) return;
    finalizedRef.current = true;
    setPhase('result');
  }, []);

  useEffect(() => {
    if (phase !== 'playing') return;
    if (idx >= pool.length || timeLeft <= 0) {
      finishMatch();
    }
  }, [phase, idx, pool.length, timeLeft, finishMatch]);

  /* =================== APPLY REWARDS ONCE in 'result' =================== */
  useEffect(() => {
    if (phase !== 'result' || reward) return;
    const won = myScore > oppScore;
    const xp = won ? 40 : 8;
    const coins = won ? 15 : 0;
    const rating = won ? 25 : -15;
    addXp(xp, won ? 'Duel — g‘alaba' : 'Duel — ishtirok');
    if (coins > 0 && user) {
      patchUser({ coins: (user.coins ?? 0) + coins });
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReward({ xp, coins, rating, won });
  }, [phase, reward, myScore, oppScore, addXp, patchUser, user]);

  /* =================== HANDLE ANSWER =================== */
  const handleAnswer = useCallback(
    (rawPicked: string | null) => {
      if (lockRef.current || phase !== 'playing' || !currentQ) return;
      lockRef.current = true;
      const isCorrect = isAnswerCorrect(currentQ, rawPicked);
      recordAnswer(isCorrect);
      setFeedback(isCorrect ? 'correct' : 'wrong');
      setAnswers((prev) => [
        ...prev,
        {
          qIndex: idx,
          picked: rawPicked,
          correctValue: correctAsText(currentQ),
          isCorrect,
        },
      ]);
      if (isCorrect) {
        setMyScore((s) => s + 1);
        const k = Date.now();
        setFloatChip({ key: k, text: '+10 XP' });
        setTimeout(() => {
          setFloatChip((cur) => (cur?.key === k ? null : cur));
        }, 700);
      }
      setTimeout(() => {
        setPicked(null);
        setFillValue('');
        setFeedback('none');
        setIdx((i) => i + 1);
        lockRef.current = false;
      }, 800);
    },
    [phase, currentQ, idx, recordAnswer],
  );

  /* =================== ACTIONS =================== */
  const startCountdown = () => {
    if (!canStart) return;
    resetMatch();
    setCount(3);
    setPhase('countdown');
  };

  const rematch = () => {
    resetMatch();
    setCount(3);
    setPhase('countdown');
  };

  const backToLobby = () => {
    resetMatch();
    setOpponent(null);
    setSubject(null);
    setGrade(null);
    setPhase('lobby');
  };

  /* =================== RENDER =================== */
  if (phase === 'lobby') {
    return (
      <LobbyView
        opponent={opponent}
        subject={subject}
        grade={grade}
        rating={myRating}
        opponentPool={opponentPool}
        onSelectOpponent={setOpponent}
        onSelectSubject={setSubject}
        onSelectGrade={setGrade}
        canStart={canStart}
        onStart={startCountdown}
      />
    );
  }

  if (phase === 'countdown') {
    return <CountdownView count={count} />;
  }

  if (phase === 'playing' && currentQ) {
    return (
      <PlayingView
        meName={user?.name ?? 'Siz'}
        meColor={user?.avatarColor ?? '#4f3cc9'}
        opp={opponent!}
        myScore={myScore}
        oppScore={oppScore}
        oppProgress={oppProgress}
        idx={idx}
        total={pool.length}
        timeLeft={timeLeft}
        question={currentQ}
        picked={picked}
        fillValue={fillValue}
        feedback={feedback}
        floatChip={floatChip}
        onPick={setPicked}
        onFillChange={setFillValue}
        onSubmit={() => {
          if (currentQ.type === 'choice') {
            if (picked === null) return;
            handleAnswer(picked);
          } else {
            if (!fillValue.trim()) return;
            handleAnswer(fillValue);
          }
        }}
      />
    );
  }

  if (phase === 'result' && reward && opponent) {
    return (
      <ResultView
        won={reward.won}
        myScore={myScore}
        oppScore={oppScore}
        timeUsed={TOTAL_TIME - timeLeft}
        xp={reward.xp}
        coins={reward.coins}
        rating={reward.rating}
        meName={user?.name ?? 'Siz'}
        meColor={user?.avatarColor ?? '#4f3cc9'}
        opp={opponent}
        analysis={analyze(answers)}
        onReview={() => setPhase('review')}
        onRematch={rematch}
        onLobby={backToLobby}
      />
    );
  }

  if (phase === 'review') {
    return (
      <ReviewView
        pool={pool}
        answers={answers}
        onBack={() => setPhase('result')}
      />
    );
  }

  return null;
}

/* =================================================================
 * LOBBY
 * ================================================================= */
interface LobbyProps {
  opponent: Friend | null;
  subject: SubjectKey | null;
  grade: number | null;
  rating: number;
  opponentPool: Friend[];
  onSelectOpponent: (f: Friend) => void;
  onSelectSubject: (s: SubjectKey) => void;
  onSelectGrade: (g: number) => void;
  canStart: boolean;
  onStart: () => void;
}

function LobbyView({
  opponent,
  subject,
  grade,
  rating,
  opponentPool,
  onSelectOpponent,
  onSelectSubject,
  onSelectGrade,
  canStart,
  onStart,
}: LobbyProps) {
  return (
    <div>
      <PageHead
        icon="Swords"
        title="Duel Arena"
        desc="1 ga 1 do‘stingiz bilan musobaqa — 10 ta savol, 5 daqiqa, g‘olib oladi"
        action={
          <div className="flex items-center gap-2 rounded-full border border-amber-400/30 bg-amber-400/10 px-4 py-2">
            <Icon name="Trophy" size={16} color="#fbbf24" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              ELO Rating
            </span>
            <span className="text-base font-black text-white">
              <CountUp to={rating} />
            </span>
          </div>
        }
      />

      {/* 1. Opponent grid */}
      <section className="mb-7">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600/30 text-xs text-brand-300">
            1
          </span>
          Raqibingizni tanlang
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {opponentPool.map((f: Friend) => {
            const selected = opponent?.id === f.id;
            return (
              <button
                key={f.id}
                onClick={() => onSelectOpponent(f)}
                className={`group relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all ${
                  selected
                    ? 'border-brand-500 bg-brand-600/15 ring-2 ring-brand-500/40'
                    : 'border-ink-700 bg-ink-800 hover:border-ink-600 hover:bg-ink-700/40'
                }`}
              >
                <div className="relative">
                  <Avatar name={f.name} color={f.avatarColor} size={56} />
                  {f.online && (
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink-800 bg-grass" />
                  )}
                </div>
                <div className="font-semibold text-white">{f.name.split(' ')[0]}</div>
                <div className="text-xs text-white/45">
                  Lvl {f.level} · {f.xp.toLocaleString()} XP
                </div>
                {selected && (
                  <span className="absolute right-2 top-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-500 text-white">
                    <Icon name="Check" size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2. Subject */}
      <section className="mb-7">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600/30 text-xs text-brand-300">
            2
          </span>
          Fan
        </h2>
        <div className="flex flex-wrap gap-2">
          {SUBJECTS.map((s) => {
            const selected = subject === s.id;
            return (
              <button
                key={s.id}
                onClick={() => onSelectSubject(s.id)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-all ${
                  selected
                    ? 'border-transparent text-white shadow-[0_6px_24px_rgba(29,78,216,0.35)]'
                    : 'border-ink-700 bg-ink-800 text-white/70 hover:border-ink-600 hover:text-white'
                }`}
                style={selected ? { background: s.color } : undefined}
              >
                <Icon name={s.icon} size={16} />
                {s.name}
              </button>
            );
          })}
        </div>
      </section>

      {/* 3. Grade */}
      <section className="mb-7">
        <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-white/70">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-brand-600/30 text-xs text-brand-300">
            3
          </span>
          Sinf
        </h2>
        <div className="flex flex-wrap gap-2">
          {GRADES.map((g) => {
            const selected = grade === g;
            return (
              <button
                key={g}
                onClick={() => onSelectGrade(g)}
                className={`h-11 min-w-[3rem] rounded-lg border px-4 text-sm font-bold transition-all ${
                  selected
                    ? 'border-brand-500 bg-brand-600 text-white shadow-[0_6px_18px_rgba(29,78,216,0.4)]'
                    : 'border-ink-700 bg-ink-800 text-white/70 hover:border-ink-600 hover:text-white'
                }`}
              >
                {g}
              </button>
            );
          })}
        </div>
      </section>

      {/* Start button */}
      <div className="sticky bottom-4 z-10 mt-6 rounded-xl border border-ink-700 bg-ink-800/95 p-4 backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="text-xs text-white/55">
            {!opponent && 'Raqib tanlang. '}
            {!subject && 'Fan tanlang. '}
            {!grade && 'Sinf tanlang.'}
            {canStart && (
              <span className="font-semibold text-white">
                Tayyor — {opponent!.name.split(' ')[0]} bilan {SUBJECTS.find((s) => s.id === subject)?.name},{' '}
                {grade}-sinf
              </span>
            )}
          </div>
          <Button
            size="lg"
            icon="Swords"
            disabled={!canStart}
            onClick={onStart}
            className="bg-brand-600 hover:bg-brand-500"
          >
            Boshlash
          </Button>
        </div>
      </div>
    </div>
  );
}

/* =================================================================
 * COUNTDOWN
 * ================================================================= */
function CountdownView({ count }: { count: number }) {
  const label = count > 0 ? String(count) : 'GO!';
  return (
    <div className="relative flex min-h-[60vh] items-center justify-center">
      {/* Pulsing background glow */}
      <motion.div
        className="pointer-events-none absolute inset-0"
        animate={{ opacity: [0.25, 0.6, 0.25] }}
        transition={{ duration: 1, repeat: Infinity }}
        style={{
          background:
            'radial-gradient(circle at 50% 50%, rgba(29,78,216,0.55) 0%, rgba(29,78,216,0.15) 35%, transparent 65%)',
        }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={count}
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.8, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 220, damping: 18 }}
          className="relative z-10 text-center"
        >
          <div
            className={`font-black leading-none ${
              count > 0 ? 'text-white' : 'text-amber-400'
            }`}
            style={{ fontSize: count > 0 ? 'clamp(10rem, 28vw, 18rem)' : 'clamp(6rem, 18vw, 12rem)' }}
          >
            {label}
          </div>
          {count > 0 && (
            <p className="mt-4 text-sm font-semibold uppercase tracking-[0.4em] text-white/50">
              Tayyor bo‘ling
            </p>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* =================================================================
 * PLAYING
 * ================================================================= */
interface PlayingProps {
  meName: string;
  meColor: string;
  opp: Friend;
  myScore: number;
  oppScore: number;
  oppProgress: number;
  idx: number;
  total: number;
  timeLeft: number;
  question: BaseQ;
  picked: string | null;
  fillValue: string;
  feedback: 'none' | 'correct' | 'wrong';
  floatChip: { key: number; text: string } | null;
  onPick: (v: string) => void;
  onFillChange: (v: string) => void;
  onSubmit: () => void;
}

function PlayingView({
  meName,
  meColor,
  opp,
  myScore,
  oppScore,
  oppProgress,
  idx,
  total,
  timeLeft,
  question,
  picked,
  fillValue,
  feedback,
  floatChip,
  onPick,
  onFillChange,
  onSubmit,
}: PlayingProps) {
  const myPct = ((idx + (feedback !== 'none' ? 1 : 0)) / total) * 100;
  const oppPct = (oppProgress / total) * 100;
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeUrgent = timeLeft <= 30;

  return (
    <div className="mx-auto max-w-3xl">
      {/* Timer */}
      <div className="mb-4 flex items-center justify-center">
        <motion.div
          animate={timeUrgent ? { scale: [1, 1.06, 1] } : {}}
          transition={{ duration: 0.8, repeat: timeUrgent ? Infinity : 0 }}
          className={`inline-flex items-center gap-2 rounded-full border px-5 py-2 font-mono text-lg font-black ${
            timeUrgent
              ? 'border-rose-accent/60 bg-rose-accent/15 text-rose-accent'
              : 'border-ink-700 bg-ink-800 text-white'
          }`}
        >
          <Icon name="Clock" size={18} />
          {minutes}:{String(seconds).padStart(2, '0')}
        </motion.div>
      </div>

      {/* VS Header */}
      <div className="mb-5 rounded-2xl border border-ink-700 bg-ink-800 p-4 sm:p-5">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-4">
          {/* Me */}
          <div className="flex items-center gap-3">
            <Avatar name={meName} color={meColor} size={44} />
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-semibold text-white">{meName}</div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-900">
                <motion.div
                  className="h-full rounded-full bg-brand-600"
                  animate={{ width: `${myPct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
            <div className="text-2xl font-black text-amber-400 tabular-nums">
              <CountUp to={myScore} duration={0.4} />
            </div>
          </div>

          <div className="font-display text-lg font-black text-white/40">VS</div>

          {/* Opp */}
          <div className="flex items-center gap-3">
            <div className="text-right text-2xl font-black text-amber-400 tabular-nums">
              <CountUp to={oppScore} duration={0.4} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-right text-sm font-semibold text-white">
                {opp.name.split(' ')[0]}
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-900">
                <motion.div
                  className="ml-auto h-full rounded-full bg-rose-accent"
                  animate={{ width: `${oppPct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>
            <Avatar name={opp.name} color={opp.avatarColor} size={44} />
          </div>
        </div>
      </div>

      {/* Progress dots */}
      <div className="mb-2 flex justify-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={`h-2 w-2 rounded-full ${
              i === idx ? 'bg-brand-500' : i < idx ? 'bg-grass' : 'bg-ink-700'
            }`}
          />
        ))}
      </div>
      <div className="mb-5 text-center text-xs text-white/45">
        Savol {Math.min(idx + 1, total)} / {total}
      </div>

      {/* Question card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 240, damping: 24 }}
          className="relative rounded-xl border border-ink-700 bg-ink-800 p-6 sm:p-8"
        >
          {/* floating XP chip */}
          <AnimatePresence>
            {floatChip && (
              <motion.span
                key={floatChip.key}
                initial={{ opacity: 1, y: 0 }}
                animate={{ opacity: 0, y: -60 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7, ease: 'easeOut' }}
                className="pointer-events-none absolute right-6 top-6 rounded-md bg-grass/20 px-2.5 py-1 text-xs font-bold text-grass"
              >
                {floatChip.text}
              </motion.span>
            )}
          </AnimatePresence>

          <h2 className="text-xl font-bold leading-snug text-white sm:text-2xl">
            {question.q}
          </h2>

          {question.type === 'choice' && question.options && (
            <div className="mt-6 space-y-3">
              {question.options.map((o, i) => {
                const isPicked = picked === o;
                const showCorrect = feedback !== 'none' && o === correctAsText(question);
                const showWrong = feedback === 'wrong' && isPicked && !showCorrect;
                let cls = 'border-ink-700 bg-ink-900 hover:border-ink-600 text-white';
                let anim = '';
                if (showCorrect) {
                  cls = 'border-grass bg-grass/15 text-white glow-success';
                  anim = 'anim-pop';
                } else if (showWrong) {
                  cls = 'border-rose-accent bg-rose-accent/15 text-white glow-error';
                  anim = 'anim-shake';
                } else if (feedback !== 'none') {
                  cls = 'border-ink-700 bg-ink-900 text-white/55';
                } else if (isPicked) {
                  cls = 'border-brand-500 bg-brand-600/20 text-white';
                }
                return (
                  <button
                    key={i}
                    disabled={feedback !== 'none'}
                    onClick={() => onPick(o)}
                    className={`flex w-full items-center gap-3 rounded-lg border p-4 text-left transition-all ${cls} ${anim}`}
                  >
                    <span
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-sm font-bold ${
                        showCorrect
                          ? 'bg-grass text-white'
                          : showWrong
                            ? 'bg-rose-accent text-white'
                            : 'bg-ink-800 text-white/70'
                      }`}
                    >
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="text-sm font-medium sm:text-base">{o}</span>
                    {showCorrect && (
                      <Icon name="CheckCircle2" size={18} className="ml-auto text-grass" />
                    )}
                    {showWrong && (
                      <Icon name="XCircle" size={18} className="ml-auto text-rose-accent" />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {question.type === 'fill' && (
            <div className="mt-6">
              <div
                className={`relative rounded-lg border bg-ink-900 transition-all ${
                  feedback === 'correct'
                    ? 'border-grass glow-success anim-pop'
                    : feedback === 'wrong'
                      ? 'border-rose-accent glow-error anim-shake'
                      : 'border-ink-700 focus-within:border-brand-500'
                }`}
              >
                <input
                  type="text"
                  value={fillValue}
                  disabled={feedback !== 'none'}
                  onChange={(e) => onFillChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && fillValue.trim() && feedback === 'none') {
                      onSubmit();
                    }
                  }}
                  placeholder="Javobingizni yozing..."
                  className="w-full bg-transparent px-4 py-4 text-lg font-semibold text-white outline-none placeholder:text-white/30"
                  autoFocus
                />
              </div>
              {feedback === 'wrong' && (
                <p className="mt-2 text-xs text-rose-accent">
                  To‘g‘ri javob: <span className="font-bold">{correctAsText(question)}</span>
                </p>
              )}
            </div>
          )}

          <Button
            block
            size="lg"
            className="mt-6 bg-brand-600 hover:bg-brand-500"
            disabled={
              feedback !== 'none' ||
              (question.type === 'choice' ? picked === null : !fillValue.trim())
            }
            onClick={onSubmit}
          >
            Yuborish
          </Button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* =================================================================
 * RESULT
 * ================================================================= */
interface ResultProps {
  won: boolean;
  myScore: number;
  oppScore: number;
  timeUsed: number;
  xp: number;
  coins: number;
  rating: number;
  meName: string;
  meColor: string;
  opp: Friend;
  analysis: string;
  onReview: () => void;
  onRematch: () => void;
  onLobby: () => void;
}

function ResultView({
  won,
  myScore,
  oppScore,
  timeUsed,
  xp,
  coins,
  rating,
  meName,
  meColor,
  opp,
  analysis,
  onReview,
  onRematch,
  onLobby,
}: ResultProps) {
  const tie = myScore === oppScore;
  return (
    <div className="relative mx-auto max-w-2xl">
      {won && <Confetti count={50} />}
      {won && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-[80]"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.5, 0.3, 0.5] }}
          transition={{ duration: 2.4, repeat: Infinity }}
          style={{
            background:
              'radial-gradient(circle at 50% 35%, rgba(22,163,74,0.5) 0%, rgba(22,163,74,0.12) 40%, transparent 70%)',
          }}
        />
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 24 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        className="relative z-[85] overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 text-center"
      >
        <div className="bg-ink-900 px-8 pt-10 pb-8">
          <motion.div
            initial={{ scale: 0.4, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.15, type: 'spring', stiffness: 220, damping: 14 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-2xl"
            style={{
              background: won ? '#16a34a22' : tie ? '#47556922' : '#e11d4822',
              boxShadow: won
                ? '0 0 0 4px #16a34a44, 0 0 40px #16a34a80'
                : tie
                  ? '0 0 0 2px #47556944'
                  : '0 0 0 2px #e11d4844',
            }}
          >
            <Icon
              name={won ? 'Trophy' : tie ? 'ShieldHalf' : 'XCircle'}
              size={44}
              color={won ? '#16a34a' : tie ? '#94a3b8' : '#e11d48'}
            />
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-5 text-5xl font-black text-white sm:text-6xl"
            style={won ? { textShadow: '0 0 40px rgba(22,163,74,0.5)' } : {}}
          >
            {won ? 'G‘olib!' : tie ? 'Durang' : 'Mag‘lubiyat'}
          </motion.h2>
          {!won && (
            <p className="mt-3 text-sm text-white/55">
              Yana uringizmi? Mashq qilib qaytadan urinib ko‘ring.
            </p>
          )}

          {/* reward chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="mt-5 flex flex-wrap items-center justify-center gap-2"
          >
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-3 py-1.5 text-sm font-bold text-brand-300">
              <Icon name="Sparkles" size={14} /> +{xp} XP
            </span>
            {coins > 0 && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-fire/15 px-3 py-1.5 text-sm font-bold text-fire">
                <Icon name="Coins" size={14} /> +{coins} coin
              </span>
            )}
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-bold ${
                rating >= 0
                  ? 'bg-grass/15 text-grass'
                  : 'bg-rose-accent/15 text-rose-accent'
              }`}
            >
              <Icon name="TrendingUp" size={14} />
              {rating >= 0 ? '+' : ''}
              {rating} rating
            </span>
          </motion.div>
        </div>

        {/* Three stat tiles */}
        <div className="grid grid-cols-3 items-center gap-px bg-ink-700">
          <div className="bg-ink-800 px-3 py-5">
            <Avatar name={meName} color={meColor} size={40} />
            <p className="mt-2 text-xs uppercase tracking-wider text-white/45">Siz</p>
            <p className="mt-0.5 text-3xl font-black text-amber-400">
              <CountUp to={myScore} duration={0.8} />
            </p>
          </div>
          <div className="bg-ink-800 px-3 py-5">
            <p className="text-xs uppercase tracking-wider text-white/45">Vaqt</p>
            <p className="mt-2 text-3xl font-black text-white">
              {Math.floor(timeUsed / 60)}:{String(timeUsed % 60).padStart(2, '0')}
            </p>
          </div>
          <div className="bg-ink-800 px-3 py-5">
            <Avatar name={opp.name} color={opp.avatarColor} size={40} />
            <p className="mt-2 truncate text-xs uppercase tracking-wider text-white/45">
              {opp.name.split(' ')[0]}
            </p>
            <p className="mt-0.5 text-3xl font-black text-amber-400">
              <CountUp to={oppScore} duration={0.8} />
            </p>
          </div>
        </div>

        {/* Smart analysis */}
        <div className="border-t border-ink-700 bg-ink-800 px-6 py-5">
          <div className="flex items-start gap-3 text-left">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600/20 text-brand-300">
              <Icon name="Brain" size={18} />
            </span>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-brand-300">
                AI tahlil
              </div>
              <p className="mt-0.5 text-sm text-white/75">{analysis}</p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-3 border-t border-ink-700 p-6">
          <Button icon="BookOpenCheck" variant="dark" onClick={onReview}>
            Xatolarni ko‘rish
          </Button>
          <Button icon="RotateCcw" onClick={onRematch} className="bg-brand-600 hover:bg-brand-500">
            Rematch
          </Button>
          <Button icon="Home" variant="dark" onClick={onLobby}>
            Lobbyga qaytish
          </Button>
        </div>
      </motion.div>
    </div>
  );
}

/* =================================================================
 * REVIEW
 * ================================================================= */
interface ReviewProps {
  pool: BaseQ[];
  answers: AnswerLog[];
  onBack: () => void;
}

function ReviewView({ pool, answers, onBack }: ReviewProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <PageHead
        icon="BookOpenCheck"
        title="Xatolar va to‘g‘ri javoblar"
        desc="Har bir savolingiz natijasini batafsil ko‘ring"
        action={
          <Button variant="dark" icon="ChevronLeft" onClick={onBack}>
            Orqaga
          </Button>
        }
      />
      <div className="space-y-3">
        {pool.map((q, i) => {
          const ans = answers.find((a) => a.qIndex === i);
          const answered = Boolean(ans);
          const isCorrect = ans?.isCorrect ?? false;
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="rounded-xl border border-ink-700 bg-ink-800 p-5"
            >
              <div className="mb-3 flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-white">
                  Savol {i + 1}: {q.q}
                </h3>
                {answered ? (
                  isCorrect ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-grass/15 px-2.5 py-1 text-xs font-bold text-grass">
                      <Icon name="CheckCircle2" size={12} /> To‘g‘ri
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 rounded-full bg-rose-accent/15 px-2.5 py-1 text-xs font-bold text-rose-accent">
                      <Icon name="XCircle" size={12} /> Xato
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ink-700 px-2.5 py-1 text-xs font-bold text-white/55">
                    <Icon name="MinusCircle" size={12} /> Javobsiz
                  </span>
                )}
              </div>

              {answered && (
                <div
                  className={`mb-2 rounded-lg border px-3 py-2 text-sm ${
                    isCorrect
                      ? 'border-grass bg-grass/10 text-grass'
                      : 'border-rose-accent bg-rose-accent/10 text-rose-accent'
                  }`}
                >
                  <span className="font-semibold uppercase tracking-wider text-xs opacity-80">
                    Sizning javob:
                  </span>{' '}
                  <span className="font-bold">{ans!.picked ?? '—'}</span>
                </div>
              )}

              {(!isCorrect || !answered) && (
                <div className="mb-2 rounded-lg border border-grass bg-grass/10 px-3 py-2 text-sm text-grass">
                  <span className="font-semibold uppercase tracking-wider text-xs opacity-80">
                    To‘g‘ri javob:
                  </span>{' '}
                  <span className="font-bold">{correctAsText(q)}</span>
                </div>
              )}

              <p className="mt-2 flex items-start gap-2 text-xs text-white/55">
                <Icon name="Info" size={14} className="mt-0.5 shrink-0 text-brand-300" />
                <span>{q.explanation}</span>
              </p>
            </motion.div>
          );
        })}
      </div>
      <div className="mt-6 flex justify-center">
        <Button icon="ChevronLeft" onClick={onBack} className="bg-brand-600 hover:bg-brand-500">
          Natijaga qaytish
        </Button>
      </div>
    </div>
  );
}

export default DuelArena;

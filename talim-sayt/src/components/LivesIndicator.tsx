import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store/useApp';
import { Icon } from './Icon';

type Size = 'sm' | 'md' | 'lg';

const SIZE_PX: Record<Size, number> = {
  sm: 12,
  md: 16,
  lg: 22,
};

const GAP_CLS: Record<Size, string> = {
  sm: 'gap-0.5',
  md: 'gap-1',
  lg: 'gap-1.5',
};

const COUNT_CLS: Record<Size, string> = {
  sm: 'text-[11px]',
  md: 'text-xs',
  lg: 'text-sm',
};

const FILLED_COLOR = '#e11d48';
const EMPTY_COLOR = '#3a2c80';

interface LivesIndicatorProps {
  size?: Size;
  showCount?: boolean;
  className?: string;
}

interface FloatingDelta {
  id: number;
  delta: number;
}

export function LivesIndicator({
  size = 'md',
  showCount = false,
  className = '',
}: LivesIndicatorProps) {
  const { user } = useApp();
  const lives = user?.lives ?? 0;
  const livesMax = user?.livesMax ?? 0;

  const prevLivesRef = useRef<number>(lives);
  const [pulseIdx, setPulseIdx] = useState<number | null>(null);
  const [floats, setFloats] = useState<FloatingDelta[]>([]);

  useEffect(() => {
    const prev = prevLivesRef.current;
    if (lives < prev) {
      // Lost a life — pulse the heart at index `lives` (the one just emptied)
      const idx = Math.max(0, Math.min(livesMax - 1, lives));
      setPulseIdx(idx);
      const t = window.setTimeout(() => setPulseIdx(null), 520);
      prevLivesRef.current = lives;
      return () => window.clearTimeout(t);
    }
    if (lives > prev) {
      // Gained a life — float +1 text + pulse the newly filled heart
      const idx = Math.max(0, Math.min(livesMax - 1, lives - 1));
      setPulseIdx(idx);
      const id = Date.now() + Math.random();
      setFloats((f) => [...f, { id, delta: lives - prev }]);
      const tPulse = window.setTimeout(() => setPulseIdx(null), 520);
      const tFloat = window.setTimeout(
        () => setFloats((f) => f.filter((x) => x.id !== id)),
        1100,
      );
      prevLivesRef.current = lives;
      return () => {
        window.clearTimeout(tPulse);
        window.clearTimeout(tFloat);
      };
    }
    prevLivesRef.current = lives;
  }, [lives, livesMax]);

  if (!user || livesMax <= 0) return null;

  const px = SIZE_PX[size];
  const hearts = Array.from({ length: livesMax }, (_, i) => i < lives);

  return (
    <div
      className={`relative inline-flex items-center ${GAP_CLS[size]} ${className}`}
    >
      {hearts.map((filled, i) => {
        const isPulsing = pulseIdx === i;
        return (
          <motion.span
            key={i}
            className="inline-flex items-center justify-center"
            animate={
              isPulsing
                ? {
                    scale: [1, 1.45, 1],
                    color: [
                      filled ? FILLED_COLOR : EMPTY_COLOR,
                      FILLED_COLOR,
                      filled ? FILLED_COLOR : EMPTY_COLOR,
                    ],
                  }
                : { scale: 1 }
            }
            transition={{ duration: 0.5, ease: 'easeOut' }}
            style={{ color: filled ? FILLED_COLOR : EMPTY_COLOR }}
          >
            <Icon
              name={filled ? 'Heart' : 'HeartOff'}
              size={px}
              color={filled ? FILLED_COLOR : EMPTY_COLOR}
              style={{
                fill: filled ? FILLED_COLOR : 'transparent',
                opacity: filled ? 1 : 0.55,
              }}
              strokeWidth={2.25}
            />
          </motion.span>
        );
      })}

      {showCount && (
        <span
          className={`ml-1.5 font-semibold tabular-nums text-white/80 ${COUNT_CLS[size]}`}
        >
          {lives}/{livesMax}
        </span>
      )}

      <AnimatePresence>
        {floats.map((f) => (
          <motion.span
            key={f.id}
            className="pointer-events-none absolute -top-1 right-0 select-none font-extrabold"
            style={{
              color: FILLED_COLOR,
              fontSize: px + 2,
              textShadow: '0 1px 6px rgba(225, 29, 72, 0.45)',
            }}
            initial={{ opacity: 0, y: 4, scale: 0.7 }}
            animate={{ opacity: 1, y: -22, scale: 1 }}
            exit={{ opacity: 0, y: -34, scale: 0.9 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          >
            +{f.delta}
          </motion.span>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default LivesIndicator;

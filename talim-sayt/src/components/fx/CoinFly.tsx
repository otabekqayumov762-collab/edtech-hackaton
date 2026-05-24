import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Coins } from 'lucide-react';

interface CoinFlyProps {
  count?: number;
  onDone?: () => void;
}

interface Spec {
  x: number;
  rotate: number;
  delay: number;
}

const STAGGER_MS = 50;
const FLY_DURATION = 1.2;

function buildSpecs(count: number): Spec[] {
  return Array.from({ length: count }, (_, i) => ({
    x: Math.round((Math.random() - 0.5) * 100),
    rotate: Math.round((Math.random() - 0.5) * 90),
    delay: (i * STAGGER_MS) / 1000,
  }));
}

export function CoinFly({ count = 8, onDone }: CoinFlyProps) {
  const [specs] = useState<Spec[]>(() => buildSpecs(count));

  useEffect(() => {
    if (!onDone) return;
    const totalMs = FLY_DURATION * 1000 + count * STAGGER_MS + 80;
    const t = window.setTimeout(() => onDone(), totalMs);
    return () => window.clearTimeout(t);
  }, [count, onDone]);

  return (
    <div className="pointer-events-none fixed bottom-1/3 right-1/3 z-[100]">
      {specs.map((s, i) => (
        <motion.div
          key={i}
          initial={{ y: 0, x: 0, opacity: 1, scale: 0.4, rotate: 0 }}
          animate={{
            y: -120,
            x: s.x,
            opacity: [1, 1, 0],
            scale: [0.4, 1, 0.6],
            rotate: s.rotate,
          }}
          transition={{
            duration: FLY_DURATION,
            delay: s.delay,
            ease: [0.22, 1, 0.36, 1],
            times: [0, 0.6, 1],
          }}
          className="absolute drop-shadow-[0_4px_10px_rgba(251,191,36,0.55)]"
          style={{ color: '#fbbf24' }}
        >
          <Coins size={28} strokeWidth={2.2} />
        </motion.div>
      ))}
    </div>
  );
}

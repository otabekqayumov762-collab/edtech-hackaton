import { useEffect, useRef, useState } from 'react';
import { animate, useMotionValue } from 'framer-motion';

interface SmoothNumberProps {
  value: number;
  duration?: number;
  className?: string;
}

function formatThousands(n: number): string {
  return Math.round(n).toLocaleString('en-US');
}

export function SmoothNumber({
  value,
  duration = 1.0,
  className,
}: SmoothNumberProps) {
  const mv = useMotionValue(value);
  const prev = useRef<number>(value);
  const [display, setDisplay] = useState<string>(formatThousands(value));

  useEffect(() => {
    const from = prev.current;
    mv.set(from);
    const ctrl = animate(mv, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
    });
    const unsub = mv.on('change', (n) => setDisplay(formatThousands(n)));
    prev.current = value;
    return () => {
      ctrl.stop();
      unsub();
    };
  }, [value, duration, mv]);

  return <span className={className}>{display}</span>;
}

import { useEffect, useState } from 'react';
import { useMotionValue, animate } from 'framer-motion';

export function CountUp({
  to,
  duration = 1.2,
}: {
  to: number;
  duration?: number;
}) {
  const mv = useMotionValue(0);
  const [v, setV] = useState(0);
  useEffect(() => {
    const ctrl = animate(mv, to, { duration, ease: [0.22, 1, 0.36, 1] });
    const unsub = mv.on('change', (n) => setV(Math.round(n)));
    return () => {
      ctrl.stop();
      unsub();
    };
  }, [to, duration, mv]);
  return <>{v}</>;
}

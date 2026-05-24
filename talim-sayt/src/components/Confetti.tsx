import { useState } from 'react';

const COLORS = ['#1f2937', '#d4a017', '#16a34a', '#be123c'];

interface Piece {
  left: number;
  delay: number;
  dur: number;
  size: number;
  c: string;
}

function makePieces(count: number): Piece[] {
  return Array.from({ length: count }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.4,
    dur: 2.4 + Math.random() * 1.2,
    size: 6 + Math.random() * 6,
    c: COLORS[i % COLORS.length],
  }));
}

export function Confetti({ count = 36 }: { count?: number }) {
  const [pieces] = useState<Piece[]>(() => makePieces(count));
  return (
    <div className="pointer-events-none fixed inset-0 z-[120] overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: '-5%',
            width: p.size,
            height: p.size,
            background: p.c,
            animation: `fall ${p.dur}s linear ${p.delay}s forwards`,
          }}
        />
      ))}
    </div>
  );
}

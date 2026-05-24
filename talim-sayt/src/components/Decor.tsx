/* Slaydga aniq mos keladigan dekorativ figura va nuqta panjaralari */

export function BlobTopLeft({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 180"
      className={`pointer-events-none absolute ${className}`}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        d="M-10 60 C 20 10 90 -10 150 20 C 200 45 220 100 180 140 C 140 175 70 175 30 140 C -5 110 -20 90 -10 60 Z"
        fill="#e2e8f0"
      />
    </svg>
  );
}

export function BlobBottomRight({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 340 240"
      className={`pointer-events-none absolute ${className}`}
      aria-hidden
      preserveAspectRatio="xMidYMid slice"
    >
      <path
        d="M40 130 C 60 70 140 40 220 60 C 300 80 330 140 320 180 C 305 220 250 235 180 230 C 110 225 50 200 35 170 C 25 155 30 145 40 130 Z"
        fill="#1f2937"
      />
    </svg>
  );
}

/* Kichik akzent halqacha (slayd top-right) */
export function Ring({
  size = 18,
  color = '#cbd5e1',
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      className={`pointer-events-none absolute ${className}`}
      aria-hidden
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        fill="none"
        stroke={color}
        strokeWidth="2"
      />
    </svg>
  );
}

export function Dots({
  cols = 6,
  rows = 6,
  color = '#cbd5e1',
  size = 3.5,
  gap = 12,
  className = '',
}: {
  cols?: number;
  rows?: number;
  color?: string;
  size?: number;
  gap?: number;
  className?: string;
}) {
  const items: { x: number; y: number }[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      items.push({ x: c * gap, y: r * gap });
    }
  }
  const w = (cols - 1) * gap + size;
  const h = (rows - 1) * gap + size;
  return (
    <svg
      width={w}
      height={h}
      className={`pointer-events-none absolute ${className}`}
      aria-hidden
    >
      {items.map((p, i) => (
        <circle
          key={i}
          cx={p.x + size / 2}
          cy={p.y + size / 2}
          r={size / 2}
          fill={color}
        />
      ))}
    </svg>
  );
}

/* Konstellatsiya: katta + kichik 4-uchli sparkle, gradient bilan */
export function Sparkle({
  size = 44,
  className = '',
}: {
  size?: number;
  color?: string;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      className={className}
      aria-hidden
    >
      <defs>
        <linearGradient id="sparkA" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFE490" />
          <stop offset="55%" stopColor="#F8B73C" />
          <stop offset="100%" stopColor="#D98000" />
        </linearGradient>
        <linearGradient id="sparkB" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#FFD774" />
          <stop offset="100%" stopColor="#E89A18" />
        </linearGradient>
      </defs>
      {/* Katta 4-uchli — keskin geometriya */}
      <path
        d="M30 4 L34 22 L52 26 L34 30 L30 48 L26 30 L8 26 L26 22 Z"
        fill="url(#sparkA)"
      />
      {/* Yumshoq highlight */}
      <path
        d="M30 8 L32 22 L46 26 L32 28 L30 42 L28 28 L14 26 L28 22 Z"
        fill="rgba(255,255,255,0.35)"
      />
      {/* Kichik ikkilamchi sparkle (yuqori-o'ngda) */}
      <path
        d="M52 8 L54 16 L62 18 L54 20 L52 28 L50 20 L42 18 L50 16 Z"
        fill="url(#sparkB)"
      />
    </svg>
  );
}

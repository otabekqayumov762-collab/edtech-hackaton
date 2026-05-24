import {
  type ButtonHTMLAttributes,
  type ReactNode,
  useEffect,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

/* ---------- Button ---------- */
type Variant = 'primary' | 'ghost' | 'outline' | 'soft' | 'gold' | 'dark';
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: 'sm' | 'md' | 'lg';
  to?: string;
  icon?: string;
  block?: boolean;
};

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-brand-600 text-white hover:bg-brand-700',
  dark: 'bg-ink-800 text-white hover:bg-ink-700 border border-ink-700',
  ghost: 'text-zinc-700 hover:bg-zinc-100',
  outline: 'border border-zinc-300 text-zinc-800 hover:border-zinc-400 hover:bg-zinc-50',
  soft: 'bg-zinc-100 text-zinc-800 hover:bg-zinc-200',
  gold: 'bg-amber-400 text-zinc-950 hover:bg-amber-300',
};
const SIZES = {
  sm: 'h-9 px-3.5 text-sm gap-1.5 rounded-lg',
  md: 'h-11 px-5 text-sm gap-2 rounded-lg',
  lg: 'h-12 px-6 text-base gap-2 rounded-lg',
};

export function Button({
  variant = 'primary',
  size = 'md',
  to,
  icon,
  block,
  className = '',
  children,
  ...rest
}: ButtonProps) {
  const cls = `inline-flex cursor-pointer items-center justify-center font-semibold transition-[color,background-color,border-color,transform,box-shadow] duration-150 will-change-transform hover:scale-[1.03] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100 ${VARIANTS[variant]} ${SIZES[size]} ${block ? 'w-full' : ''} ${className}`;
  const inner = (
    <>
      {icon && <Icon name={icon} size={size === 'lg' ? 18 : 16} />}
      {children}
    </>
  );
  if (to)
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  return (
    <button className={cls} {...rest}>
      {inner}
    </button>
  );
}

/* ---------- Card ---------- */
export function Card({
  children,
  className = '',
  dark = false,
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  dark?: boolean;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-xl ${
        dark
          ? 'bg-ink-800 border border-ink-700'
          : 'bg-white border border-zinc-200'
      } ${hover ? 'transition-colors hover:border-zinc-300' : ''} ${className}`}
    >
      {children}
    </div>
  );
}

/* ---------- Progress ---------- */
export function Progress({
  value,
  className = '',
  color = '#1f2937',
  track = 'bg-zinc-200',
  height = 'h-2',
}: {
  value: number;
  className?: string;
  color?: string;
  track?: string;
  height?: string;
}) {
  return (
    <div className={`w-full ${height} rounded-full ${track} overflow-hidden ${className}`}>
      <motion.div
        className="h-full rounded-full"
        style={{ background: color }}
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
      />
    </div>
  );
}

/* ---------- Pill ---------- */
export function Pill({
  children,
  icon,
  className = '',
}: {
  children: ReactNode;
  icon?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${className}`}
    >
      {icon && <Icon name={icon} size={13} />}
      {children}
    </span>
  );
}

/* ---------- Avatar ---------- */
export function Avatar({
  name,
  color,
  size = 40,
  ring = false,
  imageUrl,
}: {
  name: string;
  color: string;
  size?: number;
  ring?: boolean;
  imageUrl?: string | null;
}) {
  const ringCls = ring ? 'ring-2 ring-ink-600' : '';
  if (imageUrl) {
    return (
      <img
        src={imageUrl}
        alt=""
        className={`shrink-0 rounded-full object-cover ${ringCls}`}
        style={{ width: size, height: size }}
      />
    );
  }
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${ringCls}`}
      style={{
        width: size,
        height: size,
        background: color,
        fontSize: size * 0.36,
      }}
    >
      {initials}
    </div>
  );
}

/* ---------- IconBadge ---------- */
export function IconBadge({
  icon,
  color = '#1f2937',
  size = 40,
  soft = true,
}: {
  icon: string;
  color?: string;
  size?: number;
  soft?: boolean;
}) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-lg"
      style={{
        width: size,
        height: size,
        background: soft ? `${color}15` : color,
        color: soft ? color : '#fff',
      }}
    >
      <Icon name={icon} size={size * 0.46} />
    </div>
  );
}

/* ---------- Section heading ---------- */
export function SectionHead({
  eyebrow,
  title,
  desc,
  center = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  desc?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={`max-w-2xl ${center ? 'mx-auto text-center' : ''}`}>
      {eyebrow && (
        <span className="inline-flex text-xs font-semibold uppercase tracking-wider text-brand-600">
          {eyebrow}
        </span>
      )}
      <h2 className="mt-3 text-3xl font-bold text-zinc-950 sm:text-[2.25rem] sm:leading-[1.15]">
        {title}
      </h2>
      {desc && <p className="mt-4 text-base leading-relaxed text-zinc-600">{desc}</p>}
    </div>
  );
}

/* ---------- Modal ---------- */
export function Modal({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div
            className="absolute inset-0 bg-zinc-950/60"
            onClick={onClose}
          />
          <motion.div
            className="relative z-10 w-full max-w-md"
            initial={{ scale: 0.95, y: 16, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

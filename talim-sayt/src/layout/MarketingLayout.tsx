import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useMotionTemplate,
} from 'framer-motion';
import { Logo } from '../components/Brand';
import { Button } from '../components/ui';
import { Icon } from '../components/Icon';
import { useApp } from '../store/useApp';
import { PageTransition } from '../components/motion';
import { useSiteConfig } from '../hooks/useSiteConfig';

const NAV = [
  { label: 'Tajriba', to: '/#tajriba' },
  { label: 'Imkoniyatlar', to: '/#imkoniyatlar' },
  { label: 'Jarayon', to: '/#jarayon' },
  { label: 'Haqimizda', to: '/#haqimizda' },
  { label: 'Tariflar', to: '/#tariflar' },
  { label: 'Sharhlar', to: '/#sharhlar' },
  { label: 'Bog‘lanish', to: '/#boglanish' },
];

/* Scroll oraligʻi: shu masofada yonlar ichkariga qisqaradi */
const SCROLL_RANGE = 100;
const MAX_NAV_W = 1280;
const COMPACT_NAV_MAX = 425;

const FLAT_BAR_STYLE = {
  borderRadius: 0,
  borderWidth: 0,
  boxShadow: 'none',
  backdropFilter: 'none',
  WebkitBackdropFilter: 'none',
} as const;

/** 0..1 progress — smoothstep */
function useNavProgress(scrollY: ReturnType<typeof useScroll>['scrollY']) {
  return useTransform(scrollY, (y) => {
    const t = Math.min(Math.max(y / SCROLL_RANGE, 0), 1);
    return t * t * (3 - 2 * t);
  });
}

type NavBarProps = {
  activeKey: string;
  hoveredNav: string | null;
  setHoveredNav: (v: string | null) => void;
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  user: ReturnType<typeof useApp>['user'];
  siteName: string;
};

function NavBarRow({
  activeKey,
  hoveredNav,
  setHoveredNav,
  open,
  setOpen,
  user,
  siteName,
}: NavBarProps) {
  return (
    <>
      <Link to="/" className="flex shrink-0 items-center gap-3 pl-2">
        <Logo size={40} />
        <span className="hidden text-lg font-bold tracking-tight text-zinc-950 sm:block">
          {siteName}
        </span>
      </Link>

      <nav
        className="absolute left-1/2 hidden -translate-x-1/2 lg:block"
        onMouseLeave={() => setHoveredNav(null)}
      >
        <ul className="flex items-center gap-0.5 rounded-full bg-slate-100/90 p-1 shadow-inner shadow-slate-200/40 ring-1 ring-slate-200/70">
          {NAV.map((n) => {
            const isActive = activeKey === n.to || activeKey.endsWith(n.to);
            const isHovered = hoveredNav === n.to;
            return (
              <li
                key={n.to}
                className="relative"
                onMouseEnter={() => setHoveredNav(n.to)}
              >
                {isHovered && !isActive && (
                  <motion.span
                    layoutId="nav-hover-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200/80"
                    transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                  />
                )}
                {isActive && (
                  <motion.span
                    layoutId="nav-pill"
                    aria-hidden
                    className="absolute inset-0 rounded-full bg-brand-600 shadow-[0_4px_14px_-3px_rgba(30,58,138,0.55)]"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                  />
                )}
                <a
                  href={n.to}
                  className={`relative z-10 block rounded-full px-4 py-2 text-[14px] font-medium tracking-tight transition-[color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 ${
                    isActive
                      ? 'text-white'
                      : isHovered
                        ? 'text-zinc-950'
                        : 'text-zinc-600'
                  }`}
                >
                  {n.label}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="flex items-center gap-2">
        <div className="hidden items-center gap-2 sm:flex">
          {user ? (
            <Button to="/app">Kabinet</Button>
          ) : (
            <>
              <Link
                to="/login"
                className="hidden rounded-full px-4 py-2.5 text-[15px] font-semibold text-zinc-700 transition-colors hover:bg-slate-100 md:inline-block"
              >
                Kirish
              </Link>
              <Button to="/register">Boshlash</Button>
            </>
          )}
        </div>

        <button
          type="button"
          className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-zinc-700 lg:hidden"
          onClick={() => setOpen((o) => !o)}
          aria-label="Menyu"
        >
          <Icon name={open ? 'X' : 'Menu'} size={18} />
        </button>
      </div>
    </>
  );
}

function MobileNavMenu({
  open,
  setOpen,
  activeKey,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
  activeKey: string;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-lg"
        >
          <ul className="space-y-0.5">
            {NAV.map((n) => {
              const isActive = activeKey === n.to || activeKey.endsWith(n.to);
              return (
                <li key={n.to} className="relative">
                  {isActive && (
                    <motion.span
                      layoutId="nav-mobile-pill"
                      aria-hidden
                      className="absolute inset-0 rounded-xl bg-brand-600 shadow-[0_4px_12px_-3px_rgba(30,58,138,0.45)]"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    />
                  )}
                  <a
                    href={n.to}
                    onClick={() => setOpen(false)}
                    className={`relative z-10 block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 ${
                      isActive
                        ? 'text-white'
                        : 'text-zinc-600 hover:bg-slate-50 hover:text-zinc-950'
                    }`}
                  >
                    {n.label}
                  </a>
                </li>
              );
            })}
          </ul>
          <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
            <Button to="/login" variant="outline" size="sm">
              Kirish
            </Button>
            <Button to="/register" size="sm">
              Boshlash
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function MarketingLayout() {
  const [open, setOpen] = useState(false);
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [endMargin, setEndMargin] = useState(16);
  const { user } = useApp();
  const cfg = useSiteConfig();
  const location = useLocation();
  const activeKey = `${location.pathname}${location.hash}`;

  const [isCompactNav, setIsCompactNav] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia(`(max-width: ${COMPACT_NAV_MAX}px)`).matches,
  );

  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${COMPACT_NAV_MAX}px)`);
    const sync = () => setIsCompactNav(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const update = () =>
      setEndMargin(Math.max(16, (window.innerWidth - MAX_NAV_W) / 2));
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { scrollY } = useScroll();
  const p = useNavProgress(scrollY);
  const scrollFx = !isCompactNav;

  /* Yonlar ichkariga qisqaradi — padding oshadi (margin emas, overflow bo'lmasin) */
  const sideInset = useTransform(p, [0, 1], [0, endMargin]);
  const headerPadTop = useTransform(p, [0, 1], [0, 12]);
  const navRadius = useTransform(p, [0, 1], [0, 24]);
  const sideBorderW = useTransform(p, [0, 1], [0, 1]);
  const pillShadow1 = useTransform(p, [0, 1], [0, 0.18]);
  const pillShadow2 = useTransform(p, [0, 1], [0, 0.06]);
  const pillBlur = useTransform(p, [0, 1], [0, 14]);

  const pillBorder = useMotionTemplate`rgba(226, 232, 240, 0.9)`;
  const pillShadow = useMotionTemplate`0 10px 32px -10px rgba(15,23,42,${pillShadow1}), 0 2px 6px -2px rgba(15,23,42,${pillShadow2})`;
  const pillBackdrop = useMotionTemplate`blur(${pillBlur}px)`;

  const navBarProps: NavBarProps = {
    activeKey,
    hoveredNav,
    setHoveredNav,
    open,
    setOpen,
    user,
    siteName: cfg.site_name,
  };

  return (
    <div className="min-h-screen bg-white">
      {isCompactNav ? (
        <header className="marketing-header fixed inset-x-0 top-0 z-50 w-full border-b border-zinc-200 bg-white">
          <div className="marketing-header-bar relative flex w-full items-center justify-between px-4 py-3">
            <NavBarRow {...navBarProps} />
          </div>
          <div className="w-full px-4 lg:hidden">
            <MobileNavMenu open={open} setOpen={setOpen} activeKey={activeKey} />
          </div>
        </header>
      ) : (
        <motion.header
          className="marketing-header fixed inset-x-0 top-0 z-50 w-full"
          style={{ paddingTop: headerPadTop }}
        >
        <motion.div
          className="marketing-header-wrap w-full"
          style={{
            paddingLeft: scrollFx ? sideInset : 0,
            paddingRight: scrollFx ? sideInset : 0,
          }}
        >
          <motion.div
            className={`marketing-header-bar relative flex w-full items-center justify-between bg-white px-4 py-3 sm:px-6 lg:px-10 ${
              scrollFx ? 'will-change-[border-radius,box-shadow]' : 'border-b border-slate-200'
            }`}
            style={
              scrollFx
                ? {
                    borderRadius: navRadius,
                    borderWidth: 1,
                    borderStyle: 'solid',
                    borderColor: pillBorder,
                    borderTopWidth: sideBorderW,
                    borderLeftWidth: sideBorderW,
                    borderRightWidth: sideBorderW,
                    borderBottomWidth: 1,
                    boxShadow: pillShadow,
                    backdropFilter: pillBackdrop,
                    WebkitBackdropFilter: pillBackdrop,
                  }
                : FLAT_BAR_STYLE
            }
          >
            {/* Logo */}
            <Link to="/" className="flex shrink-0 items-center gap-3 pl-2">
              <Logo size={40} />
              <span className="hidden text-lg font-bold tracking-tight text-zinc-950 sm:block">
                {cfg.site_name}
              </span>
            </Link>

            {/* Pill nav (center, desktop) */}
            <nav
              className="absolute left-1/2 hidden -translate-x-1/2 lg:block"
              onMouseLeave={() => setHoveredNav(null)}
            >
              <ul className="flex items-center gap-0.5 rounded-full bg-slate-100/90 p-1 shadow-inner shadow-slate-200/40 ring-1 ring-slate-200/70">
                {NAV.map((n) => {
                  const isActive = activeKey === n.to || activeKey.endsWith(n.to);
                  const isHovered = hoveredNav === n.to;
                  return (
                    <li
                      key={n.to}
                      className="relative"
                      onMouseEnter={() => setHoveredNav(n.to)}
                    >
                      {isHovered && !isActive && (
                        <motion.span
                          layoutId="nav-hover-pill"
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-white shadow-sm ring-1 ring-slate-200/80"
                          transition={{ type: 'spring', stiffness: 500, damping: 38 }}
                        />
                      )}
                      {isActive && (
                        <motion.span
                          layoutId="nav-pill"
                          aria-hidden
                          className="absolute inset-0 rounded-full bg-brand-600 shadow-[0_4px_14px_-3px_rgba(30,58,138,0.55)]"
                          transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                        />
                      )}
                      <a
                        href={n.to}
                        className={`relative z-10 block rounded-full px-4 py-2 text-[14px] font-medium tracking-tight transition-[color,transform] duration-200 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 focus-visible:ring-offset-2 ${
                          isActive
                            ? 'text-white'
                            : isHovered
                              ? 'text-zinc-950'
                              : 'text-zinc-600'
                        }`}
                      >
                        {n.label}
                      </a>
                    </li>
                  );
                })}
              </ul>
            </nav>

            {/* Right cluster */}
            <div className="flex items-center gap-2">
              {/* Auth buttons */}
              <div className="hidden items-center gap-2 sm:flex">
                {user ? (
                  <Button to="/app">Kabinet</Button>
                ) : (
                  <>
                    <Link
                      to="/login"
                      className="hidden rounded-full px-4 py-2.5 text-[15px] font-semibold text-zinc-700 transition-colors hover:bg-slate-100 md:inline-block"
                    >
                      Kirish
                    </Link>
                    <Button to="/register">Boshlash</Button>
                  </>
                )}
              </div>

              {/* Mobile hamburger */}
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 text-zinc-700 lg:hidden"
                onClick={() => setOpen((o) => !o)}
                aria-label="Menyu"
              >
                <Icon name={open ? 'X' : 'Menu'} size={18} />
              </button>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="marketing-header-wrap w-full lg:hidden"
          style={
            scrollFx
              ? { paddingLeft: sideInset, paddingRight: sideInset }
              : undefined
          }
        >
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                className="mt-2 overflow-hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-lg"
              >
                <ul className="space-y-0.5">
                  {NAV.map((n) => {
                    const isActive = activeKey === n.to || activeKey.endsWith(n.to);
                    return (
                      <li key={n.to} className="relative">
                        {isActive && (
                          <motion.span
                            layoutId="nav-mobile-pill"
                            aria-hidden
                            className="absolute inset-0 rounded-xl bg-brand-600 shadow-[0_4px_12px_-3px_rgba(30,58,138,0.45)]"
                            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                          />
                        )}
                        <a
                          href={n.to}
                          onClick={() => setOpen(false)}
                          className={`relative z-10 block rounded-xl px-4 py-2.5 text-sm font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-400/60 ${
                            isActive
                              ? 'text-white'
                              : 'text-zinc-600 hover:bg-slate-50 hover:text-zinc-950'
                          }`}
                        >
                          {n.label}
                        </a>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <Button to="/login" variant="outline" size="sm">
                    Kirish
                  </Button>
                  <Button to="/register" size="sm">
                    Boshlash
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </motion.header>
      )}

      <main className="pt-[4.5rem]">
        <PageTransition>
          <Outlet />
        </PageTransition>
      </main>

      <footer className="border-t border-zinc-200 bg-zinc-50">
        <div className="mx-auto max-w-7xl px-5 py-12 sm:py-14">
          <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:justify-between lg:gap-12">
            <div className="max-w-md shrink-0">
              <div className="flex items-center gap-2.5">
                <Logo size={32} />
                <span className="text-base font-bold tracking-tight text-zinc-950">
                  {cfg.site_name}
                </span>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-zinc-600">
                {cfg.footer_about}
              </p>
            </div>

            <div className="grid gap-10 sm:grid-cols-2 sm:gap-x-16 lg:gap-x-20">
              <FooterCol
                title="Platforma"
                links={[
                  { label: 'Imkoniyatlar', href: '/#imkoniyatlar' },
                  { label: 'Tariflar', href: '/#tariflar' },
                  { label: 'Darslar', href: '/login' },
                  { label: 'Reyting', href: '/login' },
                ]}
              />
              <div className="min-w-[200px]">
                <h4 className="text-sm font-semibold text-zinc-950">Bog‘lanish</h4>
                <ul className="mt-4 space-y-3 text-sm text-zinc-600">
                  <li>
                    <a
                      href={buildWebsiteHref(cfg.contact_website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2.5 transition-colors hover:text-brand-700"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-400 ring-1 ring-zinc-200 transition-colors group-hover:text-brand-700">
                        <Icon name="Globe" size={14} />
                      </span>
                      {cfg.contact_website}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`https://t.me/${stripAt(cfg.telegram_handle)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-2.5 transition-colors hover:text-brand-700"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-400 ring-1 ring-zinc-200 transition-colors group-hover:text-brand-700">
                        <Icon name="Send" size={14} />
                      </span>
                      @{stripAt(cfg.telegram_handle)}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`mailto:${cfg.contact_email}`}
                      className="group flex items-center gap-2.5 transition-colors hover:text-brand-700"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-400 ring-1 ring-zinc-200 transition-colors group-hover:text-brand-700">
                        <Icon name="Mail" size={14} />
                      </span>
                      {cfg.contact_email}
                    </a>
                  </li>
                  <li>
                    <a
                      href={`tel:${cfg.contact_phone.replace(/\s+/g, '')}`}
                      className="group flex items-center gap-2.5 transition-colors hover:text-brand-700"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white text-zinc-400 ring-1 ring-zinc-200 transition-colors group-hover:text-brand-700">
                        <Icon name="Phone" size={14} />
                      </span>
                      {cfg.contact_phone}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-200 px-5 py-5">
          <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 text-xs text-zinc-500 sm:flex-row">
            <span>© 2026 {cfg.site_name}. Barcha huquqlar himoyalangan.</span>
            <span>Hackathon 2025</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function stripAt(handle: string): string {
  return handle.replace(/^@+/, '');
}

function buildWebsiteHref(site: string): string {
  if (!site) return '#';
  if (/^https?:\/\//i.test(site)) return site;
  return `https://${site.replace(/^\/+/, '')}`;
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="min-w-[140px]">
      <h4 className="text-sm font-semibold text-zinc-950">{title}</h4>
      <ul className="mt-4 space-y-2.5 text-sm text-zinc-600">
        {links.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              className="inline-block py-0.5 transition-colors hover:text-brand-700"
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

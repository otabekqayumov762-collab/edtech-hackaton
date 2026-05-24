import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { BrandMark } from '../../components/Brand';
import { Icon } from '../../components/Icon';

export function AuthShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden border-r border-zinc-200 bg-zinc-50 p-12 lg:flex lg:flex-col">
        <Link to="/">
          <BrandMark size={32} />
        </Link>
        <div className="my-auto max-w-md">
          <h2 className="text-3xl font-bold leading-tight text-zinc-950">
            Majburiy fanlardan oddiy va izchil tayyorgarlik
          </h2>
          <p className="mt-4 text-zinc-600">
            XP yig‘ing, kunlik seriyangizni saqlang va reytingda yuqoriga
            ko‘tariling. Ortiqcha to‘siqsiz interfeys, aniq natija.
          </p>
          <div className="mt-8 space-y-2.5">
            {[
              { i: 'Gamepad2', t: 'XP va level tizimi' },
              { i: 'Brain', t: 'AI shaxsiy tavsiyalar' },
              { i: 'Trophy', t: 'Reyting va yutuqlar' },
            ].map((x) => (
              <div
                key={x.t}
                className={[
                  'group flex cursor-default items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3',
                  'transition-all duration-200 ease-out',
                  '[@media(hover:hover)]:hover:border-zinc-300',
                  '[@media(hover:hover)]:hover:bg-white',
                  '[@media(hover:hover)]:hover:shadow-[0_4px_14px_-4px_rgba(15,23,42,0.12)]',
                  '[@media(hover:hover)]:hover:-translate-y-px',
                ].join(' ')}
              >
                <span
                  className={[
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-brand-600 text-white',
                    'transition-transform duration-200 ease-out',
                    '[@media(hover:hover)]:group-hover:scale-105',
                  ].join(' ')}
                >
                  <Icon name={x.i} size={15} />
                </span>
                <span
                  className={[
                    'text-sm font-medium text-zinc-700 transition-colors duration-200',
                    '[@media(hover:hover)]:group-hover:text-zinc-950',
                  ].join(' ')}
                >
                  {x.t}
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs text-zinc-400">© 2026 MF Platform</p>
      </div>

      <div className="flex items-center justify-center bg-white px-4 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex lg:hidden">
            <BrandMark size={30} />
          </Link>
          <h1 className="text-2xl font-bold text-zinc-950">{title}</h1>
          <p className="mt-2 text-sm text-zinc-600">{subtitle}</p>
          <div className="mt-7">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: ReactNode;
}) {
  return (
    <label className="group block cursor-text">
      <span className="mb-1.5 block text-sm font-medium text-zinc-800 transition-colors duration-200 group-hover:text-zinc-950">
        {label}
      </span>
      <div
        className={[
          'flex items-center gap-2.5 rounded-xl border border-zinc-300 bg-white px-3.5',
          'transition-all duration-200 ease-out',
          /* hover — faqat sichqoncha bor bo‘lganda */
          '[@media(hover:hover)]:group-hover:border-zinc-400',
          '[@media(hover:hover)]:group-hover:bg-zinc-50',
          '[@media(hover:hover)]:group-hover:shadow-[0_4px_14px_-4px_rgba(15,23,42,0.12)]',
          '[@media(hover:hover)]:group-hover:-translate-y-px',
          /* focus — ko‘k emas, yengil chuqurlik */
          'group-focus-within:border-zinc-500',
          'group-focus-within:bg-white',
          'group-focus-within:shadow-[0_6px_20px_-6px_rgba(15,23,42,0.14)]',
          'group-focus-within:-translate-y-px',
        ].join(' ')}
      >
        <Icon
          name={icon}
          size={16}
          className="shrink-0 text-zinc-400 transition-colors duration-200 group-hover:text-brand-600 group-focus-within:text-brand-600"
        />
        {children}
      </div>
    </label>
  );
}

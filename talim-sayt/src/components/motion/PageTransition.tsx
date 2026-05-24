import type { ReactNode } from 'react';

/* Safe page transition — CSS-only fade-in. Never invisible to prevent
   blank screens during lazy chunk transitions. */
export function PageTransition({ children }: { children: ReactNode }) {
  return <div className="page-fade-in">{children}</div>;
}

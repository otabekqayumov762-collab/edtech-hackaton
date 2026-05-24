import { useContext } from 'react';
import { AppCtx } from './context';

export function useApp() {
  const c = useContext(AppCtx);
  if (!c) throw new Error('useApp must be used within AppProvider');
  return c;
}

import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Icon } from './Icon';
import { useNotifications } from '../hooks/useNotifications';
import {
  formatRelativeUz,
  notifIcon,
  notifIconColor,
  notifTarget,
  type Notif,
} from '../lib/notifications';

export function NotificationBell() {
  const { notifs, unreadCount, markRead, markAllRead } = useNotifications();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const nav = useNavigate();

  // Outside click → yopiladi
  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const hasUnread = unreadCount > 0;

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        aria-label={
          hasUnread
            ? `Bildirishnomalar (${unreadCount} ta yangi)`
            : 'Bildirishnomalar'
        }
        aria-haspopup="true"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="relative flex h-12 w-12 items-center justify-center rounded-xl border border-ink-700 bg-ink-800 text-white/80 transition-colors hover:bg-ink-700 hover:text-white"
      >
        <Icon name="Bell" size={24} />
        {hasUnread && (
          <span
            aria-hidden="true"
            className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-600 px-1.5 text-[11px] font-bold leading-none text-white ring-2 ring-ink-800"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Bildirishnomalar paneli"
          className="absolute right-0 z-50 mt-2 w-[340px] max-w-[calc(100vw-1.5rem)] overflow-hidden rounded-xl border border-slate-200 bg-white text-slate-900 shadow-lg"
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <p className="text-sm font-semibold text-slate-900">
              Bildirishnomalar
            </p>
            {hasUnread && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Hammasini o‘qildi
              </button>
            )}
          </div>

          {/* List */}
          <ul className="max-h-[70vh] overflow-y-auto">
            {notifs.length === 0 && <EmptyState />}
            {notifs.map((n) => (
              <NotifRow
                key={n.id}
                notif={n}
                onClick={() => {
                  markRead(n.id);
                  setOpen(false);
                  nav(notifTarget(n.type));
                }}
              />
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ----------------------- sub-components ----------------------- */

function NotifRow({
  notif,
  onClick,
}: {
  notif: Notif;
  onClick: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={`flex w-full items-start gap-3 border-b border-slate-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-slate-50 ${
          notif.read ? '' : 'bg-blue-50'
        }`}
      >
        <span
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100"
          aria-hidden="true"
        >
          <Icon
            name={notifIcon(notif.type)}
            size={18}
            color={notifIconColor(notif.type)}
          />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-start justify-between gap-2">
            <span className="truncate text-sm font-semibold text-slate-900">
              {notif.title}
            </span>
            {!notif.read && (
              <span
                aria-label="O‘qilmagan"
                className="mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full bg-blue-600"
              />
            )}
          </span>
          <span className="mt-0.5 block text-sm leading-snug text-slate-600">
            {notif.body}
          </span>
          <span className="mt-1 block text-xs text-slate-400">
            {formatRelativeUz(notif.createdAt)}
          </span>
        </span>
      </button>
    </li>
  );
}

function EmptyState() {
  return (
    <li className="flex flex-col items-center justify-center px-6 py-10 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
        <Icon name="Bell" size={22} color="#94a3b8" />
      </span>
      <p className="text-sm font-medium text-slate-700">
        Hozircha bildirishnoma yo‘q
      </p>
      <p className="mt-1 text-xs text-slate-400">
        Yangiliklar bu yerda paydo bo‘ladi
      </p>
    </li>
  );
}

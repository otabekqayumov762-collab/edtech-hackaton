import { Icon } from './Icon';

/* Liquid glass phone screen — frosted cards, soft borders, color blobs behind */

const SUBJECTS = [
  { name: 'Matematika', icon: 'Calculator', color: '#6366f1', pct: 75 },
  { name: 'Ona tili', icon: 'BookText', color: '#0ea5e9', pct: 80 },
  { name: 'Adabiyot', icon: 'Feather', color: '#ec4899', pct: 68 },
  { name: 'Tarix', icon: 'Landmark', color: '#f59e0b', pct: 62 },
];

/* glass style helper — light theme uchun yengil oq fonli karta */
const glass = (extra: React.CSSProperties = {}): React.CSSProperties => ({
  background: 'rgba(255, 255, 255, 0.95)',
  border: '1px solid rgba(15, 23, 42, 0.08)',
  boxShadow:
    '0 1px 0 rgba(255,255,255,0.6) inset, 0 4px 14px -6px rgba(15, 23, 42, 0.12)',
  ...extra,
});

export function PhoneMockup({
  className = '',
  tilt = 0,
}: {
  className?: string;
  tilt?: number;
}) {
  return (
    <div
      className={`phone-mockup-root relative mx-auto w-[min(230px,calc(100vw-2.5rem))] max-w-[324px] shrink-0 rounded-[3rem] sm:w-[270px] md:w-[300px] lg:w-[324px] ${className}`}
      style={{
        transform: tilt ? `rotate(${tilt}deg)` : undefined,
        transformOrigin: 'center',
        boxShadow: '0 15px 15px rgba(15, 23, 42, 0.28)',
      }}
    >
      {/* Side hardware buttons (left = volume + mute, right = power) */}
      <div className="pointer-events-none absolute left-[-3px] top-[110px] z-20 h-9 w-[3px] rounded-l-sm bg-gradient-to-r from-[#d4d4d8] to-[#8a8a8e]" />
      <div className="pointer-events-none absolute left-[-3px] top-[170px] z-20 h-16 w-[3px] rounded-l-sm bg-gradient-to-r from-[#d4d4d8] to-[#8a8a8e]" />
      <div className="pointer-events-none absolute left-[-3px] top-[250px] z-20 h-16 w-[3px] rounded-l-sm bg-gradient-to-r from-[#d4d4d8] to-[#8a8a8e]" />
      <div className="pointer-events-none absolute right-[-3px] top-[180px] z-20 h-20 w-[3px] rounded-r-sm bg-gradient-to-l from-[#d4d4d8] to-[#8a8a8e]" />

      {/* Polished silver titanium outer frame */}
      <div
        className="relative rounded-[3rem] p-[3px]"
        style={{
          background:
            'linear-gradient(135deg, #ffffff 0%, #d4d4d8 12%, #8a8a8e 28%, #6b6b70 50%, #8a8a8e 72%, #d4d4d8 88%, #ffffff 100%)',
        }}
      >
        {/* Inner bezel (thinner dark ring for silver look) */}
        <div
          className="rounded-[2.85rem] p-[8px]"
          style={{
            background:
              'linear-gradient(180deg, #2a2a2c 0%, #1c1c1e 50%, #2a2a2c 100%)',
          }}
        >
          <div
            className="phone-mockup-screen relative aspect-[39/84] w-full overflow-hidden rounded-[2.2rem] [transform:translateZ(0)]"
            onCopy={(e) => e.preventDefault()}
            onContextMenu={(e) => e.preventDefault()}
            style={{
              background:
                'linear-gradient(180deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%)',
              color: '#0f172a',
              boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.4), inset 0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            {/* Shisha yaltiroq — faqat yuqori qism, pastki nav ustiga tushmasin */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-[45%] rounded-t-[2.2rem]"
              style={{
                background:
                  'linear-gradient(135deg, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0.04) 40%, transparent 70%)',
              }}
            />

            {/* Dynamic Island */}
            <div
              className="absolute left-1/2 top-2 z-20 flex h-[26px] w-[105px] -translate-x-1/2 items-center justify-end rounded-full bg-black px-2.5"
              style={{
                boxShadow: '0 0 0 1px rgba(255,255,255,0.04), inset 0 0 6px rgba(0,0,0,0.6)',
              }}
            >
              <span className="block h-[7px] w-[7px] rounded-full bg-[#1a1a1c] ring-[1.5px] ring-[#2a2a2c]" />
            </div>

          {/* Status bar */}
          <div className="relative flex items-center justify-between px-7 pt-4 text-[11px] font-medium text-slate-700">
            <span>9:41</span>
            <div className="flex items-center gap-1.5">
              <Icon name="Zap" size={11} />
              <span className="text-[10px]">5G</span>
              <span className="ml-1 inline-block h-2.5 w-5 rounded-sm border border-slate-400/70">
                <span className="block h-full w-4/5 rounded-[1px] bg-slate-700" />
              </span>
            </div>
          </div>

          {/* Header */}
          <div className="relative mt-4 flex items-center gap-2 px-3 sm:mt-5 sm:gap-2.5 sm:px-4">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white sm:h-9 sm:w-9 sm:text-xs"
              style={{
                background: 'linear-gradient(135deg,#60a5fa,#3b82f6)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.25)',
              }}
            >
              S
            </span>
            <p className="min-w-0 flex-1 truncate text-sm font-bold tracking-tight sm:text-base">
              Salom, Saydalixon!
            </p>
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full sm:h-9 sm:w-9"
              style={glass()}
            >
              <Icon name="Bell" size={16} />
            </span>
          </div>

          {/* 3 stat tiles — glass */}
          <div
            className="relative mx-3 mt-3 grid grid-cols-3 overflow-hidden rounded-2xl sm:mx-4 sm:mt-4"
            style={glass()}
          >
            {[
              {
                Icon: (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10" style={{ background: '#fef3c7', color: '#f59e0b' }}>
                    <Icon name="Star" size={20} />
                  </span>
                ),
                v: '1250',
                l: 'XP',
              },
              {
                Icon: (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10" style={{ background: '#dbeafe', color: '#1e40af' }}>
                    <Icon name="Trophy" size={20} />
                  </span>
                ),
                v: '7',
                l: 'LEVEL',
              },
              {
                Icon: (
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl sm:h-10 sm:w-10" style={{ background: '#fee2e2', color: '#ef4444' }}>
                    <Icon name="Flame" size={20} />
                  </span>
                ),
                v: '15',
                l: 'SERIYA',
              },
            ].map((s, i) => (
              <div
                key={i}
                className="flex min-w-0 flex-col items-center px-0.5 py-2.5 sm:py-3.5"
                style={{
                  borderRight:
                    i < 2 ? '1px solid rgba(15,23,42,0.08)' : 'none',
                }}
              >
                {s.Icon}
                {s.v && (
                  <span className="mt-1 text-[15px] font-extrabold text-slate-900 sm:text-[17px]">
                    {s.v}
                  </span>
                )}
                <span
                  className={`max-w-full truncate text-center text-[8px] font-semibold tracking-wide text-slate-500 sm:text-[9px] sm:tracking-wider ${
                    s.v ? '' : 'mt-1'
                  }`}
                >
                  {s.l}
                </span>
              </div>
            ))}
          </div>

          {/* Bugungi maqsad */}
          <div className="relative px-3 pt-3 sm:px-4 sm:pt-4">
            <p className="mb-2 text-[12px] font-semibold text-slate-500">
              Bugungi maqsad
            </p>
            <div
              className="flex items-center gap-3 rounded-xl px-3 py-3"
              style={glass()}
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[13px] font-bold text-slate-900">
                  Matematika testini yeching
                </p>
                <div className="mt-2 h-1.5 rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: '75%',
                      background:
                        'linear-gradient(90deg, #1f2937, #94a3b8)',
                    }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-slate-500">15 / 20 savol</p>
              </div>
              <span
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md"
                style={{
                  background: '#1f2937',
                  boxShadow:
                    'inset 0 1px 0 rgba(255,255,255,0.2), 0 4px 12px -4px rgba(15,23,42,0.4)',
                }}
              >
                <Icon name="Target" size={18} color="#fff" />
              </span>
            </div>
          </div>

          {/* Fanlar progress — glass card */}
          <div className="relative px-3 pt-3 sm:px-4 sm:pt-4">
            <p className="mb-2 text-[12px] font-semibold text-slate-500">
              Fanlar bo‘yicha progress
            </p>
            <div className="space-y-2 rounded-xl p-2.5" style={glass()}>
              {SUBJECTS.map((s) => (
                <div key={s.name} className="flex items-center gap-2.5">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      background: `${s.color}26`,
                      color: s.color,
                      border: `1px solid ${s.color}33`,
                    }}
                  >
                    <Icon name={s.icon} size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-medium text-slate-800">
                        {s.name}
                      </span>
                      <span className="text-slate-500">{s.pct}%</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${s.pct}%`,
                          background: `linear-gradient(90deg, ${s.color}, ${s.color}cc)`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom nav — qattiq fon (backdrop-blur matnni xiralashtirardi) */}
          <div
            className="absolute inset-x-0 bottom-0 z-20 bg-white"
            style={{
              borderTop: '1px solid rgba(15, 23, 42, 0.08)',
              boxShadow: '0 -4px 16px -4px rgba(15, 23, 42, 0.06)',
            }}
          >
            <div className="flex items-center justify-around px-2 pb-4 pt-2.5">
              {[
                { ic: 'Home', l: 'Bosh sahifa', a: true },
                { ic: 'BookOpen', l: 'Darslar', a: false },
                { ic: 'ClipboardList', l: 'Testlar', a: false },
                { ic: 'Trophy', l: 'Reyting', a: false },
                { ic: 'User', l: 'Profil', a: false },
              ].map((n) => (
                <div
                  key={n.l}
                  className="flex flex-col items-center gap-0.5"
                  style={
                    n.a
                      ? { color: '#1f2937' }
                      : { color: 'rgba(15,23,42,0.55)' }
                  }
                >
                  <span
                    style={
                      n.a
                        ? {
                            display: 'inline-flex',
                            width: 30,
                            height: 30,
                            borderRadius: 10,
                            alignItems: 'center',
                            justifyContent: 'center',
                            background:
                              'linear-gradient(135deg, #60a5fa, #3b82f6)',
                            border: '1px solid rgba(15,23,42,0.08)',
                            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)',
                            color: '#fff',
                          }
                        : undefined
                    }
                  >
                    <Icon name={n.ic} size={18} />
                  </span>
                  <span className="text-[9px] font-semibold antialiased">{n.l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}

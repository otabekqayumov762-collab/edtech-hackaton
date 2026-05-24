import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '../store/useApp';
import { Icon } from './Icon';

export function XpToasts() {
  const { toasts } = useApp();
  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[130] flex flex-col items-center gap-2">
      <AnimatePresence>
        {toasts.map((t) => {
          const isCoin = t.kind === 'coin';
          const isGem = t.kind === 'gem';
          const isLifeLoss = t.kind === 'life-loss';
          const isLifeGain = t.kind === 'life-gain';

          // Gem toast — cyan/emerald accent, Gem icon
          if (isGem) {
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -28, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="flex items-center gap-3 rounded-lg border border-cyan-400/40 bg-ink-900/95 px-5 py-3 text-white backdrop-blur"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400/15"
                  style={{ color: '#06b6d4' }}
                >
                  <Icon name="Gem" size={18} />
                </span>
                <div className="leading-tight">
                  <div
                    className="text-base font-extrabold"
                    style={{ color: '#06b6d4' }}
                  >
                    +{t.amount} olmos
                  </div>
                  <div className="text-xs text-white/60">{t.reason}</div>
                </div>
              </motion.div>
            );
          }

          // Coin toast — amber/gold accent, Coins icon
          if (isCoin) {
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -28, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className="flex items-center gap-3 rounded-lg border border-amber-400/40 bg-ink-900/95 px-5 py-3 text-white backdrop-blur"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
                  <Icon name="Coins" size={18} />
                </span>
                <div className="leading-tight">
                  <div className="text-base font-extrabold text-amber-300">
                    +{t.amount} tanga
                  </div>
                  <div className="text-xs text-white/60">{t.reason}</div>
                </div>
              </motion.div>
            );
          }

          // Life toasts saqlanadi (mavjud uslub)
          if (isLifeLoss || isLifeGain) {
            const color = isLifeGain ? 'text-emerald-300' : 'text-rose-accent';
            const border = isLifeGain
              ? 'border-emerald-400/40'
              : 'border-rose-accent/40';
            const bgIcon = isLifeGain
              ? 'bg-emerald-400/15 text-emerald-300'
              : 'bg-rose-accent/15 text-rose-accent';
            return (
              <motion.div
                key={t.id}
                initial={{ opacity: 0, y: -28, scale: 0.85 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.85 }}
                transition={{ type: 'spring', stiffness: 320, damping: 22 }}
                className={`flex items-center gap-3 rounded-lg border ${border} bg-ink-900/95 px-5 py-3 text-white backdrop-blur`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${bgIcon}`}
                >
                  <Icon name="Heart" size={18} />
                </span>
                <div className="leading-tight">
                  <div className={`text-base font-extrabold ${color}`}>
                    {isLifeGain ? '+' : ''}
                    {t.amount} jon
                  </div>
                  <div className="text-xs text-white/60">{t.reason}</div>
                </div>
              </motion.div>
            );
          }

          // XP toast — default
          return (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -28, scale: 0.85 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.85 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="flex items-center gap-3 rounded-lg border border-brand-400/40 bg-ink-900/95 px-5 py-3 text-white  backdrop-blur"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/20 text-gold">
                <Icon name="Zap" size={18} />
              </span>
              <div className="leading-tight">
                <div className="text-base font-extrabold text-gold">
                  +{t.amount} XP
                </div>
                <div className="text-xs text-white/60">{t.reason}</div>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}

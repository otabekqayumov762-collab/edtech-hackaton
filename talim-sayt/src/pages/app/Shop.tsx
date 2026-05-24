import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { PageHead } from './_shared';
import { SHOP_ITEMS, CATEGORY_META, canAfford, type ShopCategory, type ShopItem } from '../../lib/shop';

const CATEGORIES: (ShopCategory | 'all')[] = ['all', 'heart', 'booster', 'hint', 'cosmetic', 'special'];

export function Shop() {
  const { user, patchUser } = useApp();
  const [cat, setCat] = useState<ShopCategory | 'all'>('all');
  const [pulse, setPulse] = useState<string | null>(null);
  const [toast, setToast] = useState<{ kind: 'ok' | 'bad'; text: string } | null>(null);

  if (!user) return null;

  const items = cat === 'all' ? SHOP_ITEMS : SHOP_ITEMS.filter((i) => i.category === cat);

  function buy(item: ShopItem) {
    if (!user) return;
    if (!canAfford(user, item)) {
      setToast({ kind: 'bad', text: `${item.currency === 'coin' ? 'Tanga' : 'Olmos'} yetarli emas` });
      setTimeout(() => setToast(null), 1800);
      return;
    }
    const patch: Partial<typeof user> = {};
    if (item.currency === 'coin') patch.coins = (user.coins ?? 0) - item.cost;
    else patch.gems = (user.gems ?? 0) - item.cost;
    if (item.category === 'heart' && typeof item.payload?.hearts === 'number') {
      const livesMax = user.livesMax ?? 10;
      patch.lives = Math.min(livesMax, (user.lives ?? 0) + (item.payload.hearts as number));
    }
    patchUser(patch);
    setPulse(item.slug);
    setTimeout(() => setPulse(null), 700);
    setToast({ kind: 'ok', text: `${item.name} sotib olindi` });
    setTimeout(() => setToast(null), 1800);
  }

  return (
    <div>
      <PageHead
        icon="ShoppingBag"
        title="Do‘kon"
        desc="XP, tanga va olmosingizni ishlatib boostlar oling"
        action={
          <div className="flex items-center gap-2">
            <Pill icon="Coins" color="#f59e0b" value={user.coins ?? 0} />
            <Pill icon="Gem" color="#06b6d4" value={user.gems ?? 0} />
          </div>
        }
      />

      {/* Category tabs */}
      <div className="mb-5 flex flex-wrap gap-1.5 rounded-xl border border-ink-700 bg-ink-800 p-1">
        {CATEGORIES.map((c) => {
          const meta = c !== 'all' ? CATEGORY_META[c] : { label: 'Hammasi', icon: 'LayoutGrid', color: '#94a3b8' };
          const active = cat === c;
          return (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-colors ${
                active ? 'bg-brand-600 text-white' : 'text-white/55 hover:text-white'
              }`}
            >
              <Icon name={meta.icon} size={15} />
              {meta.label}
            </button>
          );
        })}
      </div>

      {/* Items grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const meta = CATEGORY_META[item.category];
          const afford = canAfford(user, item);
          return (
            <motion.div
              key={item.slug}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className={`group hover-lift relative overflow-hidden rounded-2xl border border-ink-700 bg-ink-800 p-5 ${pulse === item.slug ? 'anim-pop glow-success' : ''}`}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
                  style={{ background: `${meta.color}26`, color: meta.color }}
                >
                  <Icon name={item.icon} size={28} />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-white">{item.name}</h3>
                  <p className="mt-0.5 text-xs text-white/55">{item.description}</p>
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-1.5 rounded-lg border border-ink-700 bg-ink-900 px-3 py-1.5 text-sm font-bold">
                  <Icon
                    name={item.currency === 'coin' ? 'Coins' : 'Gem'}
                    size={16}
                    color={item.currency === 'coin' ? '#f59e0b' : '#06b6d4'}
                  />
                  <span className="text-white">{item.cost}</span>
                </div>
                <button
                  type="button"
                  onClick={() => buy(item)}
                  disabled={!afford}
                  className={`cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                    afford
                      ? 'bg-brand-600 text-white hover:bg-brand-700'
                      : 'cursor-not-allowed bg-ink-900 text-white/35'
                  }`}
                >
                  {afford ? 'Sotib olish' : 'Yetarli emas'}
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className={`fixed bottom-24 left-1/2 z-50 -translate-x-1/2 rounded-xl px-5 py-3 text-sm font-semibold shadow-2xl ${
              toast.kind === 'ok' ? 'bg-grass text-white' : 'bg-rose-accent text-white'
            }`}
          >
            {toast.text}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Pill({ icon, color, value }: { icon: string; color: string; value: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full border border-ink-700 bg-ink-800 px-3 py-1.5 text-sm font-bold">
      <Icon name={icon} size={15} color={color} />
      <span className="text-white">{value.toLocaleString()}</span>
    </span>
  );
}

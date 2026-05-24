import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { Button } from '../../components/ui';
import { PageHead } from './_shared';
import type { User } from '../../lib/types';

const PLANS: {
  name: User['plan'];
  price: string;
  icon: string;
  desc: string;
  features: string[];
  popular?: boolean;
}[] = [
  {
    name: 'Bepul',
    price: '0',
    icon: 'Sparkles',
    desc: 'Boshlash uchun',
    features: [
      'Cheklangan darslar',
      'Asosiy testlar',
      'Kunlik maqsadlar',
      'Reyting tizimi',
    ],
  },
  {
    name: 'Premium',
    price: '49 900',
    icon: 'Crown',
    desc: 'Eng ommabop tanlov',
    popular: true,
    features: [
      'Barcha darslar va testlar',
      'AI shaxsiy yondashuv',
      'Batafsil statistika',
      'Reklamasiz tajriba',
      'Cheksiz mashqlar',
    ],
  },
  {
    name: 'Premium+',
    price: '99 900',
    icon: 'Medal',
    desc: 'Maksimal natija',
    features: [
      'Premium imkoniyatlari',
      'Live darslar',
      'Mentorlardan yordam',
      'Rasmiy sertifikatlar',
      'Ustuvor qo‘llab-quvvatlash',
    ],
  },
];

export function Pricing() {
  const { user, patchUser } = useApp();

  return (
    <div>
      <PageHead
        icon="Crown"
        title="Tariflar"
        desc="O‘zingizga mos tarifni tanlang va imkoniyatlarni oching"
      />

      <div className="grid items-stretch gap-6 lg:grid-cols-3">
        {PLANS.map((p) => {
          const current = user?.plan === p.name;
          return (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-xl border p-7 ${
                p.popular
                  ? 'border-brand-500 bg-ink-800 '
                  : 'border-ink-700 bg-ink-800'
              }`}
            >
              {p.popular && (
                <span className="absolute right-6 top-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
                  Ommabop
                </span>
              )}
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                  p.popular
                    ? 'bg-brand-600 text-white'
                    : 'bg-brand-600/15 text-brand-300'
                }`}
              >
                <Icon name={p.icon} size={22} />
              </span>
              <h3 className="mt-5 text-lg font-bold text-white">{p.name}</h3>
              <p className="text-sm text-white/45">{p.desc}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-black text-white">
                  {p.price}
                </span>
                <span className="text-white/45">so‘m / oy</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li
                    key={f}
                    className="flex items-center gap-3 text-sm text-white/70"
                  >
                    <Icon name="Check" size={16} className="text-grass" />
                    {f}
                  </li>
                ))}
              </ul>
              <Button
                block
                className="mt-7"
                disabled={current}
                variant={current ? 'dark' : 'primary'}
                icon={current ? 'Check' : 'Crown'}
                onClick={() => patchUser({ plan: p.name })}
              >
                {current ? 'Joriy tarif' : 'Tanlash'}
              </Button>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-4 rounded-xl border border-ink-700 bg-ink-800 p-6">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-brand-600/15 text-brand-300">
          <Icon name="ShieldCheck" size={20} />
        </span>
        <p className="text-sm leading-relaxed text-white/55">
          Bu demo platforma — to‘lov amalga oshirilmaydi. Tarifni tanlasangiz,
          hisobingizdagi imkoniyatlar darhol yangilanadi. Istalgan vaqtda
          o‘zgartirishingiz mumkin.
        </p>
      </div>
    </div>
  );
}

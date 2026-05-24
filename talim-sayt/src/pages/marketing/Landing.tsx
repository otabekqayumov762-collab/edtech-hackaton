import { motion } from 'framer-motion';
import type { ReactNode } from 'react';
import { Button, SectionHead } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { Phone3D } from '../../components/Phone3D';
import { BlobTopLeft, BlobBottomRight, Dots } from '../../components/Decor';
import { useTestimonials, useSiteConfig } from '../../hooks/useSiteConfig';

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.45, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

const Section = ({
  id,
  className = '',
  children,
}: {
  id?: string;
  className?: string;
  children: ReactNode;
}) => (
  <section id={id} className={`mx-auto max-w-7xl px-5 ${className}`}>
    {children}
  </section>
);

const hoverCard =
  'group transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-200/30';
const hoverIcon =
  'transition-colors duration-300 group-hover:bg-brand-700 group-hover:text-white';
const hoverIconSolid =
  'transition-transform duration-300 group-hover:scale-110';

export function Landing() {
  const testimonials = useTestimonials();
  const siteCfg = useSiteConfig();
  return (
    <div className="overflow-x-hidden">
      {/* ============ HERO ============ */}
      <div className="relative overflow-x-hidden overflow-y-visible bg-white">
        {/* Yuqori-chap kichik dekoratsiya */}
        <BlobTopLeft className="left-[-40px] top-[-20px] h-[160px] w-[200px]" />
        <Dots className="left-16 top-10" cols={6} rows={6} />

        <Section className="relative grid items-center justify-items-center gap-12 overflow-visible py-14 lg:grid-cols-[1.05fr_1fr] lg:justify-items-stretch lg:py-20">
          {/* Chap — MF logo + heading */}
          <div className="relative z-10">
            <div className="relative inline-block leading-none">
              <h1
                className="leading-[0.82] tracking-[-0.04em] text-brand-700"
                style={{
                  fontSize: 'clamp(5.5rem, 12vw, 9rem)',
                  fontFamily: 'var(--font-heavy)',
                }}
              >
                MF
              </h1>
            </div>
            <p
              className="mt-1 tracking-[0.14em] text-brand-700"
              style={{
                fontSize: 'clamp(1.6rem, 3.2vw, 2.3rem)',
                fontFamily: 'var(--font-heavy)',
                letterSpacing: '0.12em',
              }}
            >
              PLATFORM
            </p>

            <h2
              className="mt-8 leading-[1.05] tracking-[-0.02em] text-zinc-950"
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 'clamp(1.7rem, 3vw, 2.5rem)',
              }}
            >
              Har kuni o‘rgan.
              <br />
              <span className="text-brand-700">Har kuni darajangni oshir.</span>
            </h2>
            <div className="mt-5 h-[3px] w-16 rounded-full bg-brand-700" />
            <p className="mt-5 max-w-md text-base leading-relaxed text-zinc-600 sm:text-[1.05rem]">
              9–11 sinf uchun majburiy fanlar — Matematika, Ingliz, Fanlar,
              Mantiq — qisqa, qiziqarli o‘yin-darslar. Avtobusda yoki tanaffusda
              ham bilim oshadi.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Button to="/register" size="lg" icon="ArrowRight">
                Bepul boshlash
              </Button>
              <Button to="/login" size="lg" variant="outline">
                Demo bilan kirib ko‘rish
              </Button>
            </div>
          </div>

          {/* O'ng — reklama bannerlaridagi kabi tik turgan telefon */}
          <div className="relative w-full max-w-[280px] min-h-[440px] overflow-visible p-4 sm:max-w-none sm:min-h-[520px] lg:min-h-[700px]">
            <div className="relative flex h-full items-center justify-center overflow-visible">
              <div className="w-full max-w-[230px] shrink-0 overflow-visible lg:-translate-y-6 lg:translate-x-12">
                <Phone3D />
              </div>
            </div>
          </div>
        </Section>
      </div>

      {/* ============ MUAMMO ============ */}
      <div className="relative border-t border-zinc-100 bg-zinc-50/60">
        <Dots className="right-10 top-10" cols={4} rows={4} />
        <Section className="py-20">
          <Reveal>
            <SectionHead
              eyebrow="Muammo"
              title={
                <>
                  Abituriyentlar nima bilan{' '}
                  <span className="text-brand-700">kurashadi</span>
                </>
              }
              desc="O‘zbekistonda har yili yuz minglab abituriyent universitetga tayyorlanadi. Quyidagilar haqiqiy to‘siqlar."
            />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {[
              { i: 'BookText', t: 'Majburiy fanlar', d: 'Yetarli e’tibor berilmaydi.' },
              { i: 'Wallet', t: 'Qimmat repetitor', d: 'Ko‘pchilik uchun yiroq.' },
              { i: 'ClipboardList', t: 'Zerikarli test', d: 'Monoton va motivatsiyasiz.' },
              { i: 'TrendingUp', t: 'Past motivatsiya', d: 'Uzoq saqlash qiyin.' },
              { i: 'MapPin', t: 'Qishloq hududlari', d: 'Sifatli imkoniyat cheklangan.' },
            ].map((p, idx) => (
              <Reveal key={p.t} delay={idx * 0.04}>
                <div className={`h-full rounded-2xl border border-zinc-200 bg-white p-5 ${hoverCard}`}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 ${hoverIcon}`}>
                    <Icon name={p.i} size={20} />
                  </span>
                  <h3 className="mt-4 font-bold text-zinc-950">{p.t}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{p.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.1}>
            <div className="mt-6 rounded-2xl bg-brand-100 px-6 py-5 text-center text-sm font-semibold text-brand-800">
              Natijada ko‘plab yoshlar aynan majburiy blok sababli yuqori ball
              yo‘qotmoqda.
            </div>
          </Reveal>
        </Section>
      </div>

      {/* ============ O'TKIR FARQ — AI REPETITOR ============ */}
      <div className="relative overflow-hidden border-y border-brand-100 bg-brand-50/40">
        <Section className="relative py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <Reveal>
              <span className="inline-flex items-center gap-2 rounded-full border border-brand-200 bg-white px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-brand-700">
                <Icon name="Lightbulb" size={13} /> Bozorda yo‘q bo‘lgan farq
              </span>
              <h2
                className="mt-5 leading-[1.05] tracking-[-0.02em] text-zinc-950"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: 'clamp(1.7rem, 3vw, 2.6rem)',
                }}
              >
                Bu test sayti emas.{' '}
                <span className="text-brand-700">
                  Har bir o‘quvchiga shaxsiy o‘qituvchi.
                </span>
              </h2>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-zinc-600">
                Hozir bozordagi hammaning mahsuloti bir xil ishlaydi:{' '}
                <span className="font-semibold text-zinc-950">
                  test ber → ball ko‘r → keyingisi
                </span>
                . Hech biri o‘quvchiga{' '}
                <span className="font-semibold text-zinc-950">nega xato</span>{' '}
                qilganini tushuntirmaydi. Aynan shu — bizning eshik ochar nuqtamiz.
              </p>
              <div className="mt-7 space-y-3 text-sm">
                {[
                  {
                    n: '01',
                    t: 'Xato javobni AI tahlil qiladi',
                    d: 'O‘quvchi nimani noto‘g‘ri tushungani aniqlanadi — taxmin emas, sabab.',
                  },
                  {
                    n: '02',
                    t: 'O‘sha mavzuni tushuntirib beradi',
                    d: 'Qisqa, og‘zaki uslubda. Kerak bo‘lsa misol bilan.',
                  },
                  {
                    n: '03',
                    t: 'Shaxsiy mashq beradi',
                    d: 'Faqat zaif joyga mo‘ljallangan, 3–5 savol — uzun "kurslar" emas.',
                  },
                ].map((x) => (
                  <div
                    key={x.n}
                    className="flex items-start gap-4 rounded-xl border border-brand-100 bg-white p-4"
                  >
                    <span className="font-display text-2xl font-black text-brand-700">
                      {x.n}
                    </span>
                    <div>
                      <p className="font-bold text-zinc-950">{x.t}</p>
                      <p className="mt-1 text-sm text-zinc-600">{x.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </Reveal>

            <Reveal delay={0.05}>
              <div className="rounded-2xl border border-brand-200 bg-white p-7">
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-display font-black text-brand-700"
                    style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)' }}
                  >
                    500 ming–1.5 mln
                  </span>
                  <span className="text-sm text-zinc-500">so‘m/oy</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  O‘zbekistonda jonli repetitor xizmatlari narxi. Ko‘pchilik
                  oilaga arzon emas.
                </p>
                <div className="my-7 h-px bg-brand-100" />
                <div className="flex items-baseline gap-2">
                  <span
                    className="font-display font-black text-zinc-950"
                    style={{ fontSize: 'clamp(2.2rem, 4vw, 3.4rem)' }}
                  >
                    49 900
                  </span>
                  <span className="text-sm text-zinc-500">so‘m/oy — Premium</span>
                </div>
                <p className="mt-2 text-sm text-zinc-600">
                  AI repetitor — 24/7 mavjud, kechqurun ham, dam olish kunlari
                  ham. Bitta repetitorning narxiga 10+ o‘quvchi foydalanadi.
                </p>
                <div className="mt-7 flex items-start gap-3 rounded-lg border border-brand-200 bg-brand-50 p-4">
                  <Icon name="ShieldCheck" size={20} className="text-brand-700" />
                  <p className="text-sm leading-relaxed text-zinc-700">
                    Ota-onalar uchun aniq qiymat:{' '}
                    <b className="text-zinc-950">
                      bola xato qilsa AI dialogga kirib o‘rgatadi
                    </b>{' '}
                    — repetitor topish, vaqt belgilash, qatnov to‘lash kerak emas.
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </Section>
      </div>

      {/* ============ BOZOR HAJMI ============ */}
      <Section className="relative py-20">
        <Dots className="left-6 top-10" cols={4} rows={4} />
        <Reveal>
          <SectionHead
            eyebrow="Bozor hajmi"
            title="Talab katta, o‘sish yuqori"
            desc="Raqamlar O‘zbekistondagi online ta’lim bozori juda katta ekanini ko‘rsatadi."
          />
        </Reveal>
        <div className="mt-10 grid gap-4 md:grid-cols-3">
          {[
            { ic: 'GraduationCap', v: '732 ming+', l: '2025-yilda OTMga hujjat topshirgan abituriyent' },
            { ic: 'BookOpen', v: '6.8 mln+', l: 'Maktab o‘quvchilari mavjud' },
            { ic: 'TrendingUp', v: '1.48 mln', l: '2020-yilda abituriyentlar soni' },
          ].map((s) => (
            <div key={s.v} className={`rounded-2xl border border-brand-100 bg-brand-50/50 p-6 ${hoverCard}`}>
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl bg-white text-brand-700 ${hoverIcon}`}>
                <Icon name={s.ic} size={22} />
              </span>
              <div className="mt-5 text-3xl font-black text-brand-800">
                {s.v}
              </div>
              <p className="mt-1 text-sm text-zinc-600">{s.l}</p>
            </div>
          ))}
        </div>
        <Reveal delay={0.05}>
          <div className={`mt-5 flex items-start gap-3 rounded-2xl border border-zinc-200 bg-white p-5 ${hoverCard}`}>
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <Icon name="Lightbulb" size={20} />
            </span>
            <p className="text-sm leading-relaxed text-zinc-700">
              <b className="text-zinc-950">Xulosa:</b> bozor kattaligi, talab
              yuqoriligi va raqamli ta’limga qiziqish — MF Platform uchun katta
              imkoniyat yaratadi.
            </p>
          </div>
        </Reveal>
      </Section>

      {/* ============ AUDITORIYA ============ */}
      <div className="relative border-y border-zinc-100 bg-zinc-50/60">
        <Section className="py-20">
          <Reveal>
            <SectionHead
              eyebrow="Auditoriya"
              title="Kim uchun yaratilgan"
              desc="MF Platform turli foydalanuvchilar ehtiyojini hisobga oladi."
            />
          </Reveal>
          <div className="mt-10 grid gap-4 lg:grid-cols-2">
            <div className={`rounded-2xl border border-zinc-200 bg-white p-7 ${hoverCard}`}>
              <h3 className="flex items-center gap-2 text-base font-bold text-zinc-950">
                <Icon name="Users" size={18} className="text-brand-700" />
                Asosiy foydalanuvchilar
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                {['10–11-sinf o‘quvchilari', 'Abituriyentlar', 'Repetitorsiz tayyorlanayotgan yoshlar'].map(
                  (x) => (
                    <li key={x} className="flex items-center gap-2.5">
                      <Icon name="Check" size={16} className="text-brand-700" />
                      {x}
                    </li>
                  ),
                )}
              </ul>
            </div>
            <div className={`rounded-2xl border border-zinc-200 bg-white p-7 ${hoverCard}`}>
              <h3 className="flex items-center gap-2 text-base font-bold text-zinc-950">
                <Icon name="GraduationCap" size={18} className="text-brand-700" />
                Ikkinchi auditoriya
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                {['Ota-onalar', 'Ustozlar', 'O‘quv markazlari va ta’lim muassasalari'].map(
                  (x) => (
                    <li key={x} className="flex items-center gap-2.5">
                      <Icon name="Check" size={16} className="text-brand-700" />
                      {x}
                    </li>
                  ),
                )}
              </ul>
            </div>
          </div>
        </Section>
      </div>

      {/* ============ BIZNING YECHIM ============ */}
      <Section className="py-20">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <Reveal>
            <span className="inline-flex text-xs font-bold uppercase tracking-wider text-brand-700">
              Bizning yechim
            </span>
            <h2 className="mt-3 text-3xl font-extrabold text-zinc-950 sm:text-4xl">
              MF Platform — majburiy fanlardan{' '}
              <span className="text-brand-700">o‘yin tarzida</span> tayyorgarlik
            </h2>
            <ul className="mt-6 space-y-3">
              {[
                { i: 'Gamepad2', t: 'O‘yin tizimi', d: 'XP, level va medal yig‘ish' },
                { i: 'Trophy', t: 'Reyting tizimi', d: 'Reyting va musobaqalar' },
                { i: 'Flame', t: 'Kunlik seriya', d: 'Har kuni o‘qish odati' },
                { i: 'PieChart', t: 'Test tahlili', d: 'Batafsil natija ko‘rinishi' },
                { i: 'Bot', t: 'AI yordamchi', d: 'Sun’iy intellekt suhbatdosh' },
                { i: 'Smartphone', t: 'Mobil ta‘lim', d: 'Istalgan joyda o‘qish' },
              ].map((x) => (
                <li
                  key={x.t}
                  className={`flex items-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 ${hoverCard}`}
                >
                  <span className={`flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 ${hoverIcon}`}>
                    <Icon name={x.i} size={18} />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-zinc-950">{x.t}</div>
                    <div className="text-xs text-zinc-600">{x.d}</div>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex items-start gap-3 rounded-xl bg-brand-50 p-4">
              <Icon name="Target" size={18} className="mt-0.5 text-brand-700" />
              <p className="text-sm text-zinc-700">
                <b>Bizning maqsadimiz:</b> tayyorgarlikni qiziqarli, samarali
                va natijaga yo‘naltirish.
              </p>
            </div>
          </Reveal>
          <Reveal delay={0.1}>
            <Phone3D />
          </Reveal>
        </div>
      </Section>

      {/* ============ NEGA GAMIFICATION ============ */}
      <div className="relative border-y border-zinc-100 bg-zinc-50/60">
        <Dots className="right-8 top-8" cols={4} rows={4} />
        <Section className="py-20">
          <Reveal>
            <SectionHead
              eyebrow="Nega gamification?"
              title="O‘yin elementlari ajoyib natija beradi"
              desc="Dunyo tajribasi shuni ko‘rsatadiki, gamification ta’limda samaradorlikni keskin oshiradi."
            />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: 'Brain', t: 'Tezroq o‘rganish', d: 'O‘yin elementlari ma’lumotni eslab qolishni osonlashtiradi.' },
              { i: 'TrendingUp', t: 'Yuqori engagement', d: 'Foydalanuvchilar platformada ko‘proq vaqt qoladi.' },
              { i: 'Target', t: 'Motivatsiya', d: 'Mukofot, reyting va yutuqlar oldinga undaydi.' },
              { i: 'Users', t: 'Sog‘lom raqobat', d: 'Reyting va leaderboardlar tabiiy musobaqa yaratadi.' },
              { i: 'Trophy', t: 'Natijadorlik', d: 'An’anaviy usullarga qaraganda yaxshiroq natija.' },
              { i: 'Flame', t: 'Kuchli odat', d: 'Streak har kuni o‘qish odatini shakllantiradi.' },
            ].map((g, i) => (
              <Reveal key={g.t} delay={i * 0.03}>
                <div className={`h-full rounded-2xl border border-zinc-200 bg-white p-6 ${hoverCard}`}>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 ${hoverIcon}`}>
                    <Icon name={g.i} size={20} />
                  </span>
                  <h3 className="mt-4 font-bold text-zinc-950">{g.t}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{g.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      </div>

      {/* ============ XALQARO TAJRIBA ============ */}
      <Section id="tajriba" className="relative py-20">
        <Reveal>
          <SectionHead
            eyebrow="Xalqaro tajriba"
            title="Dunyodagi muvaffaqiyatli modellar"
            desc="MF Platform ushbu tajribalarni O‘zbekiston bozori uchun lokalizatsiya qiladi."
          />
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              n: 'Duolingo',
              c: 'AQSh',
              t: 'Gamified learning',
              i: 'Gamepad2',
              logo: '/logos/duolingo.png',
            },
            {
              n: 'Khan Academy',
              c: 'AQSh',
              t: 'Test preparation',
              i: 'GraduationCap',
              logo: '/logos/khan-academy.png',
            },
            {
              n: 'Yuanfudao',
              c: 'Xitoy',
              t: 'AI + exam prep',
              i: 'Bot',
              logo: '/logos/yuanfudao.png',
            },
            {
              n: 'Quizlet',
              c: 'AQSh',
              t: 'Flashcards',
              i: 'Layers',
              logo: '/logos/quizlet.png',
            },
          ].map((p) => (
            <div key={p.n} className={`rounded-2xl border border-zinc-200 bg-white p-5 ${hoverCard}`}>
              <span
                className={`flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl ${
                  p.logo
                    ? 'bg-transparent'
                    : `bg-brand-100 text-brand-700 ${hoverIcon}`
                }`}
              >
                {p.logo ? (
                  <img
                    src={p.logo}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon name={p.i} size={20} />
                )}
              </span>
              <h3 className="mt-3 font-bold text-zinc-950">{p.n}</h3>
              <p className="text-xs text-zinc-500">{p.c}</p>
              <p className="mt-3 inline-block rounded-md bg-brand-50 px-2.5 py-1 text-xs font-semibold text-brand-700">
                {p.t}
              </p>
            </div>
          ))}
        </div>
        <div className="mt-6 grid gap-3 rounded-2xl border border-brand-200 bg-brand-50/60 p-5 sm:grid-cols-5">
          {[
            { i: 'Globe', t: 'Lokal kontent' },
            { i: 'BookText', t: 'Ona tilida' },
            { i: 'Smartphone', t: 'Mobil avval' },
            { i: 'Gamepad2', t: 'O‘yin tizimi' },
            { i: 'LineChart', t: 'AI tahlil' },
          ].map((x) => (
            <div key={x.t} className="flex items-center gap-2.5">
              <Icon name={x.i} size={18} className="text-brand-700" />
              <span className="text-sm font-semibold text-zinc-800">
                {x.t}
              </span>
            </div>
          ))}
        </div>
      </Section>

      {/* ============ abt.uz VS MF ============ */}
      <div className="border-y border-zinc-100 bg-zinc-50/60">
        <Section className="py-20">
          <Reveal>
            <SectionHead
              center
              eyebrow="Taqqoslash"
              title="Nima uchun mavjud platformalar yetarli emas"
              desc="abt.uz faqat test bazasi sifatida ishladi va foydalanuvchi ehtiyojini to‘liq qondira olmadi."
            />
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-5xl items-stretch gap-5 lg:grid-cols-2">
            <div className="group rounded-2xl border-2 border-rose-accent/25 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-rose-accent/25">
              <h3 className="flex items-center gap-2 text-base font-bold text-rose-accent">
                <Icon name="XCircle" size={20} /> abt.uz nima qildi
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                {[
                  'Faqat test bazasi sifatida ishladi',
                  'Motivatsiya tizimi kuchsiz',
                  'O‘yin elementlari mavjud emas',
                  'Foydalanuvchini ushlab qolish past',
                  'Zamonaviy mobil UX yetishmadi',
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2.5">
                    <Icon name="X" size={16} className="text-rose-accent" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
            <div className="group rounded-2xl border-2 border-brand-300 bg-white p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-300/40">
              <h3 className="flex items-center gap-2 text-base font-bold text-brand-700">
                <Icon name="CheckCircle2" size={20} /> MF Platform nima taklif
              </h3>
              <ul className="mt-5 space-y-3 text-sm text-zinc-700">
                {[
                  'O‘yin tizimi va motivatsion mexanizm',
                  'Ushlab qolish uchun kuchli vositalar',
                  'AI asosida tahlil va shaxsiy yondashuv',
                  'Mobil ustun, sodda va qulay UX',
                  'O‘yin elementlari orqali qiziqarli o‘rganish',
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2.5">
                    <Icon name="Check" size={16} className="text-brand-700" />
                    {x}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Section>
      </div>

      {/* ============ IMKONIYATLAR ============ */}
      <Section id="imkoniyatlar" className="py-20">
        <Reveal>
          <SectionHead
            eyebrow="Imkoniyatlar"
            title="MF Platform asosiy imkoniyatlari"
            desc="O‘quvchilarga o‘yinlashtirilgan, interaktiv va samarali ta’lim tajribasi."
          />
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { i: 'Gamepad2', t: 'O‘yin tizimi', d: 'XP, level, medal va reyting orqali rag‘batlantirish.' },
            { i: 'Target', t: 'Interaktiv jarayon', d: 'Testlar, video darslar va mashqlar.' },
            { i: 'Brain', t: 'AI shaxsiy yondashuv', d: 'Kuchli va zaif tomonlarni aniqlab tavsiyalar.' },
            { i: 'Smartphone', t: 'Mobil qulaylik', d: 'Android va iOS uchun optimallashtirilgan.' },
            { i: 'Users', t: 'Jamoa va raqobat', d: 'Do‘stlar bilan musobaqa va leaderboard.' },
            { i: 'BarChart3', t: 'Batafsil tahlil', d: 'Statistika va progress monitoringi.' },
            { i: 'ShieldCheck', t: 'Xavfsiz va ishonchli', d: 'Ma’lumotlar himoyalangan, zaxiralanadi.' },
            { i: 'GraduationCap', t: 'Ko‘p fanli platforma', d: 'Maktab fanlaridan kirish imtihonlarigacha.' },
            { i: 'Headphones', t: '24/7 qo‘llab-quvvatlash', d: 'Istalgan vaqtda tez va sifatli yordam.' },
          ].map((f, i) => (
            <Reveal key={f.t} delay={i * 0.03}>
              <div className={`h-full rounded-2xl border border-zinc-200 bg-white p-6 ${hoverCard}`}>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-100 text-brand-700 transition-colors duration-300 group-hover:bg-brand-200">
                  <Icon name={f.i} size={22} />
                </span>
                <h3 className="mt-4 font-bold text-zinc-950">{f.t}</h3>
                <p className="mt-1 text-sm text-zinc-600">{f.d}</p>
              </div>
              </Reveal>
            ))}
        </div>
      </Section>

      {/* ============ JARAYON ============ */}
      <div className="relative border-y border-zinc-100 bg-zinc-50/60">
        <Section id="jarayon" className="py-20">
          <Reveal>
            <SectionHead
              eyebrow="Jarayon"
              title="Muvaffaqiyatga 6 qadam"
            />
          </Reveal>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: 'User', t: 'Ro‘yxatdan o‘tish', d: 'Tez va oson kabinet yarating.' },
              { i: 'ClipboardCheck', t: 'Diagnostika', d: 'Boshlang‘ich test bilim darajangizni aniqlaydi.' },
              { i: 'GraduationCap', t: 'Shaxsiy reja', d: 'AI siz uchun optimal o‘quv reja tuzadi.' },
              { i: 'Play', t: 'O‘qish va amaliyot', d: 'Video, interaktiv testlar va mashqlar.' },
              { i: 'LineChart', t: 'Tahlil', d: 'Progress doimiy kuzatiladi.' },
              { i: 'Trophy', t: 'Maqsad sari', d: 'Reyting va yutuqlar motivatsiyani yuqori tutadi.' },
            ].map((s, i) => (
              <Reveal key={s.t} delay={i * 0.04}>
                <div className={`relative h-full rounded-2xl border border-zinc-200 bg-white p-6 ${hoverCard}`}>
                  <span className="absolute right-5 top-5 font-display text-3xl font-black text-brand-100 transition-colors duration-300 group-hover:text-brand-200">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl bg-brand-700 text-white ${hoverIconSolid}`}>
                    <Icon name={s.i} size={20} />
                  </span>
                  <h3 className="mt-4 font-bold text-zinc-950">{s.t}</h3>
                  <p className="mt-1 text-sm text-zinc-600">{s.d}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </Section>
      </div>

      {/* ============ HAQIMIZDA ============ */}
      <Section id="haqimizda" className="py-20">
        <Reveal>
          <SectionHead
            eyebrow="Haqimizda"
            title="MF Platform haqida"
            desc={siteCfg.footer_about}
          />
        </Reveal>
        <div className="mt-10 grid gap-4 lg:grid-cols-3">
          {[
            {
              i: 'Target',
              t: 'Missiyamiz',
              d: 'Abituriyentlar uchun tayyorgarlikni qiziqarli, samarali va natijaga yo‘naltirilgan qilish.',
            },
            {
              i: 'Sparkles',
              t: 'Yondashuvimiz',
              d: 'Gamifikatsiya, AI repetitor va shaxsiy o‘quv rejasi — bitta platformada.',
            },
            {
              i: 'Users',
              t: 'Jamoamiz',
              d: 'Ta’lim, dizayn va texnologiya mutaxassislari O‘zbekiston bozori uchun ishlaydi.',
            },
          ].map((x, i) => (
            <Reveal key={x.t} delay={i * 0.05}>
              <div className={`h-full rounded-2xl border border-zinc-200 bg-white p-6 ${hoverCard}`}>
                <span
                  className={`flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700 ${hoverIcon}`}
                >
                  <Icon name={x.i} size={20} />
                </span>
                <h3 className="mt-4 font-bold text-zinc-950">{x.t}</h3>
                <p className="mt-2 text-sm leading-relaxed text-zinc-600">{x.d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </Section>

      {/* ============ NATIJALAR ============ */}
      <Section className="py-16">
        <div className="grid gap-8 rounded-2xl border border-zinc-200 bg-white p-8 sm:grid-cols-3 lg:grid-cols-5">
          {[
            { v: '100K+', l: 'Faol foydalanuvchi', i: 'Users' },
            { v: '50K+', l: 'Dars va material', i: 'BookOpen' },
            { v: '98%', l: 'Qoniqish darajasi', i: 'CheckCircle2' },
            { v: '2x', l: 'O‘rtacha natija o‘sishi', i: 'TrendingUp' },
            { v: '150+', l: 'Mamlakatda', i: 'Globe' },
          ].map((s) => (
            <div key={s.l}>
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
                <Icon name={s.i} size={18} />
              </span>
              <div className="mt-4 text-3xl font-black text-zinc-950">{s.v}</div>
              <div className="mt-0.5 text-sm text-zinc-600">{s.l}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* ============ TARIFLAR ============ */}
      <div className="border-y border-zinc-100 bg-zinc-50/60">
        <Section id="tariflar" className="py-20">
          <Reveal>
            <SectionHead
              center
              eyebrow="Tariflar"
              title="Siz uchun mos tarif"
              desc="Bepul boshlang, kerak bo‘lganda istalgan vaqtda yangilang."
            />
          </Reveal>
          <div className="mx-auto mt-10 grid max-w-5xl items-stretch gap-4 lg:grid-cols-3">
            <PlanCard
              name="Bepul"
              icon="Sparkles"
              price="0"
              features={['Cheklangan darslar', 'Asosiy testlar', 'Kunlik maqsadlar', 'Reyting tizimi']}
            />
            <PlanCard
              name="Premium"
              icon="Crown"
              price="49 900"
              popular
              features={['Barcha darslar va testlar', 'AI shaxsiy yondashuv', 'Batafsil statistika', 'Reklamasiz tajriba']}
            />
            <PlanCard
              name="Premium+"
              icon="Medal"
              price="99 900"
              features={['Premium imkoniyatlari', 'Live darslar', 'Mentorlardan yordam', 'Sertifikatlar']}
            />
          </div>
        </Section>
      </div>

      {/* ============ ROADMAP ============ */}
      <Section className="py-20">
        <Reveal>
          <SectionHead
            eyebrow="Kelajak rejalari"
            title="MF Platform yo‘l xaritasi"
          />
        </Reveal>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              y: '2026',
              t: 'Kuchli va stabil ekotizim yaratish',
              i: 'BookOpen',
              details: [
                'AI asosidagi adaptiv test tizimi',
                'Smart ranking va XP sistemi',
                'Daily streak & motivation system',
                'Teacher dashboard 2.0',
                'Mobil ilova (Android/iOS)',
                'Offline mode',
                'O‘quvchilar uchun AI tutor',
                'Ota-onalar monitoring paneli',
                'Real-time analytics',
              ],
            },
            {
              y: '2027',
              t: 'MF Platformni “aqlli ustoz” darajasiga olib chiqish',
              i: 'Smartphone',
              details: [
                'Voice AI Assistant',
                'AI orqali individual learning path',
                'Speech checking (IELTS/SAT)',
                'AI essay checker',
                'AI-generated homework',
                'Emotion & engagement analytics',
                'Smart classroom system',
                'AI mentor tavsiyalari',
              ],
            },
            {
              y: '2028',
              t: 'Ta’limni immersive qilish',
              i: 'Brain',
              details: [
                'VR/AR darslar',
                '3D virtual laboratory',
                'Multiplayer quiz arena',
                'Avatar system',
                'Virtual school campus',
                'AI NPC tutorlar',
                'Mission-based learning',
                'Interactive historical simulations',
              ],
            },
            {
              y: '2029',
              t: 'Global bozorga chiqish',
              i: 'Sparkles',
              details: [
                'Ingliz va turk tillari',
                'SAT / IELTS / TOEFL bo‘limlari',
                'International certificates',
                'Global leaderboard',
                'AI translation system',
                'International teachers marketplace',
                'Regional servers & localization',
              ],
            },
            {
              y: '2030',
              t: 'MF Platformni to‘liq AI-driven education OS qilish',
              i: 'Globe',
              details: [
                'AI-generated personalized curriculum',
                'Fully autonomous AI tutor',
                'Brain-based adaptive learning',
                'Predictive student success analytics',
                'AI career consultant',
                'AI portfolio builder',
                'University recommendation engine',
                'Blockchain certificate verification',
              ],
            },
          ].map((r) => (
            <div
              key={r.y}
              className={`rounded-2xl border border-zinc-200 bg-white p-5 ${hoverCard}${
                'details' in r && r.details
                  ? ' min-h-[8.5rem] overflow-hidden transition-[min-height,transform,box-shadow,border-color] duration-300 ease-out hover:min-h-[22rem] hover:border-brand-200'
                  : ''
              }`}
            >
              {'details' in r && r.details ? (
                <div className="relative">
                  <div className="transition-all duration-300 ease-out group-hover:absolute group-hover:inset-x-0 group-hover:top-0 group-hover:pointer-events-none group-hover:-translate-y-1 group-hover:opacity-0">
                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 ${hoverIcon}`}
                    >
                      <Icon name={r.i} size={18} />
                    </span>
                    <div className="mt-4 text-sm font-bold text-brand-700">{r.y}</div>
                    <p className="mt-1 text-sm text-zinc-700">{r.t}</p>
                  </div>
                  <ul className="max-h-0 space-y-2 overflow-hidden opacity-0 transition-all duration-300 ease-out group-hover:max-h-80 group-hover:opacity-100">
                    {r.details.map((item, i) => (
                      <li
                        key={item}
                        className="flex gap-2 text-xs leading-relaxed text-zinc-700 opacity-0 transition-all duration-300 ease-out group-hover:opacity-100"
                        style={{ transitionDelay: `${120 + i * 40}ms` }}
                      >
                        <span className="shrink-0 font-semibold text-brand-600">*</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <>
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700 ${hoverIcon}`}
                  >
                    <Icon name={r.i} size={18} />
                  </span>
                  <div className="mt-4 text-sm font-bold text-brand-700">{r.y}</div>
                  <p className="mt-1 text-sm text-zinc-700">{r.t}</p>
                </>
              )}
            </div>
          ))}
        </div>
      </Section>

      {/* ============ TESTIMONIAL ============ */}
      <div className="border-y border-zinc-100 bg-zinc-50/60">
        <Section id="sharhlar" className="py-20">
          <Reveal>
            <SectionHead
              center
              eyebrow="Sharhlar"
              title="Foydalanuvchilar fikri"
            />
          </Reveal>
          <div className="mt-10 overflow-hidden">
            <div className="marquee-track flex gap-4">
              {[...testimonials, ...testimonials].map((q, idx) => (
                <div
                  key={`${q.id}-${idx}`}
                  className={`w-[320px] shrink-0 rounded-2xl border border-zinc-200 bg-white p-6 sm:w-[380px] ${hoverCard}`}
                >
                  <Icon name="Quote" size={26} className="text-brand-300" />
                  <p className="mt-3 line-clamp-4 leading-relaxed text-zinc-700">{q.text}</p>
                  <div className="mt-5 flex items-center gap-3 border-t border-zinc-100 pt-4">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-full font-bold text-zinc-900"
                      style={{ background: q.avatar_color }}
                    >
                      {q.name[0]}
                    </span>
                    <div>
                      <p className="text-sm font-bold text-zinc-950">{q.name}</p>
                      <p className="text-xs text-zinc-500">{q.region}</p>
                    </div>
                    <div className="ml-auto flex gap-0.5 text-amber-400">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <Icon key={s} name="Star" size={14} />
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Section>
      </div>

      {/* ============ CTA / BOG'LANISH ============ */}
      <Section id="boglanish" className="py-20">
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white px-8 py-16 text-center text-slate-900 shadow-sm">
          <BlobTopLeft className="left-[-60px] top-[-30px] h-44 w-48 opacity-40" />
          <BlobBottomRight className="bottom-[-80px] right-[-60px] h-60 w-72 opacity-30" />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl text-3xl font-black sm:text-4xl">
              Bugun boshlang, ertangi kuni yuting
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-slate-600">
              MF Platform bilan bilimga investitsiya qiling va orzularingiz
              sari dadil qadam qo‘ying.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button to="/register" size="lg">
                Hozir ro‘yxatdan o‘tish
              </Button>
              <Button
                to="/login"
                size="lg"
                className="!bg-slate-900 hover:!bg-slate-800 !text-white border border-slate-900"
              >
                Demo bilan kirish
              </Button>
            </div>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 text-sm text-slate-500">
              <span className="flex items-center gap-2">
                <Icon name="Globe" size={15} /> {siteCfg.contact_website}
              </span>
              <span className="flex items-center gap-2">
                <Icon name="Mail" size={15} /> {siteCfg.contact_email}
              </span>
              <span className="flex items-center gap-2">
                <Icon name="Phone" size={15} /> {siteCfg.contact_phone}
              </span>
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}

function PlanCard({
  name,
  icon,
  price,
  features,
  popular,
}: {
  name: string;
  icon: string;
  price: string;
  features: string[];
  popular?: boolean;
}) {
  return (
    <div
      className={`relative flex h-full flex-col rounded-2xl border-2 p-7 transition-all duration-300 ease-out hover:-translate-y-1 hover:shadow-lg ${
        popular
          ? 'border-brand-600 bg-white text-slate-900 shadow-md shadow-brand-200/40 ring-1 ring-brand-200 hover:shadow-brand-200/60'
          : 'border-slate-200 bg-white text-slate-900 hover:shadow-slate-200/60'
      }`}
    >
      {popular && (
        <span className="absolute right-6 top-6 rounded-full bg-brand-600 px-3 py-1 text-xs font-bold text-white">
          Ommabop
        </span>
      )}
      <span
        className={`flex h-11 w-11 items-center justify-center rounded-xl ${
          popular ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-700'
        }`}
      >
        <Icon name={icon} size={20} />
      </span>
      <h3 className="mt-5 text-lg font-bold">{name}</h3>
      <div className="mt-2 flex items-end gap-1">
        <span className="text-3xl font-black">{price}</span>
        <span className="text-slate-500">so‘m / oy</span>
      </div>
      <ul className="mt-6 flex-1 space-y-3">
        {features.map((f) => (
          <li
            key={f}
            className="flex items-center gap-2.5 text-sm text-slate-700"
          >
            <Icon
              name="Check"
              size={15}
              className={popular ? 'text-brand-600' : 'text-slate-700'}
            />
            {f}
          </li>
        ))}
      </ul>
      <Button to="/register" block className="mt-7">
        Tanlash
      </Button>
    </div>
  );
}

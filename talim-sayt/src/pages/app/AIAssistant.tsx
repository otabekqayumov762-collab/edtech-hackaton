import { useRef, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '../../store/useApp';
import { Icon } from '../../components/Icon';
import { PageHead } from './_shared';
import type { ChatMessage } from '../../lib/types';

const SUGGESTIONS = [
  'Kvadrat tenglama qanday yechiladi?',
  'Bugun nimani o‘rganishim kerak?',
  'Fizikadan zaif tomonim qaysi?',
  'Motivatsiya bo‘yicha maslahat ber',
];

function aiReply(text: string, name: string): string {
  const t = text.toLowerCase();
  if (t.includes('kvadrat') || t.includes('tenglama'))
    return 'Kvadrat tenglama ax² + bx + c = 0 ko‘rinishida bo‘ladi. Avval diskriminantni toping: D = b² − 4ac. So‘ng x = (−b ± √D) / 2a formulasidan foydalaning. "Kvadrat tenglamalar" darsini ko‘rib chiqishni tavsiya qilaman.';
  if (t.includes('fizika'))
    return 'Statistikangizga ko‘ra Fizikada o‘zlashtirish o‘rtacha darajada. "Nyutonning qonunlari" va "Elektr toki" mavzularini takrorlab, mavzu testlarini yechib ko‘ring — bu zaif joylarni aniqlaydi.';
  if (t.includes('bugun') || t.includes('nima'))
    return `${name}, bugun uchun reja: 1) 1 ta yangi dars (Matematika), 2) 1 ta mavzu testi, 3) 10 ta savollik kunlik challenge. Bu kunlik maqsadingizni yopadi va seriyangizni saqlaydi.`;
  if (t.includes('motivatsiya') || t.includes('maslahat'))
    return 'Kichik, lekin doimiy qadamlar katta natija beradi. Har kuni atigi 20 daqiqa ajrating, seriyangizni uzmang va reytingda do‘stlaringiz bilan raqobatlashing — bu engagement’ni keskin oshiradi.';
  return 'Yaxshi savol! Men sizning darajangiz va statistikangizga qarab shaxsiy tavsiya bera olaman. Aniqroq fan yoki mavzu nomini yozing, men mos darslar va testlarni tavsiya qilaman.';
}

export function AIAssistant() {
  const { user } = useApp();
  const [msgs, setMsgs] = useState<ChatMessage[]>([
    {
      id: 'm0',
      role: 'ai',
      text: `Salom, ${user?.name.split(' ')[0] ?? 'do‘stim'}! Men MF AI yordamchingizman. O‘qishingiz bo‘yicha istalgan savol bering — fan, mavzu yoki shaxsiy reja.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, typing]);

  const send = (text: string) => {
    const v = text.trim();
    if (!v) return;
    setMsgs((m) => [...m, { id: 'u' + Date.now(), role: 'user', text: v }]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMsgs((m) => [
        ...m,
        {
          id: 'a' + Date.now(),
          role: 'ai',
          text: aiReply(v, user?.name.split(' ')[0] ?? 'do‘stim'),
        },
      ]);
    }, 900);
  };

  return (
    <div>
      <PageHead
        icon="Bot"
        title="AI yordamchi"
        desc="Sun’iy intellekt asosidagi shaxsiy o‘quv maslahatchi"
      />

      <div className="flex h-[68vh] flex-col rounded-xl border border-ink-700 bg-ink-800">
        <div className="flex-1 space-y-4 overflow-y-auto p-5">
          {msgs.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 ${
                m.role === 'user' ? 'flex-row-reverse' : ''
              }`}
            >
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                  m.role === 'ai'
                    ? 'bg-brand-600 text-white'
                    : 'bg-ink-700 text-white/70'
                }`}
              >
                <Icon name={m.role === 'ai' ? 'Bot' : 'User'} size={17} />
              </span>
              <div
                className={`max-w-[78%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'ai'
                    ? 'bg-ink-900 text-white/80'
                    : 'bg-brand-600 text-white'
                }`}
              >
                {m.text}
              </div>
            </motion.div>
          ))}
          {typing && (
            <div className="flex gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white">
                <Icon name="Bot" size={17} />
              </span>
              <div className="flex items-center gap-1 rounded-lg bg-ink-900 px-4 py-4">
                {[0, 1, 2].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 animate-bounce rounded-full bg-white/40"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>

        <div className="border-t border-ink-700 p-4">
          <div className="mb-3 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="rounded-full border border-ink-700 bg-ink-900 px-3 py-1.5 text-xs font-medium text-white/55 transition-colors hover:border-brand-500 hover:text-white"
              >
                {s}
              </button>
            ))}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Savolingizni yozing..."
              className="h-12 flex-1 rounded-xl border border-ink-700 bg-ink-900 px-4 text-sm text-white outline-none placeholder:text-white/30 focus:border-brand-500"
            />
            <button
              type="submit"
              className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white transition-colors hover:bg-brand-700"
            >
              <Icon name="Send" size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

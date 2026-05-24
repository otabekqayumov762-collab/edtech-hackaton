import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthShell, Field } from './AuthShell';
import { Button } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { useApp } from '../../store/useApp';

type FieldErrors = {
  name?: string;
  email?: string;
  password?: string;
  form?: string;
};

function parseAxiosError(err: unknown): FieldErrors {
  if (!axios.isAxiosError(err)) {
    return { form: 'Kutilmagan xatolik. Qayta urinib ko‘ring.' };
  }
  if (!err.response) {
    return {
      form: 'Internet ulanish yo‘q yoki server javob bermayapti.',
    };
  }
  const { status, data } = err.response;
  if (status === 400 && data && typeof data === 'object') {
    const d = data as Record<string, unknown>;
    const out: FieldErrors = {};
    const pick = (k: string): string | undefined => {
      const v = d[k];
      if (Array.isArray(v) && v.length) return String(v[0]);
      if (typeof v === 'string') return v;
      return undefined;
    };
    const emailMsg = pick('email');
    const nameMsg = pick('name');
    const pwdMsg = pick('password');
    if (emailMsg) {
      if (/exist|already|unique/i.test(emailMsg)) {
        out.email = 'Bu email allaqachon ro‘yxatdan o‘tgan.';
      } else {
        out.email = emailMsg;
      }
    }
    if (nameMsg) out.name = nameMsg;
    if (pwdMsg) {
      if (/too short|kamida/i.test(pwdMsg)) {
        out.password = 'Parol kamida 8 ta belgidan iborat bo‘lsin.';
      } else if (/numeric|raqam/i.test(pwdMsg)) {
        out.password = 'Parol faqat raqamlardan iborat bo‘lmasin.';
      } else if (/common|oddiy/i.test(pwdMsg)) {
        out.password = 'Parol juda oddiy. Murakkabroq parol tanlang.';
      } else {
        out.password = pwdMsg;
      }
    }
    const nonField = pick('non_field_errors') ?? pick('detail');
    if (nonField) out.form = nonField;
    if (!out.email && !out.name && !out.password && !out.form) {
      out.form = 'Ma’lumotlarni tekshirib qayta urinib ko‘ring.';
    }
    return out;
  }
  if (status && status >= 500) {
    return { form: 'Serverda xatolik. Birozdan keyin urinib ko‘ring.' };
  }
  return { form: 'Ro‘yxatdan o‘tishda xatolik yuz berdi.' };
}

export function Register() {
  const { register } = useApp();
  const nav = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const next: FieldErrors = {};
    const trimmedName = name.trim();
    if (trimmedName.length < 2)
      next.name = 'Ism kamida 2 ta belgidan iborat bo‘lsin.';
    else if (!/^[A-Za-zА-Яа-яЁёʻʼ‘’'\s-]+$/.test(trimmedName))
      next.name = 'Ism faqat harflardan iborat bo‘lsin.';
    if (!email.trim()) next.email = 'Email kiriting.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'To‘g‘ri email kiriting.';
    if (!password) next.password = 'Parol kiriting.';
    else if (password.length < 8)
      next.password = 'Parol kamida 8 ta belgidan iborat bo‘lsin.';
    else if (/^\d+$/.test(password))
      next.password = 'Parol faqat raqamlardan iborat bo‘lmasin.';
    if (next.name || next.email || next.password) {
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await register({ name: trimmedName, email, password });
      nav('/onboarding/vaqt');
    } catch (err) {
      setErrors(parseAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Hisob yarating"
      subtitle="Bir daqiqada ro‘yxatdan o‘ting va birinchi XP ni yig‘ing."
    >
      <motion.form
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        onSubmit={submit}
        className="space-y-4"
        noValidate
      >
        <div>
          <Field label="Ism familiya" icon="User">
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((s) => ({ ...s, name: undefined }));
              }}
              className="h-12 w-full bg-transparent text-sm outline-none"
              placeholder="Saydalixon Islomov"
              autoComplete="name"
              aria-invalid={Boolean(errors.name)}
            />
          </Field>
          {errors.name && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {errors.name}
            </p>
          )}
        </div>

        <div>
          <Field label="Email" icon="Mail">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email)
                  setErrors((s) => ({ ...s, email: undefined }));
              }}
              className="h-12 w-full bg-transparent text-sm outline-none"
              placeholder="email@misol.uz"
              autoComplete="email"
              aria-invalid={Boolean(errors.email)}
            />
          </Field>
          {errors.email && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {errors.email}
            </p>
          )}
        </div>

        <div>
          <Field label="Parol" icon="Lock">
            <input
              type={show ? 'text' : 'password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password)
                  setErrors((s) => ({ ...s, password: undefined }));
              }}
              className="h-12 w-full bg-transparent text-sm outline-none"
              placeholder="Kamida 8 ta belgi"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="cursor-pointer text-slate-400 transition-colors hover:text-slate-600"
              aria-label={show ? 'Parolni yashirish' : 'Parolni ko‘rsatish'}
              tabIndex={-1}
            >
              <Icon name={show ? 'EyeOff' : 'Eye'} size={17} />
            </button>
          </Field>
          {errors.password && (
            <p className="mt-1.5 text-xs font-medium text-rose-600">
              {errors.password}
            </p>
          )}
          {!errors.password && (
            <p className="mt-1.5 text-xs text-zinc-500">
              Kamida 8 ta belgi, faqat raqamlar bo‘lmasin.
            </p>
          )}
        </div>

        {errors.form && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
          >
            <Icon name="AlertCircle" size={14} className="mt-0.5 shrink-0" />
            <span>{errors.form}</span>
          </motion.div>
        )}

        <p className="text-xs leading-relaxed text-zinc-500">
          Ro‘yxatdan o‘tish orqali{' '}
          <a className="font-medium text-zinc-700 hover:underline" href="#">
            foydalanish shartlari
          </a>{' '}
          va{' '}
          <a className="font-medium text-zinc-700 hover:underline" href="#">
            maxfiylik siyosatiga
          </a>{' '}
          rozilik bildirasiz.
        </p>

        <Button
          type="submit"
          block
          size="lg"
          icon={loading ? undefined : 'Rocket'}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Ro‘yxatdan o‘tilmoqda...
            </>
          ) : (
            'Ro‘yxatdan o‘tish'
          )}
        </Button>
      </motion.form>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Hisobingiz bormi?{' '}
        <Link to="/login" className="font-bold text-brand-700 hover:underline">
          Kirish
        </Link>
      </p>
    </AuthShell>
  );
}

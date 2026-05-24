import { useState, type FormEvent } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import { AuthShell, Field } from './AuthShell';
import { Button } from '../../components/ui';
import { Icon } from '../../components/Icon';
import { useApp } from '../../store/useApp';

type FieldErrors = {
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
  if (status === 401 || status === 400) {
    if (data && typeof data === 'object') {
      const d = data as Record<string, unknown>;
      const out: FieldErrors = {};
      if (Array.isArray(d.email)) out.email = String(d.email[0]);
      if (Array.isArray(d.password)) out.password = String(d.password[0]);
      if (Array.isArray(d.non_field_errors)) {
        out.form = String(d.non_field_errors[0]);
      }
      if (typeof d.detail === 'string') out.form = d.detail;
      if (!out.email && !out.password && !out.form) {
        out.form = 'Email yoki parol noto‘g‘ri.';
      }
      if (out.form === 'No active account found with the given credentials') {
        out.form = 'Email yoki parol noto‘g‘ri.';
      }
      return out;
    }
    return { form: 'Email yoki parol noto‘g‘ri.' };
  }
  if (status >= 500) {
    return { form: 'Serverda xatolik. Birozdan keyin urinib ko‘ring.' };
  }
  return { form: 'Kirishda xatolik yuz berdi.' };
}

export function Login() {
  const { login } = useApp();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (loading) return;
    const next: FieldErrors = {};
    if (!email.trim()) next.email = 'Email kiriting.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
      next.email = 'To‘g‘ri email kiriting.';
    if (!password) next.password = 'Parolni kiriting.';
    if (next.email || next.password) {
      setErrors(next);
      return;
    }
    setErrors({});
    setLoading(true);
    try {
      await login(email, password);
      nav('/app');
    } catch (err) {
      setErrors(parseAxiosError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Xush kelibsiz!"
      subtitle="Hisobingizga kiring va o‘qishni davom ettiring."
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
          <Field label="Email" icon="Mail">
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors((s) => ({ ...s, email: undefined }));
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
              placeholder="••••••••"
              autoComplete="current-password"
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
        </div>

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-zinc-500">
            <input type="checkbox" defaultChecked className="accent-brand-600" />
            Eslab qolish
          </label>
          <a className="font-semibold text-brand-700 hover:underline" href="#">
            Parolni unutdingizmi?
          </a>
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

        <Button
          type="submit"
          block
          size="lg"
          icon={loading ? undefined : 'ArrowRight'}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Tekshirilmoqda...
            </>
          ) : (
            'Kirish'
          )}
        </Button>
      </motion.form>

      <p className="mt-8 text-center text-sm text-zinc-500">
        Hisobingiz yo‘qmi?{' '}
        <Link to="/register" className="font-bold text-brand-700 hover:underline">
          Ro‘yxatdan o‘ting
        </Link>
      </p>
    </AuthShell>
  );
}

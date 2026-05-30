import { useState } from 'react';
import FirebaseConfigNotice from '../components/common/FirebaseConfigNotice';
import { useAuth } from '../hooks/useAuth.jsx';
import { handleError } from '../utils/errorHandler';
import { isValidEmail } from '../utils/validators';
import { isFirebaseConfigured } from '../services/firebase';

export default function LoginPage() {
  const { login, resetPassword, error: authError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(authError || '');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async event => {
    event.preventDefault();
    setError('');
    if (!isFirebaseConfigured) { setError('Configura Firebase antes de iniciar sesión.'); return; }
    if (!isValidEmail(email) || !password) { setError('Ingresa un correo válido y contraseña.'); return; }
    setLoading(true);
    try { await login(email, password); } catch (err) { setError(handleError(err)); } finally { setLoading(false); }
  };
  const recover = async () => {
    setError(''); setMessage('');
    if (!isFirebaseConfigured) { setError('Configura Firebase antes de recuperar contraseña.'); return; }
    if (!isValidEmail(email)) { setError('Ingresa tu correo para recuperar contraseña.'); return; }
    try { await resetPassword(email); setMessage('Enviamos un correo de recuperación si la cuenta existe.'); } catch (err) { setError(handleError(err)); }
  };

  return <main className="flex min-h-screen items-center justify-center bg-slate-950 p-4"><div className="w-full max-w-md space-y-4">{!isFirebaseConfigured && <FirebaseConfigNotice compact/>}<form onSubmit={submit} className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl"><p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-600">Mantek ERP</p><h1 className="mt-2 text-3xl font-bold text-slate-900">Acceso seguro</h1><p className="mt-2 text-sm text-slate-500">Ingresa con Firebase Authentication. No existen usuarios ni contraseñas hardcodeadas en frontend.</p><div className="mt-6 space-y-4"><input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="email" placeholder="correo@empresa.com" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email"/><input className="w-full rounded-xl border border-slate-300 px-4 py-3" type="password" placeholder="Contraseña" value={password} onChange={event => setPassword(event.target.value)} autoComplete="current-password"/>{error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}{message && <p className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p>}<button disabled={loading || !isFirebaseConfigured} className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">{loading ? 'Validando...' : 'Ingresar'}</button><button type="button" onClick={recover} className="w-full text-sm font-semibold text-blue-700 hover:underline">Recuperar contraseña</button></div></form></div></main>;
}

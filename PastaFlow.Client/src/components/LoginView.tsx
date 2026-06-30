import { type FormEvent, useState } from 'react';
import { useAuth, type AuthUser } from '../context/AuthContext';

interface LoginResponse {
  token: string;
  username: string;
  rol: string;
  expiracion: string;
}

export default function LoginView() {
  const { login } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password.trim()) {
      setError('El usuario y la contraseña son obligatorios.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (res.status === 401) {
        setError('Usuario o contraseña incorrectos.');
        return;
      }

      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { detail?: string; title?: string };
        setError(body.detail ?? body.title ?? 'Error al iniciar sesión.');
        return;
      }

      const data = await res.json() as LoginResponse;
      const user: AuthUser = {
        username: data.username,
        rol: data.rol,
        expiracion: data.expiracion,
      };
      login(data.token, user);
    } catch {
      setError('No se pudo conectar con el servidor. Verificá que la API esté activa.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      {/* Card */}
      <div className="w-full max-w-md">
        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-600 shadow-lg shadow-blue-600/30 mb-4">
            <span className="text-3xl leading-none">🍝</span>
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">PastaFlow</h1>
          <p className="text-gray-400 text-sm mt-1">Panel de Control · Iniciar Sesión</p>
        </div>

        {/* Form card */}
        <div className="bg-gray-800/60 backdrop-blur-sm border border-gray-700/50 rounded-2xl shadow-2xl p-8">
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            {/* Error banner */}
            {error && (
              <div className="flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
                <span className="text-red-400 text-lg leading-none mt-0.5">⚠</span>
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300" htmlFor="username">
                Usuario
              </label>
              <input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Tu usuario"
                disabled={loading}
                className="w-full bg-gray-700/60 border border-gray-600/50 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-gray-300" htmlFor="password">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                disabled={loading}
                className="w-full bg-gray-700/60 border border-gray-600/50 text-white placeholder-gray-500 rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-50"
              />
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 rounded-xl transition-colors shadow-lg shadow-blue-600/20 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                  </svg>
                  Ingresando…
                </>
              ) : (
                'Ingresar'
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-600 text-xs mt-6">
          PastaFlow © {new Date().getFullYear()} · Sistema de Gestión de Producción
        </p>
      </div>
    </div>
  );
}

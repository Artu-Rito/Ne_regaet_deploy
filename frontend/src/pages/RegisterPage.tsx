import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

const RegisterPage: React.FC = () => {
  const [nickname, setNickname]             = useState('');
  const [email, setEmail]                   = useState('');
  const [password, setPassword]             = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const register = useAuthStore((s) => s.register);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPassword) { setError('Пароли не совпадают'); return; }
    if (password.length < 6)          { setError('Пароль минимум 6 символов'); return; }
    setLoading(true);
    try {
      await register(email, password, nickname);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16">
      <div className="gcard p-8 space-y-6">
        <h2 className="text-2xl font-bold text-white text-center">Регистрация</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: 'Никнейм',           type: 'text',     value: nickname,         set: setNickname,         ph: 'ProGamer2000' },
            { label: 'Email',             type: 'email',    value: email,            set: setEmail,            ph: 'you@example.com' },
            { label: 'Пароль',            type: 'password', value: password,         set: setPassword,         ph: '••••••••' },
            { label: 'Повторите пароль',  type: 'password', value: confirmPassword,  set: setConfirmPassword,  ph: '••••••••' },
          ].map((f) => (
            <div key={f.label}>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">{f.label}</label>
              <input
                type={f.type}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                placeholder={f.ph}
                className="ginput"
                required
              />
            </div>
          ))}
          <button type="submit" disabled={loading} className="gbtn-primary w-full py-3">
            {loading ? 'Регистрирую...' : 'Создать аккаунт'}
          </button>
        </form>

        <p className="text-center text-slate-400 text-sm">
          Уже есть аккаунт?{' '}
          <Link to="/login" className="text-indigo-400 hover:text-indigo-300">Войти</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;

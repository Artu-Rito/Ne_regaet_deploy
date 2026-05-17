import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useChatStore } from '../../store/chatStore';

const BASE_LINKS = [
  { to: '/',            label: 'Главная' },
  { to: '/test',        label: 'Тест сети' },
  { to: '/news',        label: 'Лента' },
  { to: '/articles',    label: 'Статьи' },
  { to: '/lfg',         label: 'Команды' },
  { to: '/leaderboard', label: 'Рейтинг' },
];

const Header: React.FC = () => {
  const { isAuthenticated, isAdmin, user, logout } = useAuthStore();
  const { getTotalUnread } = useChatStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const totalUnread = isAuthenticated ? getTotalUnread() : 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header className="border-b border-[#2a2a50] bg-[#0a0a1f]/95 backdrop-blur sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center h-14 gap-6">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <span className="text-indigo-400 text-xl">⚡</span>
          <span className="font-bold text-white tracking-wide text-lg">НЕ РЕГАЕТ</span>
        </Link>

        {/* Nav */}
        <nav className="hidden md:flex items-center gap-1 flex-1">
          {BASE_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? 'text-indigo-400 bg-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/chat"
              className={`relative px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                location.pathname === '/chat'
                  ? 'text-indigo-400 bg-indigo-500/10'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Чат
              {totalUnread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[10px] leading-none rounded-full px-1 py-0.5">
                  {totalUnread > 9 ? '9+' : totalUnread}
                </span>
              )}
            </Link>
          )}
        </nav>

        {/* Auth */}
        <div className="flex items-center gap-2 ml-auto">
          {isAuthenticated ? (
            <>
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-sm transition-colors"
              >
                <span className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                  {user?.nickname?.[0]?.toUpperCase() ?? '?'}
                </span>
                {user?.nickname}
              </button>
              {isAdmin && (
                <button onClick={() => navigate('/admin')} className="gbtn-ghost text-sm py-1.5 text-indigo-400">
                  Админ
                </button>
              )}
              <button onClick={handleLogout} className="gbtn-ghost text-sm py-1.5">
                Выйти
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate('/login')} className="gbtn-ghost text-sm py-1.5">
                Войти
              </button>
              <button onClick={() => navigate('/register')} className="gbtn-primary text-sm py-1.5">
                Регистрация
              </button>
            </>
          )}
        </div>

        {/* Mobile burger */}
        <button
          className="md:hidden text-slate-400 hover:text-white ml-2"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          ☰
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <nav className="md:hidden border-t border-[#2a2a50] px-4 py-3 flex flex-col gap-1 bg-[#0a0a1f]">
          {BASE_LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-sm"
            >
              {link.label}
            </Link>
          ))}
          {isAuthenticated && (
            <Link
              to="/chat"
              onClick={() => setMenuOpen(false)}
              className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-sm flex items-center gap-2"
            >
              Чат
              {totalUnread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5">{totalUnread}</span>
              )}
            </Link>
          )}
          <div className="border-t border-[#2a2a50] mt-2 pt-2 flex flex-col gap-1">
            {isAuthenticated ? (
              <>
                <Link
                  to="/profile"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-sm flex items-center gap-2"
                >
                  <span className="w-5 h-5 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-bold text-white">
                    {user?.nickname?.[0]?.toUpperCase() ?? '?'}
                  </span>
                  {user?.nickname}
                </Link>
                <button
                  onClick={() => { handleLogout(); setMenuOpen(false); }}
                  className="px-3 py-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 text-sm text-left"
                >
                  Выйти
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-lg text-slate-300 hover:text-white hover:bg-white/5 text-sm"
                >
                  Войти
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                  className="px-3 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-sm text-center font-semibold"
                >
                  Регистрация
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;

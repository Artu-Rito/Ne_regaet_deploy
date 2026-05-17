import React from 'react';
import { Link } from 'react-router-dom';

const Footer: React.FC = () => (
  <footer className="border-t border-[#2a2a50] mt-16 bg-[#080820]">
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
        {/* Brand */}
        <div>
          <div className="text-white font-bold text-lg mb-2">⚡ НЕ РЕГАЕТ У МЕНЯ</div>
          <p className="text-slate-500 text-sm leading-relaxed">
            Платформа мониторинга сетевых задержек для геймеров. Измеряй пинг, сравнивай с другими, ищи команду.
          </p>
        </div>

        {/* Navigation */}
        <div>
          <div className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">Разделы</div>
          <ul className="space-y-2 text-sm text-slate-500">
            {[
              { to: '/test',       label: 'Тест сети' },
              { to: '/news',       label: 'Лента' },
              { to: '/articles',   label: 'Статьи' },
              { to: '/lfg',        label: 'Найти команду' },
              { to: '/leaderboard', label: 'Таблица лидеров' },
              { to: '/chat',       label: 'Чат' },
            ].map((l) => (
              <li key={l.to}>
                <Link to={l.to} className="hover:text-indigo-400 transition-colors">{l.label}</Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Info */}
        <div>
          <div className="text-slate-300 font-semibold text-sm uppercase tracking-wider mb-3">О проекте</div>
          <ul className="space-y-2 text-sm text-slate-500">
            <li>Go 1.23 + Gin</li>
            <li>React 18 + TypeScript</li>
            <li>PostgreSQL / TimescaleDB</li>
            <li>WebSocket чат (gorilla/ws)</li>
            <li>Docker Compose</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-[#2a2a50] pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-slate-600 text-xs">
        <span>© 2025–2026 НЕ РЕГАЕТ У МЕНЯ — учебный проект</span>
        <span>Сарибекян · Николаев · Мартинес · Борисов</span>
      </div>
    </div>
  </footer>
);

export default Footer;

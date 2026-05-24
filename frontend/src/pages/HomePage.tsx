import React from 'react';
import { useNavigate } from 'react-router-dom';

// Карточки быстрой навигации — описывают каждый раздел платформы понятным языком
const NAV_CARDS = [
  {
    to: '/test',
    icon: '📡',
    title: 'Тест сети',
    desc: 'Измерь пинг, джиттер и потери пакетов до игровых серверов. Проверь скорость интернета.',
    primary: true,
  },
  {
    to: '/news',
    icon: '📰',
    title: 'Лента',
    desc: 'Посты, гайды и новости от игроков и редакции. Фильтрация по игре.',
    primary: false,
  },
  {
    to: '/lfg',
    icon: '🎮',
    title: 'Найти команду',
    desc: 'Ищи тиммейтов по игре, региону и уровню пинга. Размести своё объявление.',
    primary: false,
  },
  {
    to: '/chat',
    icon: '💬',
    title: 'Чат',
    desc: 'Общайся в реальном времени. Каналы «Общение» и «Советы» для каждой игры.',
    primary: false,
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-10 max-w-4xl mx-auto">

      {/* ── Приветственная плашка ──────────────────────────────────── */}
      <div className="gcard p-8 sm:p-10 space-y-5">
        <div className="flex items-center gap-3">
          <span className="text-4xl">⚡</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide">
            НЕ РЕГАЕТ У МЕНЯ
          </h1>
        </div>

        {/* Краткое описание — что делает платформа и для кого */}
        <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
          Платформа для геймеров, которые хотят разобраться со своим соединением.
          Измерь пинг до реальных игровых серверов, проверь скорость интернета,
          найди тиммейтов и обсуди игры с сообществом.
        </p>

        {/* Главный CTA — запуск теста */}
        <button
          onClick={() => navigate('/test')}
          className="gbtn-primary text-base px-8 py-3"
        >
          ▶ Начать тест сети
        </button>
      </div>

      {/* ── Навигационные карточки ─────────────────────────────────── */}
      <section>
        <h2 className="text-base font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Разделы платформы
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NAV_CARDS.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className={`gcard p-5 text-left flex items-start gap-4 transition-all hover:border-indigo-500/60 hover:bg-indigo-500/5 group ${
                card.primary ? 'border-indigo-500/30' : ''
              }`}
            >
              {/* Иконка раздела */}
              <span className="text-2xl shrink-0 mt-0.5">{card.icon}</span>
              <div>
                <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors mb-0.5">
                  {card.title}
                </div>
                {/* Однострочное описание раздела — помогает новому пользователю */}
                <div className="text-sm text-slate-500 leading-snug">
                  {card.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

    </div>
  );
};

export default HomePage;

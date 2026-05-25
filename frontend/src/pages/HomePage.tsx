import React from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="max-w-4xl mx-auto">

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


    </div>
  );
};

export default HomePage;

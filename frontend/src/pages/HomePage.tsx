import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { networkService } from '../services/networkService';
import { ServerStatus } from '../types/network';

// Цвет точки статуса сервера в зависимости от пинга
const pingDot = (online: boolean, ms: number) => {
  if (!online || ms < 0) return 'bg-red-500';
  if (ms < 40)           return 'bg-green-500';
  if (ms < 80)           return 'bg-yellow-500';
  return 'bg-red-500';
};

// Текст значения пинга
const pingText = (online: boolean, ms: number) => {
  if (!online || ms < 0) return 'offline';
  return `${ms} ms`;
};

// Цвет текста пинга
const pingColor = (online: boolean, ms: number) => {
  if (!online || ms < 0) return 'text-red-400';
  if (ms < 40)           return 'text-green-400';
  if (ms < 80)           return 'text-yellow-400';
  return 'text-red-400';
};

// Флаги регионов для карточек серверов
const REGION_FLAG: Record<string, string> = { RU: '🇷🇺', EU: '🇪🇺', ASIA: '🌏', NA: '🌎' };

// Быстрые кнопки навигации с описанием — объясняют пользователю что за каждым разделом
const NAV_CARDS = [
  {
    to: '/test',
    icon: '📡',
    title: 'Тест сети',
    desc: 'Измерь пинг, джиттер и потери пакетов до игровых серверов',
    primary: true,
  },
  {
    to: '/news',
    icon: '📰',
    title: 'Лента',
    desc: 'Посты, гайды и новости от игроков и редакции',
    primary: false,
  },
  {
    to: '/lfg',
    icon: '🎮',
    title: 'Найти команду',
    desc: 'Ищи тиммейтов по игре, региону и уровню пинга',
    primary: false,
  },
  {
    to: '/chat',
    icon: '💬',
    title: 'Чат',
    desc: 'Общайся с игроками в реальном времени по каналам',
    primary: false,
  },
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [servers, setServers]               = useState<ServerStatus[]>([]);
  const [serversLoading, setServersLoading] = useState(true);

  // Загружаем статус серверов при монтировании и обновляем каждые 30 секунд
  const loadServers = async () => {
    try {
      const res = await networkService.getServersStatus();
      setServers(res.servers ?? []);
    } catch {
      // Не показываем ошибку — просто оставляем пустой список
    } finally {
      setServersLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
    const interval = setInterval(loadServers, 30_000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = servers.filter((s) => s.online).length;

  return (
    <div className="space-y-10 max-w-4xl mx-auto">

      {/* ── Приветственная плашка ─────────────────────────────── */}
      <div className="gcard p-8 sm:p-10 space-y-4">
        <div className="flex items-center gap-3">
          <span className="text-4xl">⚡</span>
          <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-wide">
            НЕ РЕГАЕТ У МЕНЯ
          </h1>
        </div>

        <p className="text-slate-300 text-base sm:text-lg leading-relaxed max-w-2xl">
          Платформа для геймеров, которые хотят понять своё соединение.
          Здесь можно измерить пинг до реальных игровых серверов,
          найти тиммейтов по игре и региону, обсудить игры
          и следить за новостями.
        </p>

        {/* Статус серверов — краткая строка */}
        {!serversLoading && servers.length > 0 && (
          <p className="text-sm text-slate-500">
            Сейчас доступно серверов:&nbsp;
            <span className={onlineCount > 0 ? 'text-green-400 font-medium' : 'text-red-400 font-medium'}>
              {onlineCount} / {servers.length}
            </span>
          </p>
        )}
      </div>

      {/* ── Быстрая навигация ─────────────────────────────────── */}
      <section>
        <h2 className="text-lg font-semibold text-slate-300 mb-3">С чего начать</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {NAV_CARDS.map((card) => (
            <button
              key={card.to}
              onClick={() => navigate(card.to)}
              className={`gcard p-5 text-left flex items-start gap-4 transition-all hover:border-indigo-500/50 hover:bg-indigo-500/5 group ${
                card.primary ? 'border-indigo-500/40' : ''
              }`}
            >
              {/* Иконка раздела */}
              <span className="text-2xl shrink-0 mt-0.5">{card.icon}</span>
              <div>
                <div className="font-semibold text-white group-hover:text-indigo-300 transition-colors">
                  {card.title}
                </div>
                {/* Краткое описание — помогает пользователю понять раздел */}
                <div className="text-sm text-slate-500 mt-0.5 leading-snug">
                  {card.desc}
                </div>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* ── Статус игровых серверов ───────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-300">Статус серверов</h2>
          {/* Подсказка о периоде обновления */}
          <span className="text-xs text-slate-600">обновляется каждые 30 сек</span>
        </div>

        {serversLoading ? (
          <div className="gcard p-6 text-center text-slate-500 text-sm">
            Проверяем серверы...
          </div>
        ) : servers.length === 0 ? (
          <div className="gcard p-6 text-center text-slate-500 text-sm">
            Нет данных о серверах
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {servers.map((srv) => (
              <div key={srv.id} className="gcard px-4 py-3 flex items-center gap-3">
                {/* Цветная точка — зелёная / жёлтая / красная в зависимости от пинга */}
                <span className={`w-2 h-2 rounded-full shrink-0 ${pingDot(srv.online, srv.ping_ms)}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{srv.name}</div>
                  <div className="text-xs text-slate-500">
                    {REGION_FLAG[srv.region] ?? ''} {srv.region} · {srv.game}
                  </div>
                </div>
                {/* Значение пинга — «digital» шрифт для технических цифр */}
                <div className={`digital text-sm font-bold shrink-0 ${pingColor(srv.online, srv.ping_ms)}`}>
                  {pingText(srv.online, srv.ping_ms)}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

    </div>
  );
};

export default HomePage;

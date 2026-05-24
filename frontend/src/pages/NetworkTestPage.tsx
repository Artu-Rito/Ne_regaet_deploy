import React, { useEffect, useState } from 'react';
import { useTestStore } from '../store/testStore';
import { useAuthStore } from '../store/authStore';
import { networkService } from '../services/networkService';
import { GameServer } from '../types/network';
import BarVisualizer from '../components/NetworkTest/BarVisualizer';
import TestChart from '../components/NetworkTest/TestChart';
import dayjs from 'dayjs';

// Пояснения к каждой метрике — показываются под значением.
// Помогают пользователю понять что он видит без технических знаний.
const METRIC_INFO: Record<string, { label: string; hint: string }> = {
  ping: {
    label: 'Пинг',
    hint: 'Время отклика сервера. Чем меньше — тем быстрее игра реагирует на ваши действия.',
  },
  jitter: {
    label: 'Джиттер',
    hint: 'Нестабильность соединения. Высокий джиттер — ping скачет, игра «дёргается».',
  },
  packetLoss: {
    label: 'Потери пакетов',
    hint: 'Процент данных, не доставленных серверу. Даже 1-2% вызывают лаги и телепорты.',
  },
};

const NetworkTestPage: React.FC = () => {
  const { isTesting, currentTest, stats, tests, startTest, getTests, getStats } = useTestStore();
  const { isAuthenticated } = useAuthStore();
  const [servers, setServers] = useState<GameServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');

  useEffect(() => {
    networkService.getServers().then((res) => {
      setServers(res.servers);
      if (res.servers.length > 0) setSelectedServer(res.servers[0].id);
    });
    if (isAuthenticated) {
      getTests(1, 20);
      getStats('7d');
    }
  }, [isAuthenticated]);

  const handleTest = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    startTest(selectedServer);
  };

  // User values
  const ping       = currentTest?.ping       ?? null;
  const jitter     = currentTest?.jitter     ?? null;
  const packetLoss = currentTest?.packet_loss ?? null;

  // Community values from stats
  const avgPing       = stats?.avg_ping        ?? null;
  const avgJitter     = stats?.avg_jitter      ?? null;
  const avgPacketLoss = stats?.avg_packet_loss ?? null;

  return (
    <div className="space-y-8">
      {/* Controls */}
      <div className="gcard p-5 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex-1 w-full">
          <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">
            Игровой сервер
          </label>
          <select
            value={selectedServer}
            onChange={(e) => setSelectedServer(e.target.value)}
            className="ginput"
          >
            {servers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} — {s.game} ({s.region})
              </option>
            ))}
          </select>
        </div>

        <div className="shrink-0 flex flex-col items-center gap-1">
          <button
            onClick={handleTest}
            disabled={isTesting}
            className={`
              px-10 py-3 rounded-xl font-bold text-lg tracking-widest uppercase
              transition-all duration-300 border-2
              ${isTesting
                ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10 cursor-wait animate-pulse'
                : 'border-indigo-500 text-white bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
              }
            `}
          >
            {isTesting ? 'Тестирую...' : '▶ Начать тест'}
          </button>
          {!isAuthenticated && (
            <span className="text-xs text-slate-500">Нужна авторизация для сохранения</span>
          )}
        </div>
      </div>

      {/* Текущие показатели пользователя */}
      <section>
        <h2 className="text-center text-xl font-bold tracking-[0.2em] uppercase text-white mb-4">
          Ваши показатели
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Пинг — задержка до сервера */}
          <div className="space-y-2">
            <BarVisualizer
              label={METRIC_INFO.ping.label}
              value={ping}
              unit="ms"
              maxValue={300}
              warnAt={60}
              dangerAt={100}
              animate={isTesting}
            />
            <p className="text-xs text-slate-500 text-center px-2">{METRIC_INFO.ping.hint}</p>
          </div>

          {/* Джиттер — нестабильность пинга */}
          <div className="space-y-2">
            <BarVisualizer
              label={METRIC_INFO.jitter.label}
              value={jitter}
              unit="ms"
              maxValue={100}
              warnAt={20}
              dangerAt={50}
              animate={isTesting}
            />
            <p className="text-xs text-slate-500 text-center px-2">{METRIC_INFO.jitter.hint}</p>
          </div>

          {/* Потери пакетов — % недоставленных данных */}
          <div className="space-y-2">
            <BarVisualizer
              label={METRIC_INFO.packetLoss.label}
              value={packetLoss}
              unit="%"
              maxValue={20}
              warnAt={2}
              dangerAt={5}
              animate={isTesting}
            />
            <p className="text-xs text-slate-500 text-center px-2">{METRIC_INFO.packetLoss.hint}</p>
          </div>
        </div>
      </section>

      {/* Средние показатели за 7 дней — только для авторизованных пользователей */}
      {isAuthenticated && (
        <section>
          <h2 className="text-center text-xl font-bold tracking-[0.2em] uppercase text-white mb-1">
            Ваша статистика за 7 дней
          </h2>
          {/* Пояснение что это за блок */}
          <p className="text-center text-xs text-slate-500 mb-4">
            Средние значения по всем тестам за последние 7 дней
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <BarVisualizer label={METRIC_INFO.ping.label}       value={avgPing}       unit="ms" maxValue={300} warnAt={60}  dangerAt={100} />
              <p className="text-xs text-slate-500 text-center px-2">{METRIC_INFO.ping.hint}</p>
            </div>
            <div className="space-y-2">
              <BarVisualizer label={METRIC_INFO.jitter.label}     value={avgJitter}     unit="ms" maxValue={100} warnAt={20}  dangerAt={50}  />
              <p className="text-xs text-slate-500 text-center px-2">{METRIC_INFO.jitter.hint}</p>
            </div>
            <div className="space-y-2">
              <BarVisualizer label={METRIC_INFO.packetLoss.label} value={avgPacketLoss} unit="%"  maxValue={20}  warnAt={2}   dangerAt={5}   />
              <p className="text-xs text-slate-500 text-center px-2">{METRIC_INFO.packetLoss.hint}</p>
            </div>
          </div>
        </section>
      )}

      {/* Quick info after test */}
      {currentTest && (
        <div className="gcard p-4 text-sm text-slate-400">
          <span className="text-slate-300 font-semibold">Последний тест: </span>
          {new Date(currentTest.tested_at).toLocaleString('ru-RU')} —
          Ping {Math.round(currentTest.ping)} ms,
          Jitter {Math.round(currentTest.jitter ?? 0)} ms,
          Потери {(currentTest.packet_loss ?? 0).toFixed(1)}%
          {currentTest.game_server ? ` · ${currentTest.game_server}` : ''}
        </div>
      )}

      {/* Ping history chart */}
      {tests.length > 1 && (
        <section>
          <h2 className="text-center text-xl font-bold tracking-[0.2em] uppercase text-white mb-4">
            История пинга
          </h2>
          <TestChart
            data={[...tests].reverse().map((t) => ({
              time: dayjs(t.tested_at).format('DD.MM HH:mm'),
              ping: Math.round(t.ping),
            }))}
            medianPing={stats?.median_ping}
          />
        </section>
      )}
    </div>
  );
};

export default NetworkTestPage;

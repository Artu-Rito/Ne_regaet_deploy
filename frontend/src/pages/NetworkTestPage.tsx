import React, { useEffect, useRef, useState } from 'react';
import { useTestStore } from '../store/testStore';
import { useAuthStore } from '../store/authStore';
import { networkService } from '../services/networkService';
import { GameServer } from '../types/network';
import BarVisualizer from '../components/NetworkTest/BarVisualizer';

// ── Описания метрик пинга ────────────────────────────────────────────────────
// Отображаются под каждым виджетом — помогают понять что означает цифра
const METRIC_INFO = {
  ping: {
    label: 'Пинг',
    hint: 'Время отклика сервера. Чем меньше — тем быстрее игра реагирует на ваши действия. До 40 мс — отлично, до 80 мс — норма, выше — заметны лаги.',
  },
  jitter: {
    label: 'Джиттер',
    hint: 'Нестабильность соединения — насколько скачет пинг. Высокий джиттер вызывает «дёрганье» игры даже при нормальном среднем пинге.',
  },
  packetLoss: {
    label: 'Потери пакетов',
    hint: 'Процент данных, не доставленных серверу. Даже 1–2% вызывают телепорты персонажей и необъяснимые смерти.',
  },
};

// ── Тип результата теста скорости ───────────────────────────────────────────
interface SpeedResult {
  download: number | null; // Мбит/с
  upload:   number | null;
  status:   'idle' | 'testing' | 'done' | 'error';
}

// ── Компонент индикатора скорости ───────────────────────────────────────────
const SpeedGauge: React.FC<{ label: string; value: number | null; unit: string }> = ({ label, value, unit }) => {
  const color = value === null ? 'text-slate-500'
    : value > 50 ? 'text-green-400'
    : value > 10 ? 'text-yellow-400'
    : 'text-red-400';

  return (
    <div className="gcard p-6 text-center space-y-2">
      <div className={`digital text-4xl font-bold ${color}`}>
        {value === null ? '—' : value.toFixed(1)}
      </div>
      <div className="text-slate-400 text-sm">{unit}</div>
      <div className="text-slate-300 font-medium">{label}</div>
    </div>
  );
};

// ── Главный компонент страницы ───────────────────────────────────────────────
const NetworkTestPage: React.FC = () => {
  const { isTesting, currentTest, startTest } = useTestStore();
  const { isAuthenticated } = useAuthStore();
  const [servers, setServers] = useState<GameServer[]>([]);
  const [selectedServer, setSelectedServer] = useState<string>('');

  // Состояние теста скорости — независимо от пинг-теста
  const [speed, setSpeed] = useState<SpeedResult>({ download: null, upload: null, status: 'idle' });
  const abortRef = useRef<AbortController | null>(null);

  // Загружаем список серверов при монтировании
  useEffect(() => {
    networkService.getServers().then((res) => {
      setServers(res.servers);
      if (res.servers.length > 0) setSelectedServer(res.servers[0].id);
    });
  }, []);

  // Запуск пинг-теста — требует авторизации для сохранения результата
  const handlePingTest = () => {
    if (!isAuthenticated) {
      window.location.href = '/login';
      return;
    }
    startTest(selectedServer);
  };

  // ── Тест скорости загрузки ─────────────────────────────────────────────
  // Скачиваем 2 МБ с бэкенда и считаем скорость по времени загрузки.
  // Для загрузки (upload) — отправляем POST с 1 МБ данных.
  const handleSpeedTest = async () => {
    if (speed.status === 'testing') {
      abortRef.current?.abort();
      return;
    }

    setSpeed({ download: null, upload: null, status: 'testing' });
    abortRef.current = new AbortController();

    try {
      // ── Download ────────────────────────────────────────────────────────
      const dlSize = 2 * 1024 * 1024; // 2 МБ
      const dlStart = performance.now();
      const dlRes = await fetch(`/api/network/speedtest/download?size=${dlSize}`, {
        signal: abortRef.current.signal,
        cache: 'no-store',
      });
      await dlRes.arrayBuffer(); // ждём полной загрузки
      const dlTime = (performance.now() - dlStart) / 1000; // в секундах
      const downloadMbps = (dlSize * 8) / dlTime / 1_000_000;

      setSpeed((s) => ({ ...s, download: downloadMbps }));

      // ── Upload ──────────────────────────────────────────────────────────
      // Отправляем 1 МБ случайных данных на /api/network/ping (он их проигнорирует)
      const ulSize = 1 * 1024 * 1024; // 1 МБ
      const ulData = new Uint8Array(ulSize);
      const ulStart = performance.now();
      await fetch('/api/network/ping', {
        method: 'POST',
        body: ulData,
        signal: abortRef.current.signal,
        cache: 'no-store',
      });
      const ulTime = (performance.now() - ulStart) / 1000;
      const uploadMbps = (ulSize * 8) / ulTime / 1_000_000;

      setSpeed({ download: downloadMbps, upload: uploadMbps, status: 'done' });
    } catch (e: any) {
      if (e?.name === 'AbortError') {
        setSpeed({ download: null, upload: null, status: 'idle' });
      } else {
        setSpeed((s) => ({ ...s, status: 'error' }));
      }
    }
  };

  // Значения текущего теста пинга
  const ping       = currentTest?.ping        ?? null;
  const jitter     = currentTest?.jitter      ?? null;
  const packetLoss = currentTest?.packet_loss ?? null;

  return (
    <div className="space-y-10 max-w-4xl mx-auto">

      {/* ════════════════════════════════════════════════════════════
          БЛОК 1 — ТЕСТ ПИНГА
          ════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Тест пинга до сервера</h2>
          <p className="text-sm text-slate-500 mt-1">
            Выбери игровой сервер и нажми «Начать тест». Результаты сохраняются в твою историю.
          </p>
        </div>

        {/* Выбор сервера + кнопка */}
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
              onClick={handlePingTest}
              disabled={isTesting}
              className={`px-10 py-3 rounded-xl font-bold text-lg tracking-widest uppercase transition-all duration-300 border-2 ${
                isTesting
                  ? 'border-indigo-400 text-indigo-400 bg-indigo-500/10 cursor-wait animate-pulse'
                  : 'border-indigo-500 text-white bg-indigo-600 hover:bg-indigo-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]'
              }`}
            >
              {isTesting ? 'Тестирую...' : '▶ Начать тест'}
            </button>
            {!isAuthenticated && (
              <span className="text-xs text-slate-500">Нужна авторизация для сохранения</span>
            )}
          </div>
        </div>

        {/* Результаты пинг-теста — 3 метрики с пояснениями */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Пинг */}
          <div className="space-y-2">
            <BarVisualizer label={METRIC_INFO.ping.label} value={ping} unit="ms"
              maxValue={300} warnAt={60} dangerAt={100} animate={isTesting} />
            <p className="text-xs text-slate-500 text-center px-2 leading-relaxed">
              {METRIC_INFO.ping.hint}
            </p>
          </div>
          {/* Джиттер */}
          <div className="space-y-2">
            <BarVisualizer label={METRIC_INFO.jitter.label} value={jitter} unit="ms"
              maxValue={100} warnAt={20} dangerAt={50} animate={isTesting} />
            <p className="text-xs text-slate-500 text-center px-2 leading-relaxed">
              {METRIC_INFO.jitter.hint}
            </p>
          </div>
          {/* Потери пакетов */}
          <div className="space-y-2">
            <BarVisualizer label={METRIC_INFO.packetLoss.label} value={packetLoss} unit="%"
              maxValue={20} warnAt={2} dangerAt={5} animate={isTesting} />
            <p className="text-xs text-slate-500 text-center px-2 leading-relaxed">
              {METRIC_INFO.packetLoss.hint}
            </p>
          </div>
        </div>

        {/* Строка с кратким результатом после теста */}
        {currentTest && (
          <div className="gcard p-3 text-sm text-slate-400">
            <span className="text-slate-300 font-semibold">Последний тест: </span>
            {new Date(currentTest.tested_at).toLocaleString('ru-RU')} —
            Пинг {Math.round(currentTest.ping)} мс,
            Джиттер {Math.round(currentTest.jitter ?? 0)} мс,
            Потери {(currentTest.packet_loss ?? 0).toFixed(1)}%
            {currentTest.game_server ? ` · ${currentTest.game_server}` : ''}
          </div>
        )}

      </section>

      {/* Разделитель между двумя блоками */}
      <div className="border-t border-[#2a2a50]" />

      {/* ════════════════════════════════════════════════════════════
          БЛОК 2 — ТЕСТ СКОРОСТИ ИНТЕРНЕТА
          ════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white">Тест скорости интернета</h2>
          <p className="text-sm text-slate-500 mt-1">
            Измеряет скорость загрузки (download) и отдачи (upload) до нашего сервера.
            Результат показывает пропускную способность твоего соединения в мегабитах в секунду.
          </p>
        </div>

        {/* Показатели скорости */}
        <div className="grid grid-cols-2 gap-4">
          <SpeedGauge label="Загрузка (Download)" value={speed.download} unit="Мбит/с" />
          <SpeedGauge label="Отдача (Upload)"     value={speed.upload}   unit="Мбит/с" />
        </div>

        {/* Кнопка запуска / остановки */}
        <div className="flex flex-col items-center gap-2">
          <button
            onClick={handleSpeedTest}
            className={`px-10 py-3 rounded-xl font-bold text-lg tracking-widest uppercase transition-all duration-300 border-2 ${
              speed.status === 'testing'
                ? 'border-red-500 text-red-400 bg-red-500/10 cursor-pointer animate-pulse'
                : 'border-indigo-500 text-white bg-indigo-600 hover:bg-indigo-500'
            }`}
          >
            {speed.status === 'testing' ? '⏹ Остановить' : '▶ Начать тест скорости'}
          </button>

          {/* Статусные сообщения */}
          {speed.status === 'testing' && (
            <p className="text-xs text-slate-500">Идёт измерение, подождите...</p>
          )}
          {speed.status === 'error' && (
            <p className="text-xs text-red-400">Ошибка теста. Проверь подключение и попробуй снова.</p>
          )}
          {speed.status === 'done' && (
            <p className="text-xs text-slate-500">
              Тест завершён. Результаты могут отличаться от реальной скорости в игре —
              они зависят от расстояния до нашего сервера.
            </p>
          )}
        </div>
      </section>

    </div>
  );
};

export default NetworkTestPage;

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { networkService } from '../services/networkService';
import { NetworkTest, NetworkStats } from '../types/network';
import TestChart from '../components/NetworkTest/TestChart';
import dayjs from 'dayjs';

function pingColor(ms: number) {
  if (ms < 30) return 'text-green-400';
  if (ms < 60) return 'text-yellow-400';
  return 'text-red-400';
}

const PERIODS = [
  { label: '7 дней',  value: '7d' },
  { label: '30 дней', value: '30d' },
  { label: '90 дней', value: '90d' },
];

const ProfilePage: React.FC = () => {
  const { user, updateProfile } = useAuthStore();
  const [stats, setStats] = useState<NetworkStats | null>(null);
  const [tests, setTests] = useState<NetworkTest[]>([]);
  const [period, setPeriod] = useState('7d');
  const [statsLoading, setStatsLoading] = useState(false);
  const [editingNick, setEditingNick] = useState(false);
  const [nickValue, setNickValue] = useState('');
  const [nickError, setNickError] = useState('');
  const [nickSaving, setNickSaving] = useState(false);

  useEffect(() => {
    setStatsLoading(true);
    networkService.getStats(period)
      .then((r) => setStats(r.stats))
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, [period]);

  useEffect(() => {
    networkService.getTests(1, 30).then((r) => setTests(r.tests ?? [])).catch(() => {});
  }, []);

  const chartData = [...tests].reverse().map((t) => ({
    time: dayjs(t.tested_at).format('DD.MM HH:mm'),
    ping: Math.round(t.ping),
  }));

  const statCards = [
    { label: 'Средний пинг',   value: statsLoading ? '…' : stats ? `${stats.avg_ping.toFixed(1)} ms`    : '—', color: 'text-indigo-400' },
    { label: 'Медиана',         value: statsLoading ? '…' : stats ? `${stats.median_ping.toFixed(1)} ms` : '—', color: 'text-green-400' },
    { label: 'Мин. пинг',      value: statsLoading ? '…' : stats ? `${stats.min_ping.toFixed(1)} ms`    : '—', color: 'text-cyan-400' },
    { label: 'Всего тестов',   value: statsLoading ? '…' : stats ? String(stats.total_tests)             : '—', color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Профиль</h2>

      {/* User info */}
      <div className="gcard p-6 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Никнейм</div>
          {editingNick ? (
            <div className="flex items-center gap-2">
              <input
                value={nickValue}
                onChange={(e) => setNickValue(e.target.value)}
                className="ginput text-sm py-1 flex-1"
                autoFocus
              />
              <button
                onClick={async () => {
                  if (!nickValue.trim()) { setNickError('Введите никнейм'); return; }
                  setNickSaving(true); setNickError('');
                  try {
                    await updateProfile({ nickname: nickValue.trim() });
                    setEditingNick(false);
                  } catch (e: any) {
                    setNickError(e.response?.data?.error ?? 'Ошибка');
                  } finally { setNickSaving(false); }
                }}
                disabled={nickSaving}
                className="gbtn-primary text-xs px-3 py-1"
              >
                {nickSaving ? '…' : 'OK'}
              </button>
              <button onClick={() => { setEditingNick(false); setNickError(''); }} className="gbtn-ghost text-xs px-2 py-1">✕</button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div className="text-white font-semibold">{user?.nickname ?? '—'}</div>
              <button
                onClick={() => { setNickValue(user?.nickname ?? ''); setEditingNick(true); }}
                className="text-xs text-slate-500 hover:text-indigo-400 transition-colors"
              >
                Изменить
              </button>
            </div>
          )}
          {nickError && <p className="text-red-400 text-xs mt-1">{nickError}</p>}
        </div>
        {[
          { label: 'Email',  value: user?.email },
          { label: 'С нами', value: user?.created_at ? dayjs(user.created_at).format('DD.MM.YYYY') : '—' },
        ].map((f) => (
          <div key={f.label}>
            <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">{f.label}</div>
            <div className="text-white font-semibold">{f.value ?? '—'}</div>
          </div>
        ))}
      </div>

      {/* Period selector + Stats */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">Статистика</h3>
          <div className="flex gap-2">
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-3 py-1 rounded-full text-xs transition-colors ${
                  period === p.value
                    ? 'bg-indigo-600 text-white'
                    : 'border border-[#2a2a50] text-slate-400 hover:text-white hover:border-indigo-500'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {statCards.map((s) => (
            <div key={s.label} className="gcard p-4 text-center">
              <div className={`digital text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-slate-400 text-xs mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Ping chart */}
      {chartData.length > 1 && (
        <TestChart data={chartData} medianPing={stats?.median_ping} />
      )}

      {/* Test history table */}
      <div>
        <h3 className="text-lg font-bold text-white mb-3">История тестов</h3>
        <div className="gcard overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a50] text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Пинг</th>
                <th className="px-4 py-3 text-left">Джиттер</th>
                <th className="px-4 py-3 text-left">Потери</th>
                <th className="px-4 py-3 text-left">Сервер</th>
                <th className="px-4 py-3 text-left">Дата</th>
              </tr>
            </thead>
            <tbody>
              {tests.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-slate-500">Нет тестов за этот период</td></tr>
              ) : tests.map((t) => (
                <tr key={t.id} className="border-b border-[#1a1a3a] hover:bg-white/[0.02] transition-colors">
                  <td className={`px-4 py-3 digital font-bold ${pingColor(t.ping)}`}>
                    {t.ping.toFixed(1)} ms
                  </td>
                  <td className="px-4 py-3 text-slate-300">{(t.jitter ?? 0).toFixed(1)} ms</td>
                  <td className="px-4 py-3 text-slate-300">{(t.packet_loss ?? 0).toFixed(1)}%</td>
                  <td className="px-4 py-3 text-slate-400">{t.game_server || '—'}</td>
                  <td className="px-4 py-3 text-slate-500">
                    {dayjs(t.tested_at).format('DD.MM.YY HH:mm')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;

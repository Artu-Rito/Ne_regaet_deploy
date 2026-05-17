import React, { useEffect, useState } from 'react';
import { networkService } from '../services/networkService';
import { LeaderboardEntry, GameServer } from '../types/network';
import { useAuthStore } from '../store/authStore';

function pingColor(ms: number) {
  if (ms < 30)  return 'text-green-400';
  if (ms < 60)  return 'text-yellow-400';
  if (ms < 100) return 'text-orange-400';
  return 'text-red-400';
}

const MEDALS = ['🥇', '🥈', '🥉'];

const LeaderboardPage: React.FC = () => {
  const [entries, setEntries]       = useState<LeaderboardEntry[]>([]);
  const [servers, setServers]       = useState<GameServer[]>([]);
  const [selected, setSelected]     = useState('');
  const [loading, setLoading]       = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    networkService.getServers().then((r) => setServers(r.servers)).catch(() => {});
    load('');
  }, []);

  const load = async (server: string) => {
    setLoading(true);
    try {
      const res = await networkService.getLeaderboard(server || undefined, 100);
      setEntries(res.players ?? []);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = (server: string) => {
    setSelected(server);
    load(server);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white">Таблица лидеров</h2>
        <select
          value={selected}
          onChange={(e) => handleFilter(e.target.value)}
          className="ginput max-w-xs"
        >
          <option value="">Все серверы</option>
          {servers.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      <div className="gcard overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2a2a50] text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 text-left w-12">#</th>
              <th className="px-4 py-3 text-left">Игрок</th>
              <th className="px-4 py-3 text-right">Средний пинг</th>
              <th className="px-4 py-3 text-right">Тестов</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Загрузка...</td></tr>
            ) : entries.length === 0 ? (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-slate-500">Нет данных</td></tr>
            ) : entries.map((entry, i) => {
              const isMe = user?.id === entry.user_id;
              return (
                <tr
                  key={entry.user_id}
                  className={`border-b border-[#1a1a3a] transition-colors ${
                    isMe ? 'bg-indigo-500/10' : 'hover:bg-white/2'
                  }`}
                >
                  <td className="px-4 py-3 text-center font-bold text-slate-400">
                    {i < 3 ? MEDALS[i] : i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <span className={isMe ? 'text-indigo-400 font-semibold' : 'text-slate-200'}>
                      {entry.nickname} {isMe && <span className="text-xs">(Вы)</span>}
                    </span>
                  </td>
                  <td className={`px-4 py-3 text-right digital font-bold ${pingColor(entry.avg_ping)}`}>
                    {entry.avg_ping.toFixed(1)} ms
                  </td>
                  <td className="px-4 py-3 text-right text-slate-400">
                    {entry.total_tests}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LeaderboardPage;

import React from 'react';
import { NetworkTest } from '../../types/network';
import dayjs from 'dayjs';

interface TestHistoryProps {
  tests: NetworkTest[];
  onRefresh?: () => void;
}

function pingColor(ms: number) {
  if (ms < 30) return 'text-green-400';
  if (ms < 60) return 'text-yellow-400';
  return 'text-red-400';
}

const TestHistory: React.FC<TestHistoryProps> = ({ tests, onRefresh }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between">
      <h4 className="font-bold text-white">История тестов</h4>
      {onRefresh && (
        <button onClick={onRefresh} className="gbtn-ghost text-sm">Обновить</button>
      )}
    </div>
    <div className="gcard overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#2a2a50] text-slate-400 text-xs uppercase tracking-wider">
            <th className="px-4 py-3 text-left">Пинг</th>
            <th className="px-4 py-3 text-left">Джиттер</th>
            <th className="px-4 py-3 text-left">Потери</th>
            <th className="px-4 py-3 text-left">Сервер</th>
            <th className="px-4 py-3 text-left">Время</th>
          </tr>
        </thead>
        <tbody>
          {tests.length === 0 ? (
            <tr><td colSpan={5} className="px-4 py-6 text-center text-slate-500">Нет тестов</td></tr>
          ) : tests.map((t) => (
            <tr key={t.id} className="border-b border-[#1a1a3a] hover:bg-white/2 transition-colors">
              <td className={`px-4 py-2 digital font-bold ${pingColor(t.ping)}`}>{t.ping.toFixed(1)} ms</td>
              <td className="px-4 py-2 text-slate-300">{(t.jitter ?? 0).toFixed(1)} ms</td>
              <td className="px-4 py-2 text-slate-300">{(t.packet_loss ?? 0).toFixed(1)}%</td>
              <td className="px-4 py-2 text-slate-400">{t.game_server || '—'}</td>
              <td className="px-4 py-2 text-slate-500">{dayjs(t.tested_at).format('DD.MM HH:mm')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

export default TestHistory;

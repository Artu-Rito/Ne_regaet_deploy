import React from 'react';
import { NetworkTest } from '../../types/network';

interface ResultsCardProps {
  test: NetworkTest;
}

function pingLabel(ms: number) {
  if (ms < 30)  return { text: 'Отлично', cls: 'text-green-400' };
  if (ms < 60)  return { text: 'Хорошо',  cls: 'text-yellow-400' };
  if (ms < 100) return { text: 'Нормально', cls: 'text-orange-400' };
  return { text: 'Высокий пинг', cls: 'text-red-400' };
}

const ResultsCard: React.FC<ResultsCardProps> = ({ test }) => {
  const { text, cls } = pingLabel(test.ping);

  return (
    <div className="gcard p-5 grid grid-cols-3 gap-4 mt-4">
      <div className="text-center">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Пинг</div>
        <div className={`digital text-3xl font-bold ${cls}`}>{test.ping.toFixed(1)} ms</div>
        <div className={`text-xs mt-1 ${cls}`}>{text}</div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Джиттер</div>
        <div className={`digital text-3xl font-bold ${(test.jitter ?? 0) < 10 ? 'text-green-400' : 'text-yellow-400'}`}>
          {(test.jitter ?? 0).toFixed(1)} ms
        </div>
      </div>
      <div className="text-center">
        <div className="text-xs text-slate-400 uppercase tracking-wider mb-1">Потери</div>
        <div className={`digital text-3xl font-bold ${(test.packet_loss ?? 0) < 1 ? 'text-green-400' : 'text-red-400'}`}>
          {(test.packet_loss ?? 0).toFixed(1)}%
        </div>
      </div>
    </div>
  );
};

export default ResultsCard;

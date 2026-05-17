import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { networkService } from '../services/networkService';
import { ServerStatus } from '../types/network';
import api from '../services/api';

const pingColor = (online: boolean, ms: number) => {
  if (!online || ms < 0) return 'text-red-400';
  if (ms < 40) return 'text-green-400';
  if (ms < 80) return 'text-yellow-400';
  return 'text-red-400';
};

const pingDot = (online: boolean, ms: number) => {
  if (!online || ms < 0) return 'bg-red-500';
  if (ms < 40) return 'bg-green-500';
  if (ms < 80) return 'bg-yellow-500';
  return 'bg-red-500';
};

const REGION_FLAG: Record<string, string> = { RU: '🇷🇺', EU: '🇪🇺', ASIA: '🌏', NA: '🌎' };

interface GlobalStats { users: number; posts: number; tests: number; }

const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [servers, setServers] = useState<ServerStatus[]>([]);
  const [serversLoading, setServersLoading] = useState(true);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  const loadServers = async () => {
    try {
      const res = await networkService.getServersStatus();
      setServers(res.servers ?? []);
    } catch {
      // keep empty
    } finally {
      setServersLoading(false);
    }
  };

  useEffect(() => {
    loadServers();
    api.get('/stats').then((r) => setGlobalStats(r.data)).catch(() => {});
    api.get('/posts?page=1&limit=4').then((r) => setRecentPosts(r.data.posts ?? [])).catch(() => {});

    const interval = setInterval(loadServers, 30_000);
    return () => clearInterval(interval);
  }, []);

  const onlineCount = servers.filter((s) => s.online).length;

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="gcard p-10 text-center space-y-5">
        <div className="text-5xl mb-2">⚡</div>
        <h1 className="text-4xl font-bold text-white tracking-wide">НЕ РЕГАЕТ У МЕНЯ</h1>
        <p className="text-slate-400 text-lg max-w-lg mx-auto">
          Платформа для мониторинга сетевых задержек. Измеряй пинг, сравнивай с другими игроками,
          ищи тиммейтов по игре и региону.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <button onClick={() => navigate('/test')} className="gbtn-primary text-lg px-8 py-3">
            ▶ Начать тест сети
          </button>
          <button onClick={() => navigate('/lfg')} className="gbtn-ghost text-lg px-8 py-3">
            Найти команду
          </button>
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          {
            label: 'Серверов онлайн',
            value: serversLoading ? '…' : `${onlineCount} / ${servers.length}`,
            color: 'text-green-400',
          },
          {
            label: 'Всего тестов',
            value: globalStats ? String(globalStats.tests) : '—',
            color: 'text-indigo-400',
          },
          {
            label: 'Пользователей',
            value: globalStats ? String(globalStats.users) : '—',
            color: 'text-yellow-400',
          },
        ].map((s) => (
          <div key={s.label} className="gcard p-6 text-center">
            <div className={`digital text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-sm mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Live server status */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Статус серверов</h2>
          <span className="text-xs text-slate-500">обновляется каждые 30 сек</span>
        </div>

        {serversLoading ? (
          <div className="gcard p-8 text-center text-slate-500">Проверяем серверы...</div>
        ) : servers.length === 0 ? (
          <div className="gcard p-8 text-center text-slate-500">Нет данных</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {servers.map((srv) => (
              <div key={srv.id} className="gcard px-4 py-3 flex items-center gap-3">
                <span
                  className={`w-2.5 h-2.5 rounded-full shrink-0 ${pingDot(srv.online, srv.ping_ms)}`}
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium truncate">{srv.name}</div>
                  <div className="text-xs text-slate-500">
                    {REGION_FLAG[srv.region] ?? ''} {srv.region} · {srv.game}
                  </div>
                </div>
                <div className={`digital text-sm font-bold shrink-0 ${pingColor(srv.online, srv.ping_ms)}`}>
                  {srv.online && srv.ping_ms >= 0 ? `${srv.ping_ms} ms` : 'offline'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent posts */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Последнее в ленте</h2>
          <Link to="/news" className="text-indigo-400 text-sm hover:underline">Все материалы →</Link>
        </div>
        {recentPosts.length === 0 ? (
          <p className="text-slate-500 text-sm">Постов пока нет</p>
        ) : (
          <div className="space-y-3">
            {recentPosts.map((post) => (
              <Link
                key={post.id}
                to={`/post/${post.id}`}
                className="gcard p-4 block hover:border-indigo-500/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="font-semibold text-white flex-1">{post.title}</h3>
                  {post.game && (
                    <span className="text-xs px-2 py-0.5 rounded-full border border-[#2a2a50] text-slate-500 shrink-0">
                      {post.game}
                    </span>
                  )}
                </div>
                <p className="text-slate-400 text-sm mt-1 line-clamp-2">{post.content}</p>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs text-slate-500">
                    {new Date(post.created_at).toLocaleDateString('ru-RU')}
                  </span>
                  {post.author?.nickname && (
                    <span className="text-xs text-slate-500">· {post.author.nickname}</span>
                  )}
                  {post.comment_count > 0 && (
                    <span className="text-xs text-slate-500">· {post.comment_count} комм.</span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

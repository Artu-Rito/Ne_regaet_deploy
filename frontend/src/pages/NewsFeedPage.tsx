import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

interface FeedItem {
  kind: 'post' | 'article';
  id: string;
  title: string;
  excerpt: string;
  author_id: string;
  nickname: string;
  game: string;
  post_type: string;
  category: string;
  tags: string;
  is_pinned: boolean;
  created_at: string;
}

const TYPE_TABS = [
  { value: 'all',     label: 'Всё' },
  { value: 'post',    label: 'Посты' },
  { value: 'guide',   label: 'Гайды' },
  { value: 'news',    label: 'Новости' },
  { value: 'clip',    label: 'Клипы' },
  { value: 'article', label: 'Статьи' },
];

const GAMES = ['Все', 'CS2', 'Dota2', 'Valorant', 'Apex', 'WoW', 'PUBG', 'Overwatch2'];

const TYPE_BADGE: Record<string, string> = {
  guide:   'text-green-400 bg-green-400/10',
  news:    'text-blue-400 bg-blue-400/10',
  clip:    'text-yellow-400 bg-yellow-400/10',
  post:    'text-slate-400 bg-slate-400/10',
  article: 'text-indigo-400 bg-indigo-400/10',
};

const TYPE_LABEL: Record<string, string> = {
  guide: 'Гайд', news: 'Новость', clip: 'Клип', post: 'Пост', article: 'Статья',
};

const LIMIT = 15;

const NewsFeedPage: React.FC = () => {
  const [items, setItems] = useState<FeedItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [kindFilter, setKindFilter] = useState('all');
  const [gameFilter, setGameFilter] = useState('Все');
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();

  const load = async (p: number, kind: string, game: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), kind });
      if (game !== 'Все') params.append('game', game);
      const res = await api.get(`/feed?${params}`);
      setItems(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(1);
    load(1, kindFilter, gameFilter);
  }, [kindFilter, gameFilter]);

  useEffect(() => {
    load(page, kindFilter, gameFilter);
  }, [page]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Лента</h2>
        {isAuthenticated && (
          <button className="gbtn-primary" onClick={() => navigate('/post/create')}>
            + Создать пост
          </button>
        )}
      </div>

      {/* Type tabs */}
      <div className="flex flex-wrap gap-1.5">
        {TYPE_TABS.map((t) => (
          <button
            key={t.value}
            onClick={() => { setKindFilter(t.value); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
              kindFilter === t.value
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-[#2a2a50] text-slate-400 hover:text-white hover:border-indigo-500'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Game filter */}
      <div className="flex flex-wrap gap-1.5">
        {GAMES.map((g) => (
          <button
            key={g}
            onClick={() => { setGameFilter(g); setPage(1); }}
            className={`px-3 py-1 rounded-full text-xs transition-colors border ${
              gameFilter === g
                ? 'bg-indigo-600/20 text-indigo-300 border-indigo-500'
                : 'border-[#2a2a50] text-slate-500 hover:text-white hover:border-slate-500'
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      {/* Items */}
      {loading ? (
        <div className="text-slate-500 text-center py-12">Загрузка...</div>
      ) : items.length === 0 ? (
        <div className="text-slate-500 text-center py-12">Ничего не найдено</div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <FeedCard key={`${item.kind}-${item.id}`} item={item} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex justify-center gap-2 pt-2">
          {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                p === page
                  ? 'bg-indigo-600 text-white'
                  : 'border border-[#2a2a50] text-slate-400 hover:text-white hover:border-indigo-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const FeedCard: React.FC<{ item: FeedItem }> = ({ item }) => {
  const href = item.kind === 'article' ? `/articles/${item.id}` : `/post/${item.id}`;
  const typeKey = item.kind === 'article' ? 'article' : (item.post_type || 'post');
  const badgeClass = TYPE_BADGE[typeKey] ?? TYPE_BADGE.post;
  const badgeLabel = TYPE_LABEL[typeKey] ?? 'Пост';

  return (
    <Link
      to={href}
      className={`gcard p-4 block hover:border-indigo-500/50 transition-colors ${
        item.is_pinned ? 'border-indigo-500/30 bg-indigo-500/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {item.is_pinned && (
              <span className="text-xs text-indigo-400">📌</span>
            )}
            <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${badgeClass}`}>
              {badgeLabel}
            </span>
            {item.game && (
              <span className="text-xs text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                {item.game}
              </span>
            )}
          </div>
          <h3 className="font-semibold text-white leading-snug">{item.title}</h3>
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{item.excerpt}</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-xs text-slate-500">{item.nickname}</span>
            <span className="text-xs text-slate-600">
              {new Date(item.created_at).toLocaleDateString('ru-RU')}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default NewsFeedPage;

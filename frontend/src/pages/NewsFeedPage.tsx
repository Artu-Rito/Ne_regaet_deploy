import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuthStore } from '../store/authStore';

// Тип элемента ленты — пост или статья
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

// Список игр для фильтра — «Все» означает без фильтрации
const GAMES = ['Все', 'CS2', 'Dota2', 'Valorant', 'Apex', 'WoW', 'PUBG', 'Overwatch2'];

// Визуальные стили бейджей по типу поста
const TYPE_BADGE: Record<string, string> = {
  guide:   'text-green-400 bg-green-400/10',
  news:    'text-blue-400 bg-blue-400/10',
  clip:    'text-yellow-400 bg-yellow-400/10',
  post:    'text-slate-400 bg-slate-400/10',
  article: 'text-indigo-400 bg-indigo-400/10',
};

// Русские названия типов постов
const TYPE_LABEL: Record<string, string> = {
  guide: 'Гайд', news: 'Новость', clip: 'Клип', post: 'Пост', article: 'Статья',
};

const LIMIT = 15; // Постов на страницу

const NewsFeedPage: React.FC = () => {
  const [items, setItems]       = useState<FeedItem[]>([]);
  const [total, setTotal]       = useState(0);
  const [page, setPage]         = useState(1);
  const [loading, setLoading]   = useState(false);
  const [gameFilter, setGameFilter] = useState('Все'); // Фильтр по игре
  const { isAuthenticated }     = useAuthStore();
  const navigate                = useNavigate();

  // Загружаем ленту с учётом текущих фильтров и номера страницы
  const load = async (p: number, game: string) => {
    setLoading(true);
    try {
      // kind=all — показываем все типы (посты и статьи вместе)
      const params = new URLSearchParams({ page: String(p), limit: String(LIMIT), kind: 'all' });
      if (game !== 'Все') params.append('game', game);
      const res = await api.get(`/feed?${params}`);
      setItems(res.data.items ?? []);
      setTotal(res.data.total ?? 0);
    } finally {
      setLoading(false);
    }
  };

  // При смене фильтра игры — сбрасываем на первую страницу и перезагружаем
  useEffect(() => {
    setPage(1);
    load(1, gameFilter);
  }, [gameFilter]);

  // При смене номера страницы — перезагружаем с теми же фильтрами
  useEffect(() => {
    load(page, gameFilter);
  }, [page]);

  const pages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-5">

      {/* Заголовок и кнопка создания поста */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Лента</h2>
          <p className="text-sm text-slate-500 mt-0.5">
            Посты, гайды и новости от игроков и редакции
          </p>
        </div>
        {isAuthenticated && (
          <button className="gbtn-primary" onClick={() => navigate('/post/create')}>
            + Создать пост
          </button>
        )}
      </div>

      {/* Фильтр по игре — единственный фильтр, тип поста не важен */}
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

      {/* Список постов */}
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

      {/* Пагинация */}
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

// Карточка одного поста/статьи в ленте
const FeedCard: React.FC<{ item: FeedItem }> = ({ item }) => {
  // Статьи ведут на /articles/:id, посты — на /post/:id
  const href     = item.kind === 'article' ? `/articles/${item.id}` : `/post/${item.id}`;
  const typeKey  = item.kind === 'article' ? 'article' : (item.post_type || 'post');
  const badgeClass  = TYPE_BADGE[typeKey] ?? TYPE_BADGE.post;
  const badgeLabel  = TYPE_LABEL[typeKey] ?? 'Пост';

  return (
    <Link
      to={href}
      className={`gcard p-4 block hover:border-indigo-500/50 transition-colors ${
        item.is_pinned ? 'border-indigo-500/30 bg-indigo-500/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Бейджи: закреплено, тип, игра */}
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

          {/* Заголовок */}
          <h3 className="font-semibold text-white leading-snug">{item.title}</h3>

          {/* Превью текста */}
          <p className="text-slate-400 text-sm mt-1 line-clamp-2">{item.excerpt}</p>

          {/* Мета: автор и дата */}
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

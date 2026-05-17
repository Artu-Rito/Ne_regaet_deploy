import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { articleService } from '../services/postService';
import { Article } from '../types/post';
import dayjs from 'dayjs';

const CATEGORIES = [
  { value: '',         label: 'Все' },
  { value: 'network',  label: 'Сеть' },
  { value: 'hardware', label: 'Железо' },
  { value: 'software', label: 'Софт' },
  { value: 'guides',   label: 'Гайды' },
];

function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} мин`;
}

const ArticlesPage: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [category, setCategory] = useState('');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    setLoading(true);
    articleService.getArticles(category || undefined)
      .then((r) => setArticles(r.articles ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  const featured = articles.slice(0, 2);
  const rest = articles.slice(2);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-2xl font-bold text-white">Статьи</h2>
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-3 py-1 rounded-full text-sm transition-colors ${
                category === c.value
                  ? 'bg-indigo-600 text-white'
                  : 'border border-[#2a2a50] text-slate-400 hover:text-white hover:border-indigo-500'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="text-slate-500 text-center py-12">Загрузка...</div>
      ) : articles.length === 0 ? (
        <div className="text-slate-500 text-center py-12">Статей пока нет</div>
      ) : (
        <>
          {/* Featured articles */}
          {featured.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {featured.map((a) => (
                <Link
                  key={a.id}
                  to={`/articles/${a.id}`}
                  className="gcard p-6 flex flex-col gap-3 hover:border-indigo-500/50 transition-colors group"
                >
                  <div className="flex items-start justify-between gap-2">
                    {a.category && (
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                        {a.category}
                      </span>
                    )}
                    <span className="text-xs text-slate-500 ml-auto shrink-0">{readingTime(a.content)} чтения</span>
                  </div>
                  <h3 className="font-bold text-white text-xl leading-tight group-hover:text-indigo-300 transition-colors">
                    {a.title}
                  </h3>
                  <p className="text-slate-400 text-sm line-clamp-3 flex-1">{a.content}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-auto">
                    <span>{a.author?.nickname ?? 'Редакция'}</span>
                    <span>{dayjs(a.created_at).format('DD.MM.YYYY')}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Remaining articles */}
          {rest.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {rest.map((a) => (
                <div key={a.id} className="gcard p-5 flex flex-col gap-3 hover:border-indigo-500/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-bold text-white text-lg leading-tight">{a.title}</h3>
                    <div className="flex items-center gap-2 shrink-0">
                      {a.category && (
                        <span className="text-xs px-2 py-0.5 rounded-full border border-[#2a2a50] text-slate-400">
                          {a.category}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-slate-400 text-sm line-clamp-3 flex-1">{a.content}</p>
                  <div className="flex items-center justify-between text-xs text-slate-500 mt-auto">
                    <div className="flex items-center gap-3">
                      <span>{a.author?.nickname ?? 'Редакция'}</span>
                      <span>·</span>
                      <span>{readingTime(a.content)} чтения</span>
                    </div>
                    <span>{dayjs(a.created_at).format('DD.MM.YYYY')}</span>
                  </div>
                  <Link
                    to={`/articles/${a.id}`}
                    className="text-indigo-400 hover:text-indigo-300 text-sm font-medium"
                  >
                    Читать →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ArticlesPage;

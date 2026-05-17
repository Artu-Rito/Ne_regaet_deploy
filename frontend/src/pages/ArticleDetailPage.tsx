import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { articleService } from '../services/postService';
import { Article } from '../types/post';
import dayjs from 'dayjs';

function readingTime(content: string): string {
  const words = content.trim().split(/\s+/).length;
  const mins = Math.max(1, Math.round(words / 200));
  return `${mins} мин`;
}

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    if (!id) return;
    articleService.getArticle(id)
      .then((r) => setArticle(r.article))
      .catch((e) => setError(e.response?.data?.error ?? 'Статья не найдена'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return <div className="text-slate-500 text-center py-16">Загрузка...</div>;
  }

  if (error || !article) {
    return (
      <div className="gcard p-8 text-center space-y-4">
        <p className="text-red-400">{error || 'Статья не найдена'}</p>
        <button onClick={() => navigate('/articles')} className="gbtn-ghost">← К статьям</button>
      </div>
    );
  }

  const tags: string[] = Array.isArray(article.tags)
    ? article.tags
    : typeof article.tags === 'string'
      ? (article.tags as string).split(',').map((t: string) => t.trim()).filter(Boolean)
      : [];

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <button onClick={() => navigate('/articles')} className="gbtn-ghost text-sm">
        ← К статьям
      </button>

      <div className="gcard p-6 space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          {article.category && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
              {article.category}
            </span>
          )}
          {tags.map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-full border border-[#2a2a50] text-slate-400">
              #{t}
            </span>
          ))}
        </div>

        <h1 className="text-2xl font-bold text-white leading-snug">{article.title}</h1>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="font-medium text-slate-400">{article.author?.nickname ?? 'Редакция'}</span>
          <span>·</span>
          <span>{dayjs(article.created_at).format('DD.MM.YYYY')}</span>
          <span>·</span>
          <span>{readingTime(article.content)} чтения</span>
        </div>

        <div className="border-t border-[#2a2a50] pt-5 text-slate-300 whitespace-pre-wrap leading-[1.8] text-[15px]">
          {article.content}
        </div>
      </div>

      {/* Back link at bottom */}
      <button onClick={() => navigate('/articles')} className="gbtn-ghost text-sm">
        ← К статьям
      </button>
    </div>
  );
};

export default ArticleDetailPage;

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';

const POST_TYPES = [
  { value: 'post',  label: 'Пост' },
  { value: 'guide', label: 'Гайд' },
  { value: 'news',  label: 'Новость' },
  { value: 'clip',  label: 'Клип' },
];

const GAMES = ['', 'CS2', 'Dota2', 'Valorant', 'Apex', 'WoW', 'PUBG', 'Overwatch2'];

const CreatePostPage: React.FC = () => {
  const [title, setTitle]     = useState('');
  const [content, setContent] = useState('');
  const [postType, setPostType] = useState('post');
  const [game, setGame]       = useState('');
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (title.trim().length < 5)   { setError('Заголовок минимум 5 символов'); return; }
    if (content.trim().length < 20) { setError('Содержание минимум 20 символов'); return; }
    setError('');
    setLoading(true);
    try {
      await postService.createPost({ title, content, post_type: postType, game: game || undefined });
      navigate('/news');
    } catch (err: any) {
      setError(err.response?.data?.error ?? 'Ошибка создания поста');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      <button onClick={() => navigate('/news')} className="gbtn-ghost text-sm">
        ← Назад к ленте
      </button>

      <div className="gcard p-6 space-y-5">
        <h2 className="text-2xl font-bold text-white">Создать пост</h2>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2 text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Тип</label>
              <select
                value={postType}
                onChange={(e) => setPostType(e.target.value)}
                className="ginput w-full"
              >
                {POST_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Игра (необязательно)</label>
              <select
                value={game}
                onChange={(e) => setGame(e.target.value)}
                className="ginput w-full"
              >
                <option value="">Без игры</option>
                {GAMES.filter(Boolean).map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Заголовок</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="ginput"
              placeholder="Заголовок поста"
              required
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 uppercase tracking-wider mb-1 block">Содержание</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="ginput resize-y"
              placeholder="Текст поста..."
              rows={8}
              required
            />
          </div>
          <button type="submit" disabled={loading} className="gbtn-primary">
            {loading ? 'Публикую...' : 'Опубликовать'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostPage;

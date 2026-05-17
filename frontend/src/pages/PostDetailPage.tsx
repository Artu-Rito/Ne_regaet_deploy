import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { postService } from '../services/postService';
import { Post, Comment } from '../types/post';
import { useAuthStore } from '../store/authStore';
import dayjs from 'dayjs';

const POST_TYPE_LABEL: Record<string, string> = {
  post: 'Пост', guide: 'Гайд', news: 'Новость', clip: 'Клип',
};

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();
  const [post, setPost]             = useState<Post | null>(null);
  const [comments, setComments]     = useState<Comment[]>([]);
  const [commentText, setComment]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [editing, setEditing]       = useState(false);
  const [editTitle, setEditTitle]   = useState('');
  const [editContent, setEditContent] = useState('');
  const [editError, setEditError]   = useState('');
  const [saving, setSaving]         = useState(false);

  useEffect(() => {
    if (!id) return;
    postService.getPost(id)
      .then((r) => {
        setPost(r.post);
        setComments(r.post.comments ?? []);
        setEditTitle(r.post.title);
        setEditContent(r.post.content);
      })
      .catch(() => navigate('/news'));
  }, [id]);

  const handleAddComment = async () => {
    if (!id || !commentText.trim()) return;
    setSubmitting(true);
    try {
      const r = await postService.addComment(id, { content: commentText });
      setComments((c) => [...c, r.comment]);
      setComment('');
    } catch { /* ignore */ }
    finally { setSubmitting(false); }
  };

  const handleSaveEdit = async () => {
    if (!id || !post) return;
    if (editTitle.trim().length < 5) { setEditError('Заголовок минимум 5 символов'); return; }
    if (editContent.trim().length < 20) { setEditError('Содержание минимум 20 символов'); return; }
    setSaving(true);
    setEditError('');
    try {
      const r = await postService.updatePost(id, {
        title: editTitle,
        content: editContent,
        post_type: post.post_type,
        game: post.game,
      });
      setPost(r.post);
      setEditing(false);
    } catch (err: any) {
      setEditError(err.response?.data?.error ?? 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !window.confirm('Удалить пост?')) return;
    try {
      await postService.deletePost(id);
      navigate('/news');
    } catch { /* ignore */ }
  };

  if (!post) return null;

  const isOwner = isAuthenticated && user?.id === post.author_id;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <button onClick={() => navigate('/news')} className="gbtn-ghost text-sm">
        ← Назад к ленте
      </button>

      <div className="gcard p-6 space-y-4">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-wrap gap-2 items-center">
            {post.post_type && post.post_type !== 'post' && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                {POST_TYPE_LABEL[post.post_type] ?? post.post_type}
              </span>
            )}
            {post.game && (
              <span className="text-xs px-2 py-0.5 rounded-full border border-[#2a2a50] text-slate-400">
                {post.game}
              </span>
            )}
          </div>
          {isOwner && !editing && (
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setEditing(true)}
                className="text-xs px-3 py-1 rounded-lg border border-[#2a2a50] text-slate-400 hover:text-white hover:border-indigo-500 transition-colors"
              >
                Редактировать
              </button>
              <button
                onClick={handleDelete}
                className="text-xs px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
              >
                Удалить
              </button>
            </div>
          )}
        </div>

        {editing ? (
          <div className="space-y-3">
            <input
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              className="ginput text-xl font-bold"
            />
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              className="ginput resize-y"
              rows={12}
            />
            {editError && <p className="text-red-400 text-sm">{editError}</p>}
            <div className="flex gap-3">
              <button onClick={handleSaveEdit} disabled={saving} className="gbtn-primary">
                {saving ? 'Сохраняю...' : 'Сохранить'}
              </button>
              <button onClick={() => { setEditing(false); setEditError(''); }} className="gbtn-ghost">
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-white">{post.title}</h1>
            <div className="text-xs text-slate-500">
              {post.author?.nickname ?? 'Аноним'} · {dayjs(post.created_at).format('DD.MM.YYYY HH:mm')}
            </div>
            <p className="text-slate-300 whitespace-pre-wrap leading-relaxed">{post.content}</p>
          </>
        )}
      </div>

      <div className="gcard p-6 space-y-4">
        <h3 className="font-bold text-white">Комментарии ({comments.length})</h3>

        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="border-b border-[#1a1a3a] pb-3 last:border-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-semibold text-slate-200 text-sm">{c.user?.nickname ?? 'Аноним'}</span>
                <span className="text-xs text-slate-500">{dayjs(c.created_at).format('DD.MM.YY HH:mm')}</span>
              </div>
              <p className="text-slate-400 text-sm">{c.content}</p>
            </div>
          ))}
          {comments.length === 0 && (
            <p className="text-slate-500 text-sm">Комментариев пока нет. Будьте первым!</p>
          )}
        </div>

        {isAuthenticated ? (
          <div className="space-y-2 pt-2">
            <textarea
              value={commentText}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Напишите комментарий..."
              rows={3}
              className="ginput resize-none"
            />
            <button
              onClick={handleAddComment}
              disabled={!commentText.trim() || submitting}
              className="gbtn-primary"
            >
              {submitting ? 'Отправка...' : 'Отправить'}
            </button>
          </div>
        ) : (
          <p className="text-slate-500 text-sm">
            <button onClick={() => navigate('/login')} className="text-indigo-400 hover:underline">
              Войдите
            </button>
            , чтобы оставить комментарий
          </p>
        )}
      </div>
    </div>
  );
};

export default PostDetailPage;

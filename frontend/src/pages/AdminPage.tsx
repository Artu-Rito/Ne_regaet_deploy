import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

interface AdminPost {
  id: string;
  title: string;
  type: string;
  author: { nickname: string };
  created_at: string;
}

interface AdminArticle {
  id: string;
  title: string;
  category: string;
  author: { nickname: string };
  created_at: string;
}

interface AdminUser {
  id: string;
  nickname: string;
  email: string;
  role: string;
  created_at: string;
}

type Tab = 'posts' | 'articles' | 'users';

const EMPTY_FORM = { title: '', content: '', category: '', tags: '' };

const AdminPage: React.FC = () => {
  const { isAdmin } = useAuthStore();
  const [tab, setTab] = useState<Tab>('posts');
  const [posts, setPosts] = useState<AdminPost[]>([]);
  const [articles, setArticles] = useState<AdminArticle[]>([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isAdmin) return;
    fetchTab(tab);
  }, [tab, isAdmin]);

  const fetchTab = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'posts') {
        const res = await api.get('/admin/posts');
        setPosts(res.data.posts ?? []);
      } else if (t === 'articles') {
        const res = await api.get('/admin/articles');
        setArticles(res.data.articles ?? []);
      } else {
        const res = await api.get('/admin/users');
        setUsers(res.data.users ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  const deletePost = async (id: string) => {
    if (!confirm('Удалить пост?')) return;
    await api.delete(`/admin/posts/${id}`);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  const deleteArticle = async (id: string) => {
    if (!confirm('Удалить статью?')) return;
    await api.delete(`/admin/articles/${id}`);
    setArticles((a) => a.filter((x) => x.id !== id));
  };

  const createArticle = async () => {
    if (!form.title.trim() || !form.content.trim()) return;
    setSaving(true);
    try {
      const res = await api.post('/admin/articles', form);
      setArticles((a) => [res.data.article, ...a]);
      setForm(EMPTY_FORM);
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  };

  if (!isAdmin) {
    return (
      <div className="gcard p-8 text-center text-slate-400">
        Доступ запрещён
      </div>
    );
  }

  const tabs: { key: Tab; label: string }[] = [
    { key: 'posts', label: 'Посты' },
    { key: 'articles', label: 'Статьи' },
    { key: 'users', label: 'Пользователи' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white tracking-wide">Админ-панель</h1>

      <div className="flex gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              tab === t.key
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="gcard p-4">
        {loading ? (
          <div className="text-center text-slate-400 py-8">Загрузка...</div>
        ) : (
          <>
            {tab === 'posts' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left border-b border-slate-700">
                    <th className="pb-2">Заголовок</th>
                    <th className="pb-2">Тип</th>
                    <th className="pb-2">Автор</th>
                    <th className="pb-2">Дата</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {posts.map((p) => (
                    <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                      <td className="py-2 text-white">{p.title}</td>
                      <td className="py-2 text-slate-400">{p.type}</td>
                      <td className="py-2 text-slate-400">{p.author?.nickname}</td>
                      <td className="py-2 text-slate-500 text-xs">
                        {new Date(p.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => deletePost(p.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-800 hover:border-red-500 transition-colors"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                  {posts.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-500">Постов нет</td></tr>
                  )}
                </tbody>
              </table>
            )}

            {tab === 'articles' && (
              <>
              {showForm ? (
                <div className="mb-6 space-y-3">
                  <h3 className="text-white font-semibold">Новая статья</h3>
                  <input
                    className="ginput w-full"
                    placeholder="Заголовок *"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                  />
                  <input
                    className="ginput w-full"
                    placeholder="Категория (например: guide, news)"
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                  />
                  <input
                    className="ginput w-full"
                    placeholder="Теги через запятую"
                    value={form.tags}
                    onChange={(e) => setForm({ ...form, tags: e.target.value })}
                  />
                  <textarea
                    className="ginput w-full min-h-[200px] resize-y"
                    placeholder="Содержание *"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={createArticle}
                      disabled={saving || !form.title.trim() || !form.content.trim()}
                      className="gbtn-primary px-5 py-2 text-sm disabled:opacity-50"
                    >
                      {saving ? 'Сохраняю...' : 'Опубликовать'}
                    </button>
                    <button
                      onClick={() => { setShowForm(false); setForm(EMPTY_FORM); }}
                      className="gbtn-ghost px-5 py-2 text-sm"
                    >
                      Отмена
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <button
                    onClick={() => setShowForm(true)}
                    className="gbtn-primary px-4 py-2 text-sm"
                  >
                    + Написать статью
                  </button>
                </div>
              )}
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left border-b border-slate-700">
                    <th className="pb-2">Заголовок</th>
                    <th className="pb-2">Категория</th>
                    <th className="pb-2">Автор</th>
                    <th className="pb-2">Дата</th>
                    <th className="pb-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a) => (
                    <tr key={a.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                      <td className="py-2 text-white">{a.title}</td>
                      <td className="py-2 text-slate-400">{a.category}</td>
                      <td className="py-2 text-slate-400">{a.author?.nickname}</td>
                      <td className="py-2 text-slate-500 text-xs">
                        {new Date(a.created_at).toLocaleDateString('ru-RU')}
                      </td>
                      <td className="py-2">
                        <button
                          onClick={() => deleteArticle(a.id)}
                          className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-800 hover:border-red-500 transition-colors"
                        >
                          Удалить
                        </button>
                      </td>
                    </tr>
                  ))}
                  {articles.length === 0 && (
                    <tr><td colSpan={5} className="py-6 text-center text-slate-500">Статей нет</td></tr>
                  )}
                </tbody>
              </table>
              </>
            )}

            {tab === 'users' && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-slate-400 text-left border-b border-slate-700">
                    <th className="pb-2">Никнейм</th>
                    <th className="pb-2">Email</th>
                    <th className="pb-2">Роль</th>
                    <th className="pb-2">Дата регистрации</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                      <td className="py-2 text-white">{u.nickname}</td>
                      <td className="py-2 text-slate-400">{u.email}</td>
                      <td className="py-2">
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          u.role === 'admin' ? 'bg-indigo-900 text-indigo-300' : 'bg-slate-700 text-slate-400'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-2 text-slate-500 text-xs">
                        {new Date(u.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr><td colSpan={4} className="py-6 text-center text-slate-500">Пользователей нет</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminPage;

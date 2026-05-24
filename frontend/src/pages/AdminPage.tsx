import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

// ── Типы данных ──────────────────────────────────────────────────────────────

interface AdminStats {
  total_users:     number;
  total_tests:     number;
  tests_last_hour: number;
}

interface AdminPost {
  id: string;
  title: string;
  type: string;
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

interface AdminServer {
  id: string;
  name: string;
  ip: string;
  port: number;
  game: string;
  region: string;
}

// Пустая форма для создания нового игрового сервера
const EMPTY_SERVER = { name: '', ip: '', port: '', game: '', region: '' };

type Tab = 'posts' | 'users' | 'servers';

// ── Виджет статистики ────────────────────────────────────────────────────────
// Отображает одну цифру с подписью в карточке
const StatCard: React.FC<{ label: string; value: number | null; hint: string }> = ({ label, value, hint }) => (
  <div className="gcard p-5 space-y-1">
    <div className="text-3xl font-bold text-white digital">
      {value === null ? '—' : value.toLocaleString('ru-RU')}
    </div>
    <div className="text-sm font-medium text-slate-300">{label}</div>
    <div className="text-xs text-slate-500">{hint}</div>
  </div>
);

// ── Главный компонент ────────────────────────────────────────────────────────
const AdminPage: React.FC = () => {
  const { isAdmin } = useAuthStore();

  // Статистика дашборда
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Вкладки и их данные
  const [tab, setTab]         = useState<Tab>('posts');
  const [posts, setPosts]     = useState<AdminPost[]>([]);
  const [users, setUsers]     = useState<AdminUser[]>([]);
  const [servers, setServers] = useState<AdminServer[]>([]);
  const [loading, setLoading] = useState(false);

  // Форма добавления сервера
  const [showServerForm, setShowServerForm] = useState(false);
  const [serverForm, setServerForm]         = useState(EMPTY_SERVER);
  const [saving, setSaving]                 = useState(false);
  const [formError, setFormError]           = useState('');

  // При монтировании сразу грузим статистику дашборда
  useEffect(() => {
    if (!isAdmin) return;
    fetchStats();
  }, [isAdmin]);

  // При переключении вкладки загружаем нужные данные
  useEffect(() => {
    if (!isAdmin) return;
    fetchTab(tab);
  }, [tab, isAdmin]);

  // ── Загрузка статистики ──────────────────────────────────────────────────
  const fetchStats = async () => {
    setStatsLoading(true);
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch {
      // Если не удалось — оставляем null, выведется «—»
    } finally {
      setStatsLoading(false);
    }
  };

  // ── Загрузка данных вкладки ──────────────────────────────────────────────
  const fetchTab = async (t: Tab) => {
    setLoading(true);
    try {
      if (t === 'posts') {
        const res = await api.get('/admin/posts');
        setPosts(res.data.posts ?? []);
      } else if (t === 'users') {
        const res = await api.get('/admin/users');
        setUsers(res.data.users ?? []);
      } else if (t === 'servers') {
        const res = await api.get('/admin/servers');
        setServers(res.data.servers ?? []);
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Удаление поста ───────────────────────────────────────────────────────
  const deletePost = async (id: string) => {
    if (!confirm('Удалить пост?')) return;
    await api.delete(`/admin/posts/${id}`);
    setPosts((p) => p.filter((x) => x.id !== id));
  };

  // ── Создание игрового сервера ────────────────────────────────────────────
  const createServer = async () => {
    setFormError('');
    const port = parseInt(serverForm.port, 10);
    if (!serverForm.name.trim() || !serverForm.ip.trim() || !serverForm.game.trim() || !serverForm.region.trim()) {
      setFormError('Заполните все обязательные поля');
      return;
    }
    if (isNaN(port) || port < 1 || port > 65535) {
      setFormError('Порт должен быть числом от 1 до 65535');
      return;
    }
    setSaving(true);
    try {
      const res = await api.post('/admin/servers', {
        name:   serverForm.name.trim(),
        ip:     serverForm.ip.trim(),
        port,
        game:   serverForm.game.trim(),
        region: serverForm.region.trim(),
      });
      setServers((s) => [res.data.server, ...s]);
      setServerForm(EMPTY_SERVER);
      setShowServerForm(false);
    } catch (e: any) {
      setFormError(e?.response?.data?.error ?? 'Ошибка при создании сервера');
    } finally {
      setSaving(false);
    }
  };

  // ── Удаление игрового сервера ────────────────────────────────────────────
  const deleteServer = async (id: string) => {
    if (!confirm('Удалить сервер? Это не удалит историю тестов.')) return;
    await api.delete(`/admin/servers/${id}`);
    setServers((s) => s.filter((x) => x.id !== id));
  };

  // ── Доступ запрещён ──────────────────────────────────────────────────────
  if (!isAdmin) {
    return (
      <div className="gcard p-8 text-center text-slate-400">
        Доступ запрещён
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: 'posts',   label: 'Посты',       icon: '📝' },
    { key: 'users',   label: 'Пользователи', icon: '👥' },
    { key: 'servers', label: 'Серверы',      icon: '🖥' },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto">

      {/* ════════════════════════════════════════════════════════════
          ЗАГОЛОВОК
          ════════════════════════════════════════════════════════════ */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-wide">Админ-панель</h1>
        <p className="text-sm text-slate-500 mt-1">
          Управление платформой: статистика, модерация постов, пользователи, игровые серверы.
        </p>
      </div>

      {/* ════════════════════════════════════════════════════════════
          ДАШБОРД — СВОДНАЯ СТАТИСТИКА
          ════════════════════════════════════════════════════════════ */}
      <section>
        <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">
          Статистика платформы
        </h2>
        {statsLoading ? (
          <div className="text-slate-500 text-sm">Загрузка...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <StatCard
              label="Всего пользователей"
              value={stats?.total_users ?? null}
              hint="Зарегистрировано за всё время"
            />
            <StatCard
              label="Тестов за последний час"
              value={stats?.tests_last_hour ?? null}
              hint="Активность прямо сейчас"
            />
            <StatCard
              label="Всего тестов"
              value={stats?.total_tests ?? null}
              hint="Измерений пинга в базе"
            />
          </div>
        )}
      </section>

      {/* ════════════════════════════════════════════════════════════
          ВКЛАДКИ
          ════════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex gap-2 border-b border-[#2a2a50]">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                tab === t.key
                  ? 'border-indigo-500 text-white'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Содержимое вкладки */}
        <div className="gcard p-4 overflow-x-auto">
          {loading ? (
            <div className="text-center text-slate-400 py-10">Загрузка...</div>
          ) : (
            <>

              {/* ──────────────────────────────────────────────
                  ВКЛАДКА: ПОСТЫ
                  ────────────────────────────────────────────── */}
              {tab === 'posts' && (
                <>
                  <p className="text-xs text-slate-500 mb-3">
                    Модерация пользовательских постов. Удалённые посты не восстанавливаются.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-left border-b border-slate-700">
                        <th className="pb-2 pr-4">Заголовок</th>
                        <th className="pb-2 pr-4">Тип</th>
                        <th className="pb-2 pr-4">Автор</th>
                        <th className="pb-2 pr-4">Дата</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {posts.map((p) => (
                        <tr key={p.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                          <td className="py-2 pr-4 text-white">{p.title}</td>
                          <td className="py-2 pr-4 text-slate-400">{p.type}</td>
                          <td className="py-2 pr-4 text-slate-400">{p.author?.nickname}</td>
                          <td className="py-2 pr-4 text-slate-500 text-xs whitespace-nowrap">
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
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">Постов нет</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {/* ──────────────────────────────────────────────
                  ВКЛАДКА: ПОЛЬЗОВАТЕЛИ
                  ────────────────────────────────────────────── */}
              {tab === 'users' && (
                <>
                  <p className="text-xs text-slate-500 mb-3">
                    Список всех зарегистрированных аккаунтов. Всего: {users.length}.
                  </p>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-left border-b border-slate-700">
                        <th className="pb-2 pr-4">Никнейм</th>
                        <th className="pb-2 pr-4">Email</th>
                        <th className="pb-2 pr-4">Роль</th>
                        <th className="pb-2">Дата регистрации</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.map((u) => (
                        <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                          <td className="py-2 pr-4 text-white">{u.nickname}</td>
                          <td className="py-2 pr-4 text-slate-400">{u.email}</td>
                          <td className="py-2 pr-4">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              u.role === 'admin'
                                ? 'bg-indigo-900 text-indigo-300'
                                : 'bg-slate-700 text-slate-400'
                            }`}>
                              {u.role}
                            </span>
                          </td>
                          <td className="py-2 text-slate-500 text-xs whitespace-nowrap">
                            {new Date(u.created_at).toLocaleDateString('ru-RU')}
                          </td>
                        </tr>
                      ))}
                      {users.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-8 text-center text-slate-500">
                            Пользователей нет
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}

              {/* ──────────────────────────────────────────────
                  ВКЛАДКА: СЕРВЕРЫ
                  ────────────────────────────────────────────── */}
              {tab === 'servers' && (
                <>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-slate-500">
                      Игровые серверы для тестирования пинга. Добавь IP и порт, и система начнёт их измерять.
                    </p>
                    {!showServerForm && (
                      <button
                        onClick={() => { setShowServerForm(true); setFormError(''); }}
                        className="gbtn-primary px-4 py-1.5 text-sm shrink-0 ml-4"
                      >
                        + Добавить сервер
                      </button>
                    )}
                  </div>

                  {/* Форма добавления нового сервера */}
                  {showServerForm && (
                    <div className="mb-5 p-4 rounded-xl border border-[#2a2a50] bg-[#0f0f2a] space-y-3">
                      <h3 className="text-white font-semibold text-sm">Новый сервер</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">
                            Название <span className="text-red-400">*</span>
                          </label>
                          <input
                            className="ginput w-full"
                            placeholder="Например: CS2 EU Frankfurt"
                            value={serverForm.name}
                            onChange={(e) => setServerForm({ ...serverForm, name: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">
                            Игра <span className="text-red-400">*</span>
                          </label>
                          <input
                            className="ginput w-full"
                            placeholder="CS2, Dota2, Valorant..."
                            value={serverForm.game}
                            onChange={(e) => setServerForm({ ...serverForm, game: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">
                            IP-адрес <span className="text-red-400">*</span>
                          </label>
                          <input
                            className="ginput w-full font-mono"
                            placeholder="192.168.0.1 или hostname"
                            value={serverForm.ip}
                            onChange={(e) => setServerForm({ ...serverForm, ip: e.target.value })}
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">
                            Порт <span className="text-red-400">*</span>
                          </label>
                          <input
                            className="ginput w-full font-mono"
                            placeholder="27015"
                            value={serverForm.port}
                            onChange={(e) => setServerForm({ ...serverForm, port: e.target.value })}
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="text-xs text-slate-400 mb-1 block">
                            Регион <span className="text-red-400">*</span>
                          </label>
                          <input
                            className="ginput w-full"
                            placeholder="EU, RU, NA, Asia..."
                            value={serverForm.region}
                            onChange={(e) => setServerForm({ ...serverForm, region: e.target.value })}
                          />
                        </div>
                      </div>

                      {/* Ошибка валидации */}
                      {formError && (
                        <p className="text-xs text-red-400">{formError}</p>
                      )}

                      <div className="flex gap-2 pt-1">
                        <button
                          onClick={createServer}
                          disabled={saving}
                          className="gbtn-primary px-5 py-2 text-sm disabled:opacity-50"
                        >
                          {saving ? 'Сохраняю...' : 'Добавить'}
                        </button>
                        <button
                          onClick={() => { setShowServerForm(false); setServerForm(EMPTY_SERVER); setFormError(''); }}
                          className="gbtn-ghost px-5 py-2 text-sm"
                        >
                          Отмена
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Таблица серверов */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-slate-400 text-left border-b border-slate-700">
                        <th className="pb-2 pr-4">Название</th>
                        <th className="pb-2 pr-4">Игра</th>
                        <th className="pb-2 pr-4">Адрес</th>
                        <th className="pb-2 pr-4">Регион</th>
                        <th className="pb-2"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {servers.map((s) => (
                        <tr key={s.id} className="border-b border-slate-800 hover:bg-slate-800/40">
                          <td className="py-2 pr-4 text-white">{s.name}</td>
                          <td className="py-2 pr-4 text-slate-400">{s.game}</td>
                          <td className="py-2 pr-4 text-slate-400 font-mono text-xs">
                            {s.ip}:{s.port}
                          </td>
                          <td className="py-2 pr-4 text-slate-400">{s.region}</td>
                          <td className="py-2">
                            <button
                              onClick={() => deleteServer(s.id)}
                              className="text-red-400 hover:text-red-300 text-xs px-2 py-1 rounded border border-red-800 hover:border-red-500 transition-colors"
                            >
                              Удалить
                            </button>
                          </td>
                        </tr>
                      ))}
                      {servers.length === 0 && (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-slate-500">
                            Серверов нет — добавьте первый выше
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </>
              )}

            </>
          )}
        </div>
      </section>

    </div>
  );
};

export default AdminPage;

import React, { useEffect, useState } from 'react';
import { lfgService } from '../services/lfgService';
import { LFGRequest, CreateLFGInput } from '../types/lfg';
import { useAuthStore } from '../store/authStore';

const GAMES = ['Все', 'CS2', 'Dota2', 'Valorant', 'Apex', 'WoW', 'PUBG', 'Overwatch2'];
const REGIONS = ['Все', 'RU', 'EU', 'ASIA', 'NA'];

const GAME_COLOR: Record<string, string> = {
  CS2: 'text-orange-400 bg-orange-400/10 border-orange-400/30',
  Dota2: 'text-red-400 bg-red-400/10 border-red-400/30',
  Valorant: 'text-pink-400 bg-pink-400/10 border-pink-400/30',
  Apex: 'text-yellow-400 bg-yellow-400/10 border-yellow-400/30',
  WoW: 'text-blue-400 bg-blue-400/10 border-blue-400/30',
  PUBG: 'text-green-400 bg-green-400/10 border-green-400/30',
  Overwatch2: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/30',
};

const REGION_LABEL: Record<string, string> = { RU: '🇷🇺 RU', EU: '🇪🇺 EU', ASIA: '🌏 ASIA', NA: '🌎 NA' };

const emptyForm: CreateLFGInput = { game: 'CS2', region: 'RU', rank: '', description: '', contact: '' };

const LFGPage: React.FC = () => {
  const { isAuthenticated } = useAuthStore();
  const [requests, setRequests] = useState<LFGRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterGame, setFilterGame] = useState('Все');
  const [filterRegion, setFilterRegion] = useState('Все');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CreateLFGInput>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const game = filterGame !== 'Все' ? filterGame : undefined;
      const region = filterRegion !== 'Все' ? filterRegion : undefined;
      const res = await lfgService.getAll(game, region);
      setRequests(res.requests ?? []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filterGame, filterRegion]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description.trim() || !form.contact.trim()) {
      setError('Заполните описание и контакт');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await lfgService.create(form);
      setShowForm(false);
      setForm(emptyForm);
      load();
    } catch {
      setError('Ошибка при создании — попробуйте ещё раз');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await lfgService.delete(id);
      setRequests((prev) => prev.filter((r) => r.id !== id));
    } catch {
      // ignore
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Найти команду</h1>
          <p className="text-slate-400 text-sm mt-1">
            Ищи тиммейтов по игре и региону. Нашёл — пиши в Discord или Steam.
          </p>
        </div>
        {isAuthenticated && (
          <button
            className="gbtn-primary shrink-0"
            onClick={() => setShowForm(!showForm)}
          >
            {showForm ? '✕ Отмена' : '+ Разместить объявление'}
          </button>
        )}
        {!isAuthenticated && (
          <p className="text-slate-500 text-sm">
            <a href="/login" className="text-indigo-400 hover:underline">Войдите</a>, чтобы разместить объявление
          </p>
        )}
      </div>

      {/* Create form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="gcard p-6 space-y-4">
          <h3 className="text-white font-semibold">Новое объявление</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Игра</label>
              <select
                className="ginput w-full"
                value={form.game}
                onChange={(e) => setForm({ ...form, game: e.target.value })}
              >
                {GAMES.filter((g) => g !== 'Все').map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Регион</label>
              <select
                className="ginput w-full"
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value })}
              >
                {REGIONS.filter((r) => r !== 'Все').map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">Ранг / MMR</label>
              <input
                className="ginput w-full"
                placeholder="Gold Nova 3, 3200 MMR..."
                value={form.rank}
                onChange={(e) => setForm({ ...form, rank: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Описание</label>
            <textarea
              className="ginput w-full h-24 resize-none"
              placeholder="Расскажите о себе, времени игры, чего ищете..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 block mb-1">Контакт</label>
            <input
              className="ginput w-full"
              placeholder="Discord: ник#1234 или Steam: ссылка"
              value={form.contact}
              onChange={(e) => setForm({ ...form, contact: e.target.value })}
            />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button type="submit" className="gbtn-primary" disabled={submitting}>
            {submitting ? 'Публикуем...' : 'Опубликовать'}
          </button>
        </form>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Игра</span>
          {GAMES.map((g) => (
            <button
              key={g}
              onClick={() => setFilterGame(g)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                filterGame === g
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-[#2a2a50] text-slate-400 hover:text-white hover:border-indigo-500'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-slate-500 uppercase tracking-wider">Регион</span>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => setFilterRegion(r)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                filterRegion === r
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'border-[#2a2a50] text-slate-400 hover:text-white hover:border-indigo-500'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      <p className="text-slate-500 text-sm">
        {loading ? 'Загрузка...' : `Найдено объявлений: ${requests.length}`}
      </p>

      {/* Cards */}
      {!loading && requests.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <div className="text-4xl mb-3">🔍</div>
          <p>Объявлений не найдено</p>
          {isAuthenticated && (
            <button className="gbtn-primary mt-4" onClick={() => setShowForm(true)}>
              Разместить первое объявление
            </button>
          )}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {requests.map((req) => (
          <LFGCard key={req.id} req={req} onDelete={handleDelete} />
        ))}
      </div>
    </div>
  );
};

interface LFGCardProps {
  req: LFGRequest;
  onDelete: (id: string) => void;
}

const LFGCard: React.FC<LFGCardProps> = ({ req, onDelete }) => {
  const { user } = useAuthStore();
  const isOwner = user?.id === req.user_id;
  const gameClass = GAME_COLOR[req.game] ?? 'text-slate-400 bg-slate-400/10 border-slate-400/30';

  return (
    <div className="gcard p-5 flex flex-col gap-3 hover:border-indigo-500/40 transition-colors">
      {/* Top row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-2 py-0.5 rounded text-xs font-bold border ${gameClass}`}>
            {req.game}
          </span>
          {req.region && (
            <span className="text-xs text-slate-500">
              {REGION_LABEL[req.region] ?? req.region}
            </span>
          )}
          {req.rank && (
            <span className="text-xs text-slate-400 bg-white/5 px-2 py-0.5 rounded">
              {req.rank}
            </span>
          )}
        </div>
        {isOwner && (
          <button
            onClick={() => onDelete(req.id)}
            className="text-slate-600 hover:text-red-400 text-xs transition-colors shrink-0"
            title="Удалить"
          >
            ✕
          </button>
        )}
      </div>

      {/* Author */}
      <div className="flex items-center gap-2">
        <span className="w-7 h-7 rounded-full bg-indigo-700 flex items-center justify-center text-xs font-bold text-white shrink-0">
          {req.user?.nickname?.[0]?.toUpperCase() ?? '?'}
        </span>
        <span className="text-slate-300 text-sm font-medium">{req.user?.nickname ?? 'Игрок'}</span>
        <span className="text-slate-600 text-xs ml-auto">
          {new Date(req.created_at).toLocaleDateString('ru-RU')}
        </span>
      </div>

      {/* Description */}
      <p className="text-slate-400 text-sm leading-relaxed flex-1">{req.description}</p>

      {/* Contact */}
      <div className="pt-2 border-t border-[#2a2a50]">
        <span className="text-xs text-slate-500">Контакт: </span>
        <span className="text-xs text-indigo-400 font-mono break-all">{req.contact}</span>
      </div>
    </div>
  );
};

export default LFGPage;

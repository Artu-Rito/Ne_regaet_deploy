import React, { useState } from 'react';
import { ChatRoom } from '../../types/chat';

const GAME_ICON: Record<string, string> = {
  CS2: '🎮',
  Dota2: '⚔️',
  Valorant: '🔫',
  Apex: '🏆',
  WoW: '🐉',
  PUBG: '🪖',
  Overwatch2: '🛡️',
};

interface Props {
  rooms: ChatRoom[];
  activeSlug: string | null;
  onlineByRoom: Record<string, number>;
  unreadByRoom: Record<string, number>;
  onSelect: (slug: string) => void;
}

const RoomSidebar: React.FC<Props> = ({ rooms, activeSlug, onlineByRoom, unreadByRoom, onSelect }) => {
  const grouped: Record<string, ChatRoom[]> = {};
  for (const r of rooms) {
    if (!grouped[r.game]) grouped[r.game] = [];
    grouped[r.game].push(r);
  }

  const games = Object.keys(grouped).sort();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const toggle = (game: string) =>
    setCollapsed((prev) => ({ ...prev, [game]: !prev[game] }));

  return (
    <div className="w-52 shrink-0 border-r border-[#2a2a50] overflow-y-auto flex flex-col gap-1 py-2">
      {games.map((game) => {
        const isCollapsed = collapsed[game];
        const gameRooms = grouped[game];
        const gameUnread = gameRooms.reduce((s, r) => s + (unreadByRoom[r.slug] ?? 0), 0);

        return (
          <div key={game}>
            <button
              onClick={() => toggle(game)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-left hover:bg-white/5 transition-colors"
            >
              <span className="text-base">{GAME_ICON[game] ?? '🎮'}</span>
              <span className="text-sm font-semibold text-slate-300 flex-1">{game}</span>
              {gameUnread > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[1.2rem] text-center">
                  {gameUnread}
                </span>
              )}
              <span className="text-slate-600 text-xs">{isCollapsed ? '▶' : '▼'}</span>
            </button>

            {!isCollapsed && (
              <div className="pl-3">
                {gameRooms.map((room) => {
                  const online = onlineByRoom[room.slug] ?? 0;
                  const unread = unreadByRoom[room.slug] ?? 0;
                  const isActive = room.slug === activeSlug;

                  return (
                    <button
                      key={room.slug}
                      onClick={() => onSelect(room.slug)}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-left transition-colors text-sm ${
                        isActive
                          ? 'bg-indigo-500/15 text-indigo-300'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                          online > 0 ? 'bg-green-500' : 'bg-slate-600'
                        }`}
                      />
                      <span className="flex-1 truncate"># {room.name}</span>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-xs rounded-full px-1 min-w-[1.1rem] text-center">
                          {unread > 9 ? '9+' : unread}
                        </span>
                      )}
                      {online > 0 && (
                        <span className="text-xs text-green-500 font-mono shrink-0">{online}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default RoomSidebar;

import { create } from 'zustand';
import { ChatRoom, ChatMessage, WSEvent } from '../types/chat';
import { chatService } from '../services/chatService';
import { authService } from '../services/authService';

const LS_KEY = 'chat_last_seen';

function loadLastSeen(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) ?? '{}');
  } catch {
    return {};
  }
}

function saveLastSeen(data: Record<string, string>) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

interface ChatState {
  rooms: ChatRoom[];
  messagesByRoom: Record<string, ChatMessage[]>;
  onlineByRoom: Record<string, number>;
  unreadByRoom: Record<string, number>;
  lastSeenAt: Record<string, string>;
  activeSlug: string | null;
  ws: WebSocket | null;
  pollingTimer: ReturnType<typeof setInterval> | null;

  fetchRooms: () => Promise<void>;
  connectToRoom: (slug: string, token: string) => void;
  disconnectFromRoom: () => void;
  sendMessage: (content: string) => void;
  markRead: (slug: string) => void;
  startPolling: () => void;
  stopPolling: () => void;
  getTotalUnread: () => number;
}

export const useChatStore = create<ChatState>((set, get) => ({
  rooms: [],
  messagesByRoom: {},
  onlineByRoom: {},
  unreadByRoom: {},
  lastSeenAt: loadLastSeen(),
  activeSlug: null,
  ws: null,
  pollingTimer: null,

  fetchRooms: async () => {
    try {
      const { rooms } = await chatService.getRooms();
      const state = get();
      const newUnread = { ...state.unreadByRoom };

      for (const r of rooms) {
        if (r.last_message_at && r.slug !== state.activeSlug) {
          const last = state.lastSeenAt[r.slug];
          if (!last || new Date(r.last_message_at) > new Date(last)) {
            newUnread[r.slug] = 1;
          }
        }
      }

      set({ rooms, unreadByRoom: newUnread });
    } catch {
      // ignore
    }
  },

  connectToRoom: (slug, token) => {
    const state = get();

    // Close existing socket
    if (state.ws) {
      state.ws.close();
    }

    // Reset online count for previous room so indicator doesn't stay lit
    const prevSlug = state.activeSlug;
    const updatedOnline = { ...state.onlineByRoom };
    if (prevSlug && prevSlug !== slug) {
      updatedOnline[prevSlug] = 0;
    }

    // Set active room IMMEDIATELY for instant UI feedback
    set({ activeSlug: slug, ws: null, onlineByRoom: updatedOnline });
    get().markRead(slug);

    // Load history via REST right away, caching result
    if (!get().messagesByRoom[slug]) {
      set({ messagesByRoom: { ...get().messagesByRoom, [slug]: [] } });
      chatService.getHistory(slug).then(({ messages }) => {
        const shaped: ChatMessage[] = (messages as any[]).map((m) => ({
          type: 'message' as const,
          id: m.id,
          room_slug: slug,
          user_id: m.user_id,
          nickname: m.user?.nickname ?? 'Игрок',
          content: m.content,
          created_at: m.created_at,
        }));
        // Only overwrite if WS hasn't already populated messages
        if ((get().messagesByRoom[slug] ?? []).length === 0 && shaped.length > 0) {
          set({ messagesByRoom: { ...get().messagesByRoom, [slug]: shaped } });
        }
      }).catch(() => {});
    }

    // Connect WebSocket in background
    const proto = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const host = window.location.host;
    const url = `${proto}://${host}/ws/chat/${slug}?token=${token}`;

    const socket = new WebSocket(url);

    socket.onopen = () => {
      set({ ws: socket });
    };

    socket.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);

        if (data.type === 'message') {
          const current = get();
          // Skip duplicate messages (may arrive via both WS history and REST)
          const existing = current.messagesByRoom[slug] ?? [];
          const msgId = (data as ChatMessage).id;
          if (existing.some((m) => m.id === msgId)) return;

          const updated = [...existing, data as ChatMessage];
          const capped = updated.length > 200 ? updated.slice(-200) : updated;
          set({ messagesByRoom: { ...get().messagesByRoom, [slug]: capped } });
        } else if (data.type === 'online_count') {
          set({ onlineByRoom: { ...get().onlineByRoom, [data.room_slug]: data.count } });
        }
      } catch {
        // ignore malformed frames
      }
    };

    socket.onclose = () => {
      set({ ws: null });
      // Reconnect after 3s if still in this room
      setTimeout(() => {
        const state = get();
        if (state.activeSlug === slug) {
          const token = authService.getToken();
          if (token) get().connectToRoom(slug, token);
        }
      }, 3000);
    };

    socket.onerror = () => {
      set({ ws: null });
    };
  },

  disconnectFromRoom: () => {
    const { ws } = get();
    if (ws) ws.close();
    set({ ws: null, activeSlug: null });
  },

  sendMessage: (content) => {
    const { ws } = get();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    ws.send(JSON.stringify({ type: 'message', content }));
  },

  markRead: (slug) => {
    const now = new Date().toISOString();
    const updated = { ...get().lastSeenAt, [slug]: now };
    const unread = { ...get().unreadByRoom, [slug]: 0 };
    saveLastSeen(updated);
    set({ lastSeenAt: updated, unreadByRoom: unread });
  },

  startPolling: () => {
    if (get().pollingTimer) return;
    get().fetchRooms();
    const timer = setInterval(() => get().fetchRooms(), 60_000);
    set({ pollingTimer: timer });
  },

  stopPolling: () => {
    const { pollingTimer } = get();
    if (pollingTimer) clearInterval(pollingTimer);
    set({ pollingTimer: null });
  },

  getTotalUnread: () => {
    return Object.values(get().unreadByRoom).reduce((a, b) => a + b, 0);
  },
}));

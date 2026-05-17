export interface ChatRoom {
  id: string;
  game: string;
  slug: string;
  name: string;
  description: string;
  order_index: number;
  online_count: number;
  last_message_at: string | null;
  created_at: string;
}

export interface ChatMessage {
  type: 'message';
  id: string;
  room_slug: string;
  user_id: string;
  nickname: string;
  content: string;
  created_at: string;
}

export type WSEvent =
  | ChatMessage
  | { type: 'online_count'; room_slug: string; count: number }
  | { type: 'error'; code: string; message: string };

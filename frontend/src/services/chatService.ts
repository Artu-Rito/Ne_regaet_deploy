import api from './api';
import { ChatRoom, ChatMessage } from '../types/chat';

export const chatService = {
  getRooms: async (): Promise<{ rooms: ChatRoom[] }> => {
    const res = await api.get('/chat/rooms');
    return res.data;
  },

  getHistory: async (slug: string): Promise<{ messages: ChatMessage[]; room: ChatRoom }> => {
    const res = await api.get(`/chat/rooms/${slug}/history`);
    return res.data;
  },
};

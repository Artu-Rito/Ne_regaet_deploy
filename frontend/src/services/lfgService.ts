import api from './api';
import { LFGRequest, CreateLFGInput } from '../types/lfg';

export const lfgService = {
  getAll: async (game?: string, region?: string): Promise<{ requests: LFGRequest[] }> => {
    const params = new URLSearchParams();
    if (game) params.append('game', game);
    if (region) params.append('region', region);
    const query = params.toString();
    const response = await api.get(`/lfg${query ? '?' + query : ''}`);
    return response.data;
  },

  create: async (data: CreateLFGInput): Promise<{ request: LFGRequest }> => {
    const response = await api.post('/lfg', data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/lfg/${id}`);
  },
};

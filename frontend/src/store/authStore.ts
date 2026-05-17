import { create } from 'zustand';
import { User } from '../types/user';
import { authService } from '../services/authService';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateProfile: (data: { nickname?: string }) => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isAdmin: false,

  login: async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    authService.setToken(response.token);
    set({ user: response.user, isAuthenticated: true, isAdmin: response.user.role === 'admin' });
  },

  register: async (email: string, password: string, nickname: string) => {
    const response = await authService.register({ email, password, nickname });
    authService.setToken(response.token);
    set({ user: response.user, isAuthenticated: true, isAdmin: response.user.role === 'admin' });
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false, isAdmin: false });
  },

  updateProfile: async (data: { nickname?: string }) => {
    const response = await authService.updateProfile(data);
    authService.setToken(response.token);
    set({ user: response.user });
  },

  checkAuth: async () => {
    const token = authService.getToken();
    if (!token) {
      set({ user: null, isAuthenticated: false, isAdmin: false });
      return;
    }

    try {
      const response = await authService.getMe();
      set({ user: response.user, isAuthenticated: true, isAdmin: response.user.role === 'admin' });
    } catch {
      authService.logout();
      set({ user: null, isAuthenticated: false, isAdmin: false });
    }
  },
}));

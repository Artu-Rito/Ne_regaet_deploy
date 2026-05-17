import api from './api';
import { Post, Comment, Article } from '../types/post';

export interface CreatePostInput {
  title: string;
  content: string;
  post_type?: string;
  game?: string;
}

export interface CreateCommentInput {
  content: string;
}

export const postService = {
  getPosts: async (page: number = 1, limit: number = 10) => {
    const response = await api.get(`/posts?page=${page}&limit=${limit}`);
    return response.data;
  },

  getPost: async (id: string): Promise<{ post: Post }> => {
    const response = await api.get(`/posts/${id}`);
    return response.data;
  },

  createPost: async (data: CreatePostInput): Promise<{ post: Post }> => {
    const response = await api.post('/posts', data);
    return response.data;
  },

  updatePost: async (id: string, data: CreatePostInput): Promise<{ post: Post }> => {
    const response = await api.put(`/posts/${id}`, data);
    return response.data;
  },

  deletePost: async (id: string): Promise<{ success: boolean }> => {
    const response = await api.delete(`/posts/${id}`);
    return response.data;
  },

  addComment: async (postId: string, data: CreateCommentInput): Promise<{ comment: Comment }> => {
    const response = await api.post(`/posts/${postId}/comments`, data);
    return response.data;
  },
};

export const articleService = {
  getArticles: async (category?: string, tag?: string): Promise<{ articles: Article[] }> => {
    const params = new URLSearchParams();
    if (category) params.append('category', category);
    if (tag) params.append('tag', tag);
    const response = await api.get(`/articles?${params}`);
    return response.data;
  },

  getArticle: async (id: string): Promise<{ article: Article }> => {
    const response = await api.get(`/articles/${id}`);
    return response.data;
  },
};

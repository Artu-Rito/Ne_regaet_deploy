import { User } from './user';

export interface Post {
  id: string;
  author_id: string;
  author?: User;
  title: string;
  content: string;
  post_type?: string;
  game?: string;
  is_pinned?: boolean;
  comment_count?: number;
  comments?: Comment[];
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  post_id: string;
  user_id: string;
  user?: User;
  content: string;
  created_at: string;
}

export interface Article {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string | string[];
  author_id: string;
  author?: User;
  created_at: string;
  updated_at: string;
}

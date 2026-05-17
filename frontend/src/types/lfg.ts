export interface LFGRequest {
  id: string;
  user_id: string;
  user?: { id: string; nickname: string };
  game: string;
  region: string;
  rank: string;
  description: string;
  contact: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateLFGInput {
  game: string;
  region: string;
  rank: string;
  description: string;
  contact: string;
}

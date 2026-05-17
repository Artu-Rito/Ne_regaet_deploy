import React from 'react';
import { Comment } from '../../types/post';
import dayjs from 'dayjs';

interface CommentListProps {
  comments: Comment[];
}

const CommentList: React.FC<CommentListProps> = ({ comments }) => (
  <div className="space-y-3">
    {comments.map((c) => (
      <div key={c.id} className="border-b border-[#1a1a3a] pb-3 last:border-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-slate-200 text-sm">{c.user?.nickname ?? 'Аноним'}</span>
          <span className="text-xs text-slate-500">{dayjs(c.created_at).format('DD.MM.YY HH:mm')}</span>
        </div>
        <p className="text-slate-400 text-sm">{c.content}</p>
      </div>
    ))}
  </div>
);

export default CommentList;

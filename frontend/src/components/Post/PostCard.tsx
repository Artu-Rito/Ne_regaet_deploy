import React from 'react';
import { Link } from 'react-router-dom';
import { Post } from '../../types/post';
import dayjs from 'dayjs';

interface PostCardProps {
  post: Post;
  showAuthor?: boolean;
}

const PostCard: React.FC<PostCardProps> = ({ post, showAuthor = true }) => (
  <div className="gcard p-5 hover:border-indigo-500/50 transition-colors">
    <Link to={`/post/${post.id}`}>
      <h3 className="font-bold text-white text-lg mb-1 hover:text-indigo-300 transition-colors">
        {post.title}
      </h3>
    </Link>
    <p className="text-slate-400 text-sm line-clamp-3 mb-3">{post.content}</p>
    <div className="flex items-center justify-between text-xs text-slate-500">
      <span className="flex items-center gap-3">
        {showAuthor && post.author && <span>{post.author.nickname}</span>}
        {post.comments && <span>{post.comments.length} комм.</span>}
      </span>
      <span>{dayjs(post.created_at).format('DD.MM.YYYY HH:mm')}</span>
    </div>
  </div>
);

export default PostCard;

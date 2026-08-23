import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  MoreHorizontal,
  Play,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    const day = Math.floor(diff / 86400000);
    if (min < 1) return 'À l\'instant';
    if (min < 60) return `Il y a ${min} min`;
    if (hr < 24) return `Il y a ${hr} h`;
    if (day < 7) return `Il y a ${day} j`;
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: d.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
  } catch {
    return '';
  }
}

function mediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function PostCard({ post, onDeleted }) {
  const [liked, setLiked] = useState(!!post?.isLiked);
  const [likesCount, setLikesCount] = useState(post?.likesCount ?? 0);
  const [commentsCount, setCommentsCount] = useState(post?.commentsCount ?? 0);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loadingComments, setLoadingComments] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  const toggleLike = async () => {
    if (likeLoading) return;
    setLikeLoading(true);
    try {
      if (liked) {
        await api.delete(`/posts/${post.id}/like`);
        setLiked(false);
        setLikesCount((n) => Math.max(0, n - 1));
      } else {
        await api.post(`/posts/${post.id}/like`);
        setLiked(true);
        setLikesCount((n) => n + 1);
      }
    } catch {
      /* ignore */
    } finally {
      setLikeLoading(false);
    }
  };

  const loadComments = async () => {
    if (loadingComments) return;
    setLoadingComments(true);
    try {
      const { data } = await api.get(`/posts/${post.id}`);
      setComments(data.comments || []);
    } catch {
      setComments([]);
    } finally {
      setLoadingComments(false);
    }
  };

  const toggleComments = () => {
    const next = !showComments;
    setShowComments(next);
    if (next && comments.length === 0) loadComments();
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim() || submittingComment) return;
    setSubmittingComment(true);
    try {
      const { data } = await api.post(`/posts/${post.id}/comments`, { content: newComment.trim() });
      if (data.comment) {
        setComments((prev) => [...prev, data.comment]);
        setCommentsCount((n) => n + 1);
      }
      setNewComment('');
    } catch {
      /* ignore */
    } finally {
      setSubmittingComment(false);
    }
  };

  const media = post.media || [];
  const primaryMedia = media[0];

  return (
    <article className="post-card">
      <header className="post-header">
        <Link to={`/users/${post.author?.id}`} className="avatar avatar-md">
          {post.author?.avatar_path ? (
            <img src={mediaUrl(post.author.avatar_path)} alt={post.author.username} />
          ) : (
            <span>{post.author?.username?.[0]?.toUpperCase() ?? '?'}</span>
          )}
        </Link>
        <div className="post-header-info">
          <Link to={`/users/${post.author?.id}`} className="post-author">
            @{post.author?.username ?? 'utilisateur'}
          </Link>
          <div className="post-meta">{formatDate(post.created_at)}</div>
        </div>
        <button className="btn-icon" aria-label="Options">
          <MoreHorizontal size={18} />
        </button>
      </header>

      {post.content && <p className="post-content">{post.content}</p>}

      {primaryMedia && (
        <div className="post-media">
          {primaryMedia.type === 'video' || post.type === 'video' ? (
            <div style={{ position: 'relative' }}>
              <video
                src={mediaUrl(primaryMedia.url || (typeof primaryMedia === 'string' ? primaryMedia : ''))}
                controls
                preload="metadata"
                poster={primaryMedia.thumbnail ? mediaUrl(primaryMedia.thumbnail) : undefined}
              />
            </div>
          ) : (
            <img
              src={mediaUrl(primaryMedia.url || (typeof primaryMedia === 'string' ? primaryMedia : ''))}
              alt="Média du post"
            />
          )}
        </div>
      )}

      <div className="post-actions">
        <button
          type="button"
          className={`action-btn${liked ? ' liked' : ''}`}
          onClick={toggleLike}
          disabled={likeLoading}
        >
          <Heart size={18} />
          <span className="action-count">{likesCount}</span>
        </button>
        <button type="button" className="action-btn" onClick={toggleComments}>
          <MessageCircle size={18} />
          <span className="action-count">{commentsCount}</span>
        </button>
        <button type="button" className="action-btn" onClick={() => {
          if (navigator.share) {
            navigator.share({ title: 'Publication Epika', url: window.location.href }).catch(() => {});
          }
        }}>
          <Share2 size={18} />
        </button>
      </div>

      {showComments && (
        <div className="post-comments">
          {loadingComments && comments.length === 0 && (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: 12 }}>
              Chargement...
            </div>
          )}
          {comments.length === 0 && !loadingComments && (
            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem', textAlign: 'center', padding: 6 }}>
              Aucun commentaire. Soyez le premier !
            </div>
          )}
          {comments.map((c) => (
            <div key={c.id} className="comment">
              <div className="avatar avatar-sm">
                <span>{(c.user?.username || c.username || 'U')[0]?.toUpperCase()}</span>
              </div>
              <div className="comment-body">
                <div className="comment-author">
                  @{c.user?.username || c.username || 'utilisateur'}
                </div>
                <div className="comment-content">{c.content}</div>
                <div className="comment-meta">{formatDate(c.created_at)}</div>
              </div>
            </div>
          ))}
          <form className="comment-composer" onSubmit={submitComment}>
            <input
              className="comment-input"
              placeholder="Ajouter un commentaire..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              maxLength={500}
            />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ borderRadius: 999, width: 42, height: 42, padding: 0, justifyContent: 'center' }}
              disabled={!newComment.trim() || submittingComment}
              aria-label="Envoyer"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

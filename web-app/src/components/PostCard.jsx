import { useState } from 'react';
import { ThumbsUp, Heart, Sparkles, MessageCircle, Share2 } from 'lucide-react';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60)   return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

function Avatar({ name, size = 'md' }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

const REACTIONS = [
  { id: 'like', icon: <ThumbsUp size={16} />, label: 'J\'aime' },
  { id: 'love', icon: <Heart size={16} />, label: 'Amour' },
  { id: 'pray', icon: <Sparkles size={16} />, label: 'Prière' },
];

export default function PostCard({ post, currentUser }) {
  const [reactions, setReactions] = useState({ like: 0, love: 0, pray: 0 });
  const [active, setActive] = useState(null);

  const handleReaction = (id) => {
    if (active === id) {
      setReactions((prev) => ({ ...prev, [id]: Math.max(0, prev[id] - 1) }));
      setActive(null);
    } else {
      if (active) {
        setReactions((prev) => ({ ...prev, [active]: Math.max(0, prev[active] - 1) }));
      }
      setReactions((prev) => ({ ...prev, [id]: prev[id] + 1 }));
      setActive(id);
    }
  };

  const authorName = post.author_username || post.username || post.author || 'Anonyme';
  const postType = post.type || 'post';
  const postContent = post.content || post.body || '';
  const createdAt = post.created_at || post.createdAt || '';

  return (
    <article className="post-card">
      {/* Header */}
      <div className="post-card-header">
        <Avatar name={authorName} size="md" />
        <div className="post-card-meta">
          <div className="post-card-author">{authorName}</div>
          <div className="post-card-time">{timeAgo(createdAt)}</div>
        </div>
        {postType && postType !== 'text' && (
          <span className="post-card-type">{postType}</span>
        )}
      </div>

      {/* Content */}
      <p className="post-card-content">{postContent || 'Aucun contenu.'}</p>

      {/* Actions */}
      <div className="post-card-actions">
        {REACTIONS.map((r) => (
          <button
            key={r.id}
            type="button"
            className={`reaction-btn${active === r.id ? ' active' : ''}`}
            onClick={() => handleReaction(r.id)}
            aria-label={r.label}
          >
            {r.icon}
            {reactions[r.id] > 0 && <span>{reactions[r.id]}</span>}
          </button>
        ))}
        <button type="button" className="reaction-btn" style={{ marginLeft: 'auto' }}>
          <MessageCircle size={16} />
          <span>Commenter</span>
        </button>
        <button type="button" className="reaction-btn">
          <Share2 size={16} />
        </button>
      </div>
    </article>
  );
}

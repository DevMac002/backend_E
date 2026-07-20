import { useState } from 'react';

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
  { emoji: '👍', label: 'J\'aime' },
  { emoji: '❤️', label: 'Amour' },
  { emoji: '🙏', label: 'Prière' },
];

export default function PostCard({ post, currentUser }) {
  const [reactions, setReactions] = useState({ '👍': 0, '❤️': 0, '🙏': 0 });
  const [active, setActive] = useState(null);

  const handleReaction = (emoji) => {
    if (active === emoji) {
      setReactions((prev) => ({ ...prev, [emoji]: Math.max(0, prev[emoji] - 1) }));
      setActive(null);
    } else {
      if (active) {
        setReactions((prev) => ({ ...prev, [active]: Math.max(0, prev[active] - 1) }));
      }
      setReactions((prev) => ({ ...prev, [emoji]: prev[emoji] + 1 }));
      setActive(emoji);
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
            key={r.emoji}
            type="button"
            className={`reaction-btn${active === r.emoji ? ' active' : ''}`}
            onClick={() => handleReaction(r.emoji)}
            aria-label={r.label}
          >
            <span>{r.emoji}</span>
            {reactions[r.emoji] > 0 && <span>{reactions[r.emoji]}</span>}
          </button>
        ))}
        <button type="button" className="reaction-btn" style={{ marginLeft: 'auto' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          <span>Commenter</span>
        </button>
        <button type="button" className="reaction-btn">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </button>
      </div>
    </article>
  );
}

import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import AppLayout from '../components/AppLayout';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { PostSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../hooks/useAuth';

const STORIES = [
  { id: 1, name: 'Marie', emoji: '🙏', color: 'linear-gradient(135deg,#7C3AED,#A855F7)' },
  { id: 2, name: 'Jean-Paul', emoji: '✨', color: 'linear-gradient(135deg,#F59E0B,#F97316)' },
  { id: 3, name: 'Sarah', emoji: '🎵', color: 'linear-gradient(135deg,#10B981,#34D399)' },
  { id: 4, name: 'David', emoji: '📖', color: 'linear-gradient(135deg,#3B82F6,#60A5FA)' },
  { id: 5, name: 'Esther', emoji: '❤️', color: 'linear-gradient(135deg,#EC4899,#F472B6)' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPosts = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) setLoading(true);
    else setLoadingMore(true);

    try {
      const res = await api.get(`/posts?page=${pageNum}&limit=10`);
      const newPosts = res.data.items || [];
      setPosts((prev) => append ? [...prev, ...newPosts] : newPosts);
      setHasMore(newPosts.length === 10);
      setError('');
    } catch {
      setError('Impossible de charger le fil d\'actualité.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  useEffect(() => { fetchPosts(1); }, [fetchPosts]);

  const handlePostCreated = (newPost) => {
    setPosts((prev) => [newPost, ...prev]);
  };

  const handleLoadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchPosts(next, true);
  };

  return (
    <AppLayout>
      {/* Stories / Highlights */}
      <div style={{
        display: 'flex',
        gap: 12,
        overflowX: 'auto',
        paddingBottom: 16,
        marginBottom: 20,
        scrollbarWidth: 'none',
      }}>
        {STORIES.map((s) => (
          <div key={s.id} style={{ textAlign: 'center', flexShrink: 0, cursor: 'pointer' }}>
            <div style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: s.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              margin: '0 auto 6px',
              border: '2px solid rgba(124,58,237,0.4)',
              transition: 'transform 0.2s ease',
            }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {s.emoji}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', maxWidth: 60, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {s.name}
            </div>
          </div>
        ))}
      </div>

      {/* Create Post Trigger */}
      <div
        className="create-post-trigger"
        role="button"
        tabIndex={0}
        aria-label="Créer une publication"
        onClick={() => setShowModal(true)}
        onKeyDown={(e) => e.key === 'Enter' && setShowModal(true)}
      >
        <div className="avatar avatar-md">
          {user?.username?.slice(0, 2).toUpperCase() || '?'}
        </div>
        <div className="create-post-trigger-input">
          Quoi de neuf, {user?.username?.split(' ')[0] || 'ami'} ?
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
        >
          ✦ Publier
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-box">
          <span>⚠️</span> {error}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div>
          {Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📭</div>
          <div className="empty-state-title">Aucune publication pour le moment</div>
          <p className="empty-state-text">Soyez le premier à partager quelque chose avec la communauté !</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}>
            ✦ Créer une publication
          </button>
        </div>
      ) : (
        <div>
          {posts.map((post) => (
            <div key={post.id} style={{ marginBottom: 16 }}>
              <PostCard post={post} currentUser={user} />
            </div>
          ))}

          {/* Load more */}
          {hasMore && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <button
                type="button"
                className={`btn btn-ghost${loadingMore ? ' btn-loading' : ''}`}
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? '' : 'Charger plus'}
              </button>
            </div>
          )}

          {loadingMore && (
            <div style={{ marginTop: 8 }}>
              <PostSkeleton />
            </div>
          )}
        </div>
      )}

      {/* Create Post Modal */}
      {showModal && (
        <CreatePostModal
          user={user}
          onClose={() => setShowModal(false)}
          onCreated={handlePostCreated}
        />
      )}
    </AppLayout>
  );
}

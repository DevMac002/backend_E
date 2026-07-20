import { useEffect, useState, useCallback } from 'react';
import api from '../api';
import AppLayout from '../components/AppLayout';
import PostCard from '../components/PostCard';
import CreatePostModal from '../components/CreatePostModal';
import { PostSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../hooks/useAuth';
import { AlertCircle, PenLine, Inbox } from 'lucide-react';

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
      <div className="page-header" style={{ marginBottom: 24 }}>
        <h1 className="page-title">Fil d'actualité</h1>
      </div>

      {/* Create Post Trigger */}
      <div
        className="create-post-trigger"
        role="button"
        tabIndex={0}
        aria-label="Créer une publication"
        onClick={() => setShowModal(true)}
        onKeyDown={(e) => e.key === 'Enter' && setShowModal(true)}
        style={{ marginBottom: 24 }}
      >
        <div className="avatar avatar-md">
          {user?.username?.slice(0, 2).toUpperCase() || '?'}
        </div>
        <div className="create-post-trigger-input" style={{ opacity: 0.7 }}>
          Quoi de neuf, {user?.username?.split(' ')[0] || 'ami'} ?
        </div>
        <button
          type="button"
          className="btn btn-primary btn-sm"
          onClick={(e) => { e.stopPropagation(); setShowModal(true); }}
        >
          <PenLine size={16} /> Publier
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="error-box">
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {/* Feed */}
      {loading ? (
        <div>
          {Array.from({ length: 4 }).map((_, i) => <PostSkeleton key={i} />)}
        </div>
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">
            <Inbox size={48} strokeWidth={1.5} color="var(--primary)" />
          </div>
          <div className="empty-state-title">Aucune publication pour le moment</div>
          <p className="empty-state-text">Soyez le premier à partager quelque chose avec la communauté !</p>
          <button type="button" className="btn btn-primary" style={{ marginTop: 20 }} onClick={() => setShowModal(true)}>
            <PenLine size={18} /> Créer une publication
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

import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';
import { SkeletonFeed } from '../components/LoadingSkeleton';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { MessageSquarePlus, Inbox } from 'lucide-react';

export default function Home() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [meta, setMeta] = useState({ total: 0, page: 1, limit: 10, totalPages: 0 });
  const [openCreate, setOpenCreate] = useState(false);
  const [page, setPage] = useState(1);

  const fetchPosts = useCallback(async (p = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/posts', { params: { page: p, limit: 10 } });
      if (p === 1) setPosts(data.data || []);
      else setPosts((prev) => [...prev, ...(data.data || [])]);
      setMeta(data.meta || meta);
    } catch (err) {
      showToast(err.response?.data?.message || 'Impossible de charger le fil', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, meta]);

  useEffect(() => { fetchPosts(page); }, [fetchPosts, page]);

  const handleCreated = (newPost) => {
    if (!newPost) return;
    setPosts((prev) => {
      const hydrated = {
        ...newPost,
        author: newPost.author || {
          id: newPost.user_id,
          username: 'vous',
        },
        likesCount: 0,
        commentsCount: 0,
      };
      return [hydrated, ...prev];
    });
    showToast('Publication créée avec succès', 'success');
  };

  return (
    <AppLayout onCreatePost={() => setOpenCreate(true)}>
      <CreatePostModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={handleCreated}
      />

      {/* Quick composer */}
      <QuickComposeCard onClick={() => setOpenCreate(true)} />

      {loading && posts.length === 0 ? (
        <SkeletonFeed count={3} />
      ) : posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Inbox size={28} /></div>
          <h3>Votre fil est vide</h3>
          <p>Soyez le premier à publier quelque chose pour inspirer la communauté !</p>
          <button className="btn btn-primary" onClick={() => setOpenCreate(true)}>
            <MessageSquarePlus size={18} /> Créer une publication
          </button>
        </div>
      ) : (
        <div className="feed-list">
          {posts.map((p) => (
            <PostCard key={p.id} post={p} />
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="pagination">
          <button
            className="pagination-btn"
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Précédent
          </button>
          {Array.from({ length: Math.min(5, meta.totalPages) }, (_, i) => {
            const start = Math.max(1, Math.min(page - 2, meta.totalPages - 4));
            const n = start + i;
            if (n > meta.totalPages) return null;
            return (
              <button
                key={n}
                className={`pagination-btn${n === page ? ' active' : ''}`}
                onClick={() => setPage(n)}
                disabled={loading}
              >
                {n}
              </button>
            );
          })}
          <button
            className="pagination-btn"
            disabled={page >= meta.totalPages || loading}
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
          >
            Suivant
          </button>
        </div>
      )}
    </AppLayout>
  );
}

function QuickComposeCard({ onClick }) {
  return (
    <div className="composer-card" onClick={onClick} role="button" style={{ cursor: 'pointer' }}>
      <div className="composer-top">
        <div className="avatar avatar-md" style={{ background: 'var(--bg-elevated)' }}>
          <span>✏️</span>
        </div>
        <div
          style={{
            flex: 1,
            alignSelf: 'center',
            color: 'var(--text-dim)',
            fontWeight: 500,
          }}
        >
          Partagez un verset, une pensée ou une vidéo...
        </div>
      </div>
      <div className="composer-divider" />
      <div className="composer-actions">
        <div className="composer-tools">
          <span className="tool-btn"><span style={{ color: '#22c55e' }}>🖼️</span> Photo</span>
          <span className="tool-btn"><span style={{ color: '#f59e0b' }}>🎬</span> Vidéo</span>
        </div>
        <span className="btn btn-primary" role="button">Publier</span>
      </div>
    </div>
  );
}

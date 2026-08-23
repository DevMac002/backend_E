import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import AppLayout from '../components/AppLayout';
import PostCard from '../components/PostCard';
import { SkeletonFeed } from '../components/LoadingSkeleton';
import api from '../lib/api';
import CreatePostModal from '../components/CreatePostModal';
import { ArrowLeft, Award, Calendar, MessageCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);

  useEffect(() => {
    if (!id) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [{ data: userData }, { data: postsData }] = await Promise.all([
          api.get(`/users/${id}`),
          api.get('/posts', { params: { page: 1, limit: 20 } }),
        ]);
        if (!active) return;
        setProfile(userData);
        const authorPosts = (postsData.data || []).filter(
          (p) => p.author?.id === parseInt(id, 10) || p.user_id === parseInt(id, 10)
        );
        setPosts(authorPosts);
      } catch {
        setProfile(null);
        setPosts([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [id]);

  return (
    <AppLayout onCreatePost={() => setOpenCreate(true)}>
      <CreatePostModal open={openCreate} onClose={() => setOpenCreate(false)} />

      <button className="btn btn-ghost" style={{ marginBottom: 16, paddingLeft: 0 }} onClick={() => navigate(-1)}>
        <ArrowLeft size={18} /> Retour
      </button>

      {loading ? (
        <SkeletonFeed count={2} />
      ) : !profile ? (
        <div className="empty-state">
          <div className="empty-state-icon"><span>🔍</span></div>
          <h3>Profil introuvable</h3>
          <p>Cet utilisateur n'existe pas ou a été désactivé.</p>
        </div>
      ) : (
        <div className="profile-header">
          <div className="profile-cover" />
          <div className="profile-body">
            <div className="profile-body-top">
              <div className="profile-left">
                <div className="avatar avatar-xl">
                  {profile.avatar_path ? (
                    <img src={profile.avatar_path} alt={profile.username} />
                  ) : (
                    <span>{profile.username?.[0]?.toUpperCase() ?? '?'}</span>
                  )}
                </div>
                <div>
                  <div className="profile-name">{profile.username}</div>
                  <div className="profile-username">@{profile.username} · Rôle : {profile.role || 'peuple'}</div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary" onClick={() => navigate('/messages')}>
                  <MessageCircle size={16} /> Message
                </button>
              </div>
            </div>

            <p className="profile-bio">
              {profile.bio || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Aucune bio.</span>}
            </p>

            <div className="profile-stats">
              <div className="profile-stat">
                <strong>{posts.length}</strong>
                <span>Publications</span>
              </div>
              <div className="profile-stat">
                <strong>{profile.foi_points ?? 0}</strong>
                <span><Award size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Foi pts</span>
              </div>
              <div className="profile-stat">
                <strong>{profile.is_verified ? '✓' : '—'}</strong>
                <span>Vérifié</span>
              </div>
              <div className="profile-stat">
                <strong><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></strong>
                <span>Inscrit</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>Publications de @{profile.username}</h3>

            {posts.length === 0 ? (
              <div className="empty-state" style={{ padding: '40px 24px' }}>
                <div className="empty-state-icon" style={{ width: 56, height: 56 }}><span>📝</span></div>
                <h3>Pas de publication</h3>
                <p>Cet utilisateur n'a encore rien publié.</p>
              </div>
            ) : (
              <div className="feed-list">
                {posts.map((p) => <PostCard key={p.id} post={p} />)}
              </div>
            )}
          </div>
        </div>
      )}
    </AppLayout>
  );
}

import { useEffect, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';
import { SkeletonFeed } from '../components/LoadingSkeleton';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { Edit3, Image as ImageIcon, MapPin, Calendar, Award } from 'lucide-react';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ username: '', bio: '' });
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    setForm({ username: user.username || '', bio: user.bio || '' });
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    (async () => {
      try {
        setLoading(true);
        const [{ data: postsData }] = await Promise.all([
          api.get('/posts', { params: { page: 1, limit: 20 } }),
        ]);
        if (!active) return;
        const mine = (postsData.data || []).filter((p) => p.author?.id === user.id || p.user_id === user.id);
        setPosts(mine);
      } catch {
        setPosts([]);
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [user?.id]);

  const handleSave = async () => {
    try {
      await updateProfile({
        username: form.username.trim() || undefined,
        bio: form.bio.trim() || undefined,
      });
      setEditing(false);
      showToast('Profil mis à jour', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Erreur lors de la mise à jour', 'error');
    }
  };

  const handleAvatarChange = async (e) => {
    const f = e.target.files?.[0];
    if (!f || !user?.id) return;
    try {
      const fd = new FormData();
      fd.append('file', f);
      await api.post('/users/me/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      showToast('Avatar mis à jour', 'success');
    } catch (err) {
      showToast(err.response?.data?.message || 'Impossible de mettre à jour l\'avatar', 'error');
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleCreated = (newPost) => {
    if (!newPost) return;
    setPosts((prev) => [{
      ...newPost,
      author: { id: user.id, username: user.username },
      likesCount: 0,
      commentsCount: 0,
    }, ...prev]);
  };

  return (
    <AppLayout onCreatePost={() => setOpenCreate(true)}>
      <CreatePostModal open={openCreate} onClose={() => setOpenCreate(false)} onCreated={handleCreated} />

      <div className="profile-header">
        <div className="profile-cover" />
        <div className="profile-body">
          <div className="profile-body-top">
            <div className="profile-left">
              <div style={{ position: 'relative' }}>
                <div className="avatar avatar-xl" onClick={() => fileInputRef.current?.click()} role="button" style={{ cursor: 'pointer' }} title="Changer l'avatar">
                  {user?.avatar_path ? (
                    <img src={user.avatar_path} alt={user.username} />
                  ) : (
                    <span>{user?.username?.[0]?.toUpperCase() ?? '?'}</span>
                  )}
                </div>
                <button
                  className="btn-icon"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label="Changer l'avatar"
                  title="Changer l'avatar"
                >
                  <ImageIcon size={14} />
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden-file-input" onChange={handleAvatarChange} />
              </div>
              <div>
                {editing ? (
                  <input
                    className="form-input"
                    style={{ marginBottom: 6, fontWeight: 700, fontSize: '1.1rem' }}
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="Nom d'utilisateur"
                  />
                ) : (
                  <div className="profile-name">{user?.username ?? '...'}</div>
                )}
                <div className="profile-username">@{user?.username ?? '...'} · Rôle : {user?.role ?? 'peuple'}</div>
              </div>
            </div>
            {!editing ? (
              <button className="btn btn-primary" onClick={() => setEditing(true)}>
                <Edit3 size={16} /> Modifier le profil
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-ghost" onClick={() => setEditing(false)}>Annuler</button>
                <button className="btn btn-primary" onClick={handleSave}>Enregistrer</button>
              </div>
            )}
          </div>

          {editing ? (
            <textarea
              className="form-input"
              style={{ minHeight: 80, marginBottom: 16, resize: 'vertical' }}
              placeholder="Parlez de vous..."
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              maxLength={300}
            />
          ) : (
            <p className="profile-bio">
              {user?.bio || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Aucune bio pour le moment.</span>}
            </p>
          )}

          <div className="profile-stats">
            <div className="profile-stat">
              <strong>{posts.length}</strong>
              <span>Publications</span>
            </div>
            <div className="profile-stat">
              <strong>{user?.foi_points ?? 0}</strong>
              <span><Award size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />Foi pts</span>
            </div>
            <div className="profile-stat">
              <strong>{user?.is_verified ? '✓' : '—'}</strong>
              <span>Vérifié</span>
            </div>
            <div className="profile-stat">
              <strong><Calendar size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /></strong>
              <span>Inscrit</span>
            </div>
          </div>

          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: 14 }}>Mes publications</h3>

          {loading ? (
            <SkeletonFeed count={2} />
          ) : posts.length === 0 ? (
            <div className="empty-state" style={{ padding: '40px 24px' }}>
              <div className="empty-state-icon" style={{ width: 56, height: 56 }}><MapPin size={22} /></div>
              <h3>Pas encore de publication</h3>
              <p>Vos publications apparaîtront ici.</p>
            </div>
          ) : (
            <div className="feed-list">
              {posts.map((p) => <PostCard key={p.id} post={p} />)}
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

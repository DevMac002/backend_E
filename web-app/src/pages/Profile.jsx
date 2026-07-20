import { useEffect, useState } from 'react';
import api from '../api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { ProfileSkeleton, PostSkeleton } from '../components/LoadingSkeleton';

const BANNER_GRADIENTS = [
  'linear-gradient(135deg,#7C3AED 0%,#A855F7 40%,#F59E0B 100%)',
  'linear-gradient(135deg,#0F172A 0%,#1E3A5F 50%,#7C3AED 100%)',
  'linear-gradient(135deg,#10B981 0%,#3B82F6 50%,#7C3AED 100%)',
];

function Avatar({ name, size = 'md' }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

function RoleBadge({ role, status }) {
  if (status === 'admin' || status === 'superadmin') {
    return <span className="profile-badge badge-admin">⚙️ Administrateur</span>;
  }
  if (role === 'moderator') {
    return <span className="profile-badge badge-verified">✅ Modérateur</span>;
  }
  return <span className="profile-badge badge-user">✦ Membre</span>;
}

export default function Profile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [bannerIdx] = useState(() => Math.floor(Math.random() * BANNER_GRADIENTS.length));

  useEffect(() => {
    Promise.all([
      api.get('/users/me'),
      api.get('/posts?limit=6'),
    ])
      .then(([profileRes, postsRes]) => {
        setProfile(profileRes.data);
        setPosts(postsRes.data.items || []);
      })
      .catch(() => setError('Impossible de charger le profil'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <AppLayout>
        <ProfileSkeleton />
        <div style={{ marginTop: 20 }}>
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {error && <div className="error-box"><span>⚠️</span> {error}</div>}

      {/* Banner */}
      <div className="profile-banner">
        <div
          className="profile-banner-gradient"
          style={{ background: BANNER_GRADIENTS[bannerIdx] }}
        />
        {/* Decorative pattern */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.08) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }} />
      </div>

      {/* Profile Header */}
      <div className="profile-header">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div className="profile-avatar-wrap">
            <Avatar name={profile?.username} size="xxl" />
          </div>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ marginBottom: 8 }}
          >
            ✏️ Modifier le profil
          </button>
        </div>

        <div className="profile-info">
          <div className="profile-name">{profile?.username || 'Utilisateur'}</div>
          <div className="profile-handle">@{profile?.email?.split('@')[0] || 'profil'}</div>
          {profile && <RoleBadge role={profile.role} status={profile.status} />}
          <p className="profile-bio">
            {profile?.bio || 'Membre de la communauté Epika Social. 🙏 Foi, amour et partage.'}
          </p>

          <div className="profile-stats">
            {[
              { value: posts.length, label: 'Publications' },
              { value: Math.floor(Math.random() * 200 + 50), label: 'Abonnés' },
              { value: Math.floor(Math.random() * 100 + 20), label: 'Abonnements' },
            ].map((s) => (
              <div key={s.label} className="profile-stat">
                <div className="profile-stat-value">{s.value}</div>
                <div className="profile-stat-label">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="page-header" style={{ marginBottom: 16, paddingBottom: 12 }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Informations</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Email', value: profile?.email, icon: '📧' },
            { label: 'Statut', value: profile?.status, icon: '⚙️' },
            { label: 'Rôle', value: profile?.role, icon: '🎭' },
            { label: 'Membre depuis', value: profile?.created_at ? new Date(profile.created_at).toLocaleDateString('fr-FR') : 'N/A', icon: '📅' },
          ].map((item) => (
            <div key={item.label} style={{
              padding: '12px 14px',
              background: 'var(--glass)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 4 }}>
                {item.icon} {item.label}
              </div>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                {item.value || '—'}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Posts */}
      <div className="page-header">
        <span className="page-title">Publications récentes</span>
      </div>

      {posts.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">📝</div>
          <div className="empty-state-title">Aucune publication</div>
          <p className="empty-state-text">Partagez quelque chose avec la communauté.</p>
        </div>
      ) : (
        posts.map((post) => (
          <div key={post.id} style={{ marginBottom: 14 }}>
            <div className="post-card">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span className="post-card-type">{post.type || 'post'}</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
                  {post.created_at ? new Date(post.created_at).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>
              <p className="post-card-content">{post.content || 'Aucun contenu.'}</p>
            </div>
          </div>
        ))
      )}
    </AppLayout>
  );
}

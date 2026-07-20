import { useEffect, useState } from 'react';
import api from '../api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';

const GROUP_COLORS = [
  { bg: 'linear-gradient(135deg,#7C3AED,#A855F7)', emoji: '📖' },
  { bg: 'linear-gradient(135deg,#F59E0B,#F97316)', emoji: '🙏' },
  { bg: 'linear-gradient(135deg,#10B981,#34D399)', emoji: '🎵' },
  { bg: 'linear-gradient(135deg,#3B82F6,#60A5FA)', emoji: '⛪' },
  { bg: 'linear-gradient(135deg,#EC4899,#F472B6)', emoji: '✝️' },
  { bg: 'linear-gradient(135deg,#6366F1,#A78BFA)', emoji: '✨' },
];

function GroupCardSkeleton() {
  return (
    <div className="group-card">
      <div className="skeleton" style={{ height: 80 }} />
      <div className="group-body">
        <div className="skeleton skeleton-line" style={{ width: '70%', marginBottom: 8 }} />
        <div className="skeleton skeleton-line" style={{ width: '90%' }} />
        <div className="skeleton skeleton-line" style={{ width: '60%' }} />
        <div style={{ marginTop: 14, display: 'flex', justifyContent: 'space-between' }}>
          <div className="skeleton" style={{ width: 80, height: 24, borderRadius: 8 }} />
          <div className="skeleton" style={{ width: 70, height: 30, borderRadius: 20 }} />
        </div>
      </div>
    </div>
  );
}

export default function Groups() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [joined, setJoined] = useState(new Set());

  useEffect(() => {
    api.get('/groups')
      .then((res) => setGroups(res.data.items || []))
      .catch(() => setError('Impossible de charger les groupes'))
      .finally(() => setLoading(false));
  }, []);

  const filtered = groups.filter((g) => {
    const name = g.name || g.nom || '';
    return name.toLowerCase().includes(search.toLowerCase()) ||
      (g.description || '').toLowerCase().includes(search.toLowerCase());
  });

  const toggleJoin = async (groupId) => {
    const isJoined = joined.has(groupId);
    setJoined((prev) => {
      const next = new Set(prev);
      if (isJoined) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
    try {
      if (isJoined) {
        await api.delete(`/groups/${groupId}/leave`);
      } else {
        await api.post(`/groups/${groupId}/join`);
      }
    } catch {
      // Revert on error
      setJoined((prev) => {
        const next = new Set(prev);
        if (isJoined) next.add(groupId);
        else next.delete(groupId);
        return next;
      });
    }
  };

  return (
    <AppLayout>
      <div className="page-header">
        <h1 className="page-title">Groupes</h1>
        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {groups.length} groupe{groups.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Search */}
      <div className="search-bar" style={{ marginBottom: 24 }}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          placeholder="Rechercher un groupe..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Rechercher un groupe"
        />
        {search && (
          <button type="button" onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>✕</button>
        )}
      </div>

      {error && <div className="error-box"><span>⚠️</span> {error}</div>}

      {loading ? (
        <div className="groups-grid">
          {Array.from({ length: 6 }).map((_, i) => <GroupCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{search ? '🔍' : '👥'}</div>
          <div className="empty-state-title">
            {search ? 'Aucun groupe trouvé' : 'Aucun groupe disponible'}
          </div>
          <p className="empty-state-text">
            {search ? `Aucun résultat pour "${search}"` : 'Les groupes créés apparaîtront ici.'}
          </p>
        </div>
      ) : (
        <div className="groups-grid">
          {filtered.map((group, i) => {
            const colorScheme = GROUP_COLORS[i % GROUP_COLORS.length];
            const name = group.name || group.nom || 'Groupe';
            const isJoined = joined.has(group.id);

            return (
              <article key={group.id} className="group-card" aria-label={name}>
                <div className="group-cover" style={{ background: colorScheme.bg }}>
                  <span style={{ fontSize: '2.2rem', filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
                    {colorScheme.emoji}
                  </span>
                </div>
                <div className="group-body">
                  <div className="group-name">{name}</div>
                  <p className="group-desc">{group.description || 'Rejoignez ce groupe pour en savoir plus.'}</p>
                  <div className="group-footer">
                    <span className="group-members">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 00-3-3.87" />
                        <path d="M16 3.13a4 4 0 010 7.75" />
                      </svg>
                      {group.member_count || Math.floor(Math.random() * 200 + 5)} membres
                    </span>
                    <button
                      type="button"
                      className={`btn btn-sm ${isJoined ? 'btn-ghost' : 'btn-primary'}`}
                      onClick={() => toggleJoin(group.id)}
                    >
                      {isJoined ? '✓ Rejoint' : '+ Rejoindre'}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

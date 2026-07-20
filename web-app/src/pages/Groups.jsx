import { useEffect, useState } from 'react';
import api from '../api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';
import { BookOpen, HeartHandshake, Music, Users, Heart, Sparkles, Search, AlertCircle, UsersRound } from 'lucide-react';

const GROUP_COLORS = [
  { bg: 'linear-gradient(135deg,#7C3AED,#A855F7)', icon: <BookOpen size={36} color="white" /> },
  { bg: 'linear-gradient(135deg,#F59E0B,#F97316)', icon: <HeartHandshake size={36} color="white" /> },
  { bg: 'linear-gradient(135deg,#10B981,#34D399)', icon: <Music size={36} color="white" /> },
  { bg: 'linear-gradient(135deg,#3B82F6,#60A5FA)', icon: <Users size={36} color="white" /> },
  { bg: 'linear-gradient(135deg,#EC4899,#F472B6)', icon: <Heart size={36} color="white" /> },
  { bg: 'linear-gradient(135deg,#6366F1,#A78BFA)', icon: <Sparkles size={36} color="white" /> },
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
        <Search size={18} />
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

      {error && <div className="error-box"><AlertCircle size={18} /> {error}</div>}

      {loading ? (
        <div className="groups-grid">
          {Array.from({ length: 6 }).map((_, i) => <GroupCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">{search ? <Search size={40} strokeWidth={1.5} /> : <UsersRound size={40} strokeWidth={1.5} />}</div>
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
                  <div style={{ filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))' }}>
                    {colorScheme.icon}
                  </div>
                </div>
                <div className="group-body">
                  <div className="group-name">{name}</div>
                  <p className="group-desc">{group.description || 'Rejoignez ce groupe pour en savoir plus.'}</p>
                  <div className="group-footer">
                    <span className="group-members">
                      <Users size={12} style={{ marginRight: 4 }} />
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

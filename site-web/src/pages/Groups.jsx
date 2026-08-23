import { useCallback, useEffect, useState } from 'react';
import AppLayout from '../components/AppLayout';
import CreatePostModal from '../components/CreatePostModal';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import Modal from '../components/Modal';
import { Users, Plus, UsersRound, Calendar, Hash } from 'lucide-react';

export default function Groups() {
  const { showToast } = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openNewGroup, setOpenNewGroup] = useState(false);
  const [meta, setMeta] = useState({ page: 1, limit: 20, totalPages: 0, total: 0 });

  const fetchGroups = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/groups', { params: { page, limit: 20 } });
      setGroups(data.data || []);
      setMeta(data.meta || { page, limit: 20, totalPages: 1, total: data.data?.length ?? 0 });
    } catch (err) {
      showToast(err.response?.data?.message || 'Impossible de charger les groupes', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchGroups(1); }, [fetchGroups]);

  return (
    <AppLayout onCreatePost={() => setOpenCreate(true)}>
      <CreatePostModal open={openCreate} onClose={() => setOpenCreate(false)} />
      <NewGroupModal
        open={openNewGroup}
        onClose={() => setOpenNewGroup(false)}
        onCreated={(g) => {
          setGroups((prev) => [g, ...prev]);
          showToast('Groupe créé avec succès', 'success');
          setOpenNewGroup(false);
        }}
      />

      <div className="page-header">
        <h2><Users size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />Groupes</h2>
        <button className="btn btn-primary" onClick={() => setOpenNewGroup(true)}>
          <Plus size={18} /> Nouveau groupe
        </button>
      </div>

      {loading ? (
        <div className="empty-state"><div className="splash-spinner" /></div>
      ) : groups.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><UsersRound size={28} /></div>
          <h3>Aucun groupe pour le moment</h3>
          <p>Créez un groupe pour réunir des membres autour d'un thème ou d'une communauté.</p>
          <button className="btn btn-primary" onClick={() => setOpenNewGroup(true)}>
            <Plus size={18} /> Créer un groupe
          </button>
        </div>
      ) : (
        <div className="groups-grid">
          {groups.map((g) => (
            <article key={g.id} className="group-card">
              <div className="group-icon"><Hash size={24} /></div>
              <div className="group-name">{g.name}</div>
              <div className="group-desc">
                {g.description || <span style={{ color: 'var(--text-dim)', fontStyle: 'italic' }}>Pas de description.</span>}
              </div>
              <div className="group-footer">
                <div className="group-members"><Users size={14} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 5 }} />{g.membersCount ?? 1} membre{g.membersCount > 1 ? 's' : ''}</div>
                <button className="btn btn-ghost" style={{ fontWeight: 600 }}>Voir</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {meta.totalPages > 1 && (
        <div className="pagination">
          <span style={{ color: 'var(--text-dim)', fontSize: '0.88rem', marginRight: 12 }}>Page {meta.page} / {meta.totalPages}</span>
        </div>
      )}
    </AppLayout>
  );
}

function NewGroupModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ name: '', description: '' });
  const [loading, setLoading] = useState(false);

  const reset = () => setForm({ name: '', description: '' });
  const close = () => { if (loading) return; reset(); onClose?.(); };

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setLoading(true);
    try {
      const { data } = await api.post('/groups', {
        name: form.name.trim(),
        description: form.description.trim() || undefined,
      });
      onCreated?.(data.group || { name: form.name, description: form.description, membersCount: 1 });
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Créer un groupe" size="md">
      <form onSubmit={submit} className="form">
        <div className="form-group">
          <label className="form-label" htmlFor="g-name">Nom du groupe</label>
          <input
            id="g-name"
            className="form-input"
            placeholder="ex. Groupe de prière"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
            autoFocus
            maxLength={80}
          />
        </div>
        <div className="form-group">
          <label className="form-label" htmlFor="g-desc">Description</label>
          <textarea
            id="g-desc"
            className="form-input"
            style={{ minHeight: 110, resize: 'vertical' }}
            placeholder="De quoi traite ce groupe ?"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            maxLength={400}
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 4 }}>
          <button type="button" className="btn btn-ghost" onClick={close} disabled={loading}>Annuler</button>
          <button type="submit" className={`btn btn-primary${loading ? ' btn-loading' : ''}`} disabled={loading || !form.name.trim()}>
            {loading ? '' : <><Calendar size={16} /> Créer le groupe</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

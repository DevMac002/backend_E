import { useState } from 'react';
import api from '../api';
import { X, AlertCircle, Sparkles } from 'lucide-react';

const POST_TYPES = [
  { value: 'text', label: 'Texte' },
  { value: 'témoignage', label: 'Témoignage' },
  { value: 'prière', label: 'Prière' },
  { value: 'louange', label: 'Louange' },
  { value: 'annonce', label: 'Annonce' },
];

export default function CreatePostModal({ user, onClose, onCreated }) {
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const MAX = 500;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/posts', { content, type });
      onCreated?.(res.data);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  const charColor =
    content.length > MAX * 0.9
      ? 'var(--red)'
      : content.length > MAX * 0.7
      ? 'var(--gold)'
      : 'var(--text-muted)';

  return (
    <div className="modal-overlay" onClick={handleOverlayClick} role="dialog" aria-modal="true" aria-label="Créer une publication">
      <div className="modal">
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">Nouvelle publication</h2>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Fermer"><X size={20} /></button>
        </div>

        {/* Author */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
          <div className="avatar avatar-md">
            {user?.username?.slice(0, 2).toUpperCase() || '?'}
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{user?.username}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Partager avec la communauté</div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Type selector */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
            {POST_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-full)',
                  border: '1px solid',
                  borderColor: type === t.value ? 'var(--primary)' : 'var(--border)',
                  background: type === t.value ? 'rgba(139,92,246,0.15)' : 'transparent',
                  color: type === t.value ? 'var(--primary-light)' : 'var(--text-muted)',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Textarea */}
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <textarea
              id="post-content"
              className="form-input form-textarea"
              placeholder="Partagez quelque chose avec la communauté..."
              value={content}
              onChange={(e) => setContent(e.target.value.slice(0, MAX))}
              rows={5}
              autoFocus
            />
            <div style={{
              position: 'absolute',
              bottom: 10,
              right: 14,
              fontSize: '0.72rem',
              fontWeight: 600,
              color: charColor,
            }}>
              {content.length}/{MAX}
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="error-box" style={{ marginBottom: 14 }}>
              <AlertCircle size={18} /> {error}
            </div>
          )}

          {/* Actions */}
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              Annuler
            </button>
            <button
              type="submit"
              className={`btn btn-primary${loading ? ' btn-loading' : ''}`}
              disabled={loading || !content.trim()}
              style={{ display: 'flex', alignItems: 'center', gap: 6 }}
            >
              {loading ? '' : <><Sparkles size={16} /> Publier</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

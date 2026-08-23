import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import CreatePostModal from '../components/CreatePostModal';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import Modal from '../components/Modal';
import {
  Plus,
  Image as ImageIcon,
  Type,
  X,
  Send,
  ChevronLeft,
  ChevronRight,
  Sparkles,
} from 'lucide-react';

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const min = Math.floor(diff / 60000);
    const hr = Math.floor(diff / 3600000);
    if (min < 1) return 'À l\'instant';
    if (min < 60) return `${min} min`;
    if (hr < 24) return `${hr} h`;
    return d.toLocaleDateString('fr-FR');
  } catch { return ''; }
}

function mediaUrl(url) {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  const base = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
}

export default function Stories() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openCreate, setOpenCreate] = useState(false);
  const [openNewStory, setOpenNewStory] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [viewerIndex, setViewerIndex] = useState(0);

  const fetchStories = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/stories', { params: { page: 1, limit: 50 } });
      setStories(data.data || []);
    } catch (err) {
      showToast(err.response?.data?.message || 'Impossible de charger les stories', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchStories(); }, [fetchStories]);

  const authorGroups = useMemo(() => {
    const map = new Map();
    for (const s of stories) {
      const aid = s.author?.id ?? s.user_id;
      if (!map.has(aid)) {
        map.set(aid, {
          author: s.author || { id: aid, username: 'utilisateur' },
          stories: [],
        });
      }
      map.get(aid).stories.push(s);
    }
    return Array.from(map.values());
  }, [stories]);

  const openViewer = (groupIndex) => {
    setViewerIndex(groupIndex);
    setViewerOpen(true);
  };

  const currentGroupStories = authorGroups[viewerIndex]?.stories || [];

  return (
    <AppLayout onCreatePost={() => setOpenCreate(true)}>
      <CreatePostModal open={openCreate} onClose={() => setOpenCreate(false)} />

      <NewStoryModal
        open={openNewStory}
        onClose={() => setOpenNewStory(false)}
        onCreated={(s) => {
          setStories((prev) => [s, ...prev]);
          showToast('Story créée avec succès', 'success');
          setOpenNewStory(false);
        }}
      />

      <div className="page-header">
        <h2><Sparkles size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />Stories</h2>
        <button className="btn btn-primary" onClick={() => setOpenNewStory(true)}>
          <Plus size={18} /> Nouvelle story
        </button>
      </div>

      <div className="stories-bar">
        <div className="story-item" onClick={() => setOpenNewStory(true)} role="button">
          <div className="story-ring story-create">
            <div className="story-ring-inner"><Plus size={26} strokeWidth={2.5} /></div>
          </div>
          <span className="story-name">Votre story</span>
        </div>
        {authorGroups.map((grp, i) => (
          <div key={grp.author.id} className={`story-item unread`} onClick={() => openViewer(i)} role="button">
            <div className="story-ring">
              <div className="story-ring-inner">
                {grp.author.avatar_path ? (
                  <img src={mediaUrl(grp.author.avatar_path)} alt="" />
                ) : (
                  <span>{(grp.author.username || '?')[0]?.toUpperCase()}</span>
                )}
              </div>
            </div>
            <span className="story-name">@{grp.author.username}</span>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="empty-state"><div className="splash-spinner" /></div>
      ) : stories.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon"><Sparkles size={28} /></div>
          <h3>Aucune story pour le moment</h3>
          <p>Les stories des membres de la communauté apparaîtront ici.</p>
          <button className="btn btn-primary" onClick={() => setOpenNewStory(true)}>
            <Plus size={18} /> Créer une story
          </button>
        </div>
      ) : (
        <div className="groups-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))' }}>
          {stories.slice(0, 20).map((s) => (
            <div key={s.id} className="group-card" onClick={() => {
              const idx = authorGroups.findIndex((g) => (g.author.id ?? g.author) === (s.author?.id ?? s.user_id));
              if (idx >= 0) openViewer(idx);
            }} role="button" style={{ cursor: 'pointer', padding: 0, overflow: 'hidden' }}>
              <div style={{ minHeight: 180, background: s.type === 'image' && (s.media_url || s.media) ? undefined : 'linear-gradient(135deg, var(--primary-soft), var(--bg-elevated))', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, textAlign: 'center' }}>
                {s.type === 'image' && (s.media_url || s.media) ? (
                  <img src={mediaUrl(s.media_url || (typeof s.media === 'string' ? s.media : s.media?.url || ''))} alt="" style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 'var(--radius-sm)' }} />
                ) : (
                  <div style={{ fontWeight: 600, fontSize: '1rem', lineHeight: 1.5 }}>{s.content || 'Story'}</div>
                )}
              </div>
              <div style={{ padding: '12px 16px 16px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>@{s.author?.username || 'utilisateur'}</div>
                <div style={{ color: 'var(--text-dim)', fontSize: '0.8rem', marginTop: 2 }}>{formatDate(s.created_at)}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {viewerOpen && currentGroupStories.length > 0 && (
        <StoryViewer
          group={authorGroups[viewerIndex]}
          onClose={() => setViewerOpen(false)}
          onPrev={() => setViewerIndex((i) => Math.max(0, i - 1))}
          onNext={() => setViewerIndex((i) => Math.min(authorGroups.length - 1, i + 1))}
          hasPrev={viewerIndex > 0}
          hasNext={viewerIndex < authorGroups.length - 1}
          onViewed={(storyId) => api.post(`/stories/${storyId}/view`).catch(() => {})}
        />
      )}
    </AppLayout>
  );
}

function StoryViewer({ group, onClose, onPrev, onNext, hasPrev, hasNext, onViewed }) {
  const stories = group?.stories || [];
  const [index, setIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const viewedRef = useRef(new Set());
  const DURATION = 5000;

  const current = stories[index];

  useEffect(() => { setProgress(0); }, [index]);

  useEffect(() => {
    if (!current) return;
    const id = current.id;
    if (!viewedRef.current.has(id)) {
      viewedRef.current.add(id);
      onViewed?.(id);
    }
    let start = performance.now();
    let raf;
    const tick = (t) => {
      const p = Math.min(100, ((t - start) / DURATION) * 100);
      setProgress(p);
      if (p >= 100) {
        if (index < stories.length - 1) setIndex((i) => i + 1);
        else onNext?.();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [current, index, stories.length, onNext, onViewed]);

  if (!current) return null;

  return (
    <div className="story-viewer-overlay" onClick={onClose}>
      <div className="story-viewer-header" onClick={(e) => e.stopPropagation()}>
        <button className="btn-icon" onClick={onPrev} disabled={!hasPrev} aria-label="Précédent" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}>
          <ChevronLeft size={20} />
        </button>
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {stories.map((_, i) => (
            <div key={i} className="story-progress-bar">
              <div className="story-progress-fill" style={{ width: i < index ? '100%' : i === index ? `${progress}%` : '0%' }} />
            </div>
          ))}
        </div>
        <button className="btn-icon" onClick={onNext} disabled={!hasNext} aria-label="Suivant" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff' }}>
          <ChevronRight size={20} />
        </button>
        <button className="btn-icon" onClick={onClose} aria-label="Fermer" style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', marginLeft: 8 }}>
          <X size={18} />
        </button>
      </div>
      <div className="story-viewer-body" onClick={(e) => e.stopPropagation()}>
        <div className="story-card">
          <div className="story-media">
            {current.type === 'image' && (current.media_url || current.media) ? (
              <img src={mediaUrl(current.media_url || (typeof current.media === 'string' ? current.media : current.media?.url || ''))} alt="" />
            ) : (
              <div className="story-text-body">
                <div className="story-text-content">{current.content || ''}</div>
              </div>
            )}
          </div>
          {current.type === 'image' && current.content && (
            <div style={{ padding: '14px 22px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{current.content}</div>
          )}
          <div className="story-author">
            <div className="avatar avatar-sm">
              {group.author.avatar_path ? (
                <img src={mediaUrl(group.author.avatar_path)} alt="" />
              ) : (
                <span>{(group.author.username || '?')[0]?.toUpperCase()}</span>
              )}
            </div>
            <div style={{ flex: 1 }}>
              <div className="story-author-name">@{group.author.username || 'utilisateur'}</div>
              <div className="story-author-time">{formatDate(current.created_at)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function NewStoryModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [type, setType] = useState('text');
  const [content, setContent] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const reset = () => {
    setType('text');
    setContent('');
    setFile(null);
    setPreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const close = () => { if (loading) return; reset(); onClose?.(); };

  const handleFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) return;
    setFile(f);
    setType('image');
    const r = new FileReader();
    r.onload = (ev) => setPreview(ev.target?.result || '');
    r.readAsDataURL(f);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('type', type);
      if (content.trim()) fd.append('content', content.trim());
      if (file) fd.append('media', file);
      const { data } = await api.post('/stories', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const hydrated = {
        ...(data.story || {}),
        author: { id: user?.id, username: user?.username, avatar_path: user?.avatar_path },
      };
      onCreated?.(hydrated);
    } catch (err) {
      alert(err.response?.data?.message || err.message || 'Erreur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={close} title="Créer une story" size="md">
      <form onSubmit={submit}>
        <div className="composer-actions" style={{ marginBottom: 14 }}>
          <div className="composer-tools">
            <button type="button" className={`tool-btn${type === 'text' ? ' active' : ''}`} onClick={() => { setType('text'); setFile(null); setPreview(''); }}>
              <Type size={18} /> Texte
            </button>
            <button type="button" className={`tool-btn${type === 'image' ? ' active' : ''}`} onClick={() => fileInputRef.current?.click()}>
              <ImageIcon size={18} /> Image
            </button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden-file-input" onChange={handleFile} />
          </div>
        </div>

        {type === 'text' ? (
          <textarea
            className="form-input"
            style={{ minHeight: 180, fontSize: '1.2rem', textAlign: 'center', padding: 20 }}
            placeholder="Votre message..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            autoFocus
            maxLength={500}
          />
        ) : (
          <>
            {preview ? (
              <div className="composer-preview" style={{ margin: '0 0 12px' }}>
                <img src={preview} alt="Aperçu" style={{ maxHeight: 340 }} />
                <button type="button" className="composer-preview-remove" onClick={() => { setFile(null); setPreview(''); setType('text'); }}>
                  <X size={16} />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                style={{
                  width: '100%',
                  minHeight: 220,
                  border: '2px dashed var(--border-strong)',
                  borderRadius: 'var(--radius)',
                  background: 'var(--bg-surface)',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 10,
                }}
              >
                <ImageIcon size={40} />
                <span>Ajouter une image</span>
              </button>
            )}
            <input
              className="form-input"
              style={{ marginTop: 12 }}
              placeholder="Légende (optionnel)"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              maxLength={300}
            />
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 20 }}>
          <button type="button" className="btn btn-ghost" onClick={close} disabled={loading}>Annuler</button>
          <button type="submit" className={`btn btn-primary${loading ? ' btn-loading' : ''}`} disabled={loading || (!content.trim() && !file)}>
            {loading ? '' : <><Send size={16} /> Partager</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

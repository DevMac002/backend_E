import { useRef, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../lib/api';
import { Image as ImageIcon, Video, X, Send } from 'lucide-react';
import Modal from './Modal';

export default function CreatePostModal({ open, onClose, onCreated }) {
  const { user } = useAuth();
  const [content, setContent] = useState('');
  const [type, setType] = useState('text');
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  const resetState = () => {
    setContent('');
    setType('text');
    setFile(null);
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    onClose?.();
  };

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const isImage = f.type.startsWith('image/');
    const isVideo = f.type.startsWith('video/');
    if (isImage) setType('photo');
    else if (isVideo) setType('video');
    const reader = new FileReader();
    reader.onload = (ev) => setFilePreview(ev.target?.result || '');
    if (isImage) reader.readAsDataURL(f);
    else setFilePreview(URL.createObjectURL(f));
  };

  const removeFile = () => {
    setFile(null);
    setFilePreview(null);
    setType('text');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !file) return;
    setLoading(true);
    try {
      let response;
      if (type === 'text') {
        response = await api.post('/posts', { content: content.trim(), type: 'text' });
      } else {
        const fd = new FormData();
        if (content.trim()) fd.append('content', content.trim());
        fd.append('type', type);
        fd.append('file', file);
        response = await api.post('/posts', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      onCreated?.(response.data?.post);
      handleClose();
    } catch (err) {
      alert(err.response?.data?.message || err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} onClose={handleClose} title="Créer une publication" size="md">
      <form onSubmit={handleSubmit}>
        <div className="composer-top" style={{ marginBottom: 14 }}>
          <div className="avatar avatar-md">
            {user?.avatar_path ? (
              <img src={user.avatar_path} alt={user.username} />
            ) : (
              <span>{user?.username?.[0]?.toUpperCase() ?? '?'}</span>
            )}
          </div>
          <div style={{ flex: 1, alignSelf: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>@{user?.username ?? '...'}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)' }}>Partager avec la communauté</div>
          </div>
        </div>

        <textarea
          className="composer-textarea"
          style={{
            width: '100%',
            minHeight: 120,
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            padding: 14,
            background: 'var(--bg-surface)',
            marginBottom: 12,
          }}
          placeholder="Quoi de neuf dans votre parcours de foi ?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          autoFocus
          maxLength={2000}
        />

        {filePreview && (
          <div className="composer-preview">
            {type === 'video' ? (
              <video src={filePreview} controls />
            ) : (
              <img src={filePreview} alt="Aperçu" />
            )}
            <button type="button" className="composer-preview-remove" onClick={removeFile} aria-label="Retirer">
              <X size={16} />
            </button>
          </div>
        )}

        <div className="composer-actions">
          <div className="composer-tools">
            <button
              type="button"
              className={`tool-btn${type === 'photo' && file ? ' active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <ImageIcon size={18} /> Photo
            </button>
            <button
              type="button"
              className={`tool-btn${type === 'video' && file ? ' active' : ''}`}
              onClick={() => fileInputRef.current?.click()}
            >
              <Video size={18} /> Vidéo
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,video/*"
              className="hidden-file-input"
              onChange={handleFileChange}
            />
          </div>
          <button
            type="submit"
            className={`btn btn-primary${loading ? ' btn-loading' : ''}`}
            disabled={(!content.trim() && !file) || loading}
          >
            {loading ? '' : <><Send size={16} /> Publier</>}
          </button>
        </div>
      </form>
    </Modal>
  );
}

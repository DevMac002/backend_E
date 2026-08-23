import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import AppLayout from '../components/AppLayout';
import CreatePostModal from '../components/CreatePostModal';
import api from '../lib/api';
import { useToast } from '../components/Toast';
import { useAuth } from '../contexts/AuthContext';
import { MessageSquarePlus, Send, Inbox, MessageCircle } from 'lucide-react';

function formatTime(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
}
function formatDay(d) {
  if (!d) return '';
  try {
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
  } catch { return ''; }
}

export default function Messages() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [openCreate, setOpenCreate] = useState(false);
  const scrollRef = useRef(null);

  const fetchConversations = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(Array.isArray(data) ? data : []);
      if (data && data[0] && !activeConv) {
        setActiveConv(data[0].contact);
      }
    } catch (err) {
      showToast(err.response?.data?.message || 'Impossible de charger les conversations', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, activeConv]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);

  const loadMessagesFor = useCallback(async (contactId) => {
    try {
      const all = await Promise.all([
        api.get('/messages', { params: { page: 1, limit: 50, other_user_id: contactId } }).catch(() => ({ data: { data: [] } })),
      ]);
      const list = all[0]?.data?.data || [];
      setMessages(list);
    } catch {
      setMessages([]);
    }
  }, []);

  useEffect(() => {
    if (!activeConv?.id) { setMessages([]); return; }
    loadMessagesFor(activeConv.id);
  }, [activeConv?.id, loadMessagesFor]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv?.id || sending) return;
    setSending(true);
    const optimistic = {
      id: `temp-${Date.now()}`,
      content: input.trim(),
      sender_id: user?.id,
      receiver_id: activeConv.id,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setInput('');
    try {
      const { data } = await api.post('/messages', {
        content: optimistic.content,
        receiver_id: activeConv.id,
      });
      if (data?.data) {
        setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? data.data : m)));
      }
    } catch (err) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      showToast(err.response?.data?.message || 'Erreur lors de l\'envoi', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <AppLayout onCreatePost={() => setOpenCreate(true)}>
      <CreatePostModal open={openCreate} onClose={() => setOpenCreate(false)} />

      <div className="page-header">
        <h2><MessageCircle size={22} style={{ verticalAlign: 'middle', marginRight: 8, color: 'var(--primary-light)' }} />Messages</h2>
        <button className="btn btn-ghost" title="Nouveau"><MessageSquarePlus size={18} /></button>
      </div>

      <div className="messages-layout">
        <div className="conversations-list">
          <div className="conversations-header">
            <h3>Conversations</h3>
          </div>
          <div className="conversations-scroll">
            {loading ? (
              <div className="empty-state" style={{ padding: 40 }}><div className="splash-spinner" /></div>
            ) : conversations.length === 0 ? (
              <div className="empty-state" style={{ padding: 40 }}>
                <div className="empty-state-icon" style={{ width: 48, height: 48 }}><Inbox size={20} /></div>
                <p style={{ fontSize: '0.88rem' }}>Aucune conversation</p>
              </div>
            ) : (
              conversations.map((c) => (
                <div
                  key={c.contact.id}
                  className={`conv-item${activeConv?.id === c.contact.id ? ' active' : ''}`}
                  onClick={() => setActiveConv(c.contact)}
                >
                  <div className="avatar avatar-md">
                    {c.contact.avatar_path ? (
                      <img src={c.contact.avatar_path} alt="" />
                    ) : (
                      <span>{(c.contact.username || '?')[0]?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="conv-info">
                    <div className="conv-top">
                      <span className="conv-name">@{c.contact.username}</span>
                      <span className="conv-time">{formatDay(c.lastMessage?.created_at)}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <span className="conv-preview">{c.lastMessage?.content || 'Aucun message'}</span>
                      {(c.unreadCount ?? 0) > 0 && <span className="conv-badge">{c.unreadCount}</span>}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="chat-window">
          {!activeConv ? (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-icon"><MessageCircle size={28} /></div>
              <h3>Sélectionnez une conversation</h3>
              <p>Choisissez un contact pour commencer à échanger.</p>
            </div>
          ) : (
            <>
              <div className="chat-header">
                <div className="avatar avatar-sm">
                  {activeConv.avatar_path ? (
                    <img src={activeConv.avatar_path} alt="" />
                  ) : (
                    <span>{(activeConv.username || '?')[0]?.toUpperCase()}</span>
                  )}
                </div>
                <h3>@{activeConv.username}</h3>
              </div>
              <div className="chat-messages" ref={scrollRef}>
                {messages.length === 0 && (
                  <div style={{ textAlign: 'center', color: 'var(--text-dim)', padding: '20px 10px', fontSize: '0.88rem' }}>
                    Envoyez le premier message à @{activeConv.username} 👋
                  </div>
                )}
                {messages.map((m) => {
                  const sent = m.sender_id === user?.id;
                  return (
                    <div key={m.id} className={`msg-bubble msg-${sent ? 'sent' : 'received'}`}>
                      <span>{m.content}</span>
                      <span className="msg-time">{formatTime(m.created_at)}</span>
                    </div>
                  );
                })}
              </div>
              <form className="chat-input-bar" onSubmit={sendMessage}>
                <input
                  className="chat-input"
                  placeholder={`Écrire à @${activeConv.username}...`}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ borderRadius: 999, width: 46, height: 46, padding: 0, justifyContent: 'center' }}
                  disabled={!input.trim() || sending}
                  aria-label="Envoyer"
                >
                  <Send size={18} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

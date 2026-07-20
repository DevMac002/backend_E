import { useEffect, useState, useRef } from 'react';
import api from '../api';
import AppLayout from '../components/AppLayout';
import { useAuth } from '../hooks/useAuth';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} h`;
  return `${Math.floor(diff / 86400)} j`;
}

function Avatar({ name, size = 'md' }) {
  const initials = name ? name.slice(0, 2).toUpperCase() : '?';
  return <div className={`avatar avatar-${size}`}>{initials}</div>;
}

export default function Messages() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConv, setActiveConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    api.get('/messages/conversations')
      .then((res) => {
        const convs = res.data.items || [];
        setConversations(convs);
        if (convs.length > 0) setActiveConv(convs[0]);
      })
      .catch(() => setError('Impossible de charger les conversations'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!activeConv) return;
    api.get(`/messages/conversations/${activeConv.id}/messages`)
      .then((res) => setMessages(res.data.items || []))
      .catch(() => setMessages([]));
  }, [activeConv]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || !activeConv) return;
    const text = input.trim();
    const tempMsg = {
      id: `temp-${Date.now()}`,
      content: text,
      sender_id: user?.id,
      created_at: new Date().toISOString(),
      _temp: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setInput('');
    setSending(true);
    try {
      const res = await api.post(`/messages/conversations/${activeConv.id}/messages`, { content: text });
      setMessages((prev) => prev.map((m) => m._temp ? res.data : m));
    } catch {
      setMessages((prev) => prev.filter((m) => !m._temp));
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <AppLayout>
      <div style={{ marginBottom: 16 }}>
        <h1 className="page-title">Messages</h1>
      </div>

      {error && <div className="error-box"><span>⚠️</span> {error}</div>}

      <div className="messages-layout">
        {/* Conversation List */}
        <div className="conversation-list">
          <div className="conversation-list-header">Conversations</div>
          {loading ? (
            <div style={{ padding: 16 }}>
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '12px 16px' }}>
                  <div className="skeleton skeleton-circle" style={{ width: 40, height: 40 }} />
                  <div style={{ flex: 1 }}>
                    <div className="skeleton skeleton-line" style={{ width: '60%', marginBottom: 6 }} />
                    <div className="skeleton skeleton-line" style={{ width: '80%' }} />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="empty-state" style={{ padding: 32 }}>
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-title" style={{ fontSize: '0.9rem' }}>Aucune conversation</div>
            </div>
          ) : (
            conversations.map((conv) => (
              <div
                key={conv.id}
                className={`conv-item${activeConv?.id === conv.id ? ' active' : ''}`}
                onClick={() => setActiveConv(conv)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => e.key === 'Enter' && setActiveConv(conv)}
                aria-label={`Conversation: ${conv.title || 'Discussion'}`}
              >
                <Avatar name={conv.title || 'C'} size="sm" />
                <div className="conv-info">
                  <div className="conv-name">{conv.title || 'Conversation'}</div>
                  <div className="conv-preview">{conv.last_message || '...'}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Chat Area */}
        <div className="chat-area">
          {activeConv ? (
            <>
              {/* Chat Header */}
              <div className="chat-header">
                <Avatar name={activeConv.title} size="sm" />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{activeConv.title || 'Conversation'}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--green)' }}>● En ligne</div>
                </div>
              </div>

              {/* Messages */}
              <div className="chat-messages">
                {messages.length === 0 ? (
                  <div className="empty-state">
                    <div className="empty-state-icon">💬</div>
                    <div className="empty-state-title">Aucun message</div>
                    <p className="empty-state-text">Commencez la conversation !</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isSent = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: isSent ? 'flex-end' : 'flex-start' }}>
                        <div className={`message-bubble ${isSent ? 'sent' : 'received'}${msg._temp ? '' : ''}`}
                          style={{ opacity: msg._temp ? 0.7 : 1 }}>
                          {msg.content}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: 2, padding: '0 4px' }}>
                          {timeAgo(msg.created_at)}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <form className="chat-input-area" onSubmit={handleSend}>
                <textarea
                  className="chat-input"
                  placeholder="Écrire un message... (Entrée pour envoyer)"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={sending}
                  aria-label="Écrire un message"
                />
                <button
                  type="submit"
                  className={`btn btn-primary${sending ? ' btn-loading' : ''}`}
                  disabled={!input.trim() || sending}
                  aria-label="Envoyer"
                >
                  {sending ? '' : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="22" y1="2" x2="11" y2="13" />
                      <polygon points="22 2 15 22 11 13 2 9 22 2" />
                    </svg>
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="empty-state" style={{ flex: 1 }}>
              <div className="empty-state-icon">💬</div>
              <div className="empty-state-title">Sélectionnez une conversation</div>
              <p className="empty-state-text">Choisissez une conversation dans la liste.</p>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}

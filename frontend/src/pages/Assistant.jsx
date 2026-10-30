import { useState, useEffect, useRef, useCallback } from 'react';
import { FiSend, FiUser, FiTrash2 } from 'react-icons/fi';
import { sendChatMessage, getChatHistory } from '../services/api';

const PROMPT_SUGGESTIONS = [
  "How to treat yellow spots on tomato leaves?",
  "Best organic fertilizer for cotton in black soil?",
  "How often should I irrigate maize using drip?",
  "Safe dosage of neem oil for pest control?"
];

const Assistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(() => {
    let sid = localStorage.getItem('agropath_chat_session');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 9);
      localStorage.setItem('agropath_chat_session', sid);
    }
    return sid;
  });
  const messagesEndRef = useRef(null);

  const loadHistory = useCallback(async (sid) => {
    try {
      const res = await getChatHistory(sid);
      if (res.messages && res.messages.length > 0) {
        setMessages(res.messages);
      } else {
        setMessages([
          {
            role: 'assistant',
            message: '🌱 **Namaste & Welcome to AgroPath AI!**\n\nI am your agricultural decision-support assistant. Ask me anything about crop diseases, fertilizers, irrigation schedules, or weather precautions!'
          }
        ]);
      }
    } catch {
      setMessages([
        {
          role: 'assistant',
          message: '🌱 **Welcome to AgroPath AI!**\n\nI am your personal agricultural advisor. How can I help your farm today?'
        }
      ]);
    }
  }, []);

  useEffect(() => {
    loadHistory(sessionId);
  }, [sessionId, loadHistory]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (textToSend) => {
    const text = textToSend || input;
    if (!text.trim() || loading) return;

    const userMsg = { role: 'user', message: text };
    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInput('');
    setLoading(true);

    try {
      const res = await sendChatMessage(text, sessionId);
      setMessages(prev => [...prev, { role: 'assistant', message: res.reply }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        message: '⚠️ Connection error. Please ensure the backend is running at http://localhost:8000.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    const newSid = 'session_' + Math.random().toString(36).substring(2, 9);
    localStorage.setItem('agropath_chat_session', newSid);
    setSessionId(newSid);
    setMessages([
      {
        role: 'assistant',
        message: '🌱 Conversation cleared. How can I help you with your crops today?'
      }
    ]);
  };

  return (
    <div className="page-container fade-in" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>AI Farming Assistant</h1>
          <p className="text-muted" style={{ margin: '0.2rem 0 0 0' }}>Instant answers for crop management, pest remedies, and fertilizer dosing powered by Gemini.</p>
        </div>
        <button 
          onClick={handleClear} 
          style={{ background: 'none', border: '1px solid #ccc', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
        >
          <FiTrash2 /> Clear Chat
        </button>
      </div>

      {/* Chat Messages Box */}
      <div className="card" style={{ flex: 1, overflowY: 'auto', padding: '1.2rem', display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1rem' }}>
        {messages.map((m, idx) => (
          <div 
            key={idx} 
            style={{
              display: 'flex',
              gap: '0.8rem',
              alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%'
            }}
          >
            {m.role === 'assistant' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.2rem' }}>
                🌱
              </div>
            )}
            
            <div style={{
              background: m.role === 'user' ? '#2e7d32' : '#f5f5f5',
              color: m.role === 'user' ? '#fff' : '#222',
              padding: '0.8rem 1rem',
              borderRadius: '12px',
              borderTopLeftRadius: m.role === 'assistant' ? '2px' : '12px',
              borderTopRightRadius: m.role === 'user' ? '2px' : '12px',
              whiteSpace: 'pre-wrap',
              fontSize: '0.92rem',
              lineHeight: 1.5
            }}>
              {m.message}
            </div>

            {m.role === 'user' && (
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#1b5e20', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FiUser />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', gap: '0.8rem', alignSelf: 'flex-start' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#e8f5e9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>
              🌱
            </div>
            <div style={{ background: '#f5f5f5', padding: '0.8rem 1rem', borderRadius: '12px', fontSize: '0.9rem', color: '#666' }}>
              <span className="spinner"></span> Consulting Agricultural Knowledge Base...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Prompt Suggestions */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', marginBottom: '0.8rem', paddingBottom: '0.2rem' }}>
        {PROMPT_SUGGESTIONS.map((prompt, i) => (
          <button 
            key={i} 
            onClick={() => handleSend(prompt)}
            disabled={loading}
            style={{
              whiteSpace: 'nowrap',
              padding: '5px 12px',
              borderRadius: '16px',
              border: '1px solid #c8e6c9',
              background: '#f1f8e9',
              color: '#1b5e20',
              fontSize: '0.8rem',
              cursor: 'pointer'
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} style={{ display: 'flex', gap: '0.6rem' }}>
        <input 
          type="text" 
          placeholder="Ask a question about your farm, crop disease, fertilizer..."
          value={input} 
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          style={{ flex: 1, padding: '0.8rem 1rem', borderRadius: '8px', border: '1px solid #ccc', fontSize: '0.95rem' }}
        />
        <button 
          type="submit" 
          className="btn btn-primary" 
          disabled={loading || !input.trim()}
          style={{ padding: '0.8rem 1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <FiSend /> Send
        </button>
      </form>
    </div>
  );
};

export default Assistant;

// src/components/ChatLauncher.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * ChatLauncher (single-column)
 *
 * Props:
 * - welcomeMessage: string
 * - suggestions: initial suggestions array
 * - fetchSuggestionsUrl: optional URL to fetch initial suggestions
 * - endpoint: server endpoint for messages (default '/.netlify/functions/dialogflow')
 */
export default function ChatLauncher({
  welcomeMessage = 'Hi — Welcome! I can help with questions about our service.',
  suggestions = ['AboutUs', 'what is ScriptBees', 'Features'],
  fetchSuggestionsUrl = undefined,
  endpoint = '/.netlify/functions/dialogflow',
}) {
  const [messages, setMessages] = useState([{ id: 'bot-welcome', from: 'bot', text: welcomeMessage }]);
  const [loading, setLoading] = useState(false);
  const [suggestionsState, setSuggestionsState] = useState(Array.isArray(suggestions) ? suggestions : []);
  const [suggestionsVisible, setSuggestionsVisible] = useState(Boolean(suggestionsState.length));
  const inputRef = useRef(null);
  const boxRef = useRef(null);

  // session id
  useEffect(() => {
    let sid = localStorage.getItem('dialogflow_session_id');
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem('dialogflow_session_id', sid);
    }
  }, []);

  // optionally fetch suggestions
  useEffect(() => {
    if (!fetchSuggestionsUrl) return;
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(fetchSuggestionsUrl);
        if (!res.ok) throw new Error(`Failed to fetch suggestions: ${res.status}`);
        const data = await res.json();
        const arr = Array.isArray(data) ? data : Array.isArray(data.suggestions) ? data.suggestions : [];
        if (mounted) {
          setSuggestionsState(arr);
          setSuggestionsVisible(arr.length > 0);
        }
      } catch (err) {
        console.warn('fetch suggestions failed', err);
      }
    })();
    return () => { mounted = false; };
  }, [fetchSuggestionsUrl]);

  // autoscroll
  useEffect(() => {
    if (boxRef.current) boxRef.current.scrollTop = boxRef.current.scrollHeight;
  }, [messages, loading]);

  // send to server
  async function sendToBot(text) {
    if (!text || !text.toString().trim()) return;
    const trimmed = text.toString().trim();

    // user message
    const userMsg = { id: `u-${Date.now()}`, from: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);

    // bot placeholder
    const placeholderId = `p-${Date.now()}`;
    setMessages((m) => [...m, { id: placeholderId, from: 'bot', text: 'Typing…', loading: true }]);
    setLoading(true);

    try {
      const sessionId = localStorage.getItem('dialogflow_session_id');
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: trimmed, sessionId }),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        throw new Error(`Server error ${res.status} ${errText}`);
      }

      const data = await res.json();
      const reply = data?.reply ?? data?.fulfillmentText ?? "Sorry, I don't have an answer for that.";
      const payload = data?.payload ?? null;

      setMessages((m) => m.map((msg) => (msg.id === placeholderId ? { ...msg, text: reply, loading: false, payload } : msg)));
    } catch (err) {
      console.error('sendToBot error', err);
      setMessages((m) => m.map((msg) => (msg.id === placeholderId ? { ...msg, text: 'Sorry — something went wrong.', loading: false } : msg)));
    } finally {
      setLoading(false);
    }
  }

  // suggestion clicked
  function handleSuggestionClick(s) {
    if (loading) return;
    setSuggestionsVisible(false);
    sendToBot(s);
  }

  // bot-sent inline buttons
  function handleBotButtonClick(messageId, button) {
    setMessages((prev) => prev.map((m) => m.id === messageId ? { ...m, payload: { ...m.payload, buttons: [] } } : m));
    const toSend = button.payload ?? button.title ?? button.text ?? '';
    if (toSend) sendToBot(toSend);
  }

  // input send
  function handleSendInput() {
    const el = inputRef.current;
    if (!el) return;
    const v = el.value?.trim();
    if (!v) return;
    el.value = '';
    sendToBot(v);
  }

  // styles (centered single column)
  const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: 20, fontFamily: 'Inter, system-ui, Arial, sans-serif' },
    wrapper: { width: '680px', maxWidth: '96%', display: 'flex', flexDirection: 'column', gap: 12 },
    header: { background: '#7AC142', color: '#fff', padding: 14, fontWeight: 800, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    subtitle: { fontSize: 13, color: '#ecfdf5', opacity: 0.95 },
    suggestionsBox: { padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #eef2f7' },
    chipsRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    chip: { padding: '8px 12px', borderRadius: 999, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', cursor: 'pointer', fontWeight: 700 },
    chatPanel: { height: '60vh', borderRadius: 10, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: '#fff', boxShadow: '0 8px 24px rgba(2,6,23,0.06)' },
    messages: { padding: 16, display: 'flex', flexDirection: 'column', gap: 10, overflowY: 'auto', flex: 1, background: '#f8fafc' },
    botBubble: { background: '#fff', color: '#0f172a', padding: '10px 14px', borderRadius: 12, maxWidth: '78%', fontSize: 14, boxShadow: '0 1px 0 rgba(2,6,23,0.03)' },
    userBubble: { background: '#7AC142', color: '#fff', padding: '10px 14px', borderRadius: 12, maxWidth: '78%', fontSize: 14, alignSelf: 'flex-end' },
    inputRow: { padding: 12, borderTop: '1px solid #eef2f7', display: 'flex', gap: 8, alignItems: 'center', background: '#fff' },
    input: { flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e6edf3', outline: 'none', fontSize: 14 },
    sendBtn: { padding: '10px 14px', borderRadius: 8, background: '#7AC142', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 },
    smallNote: { fontSize: 12, color: '#6b7280', textAlign: 'center' },
    session: { fontSize: 12, color: '#6b7280', marginTop: 6, textAlign: 'center' },
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div>ScriptBees Assistant</div>
        </div>

        {suggestionsVisible && suggestionsState && suggestionsState.length > 0 && (
          <div style={styles.suggestionsBox}>
            <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>Quick suggestions</div>
            <div style={styles.chipsRow}>
              {suggestionsState.map((s, i) => (
                <button key={`${i}-${s}`} onClick={() => handleSuggestionClick(s)} style={styles.chip} disabled={loading} aria-label={`Suggestion ${s}`}>
                  {s || 'EMPTY'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div style={styles.chatPanel}>
          <div style={styles.messages} ref={boxRef} aria-live="polite">
            {messages.map((m) => (
              <div key={m.id} style={{ display: 'flex', justifyContent: m.from === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={m.from === 'user' ? styles.userBubble : styles.botBubble}>
                  <div style={{ whiteSpace: 'pre-wrap' }}>{m.text}</div>

                  {m.payload && Array.isArray(m.payload.buttons) && m.payload.buttons.length > 0 && (
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {m.payload.buttons.map((b, idx) => (
                        <button key={`${m.id}-btn-${idx}`} onClick={() => handleBotButtonClick(m.id, b)} style={{ ...styles.chip, fontWeight: 800 }}>
                          {b.title ?? b.text ?? `Option ${idx + 1}`}
                        </button>
                      ))}
                    </div>
                  )}

                  {m.loading && <div style={{ marginTop: 6, fontSize: 12, color: '#6b7280' }}>Loading…</div>}
                </div>
              </div>
            ))}
          </div>

          <div style={styles.inputRow}>
            <input
              ref={inputRef}
              placeholder="Type your message..."
              style={styles.input}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSendInput(); }}
              disabled={loading}
              aria-label="Type a message"
            />
            <button style={styles.sendBtn} onClick={handleSendInput} disabled={loading}>{loading ? '...' : 'Send'}</button>
          </div>
        </div>

        <div style={styles.session}>Powered by ScriptBees</div>
      </div>
    </div>
  );
}

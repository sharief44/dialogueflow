// src/components/ChatLauncher.jsx
import React, { useEffect, useRef, useState } from 'react';

/**
 * ChatLauncher — welcome + suggestions rendered inside the same scrollable messages area
 * - Header + input are fixed
 * - Welcome & suggestions live inside messagesWrap so they scroll with conversation
 * - No hardcoded bot message after send; bot replies appended only when server returns
 */
export default function ChatLauncher({
  welcomeMessage = 'Hi there! 👋 Welcome to ScriptBees. I’m your virtual assistant — here to answer your questions about our services, policies, or any other info you need. What can I help you with today?',
  suggestions = [
    'What services do you offer?',
    'Do you provide AI/ML solutions?',
    'Can you help me build or improve my application?',
    'What is your development process and how do projects work?'
  ],
  fetchSuggestionsUrl = undefined,
  endpoint = '/.netlify/functions/dialogflow',
}) {
  // conversation messages only (bot replies come from server)
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [suggestionsState, setSuggestionsState] = useState(Array.isArray(suggestions) ? suggestions : []);
  const [suggestionsVisible, setSuggestionsVisible] = useState(Boolean(suggestionsState.length));
  const inputRef = useRef(null);
  const messagesRef = useRef(null);

  // session id
  useEffect(() => {
    let sid = localStorage.getItem('dialogflow_session_id');
    if (!sid) {
      sid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
      localStorage.setItem('dialogflow_session_id', sid);
    }
  }, []);

  // optional fetch suggestions
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

  // autoscroll to bottom when messages change
  useEffect(() => {
    if (!messagesRef.current) return;
    // small timeout ensures the DOM updates before scrolling
    setTimeout(() => {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight;
    }, 30);
  }, [messages, loading]);

  // send text -> append user then call server -> append bot only when returned
  async function sendToBot(text) {
    if (!text || !text.toString().trim()) return;
    const trimmed = text.toString().trim();

    // append user message immediately
    const userMsg = { id: `u-${Date.now()}`, from: 'user', text: trimmed };
    setMessages((m) => [...m, userMsg]);

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
      const reply = (data?.reply ?? data?.fulfillmentText ?? '')?.toString().trim();
      const payload = data?.payload ?? null;

      // only append server-provided content (no hardcoded filler)
      if (reply) {
        const botMsg = { id: `b-${Date.now()}`, from: 'bot', text: reply, payload: payload ?? null };
        setMessages((m) => [...m, botMsg]);
      } else if (payload && payload.buttons && payload.buttons.length) {
        // payload-only response -> append message with empty text but with payload (so buttons render)
        const botMsg = { id: `b-${Date.now()}`, from: 'bot', text: '', payload };
        setMessages((m) => [...m, botMsg]);
      } else {
        // nothing returned: do not inject any chat message (silently ignore)
        console.warn('Dialogflow returned empty reply and no payload for:', trimmed);
      }
    } catch (err) {
      console.error('sendToBot error', err);
      // do not inject a hardcoded error message; keep UI silent and log
    } finally {
      setLoading(false);
    }
  }

  // suggestion click: keep suggestions visible (they're inside the scrollable area now)
  function handleSuggestionClick(s) {
    if (loading) return;
    sendToBot(s);
  }

  // bot payload button click: keep buttons visible after click
  function handleBotButtonClick(messageId, button) {
    // do NOT clear buttons; keep them visible and clickable
    const toSend = button.payload ?? button.title ?? button.text ?? '';
    if (toSend) sendToBot(toSend);
  }

  function handleSendInput() {
    const el = inputRef.current;
    if (!el) return;
    const v = el.value?.trim();
    if (!v) return;
    el.value = '';
    sendToBot(v);
  }

  // styles: header + input fixed; messagesWrap is the single scrollable area
  const styles = {
    page: { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f3f4f6', padding: 24, fontFamily: 'Inter, system-ui, Arial, sans-serif' },
    wrapper: { width: '600px', maxWidth: '96%', display: 'flex', flexDirection: 'column', gap: 12 },
    header: { background: '#7AC142', color: '#fff', padding: 14, fontWeight: 800, borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    chatCard: { borderRadius: 10, overflow: 'hidden', background: '#fff', boxShadow: '0 8px 24px rgba(2,6,23,0.06)', display: 'flex', flexDirection: 'column', height: '72vh' },
    // messagesWrap is the single scrolling block (contains welcome, suggestions, messages)
    messagesWrap: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12, overflowY: 'auto', flex: 1, background: '#f8fafc' },
    welcome: { background: '#fff', border: '1px solid #eef2f7', padding: 12, borderRadius: 8, color: '#0f172a', fontSize: 14, lineHeight: 1.5 },
    suggestionsBox: { padding: 10, borderRadius: 8, background: '#fff', border: '1px solid #eef2f7' },
    chipsRow: { display: 'flex', gap: 8, flexWrap: 'wrap' },
    chip: { padding: '8px 12px', borderRadius: 999, border: '1px solid #cbd5e1', background: '#fff', color: '#0f172a', cursor: 'pointer', fontWeight: 700 },
    messages: { display: 'flex', flexDirection: 'column', gap: 10 },
    botBubble: { background: '#fff', color: '#0f172a', padding: '10px 14px', borderRadius: 12, maxWidth: '78%', fontSize: 14, boxShadow: '0 1px 0 rgba(2,6,23,0.03)' },
    userBubble: { background: '#7AC142', color: '#fff', padding: '10px 14px', borderRadius: 12, maxWidth: '78%', fontSize: 14, alignSelf: 'flex-end' },
    inputRow: { padding: 12, borderTop: '1px solid #eef2f7', display: 'flex', gap: 8, alignItems: 'center', background: '#fff', flex: '0 0 auto' },
    input: { flex: 1, padding: '10px 12px', borderRadius: 8, border: '1px solid #e6edf3', outline: 'none', fontSize: 14 },
    sendBtn: { padding: '10px 14px', borderRadius: 8, background: '#7AC142', color: '#fff', border: 'none', cursor: 'pointer', fontWeight: 700 },
    footerNote: { fontSize: 12, color: '#6b7280', textAlign: 'center', paddingTop: 8 }
  };

  return (
    <div style={styles.page}>
      <div style={styles.wrapper}>
        <div style={styles.header}>
          <div>ScriptBees Assistant</div>
        </div>

        <div style={styles.chatCard}>
          {/* single scrolling area: welcome + suggestions + messages */}
          <div style={styles.messagesWrap} ref={messagesRef} aria-live="polite">
            {/* welcome sits at the top of the scrollable area */}
            <div style={styles.welcome}>{welcomeMessage}</div>

            {/* suggestions are now inside the scroll area and will scroll away as messages grow */}
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

            {/* conversation messages */}
            <div style={styles.messages}>
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
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* input row stays fixed under the scroll area */}
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

        <div style={styles.footerNote}>Powered by ScriptBees</div>
      </div>
    </div>
  );
}

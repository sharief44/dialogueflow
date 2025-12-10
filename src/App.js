<<<<<<< HEAD
// src/App.js
import React from 'react';
import ChatLauncher from './components/ChatLauncher';

export default function App() {
  return (
    <div>
      <ChatLauncher
        welcomeMessage="Hi there! 👋 Welcome to ScriptBees. I’m your virtual assistant — here to answer your questions about our services, policies, or any other info you need. What can I help you with today?"
        suggestions={[
          'What services do you offer?',
          'Do you provide AI/ML solutions?',
          'Can you help me build or improve my application?',
          'What is your development process and how do projects work?'
        ]}
        endpoint="/.netlify/functions/dialogflow"
      />
=======
import { useState, useRef, useEffect } from 'react';

export default function App() {
  const [msg, setMsg] = useState('');
  const [chat, setChat] = useState([]);
  const box = useRef();

  useEffect(() => {
    if (box.current) {
      box.current.scrollTop = box.current.scrollHeight;
    }
  }, [chat]);

  // Send message to backend
  const send = async (textOverride) => {
    const finalText = textOverride || msg;
    if (!finalText.trim()) return;

    // Add user message
    setChat(c => [...c, { from: 'user', text: finalText }]);

    const r = await fetch('/.netlify/functions/dialogflow', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: finalText })
    });

    const d = await r.json();

    // Add bot text response
    if (d.reply) {
      setChat(c => [...c, { from: 'bot', text: d.reply }]);
    }

    // Add chips if present
    if (d.chips && d.chips.length > 0) {
      setChat(c => [...c, { from: 'bot', chips: d.chips }]);
    }

    setMsg('');
  };

  // When chip is clicked
  const handleChipClick = (text) => {
    send(text);
  };

  return (
    <div className="app">
      <div className="header">ScriptBees Assistant</div>

      <div className="chatbox" ref={box}>
        {chat.map((c, i) => (
          <div key={i} className={'msg ' + c.from}>
            {/* Text bubble */}
            {c.text && <div className="bubble">{c.text}</div>}

            {/* Chips */}
            {c.chips && (
              <div className="chip-container">
                {c.chips.map((chip, idx) => (
                  <button
                    key={idx}
                    className="chip"
                    onClick={() => handleChipClick(chip)}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="composer">
        <input
          value={msg}
          onChange={e => setMsg(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && send()}
        />
        <button onClick={() => send()}>Send</button>
      </div>
>>>>>>> af8a330f1d5bc4f70e7c1d603fa987ad724cec11
    </div>
  );
}

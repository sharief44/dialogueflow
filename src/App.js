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
    </div>
  );
}

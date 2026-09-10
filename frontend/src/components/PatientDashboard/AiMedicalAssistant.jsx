import React, { useState } from 'react';
import { generateAiAssistantResponse } from '../../services/aiPredictor';
import { Bot, Send, Sparkles, Stethoscope, AlertTriangle, ShieldCheck, ArrowRight } from 'lucide-react';

export default function AiMedicalAssistant({ currentUser, onAutoSelectSymptoms, onNavigateToAssessment }) {
  const [messages, setMessages] = useState([
    {
      sender: 'assistant',
      text: `Hello ${currentUser?.firstName || 'Patient'}! 👋 I am your MediAI Medical Assistant. Describe your symptoms, pain, or health concerns below for instant clinical risk analysis and specialty doctor triage.`
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const userMsg = { sender: 'user', text: inputText };
    const textToProcess = inputText;
    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setIsTyping(true);

    setTimeout(() => {
      const res = generateAiAssistantResponse(textToProcess);
      const assistantMsg = {
        sender: 'assistant',
        text: res.reply,
        specialty: res.suggestedSpecialty,
        symptoms: res.autoSymptoms
      };

      setMessages(prev => [...prev, assistantMsg]);
      setIsTyping(false);

      if (res.autoSymptoms && res.autoSymptoms.length > 0 && onAutoSelectSymptoms) {
        onAutoSelectSymptoms(res.autoSymptoms);
      }
    }, 600);
  };

  return (
    <div className="card glass-panel ai-assistant-hero fade-in">
      <div className="card-header border-bottom">
        <div className="ai-assistant-title-group">
          <div className="ai-assistant-avatar">
            <Bot size={24} color="#06b6d4" />
          </div>
          <div>
            <h3>MediAI Medical Assistance & AI Consultation</h3>
            <p className="card-subtitle">Real-time intelligent symptom triage & preliminary health guidance</p>
          </div>
        </div>
        <span className="live-pill">
          <Sparkles size={12} /> AI Engine Active
        </span>
      </div>

      <div className="chat-messages-container">
        {messages.map((msg, idx) => (
          <div key={idx} className={`chat-bubble-wrapper ${msg.sender}`}>
            <div className={`chat-bubble ${msg.sender}`}>
              <p className="bubble-text">{msg.text}</p>

              {msg.specialty && (
                <div className="assistant-action-box">
                  <div className="action-tag">
                    <Stethoscope size={14} color="#06b6d4" /> Recommended Specialist: <strong>Dr. {msg.specialty}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={onNavigateToAssessment}
                    className="btn-primary btn-sm margin-top-sm"
                  >
                    View Risk Assessment & Submit Case <ArrowRight size={14} />
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="chat-bubble-wrapper assistant">
            <div className="chat-bubble assistant typing-bubble">
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
              <span className="typing-dot"></span>
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="chat-input-row border-top">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Type your symptoms (e.g., 'I have a severe headache and chest pressure')..."
          className="form-input chat-input"
        />
        <button type="submit" className="btn-primary btn-md">
          <Send size={16} /> Ask AI
        </button>
      </form>
    </div>
  );
}

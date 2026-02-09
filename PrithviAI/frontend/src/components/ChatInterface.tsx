'use client';

/**
 * PrithviAI — AI Chat Interface
 * Natural language interface for environmental safety queries.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { sendChatMessage, getChatSuggestions } from '@/lib/api';
import { getRiskColor, getRiskBadgeBg } from '@/lib/utils';
import { t } from '@/lib/translations';
import type { ChatMessage, Language, AgeGroup, RiskLevel } from '@/types';

interface ChatInterfaceProps {
  language: Language;
  ageGroup: AgeGroup;
  city: string;
}

export default function ChatInterface({ language, ageGroup, city }: ChatInterfaceProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Accurate coordinates for each city
  const CITY_COORDS: Record<string, { lat: number; lon: number }> = {
    Pune: { lat: 18.5204, lon: 73.8567 },
    Mumbai: { lat: 19.0760, lon: 72.8777 },
    Delhi: { lat: 28.6139, lon: 77.2090 },
    Bangalore: { lat: 12.9716, lon: 77.5946 },
    Chennai: { lat: 13.0827, lon: 80.2707 },
    Kolkata: { lat: 22.5726, lon: 88.3639 },
    Hyderabad: { lat: 17.3850, lon: 78.4867 },
  };

  const coords = CITY_COORDS[city] || CITY_COORDS.Pune;

  // Load suggestions on mount
  useEffect(() => {
    loadSuggestions();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function loadSuggestions() {
    try {
      const data = await getChatSuggestions();
      setSuggestions(data.suggestions);
    } catch {
      setSuggestions([
        "Is it safe for seniors to go outside?",
        "How is the air quality?",
        "What's today's safety summary?",
      ]);
    }
  }

  async function handleSend(text?: string) {
    const message = text || input.trim();
    if (!message || loading) return;

    setInput('');

    // Add user message
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const response = await sendChatMessage(
        message,
        coords.lat,
        coords.lon,
        city,
        ageGroup,
        language,
        sessionId,
      );

      setSessionId(response.session_id);

      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
        risk_level: response.risk_level,
        safety_index: response.safety_index || undefined,
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '⚠️ Sorry, I could not process your request. Please make sure the backend server is running and try again.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Chat Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="font-semibold">{t('chatAssistant', language)}</h2>
            <p className="text-xs text-green-100">{t('chatSubtitle', language)}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Sparkles className="text-green-500" size={28} />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {t('chatWelcome', language)}
            </h3>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              {t('chatPlaceholder', language)}
            </p>

            {/* Suggestion chips */}
            <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
              {suggestions.slice(0, 6).map((suggestion, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(suggestion)}
                  className="px-4 py-2 bg-green-50 text-green-700 text-sm rounded-full
                    hover:bg-green-100 transition-colors border border-green-100"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                <Bot size={16} className="text-green-700" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-green-600 text-white rounded-br-sm'
                  : 'bg-gray-50 text-gray-800 rounded-bl-sm border border-gray-100'
              }`}
            >
              {/* Risk badge for assistant messages */}
              {msg.role === 'assistant' && msg.risk_level && (
                <span className={`inline-block text-xs font-bold px-2 py-0.5 rounded-full text-white mb-2 ${getRiskBadgeBg(msg.risk_level)}`}>
                  {msg.risk_level} RISK
                </span>
              )}
              <div className="text-sm whitespace-pre-wrap leading-relaxed">
                {msg.content}
              </div>
            </div>
            {msg.role === 'user' && (
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-white" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-green-700" />
            </div>
            <div className="bg-gray-50 rounded-2xl rounded-bl-sm px-4 py-3 border border-gray-100">
              <Loader2 className="w-5 h-5 text-green-500 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 px-4 py-3 bg-gray-50/50">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage', language)}
            className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl
              focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent
              text-sm text-gray-800 placeholder:text-gray-400"
            disabled={loading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3 bg-green-600 text-white rounded-xl hover:bg-green-700
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

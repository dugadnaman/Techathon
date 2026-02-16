'use client';

/**
 * Prithvi — AI Chat Interface
 * Premium glass-styled chat with motion-enhanced messages.
 */

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Sparkles, Loader2 } from 'lucide-react';
import { sendChatMessage, getChatSuggestions } from '@/lib/api';
import { getRiskColor, getRiskBadgeBg } from '@/lib/utils';
import { t } from '@/lib/translations';
import type { ChatMessage, Language, AgeGroup, RiskLevel } from '@/types';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

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

  useEffect(() => {
    loadSuggestions();
  }, []);

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
        content: 'Sorry, I could not process your request. Please make sure the backend server is running and try again.',
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
    <div className="flex flex-col h-[calc(100vh-12rem)] glass-card-solid rounded-3xl overflow-hidden">
      {/* Chat Header */}
      <div className="bg-accent px-6 py-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
            <Bot size={22} />
          </div>
          <div>
            <h2 className="font-semibold">{t('chatAssistant', language)}</h2>
            <p className="text-xs text-white/70">{t('chatSubtitle', language)}</p>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="text-center py-12"
            >
              <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="text-accent" size={28} />
              </div>
              <h3 className="text-lg font-semibold text-content-primary mb-2">
                {t('chatWelcome', language)}
              </h3>
              <p className="text-content-secondary text-sm mb-6 max-w-md mx-auto">
                {t('chatPlaceholder', language)}
              </p>

              <div className="flex flex-wrap gap-2 justify-center max-w-lg mx-auto">
                {suggestions.slice(0, 6).map((suggestion, idx) => (
                  <motion.button
                    key={idx}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => handleSend(suggestion)}
                    className="px-4 py-2 bg-accent/5 text-accent text-sm rounded-full
                      hover:bg-accent/10 transition-colors border border-accent/10"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot size={16} className="text-accent" />
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.role === 'user'
                    ? 'bg-accent text-white rounded-br-sm'
                    : 'glass-card-solid text-content-primary rounded-bl-sm'
                }`}
              >
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
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                  <User size={16} className="text-white" />
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 justify-start"
          >
            <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center">
              <Bot size={16} className="text-accent" />
            </div>
            <div className="glass-card-solid rounded-2xl rounded-bl-sm px-4 py-3">
              <Loader2 className="w-5 h-5 text-accent animate-spin" />
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-surface-secondary px-4 py-3 bg-surface-secondary/30">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t('typeMessage', language)}
            className="flex-1 px-4 py-3 bg-surface-card border border-surface-secondary rounded-2xl
              focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40
              text-sm text-content-primary placeholder:text-content-secondary"
            disabled={loading}
          />
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend()}
            disabled={!input.trim() || loading}
            className="p-3 bg-accent text-white rounded-2xl hover:bg-accent-dark
              disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-glow-green"
          >
            <Send size={18} />
          </motion.button>
        </div>
      </div>
    </div>
  );
}

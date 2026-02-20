'use client';

/**
 * Prithvi — Map Chat Box Component
 * Premium glass-styled AI Q&A for map locations.
 */

import { useState, useRef, useEffect } from 'react';
import { useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, MapPin, Sparkles, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendMapChatMessage } from '@/lib/api';
import type { Language, MapChatMessage } from '@/types';
import { t } from '@/lib/translations';

const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

interface MapChatBoxProps {
  selectedLocation: { lat: number; lon: number; name: string } | null;
}

export default function MapChatBox({ selectedLocation }: MapChatBoxProps) {
  const locale = useLocale() as Language;
  const [messages, setMessages] = useState<MapChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (selectedLocation) {
      setMessages([]);
      setSessionId(undefined);
    }
  }, [selectedLocation?.lat, selectedLocation?.lon]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || !selectedLocation || isLoading) return;

    const userMsg: MapChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await sendMapChatMessage(
        text.trim(),
        selectedLocation.lat,
        selectedLocation.lon,
        selectedLocation.name,
        history,
        sessionId,
      );

      setSessionId(response.session_id);

      const assistantMsg: MapChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.reply,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      const errorMsg: MapChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: t('chat.mapRequestFailed', locale),
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([]);
    setSessionId(undefined);
  };

  if (!selectedLocation) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-content-secondary/30 mx-auto mb-3" />
          <p className="text-sm text-content-secondary">{t('chat.selectLocationToAsk', locale)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-surface-secondary bg-accent/5">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-accent" />
          <div>
            <h3 className="text-sm font-semibold text-content-primary">{t('chat.assistant', locale)}</h3>
            <p className="text-xs text-content-secondary truncate max-w-[200px]">
              {selectedLocation.name || `${selectedLocation.lat.toFixed(3)}, ${selectedLocation.lon.toFixed(3)}`}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleReset}
            className="p-1.5 min-h-[44px] min-w-[44px] text-content-secondary hover:text-content-primary hover:bg-surface-secondary rounded-lg transition-colors"
            title={t('chat.clearConversation', locale)}
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-3"
            >
              <p className="text-xs text-content-secondary text-center mb-3">
                {t('chat.askAboutLocation', locale)} <strong className="text-content-primary">{selectedLocation.name || t('chat.thisLocation', locale)}</strong>
              </p>
              <div className="space-y-2">
                {[t('chat.mapSuggestion1', locale), t('chat.mapSuggestion2', locale), t('chat.mapSuggestion3', locale), t('chat.mapSuggestion4', locale)].map((q, i) => (
                  <motion.button
                    key={i}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => sendMessage(q)}
                    className="w-full text-left text-xs px-3 py-2.5 min-h-[44px] bg-surface-secondary/50 hover:bg-accent/5 hover:text-accent border border-surface-secondary hover:border-accent/20 rounded-2xl transition-all text-content-secondary"
                  >
                    {q}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: EASE_OUT }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-accent text-white rounded-tr-md'
                      : 'bg-surface-secondary text-content-primary rounded-tl-md'
                  }`}
                >
                  {msg.role === 'assistant' ? (
                    <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-1 dark:prose-invert">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-surface-secondary px-4 py-3 rounded-2xl rounded-tl-md">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-content-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-content-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-content-secondary/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-surface-secondary bg-surface-secondary/30"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('chat.askLocationPlaceholder', locale)}
            className="flex-1 px-4 py-2.5 bg-surface-card border border-surface-secondary rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent/40 text-content-primary placeholder:text-content-secondary"
            disabled={isLoading}
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 min-h-[44px] min-w-[44px] bg-accent text-white rounded-2xl hover:bg-accent-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </motion.button>
        </div>
      </form>
    </div>
  );
}

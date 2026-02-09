'use client';

/**
 * PrithviAI — Map Chat Box Component
 * AI Q&A interface that uses the selected map location as context.
 * Maintains conversation history to provide non-repetitive, varied responses.
 */

import { useState, useRef, useEffect } from 'react';
import { Send, MapPin, Sparkles, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { sendMapChatMessage } from '@/lib/api';
import type { MapChatMessage } from '@/types';

interface MapChatBoxProps {
  selectedLocation: { lat: number; lon: number; name: string } | null;
}

const SUGGESTED_QUESTIONS = [
  'Is it safe for seniors to go outside here?',
  'How is the air quality at this location?',
  'What are the main environmental risks?',
  'Is it safe for a morning walk?',
  'Should elderly people avoid this area today?',
  'What precautions should I take here?',
];

export default function MapChatBox({ selectedLocation }: MapChatBoxProps) {
  const [messages, setMessages] = useState<MapChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Clear messages when location changes
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
      // Build conversation history for non-repetitive answers
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
        content: 'Sorry, I encountered an error. Please try again.',
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

  // No location selected state
  if (!selectedLocation) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="text-center">
          <MapPin className="w-10 h-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-400">Select a location on the map to start asking questions</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-gradient-to-r from-green-50 to-emerald-50">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-green-600" />
          <div>
            <h3 className="text-sm font-semibold text-gray-800">AI Assistant</h3>
            <p className="text-xs text-gray-500 truncate max-w-[200px]">
              {selectedLocation.name || `${selectedLocation.lat.toFixed(3)}, ${selectedLocation.lon.toFixed(3)}`}
            </p>
          </div>
        </div>
        {messages.length > 0 && (
          <button
            onClick={handleReset}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear conversation"
          >
            <RotateCcw size={14} />
          </button>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-xs text-gray-500 text-center mb-3">
              Ask anything about environmental conditions at <strong>{selectedLocation.name || 'this location'}</strong>
            </p>
            <div className="space-y-2">
              {SUGGESTED_QUESTIONS.slice(0, 4).map((q, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(q)}
                  className="w-full text-left text-xs px-3 py-2.5 bg-gray-50 hover:bg-green-50 hover:text-green-700 border border-gray-100 hover:border-green-200 rounded-xl transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-green-600 text-white rounded-tr-md'
                    : 'bg-gray-100 text-gray-800 rounded-tl-md'
                }`}
              >
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5 prose-headings:my-1 prose-strong:text-gray-900">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  msg.content
                )}
              </div>
            </div>
          ))
        )}

        {/* Loading indicator */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-tl-md">
              <div className="flex gap-1.5">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t bg-white"
      >
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about this location..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent placeholder:text-gray-400"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-green-600 text-white rounded-xl hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </form>
    </div>
  );
}

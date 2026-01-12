'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Start conversation when widget opens for first time
  useEffect(() => {
    if (isOpen && messages.length === 0 && !conversationId) {
      startConversation();
    }
  }, [isOpen]);

  const startConversation = async () => {
    setIsLoading(true);
    try {
      // For now, use a temporary user ID
      // In production, this would be the authenticated user's ID
      const tempUserId = `guest_${Date.now()}`;

      const response = await fetch('/api/chat/annie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start',
          userId: tempUserId
        })
      });

      const data = await response.json();

      if (data.success) {
        setConversationId(data.conversationId);
        setMessages([{
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }]);
      } else {
        // Fallback greeting if API fails
        setMessages([{
          role: 'assistant',
          content: "Hi! I'm Annie, IntroAlignment's assistant. I can help answer questions about joining our legal network, podcast opportunities, or client referrals. How can I assist you today?",
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      // Fallback greeting
      setMessages([{
        role: 'assistant',
        content: "Hi! I'm Annie, IntroAlignment's assistant. I can help answer questions about joining our legal network, podcast opportunities, or client referrals. How can I assist you today?",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage = inputValue.trim();
    setInputValue('');

    // Add user message immediately
    const newUserMessage: Message = {
      role: 'user',
      content: userMessage,
      timestamp: new Date()
    };
    setMessages(prev => [...prev, newUserMessage]);

    setIsLoading(true);

    try {
      const response = await fetch('/api/chat/annie', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'continue',
          conversationId: conversationId || 'temp',
          message: userMessage
        })
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: data.message,
          timestamp: new Date()
        }]);
      } else {
        throw new Error('Failed to get response');
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: "I apologize, but I'm having trouble connecting right now. Please try again or email us at support@introalignment.com",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 bg-gold hover:bg-gold-light text-obsidian font-ui font-semibold px-6 py-4 rounded-full shadow-luxury transition-all flex items-center gap-2 hover:scale-105"
          aria-label="Open chat"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span>Chat with Annie</span>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)] bg-white rounded-lg shadow-luxury flex flex-col" style={{ height: '600px', maxHeight: 'calc(100vh-3rem)' }}>
          {/* Header */}
          <div className="bg-obsidian text-cream px-6 py-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gold rounded-full flex items-center justify-center text-obsidian font-heading font-bold text-lg">
                A
              </div>
              <div>
                <h3 className="font-heading text-lg font-bold">Annie</h3>
                <p className="font-ui text-xs text-pearl">IntroAlignment Assistant</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-cream hover:text-gold transition-colors"
              aria-label="Close chat"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 bg-cream">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] px-4 py-3 rounded-lg ${
                    message.role === 'user'
                      ? 'bg-gold text-obsidian ml-auto'
                      : 'bg-white text-charcoal border border-sage/20'
                  }`}
                >
                  <p className="font-body text-sm whitespace-pre-wrap">{message.content}</p>
                  <p className="font-ui text-xs mt-1 opacity-60">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-charcoal border border-sage/20 px-4 py-3 rounded-lg">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-charcoal rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-charcoal rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-charcoal rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <form onSubmit={sendMessage} className="p-4 border-t border-sage/20 bg-white rounded-b-lg">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask about partnerships, podcast, or referrals..."
                className="flex-1 px-4 py-3 border border-sage/30 rounded-lg font-body text-sm focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !inputValue.trim()}
                className="bg-gold hover:bg-gold-light text-obsidian px-6 py-3 rounded-lg font-ui font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </div>
            <p className="font-ui text-xs text-charcoal/60 mt-2">
              Powered by Annie • Estate Planning Network
            </p>
          </form>
        </div>
      )}
    </>
  );
}

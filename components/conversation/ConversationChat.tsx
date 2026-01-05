'use client';

import { useState, useEffect, useRef } from 'react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
}

interface ConversationChatProps {
  userId: string;
  onComplete?: () => void;
}

export default function ConversationChat({ userId, onComplete }: ConversationChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [totalQuestions, setTotalQuestions] = useState(49);
  const [currentChapter, setCurrentChapter] = useState(1);
  const [hasStarted, setHasStarted] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
  }, [userId]);

  async function loadConversationHistory() {
    try {
      const res = await fetch(`/api/conversation/history?userId=${userId}`);
      const data = await res.json();

      if (data.messages && data.messages.length > 0) {
        setMessages(data.messages);
        setHasStarted(true);

        // Get current status
        const statusRes = await fetch(`/api/conversation/status?userId=${userId}`);
        const status = await statusRes.json();

        setCurrentQuestion(status.currentQuestion);
        setTotalQuestions(status.totalQuestions);
        setCurrentChapter(status.currentChapter);
        setIsComplete(status.isComplete);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  }

  async function startConversation() {
    setIsLoading(true);

    try {
      const res = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'start'
        })
      });

      const data = await res.json();

      if (data.message) {
        setMessages([{
          id: Date.now().toString(),
          role: 'assistant',
          content: data.message,
          created_at: new Date().toISOString()
        }]);

        setHasStarted(true);
        setCurrentQuestion(data.currentQuestion);
        setTotalQuestions(data.totalQuestions);
        setCurrentChapter(data.currentChapter);
      }
    } catch (error) {
      console.error('Failed to start conversation:', error);
      alert('Failed to start conversation. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  async function sendMessage() {
    if (!input.trim() || isLoading || isComplete) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/conversation/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          message: input
        })
      });

      const data = await res.json();

      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.message,
        created_at: new Date().toISOString()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // Update progress
      setCurrentQuestion(data.currentQuestion);
      setCurrentChapter(data.currentChapter);

      if (data.isComplete) {
        setIsComplete(true);
        if (onComplete) {
          setTimeout(() => onComplete(), 2000);
        }
      }

    } catch (error) {
      console.error('Failed to send message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }

  function handleKeyPress(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  const progress = ((currentQuestion - 1) / totalQuestions) * 100;

  return (
    <div className="flex flex-col h-[600px] max-w-3xl mx-auto bg-white rounded-2xl shadow-lg overflow-hidden">
      {/* Header with Progress */}
      <div className="bg-gradient-to-r from-navy to-navy-dark text-white p-4">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold">IntroAlignment Conversation</h2>
          <span className="text-sm opacity-90">
            Question {currentQuestion} of {totalQuestions}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-white/30 rounded-full h-2 overflow-hidden">
          <div
            className="bg-white h-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {hasStarted && !isComplete && (
          <p className="text-sm mt-2 opacity-90">
            Chapter {currentChapter} of 7
          </p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {!hasStarted ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="text-2xl font-semibold text-gray-800">
              Ready to get to know you?
            </h3>
            <p className="text-gray-600 max-w-md">
              We'll have a natural conversation to understand who you are and what matters to you.
              No boring questionnaires - just genuine dialogue.
            </p>
            <button
              onClick={startConversation}
              disabled={isLoading}
              className="mt-4 bg-gradient-to-r from-gold to-gold-dark text-white px-8 py-3 rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-50"
            >
              {isLoading ? 'Starting...' : "Let's Begin"}
            </button>
          </div>
        ) : (
          <>
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-r from-gold to-gold-dark text-white'
                      : 'bg-blush text-navy'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-blush rounded-2xl px-4 py-3">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-gold rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Area */}
      {hasStarted && !isComplete && (
        <div className="border-t border-gray-200 p-4 bg-gray-50">
          <div className="flex space-x-2">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your response..."
              disabled={isLoading}
              rows={2}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2 focus:outline-none focus:ring-2 focus:ring-gold disabled:opacity-50 resize-none"
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="bg-gradient-to-r from-gold to-gold-dark text-white px-6 py-2 rounded-xl font-semibold hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed self-end"
            >
              Send
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Press Enter to send, Shift+Enter for new line
          </p>
        </div>
      )}

      {/* Completion State */}
      {isComplete && (
        <div className="border-t border-gray-200 p-6 bg-blush-light text-center">
          <div className="text-4xl mb-2">🎉</div>
          <p className="text-lg font-semibold text-gray-800">
            Conversation Complete!
          </p>
          <p className="text-sm text-gray-600 mt-1">
            We're using everything you shared to find your best matches.
          </p>
        </div>
      )}
    </div>
  );
}

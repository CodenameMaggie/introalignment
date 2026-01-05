'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

interface Message {
  id: string;
  content: string;
  sender_id: string;
  created_at: string;
  sender: {
    id: string;
    full_name: string;
  };
}

export default function MessagingPage() {
  const params = useParams();
  const router = useRouter();
  const matchId = params.matchId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    getCurrentUser();

    // Poll for new messages every 5 seconds
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [matchId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  async function getCurrentUser() {
    try {
      const res = await fetch('/api/auth/me'); // You may need to create this endpoint
      if (res.ok) {
        const data = await res.json();
        setCurrentUserId(data.user.id);
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }
  }

  async function fetchMessages() {
    try {
      const res = await fetch(`/api/messages?matchId=${matchId}`);
      if (!res.ok) {
        if (res.status === 403) {
          alert('Both users must be interested before you can message');
          router.push('/matches');
          return;
        }
        throw new Error('Failed to fetch messages');
      }
      const data = await res.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  async function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          matchId,
          content: newMessage.trim()
        })
      });

      if (!res.ok) throw new Error('Failed to send message');

      setNewMessage('');
      await fetchMessages(); // Refresh messages
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-navy/20 border-t-navy rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-cream">
      {/* Header */}
      <div className="bg-white border-b border-navy/10 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/matches" className="text-gold hover:text-gold-dark">
              ←
            </Link>
            <div>
              <h1 className="font-serif text-xl text-navy">
                {messages[0]?.sender?.full_name?.split(' ')[0] || 'Messages'}
              </h1>
              <p className="text-sm text-gray-500">Your match</p>
            </div>
          </div>
          <Link
            href={`/matches/${matchId}`}
            className="text-sm text-gold hover:text-gold-dark"
          >
            View match details
          </Link>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="font-serif text-2xl text-navy mb-2">Start the conversation</p>
              <p className="text-gray-600">
                Say hello and get to know each other!
              </p>
            </div>
          ) : (
            messages.map((message) => {
              const isMe = message.sender_id === currentUserId;
              return (
                <div
                  key={message.id}
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-md px-6 py-3 rounded-2xl ${
                      isMe
                        ? 'bg-gradient-to-r from-gold to-gold-dark text-white'
                        : 'bg-blush text-navy'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className={`text-xs mt-2 ${isMe ? 'text-white/70' : 'text-gray-500'}`}>
                      {new Date(message.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Message Input */}
      <div className="bg-white border-t border-navy/10 px-6 py-4">
        <div className="max-w-4xl mx-auto">
          <form onSubmit={sendMessage} className="flex gap-4">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-6 py-3 bg-cream rounded-full border-0 focus:ring-2 focus:ring-gold outline-none"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="px-8 py-3 bg-gold text-white rounded-full font-semibold hover:bg-gold-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? 'Sending...' : 'Send'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

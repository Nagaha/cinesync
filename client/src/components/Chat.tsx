import React, { useState, useRef, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import type { ChatMessage, Participant } from '../types';

interface ChatProps {
  messages: ChatMessage[];
  currentUserId: string | null;
  onSendMessage: (content: string) => void;
  participants: Participant[];
}

export default function Chat({ messages, currentUserId, onSendMessage, participants }: ChatProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showParticipants, setShowParticipants] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getParticipantUsername = (userId: string): string => {
    if (userId === 'system') return 'System';
    const participant = participants.find(p => p.id === userId);
    return participant?.username || 'Unknown';
  };

  return (
    <div className="flex flex-col h-full bg-dark-800">
      <div className="p-4 border-b border-white/5 flex items-center justify-between">
        <h2 className="font-semibold">Chat</h2>
        <button
          onClick={() => setShowParticipants(!showParticipants)}
          className={`text-sm px-3 py-1 rounded-full transition-colors ${
            showParticipants
              ? 'bg-accent-primary text-white'
              : 'bg-dark-700 text-gray-400 hover:text-white'
          }`}
        >
          {showParticipants ? 'Chat' : `${participants.length} Users`}
        </button>
      </div>

      {showParticipants ? (
        <div className="flex-1 overflow-auto p-4">
          <div className="space-y-2">
            {participants.map((participant) => (
              <div
                key={participant.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors"
              >
                <div className="w-8 h-8 bg-dark-600 rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">
                    {participant.username}
                    {participant.id === currentUserId && (
                      <span className="text-gray-500 ml-1">(You)</span>
                    )}
                  </p>
                  {participant.isHost && (
                    <span className="text-xs text-accent-primary">Host</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {participant.isMuted ? (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Muted" />
                  ) : (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Unmuted" />
                  )}
                  {participant.isCameraOff ? (
                    <div className="w-2 h-2 bg-red-500 rounded-full" title="Camera Off" />
                  ) : (
                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Camera On" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                <p className="text-sm">No messages yet</p>
                <p className="text-xs mt-1">Start the conversation!</p>
              </div>
            ) : (
              messages.map((message) => {
                const isOwn = message.userId === currentUserId;
                const isSystem = message.type === 'join' || message.type === 'leave' || message.userId === 'system';

                if (isSystem) {
                  return (
                    <div key={message.id} className="text-center py-2">
                      <span className="text-xs text-gray-500 italic">
                        {message.content}
                      </span>
                    </div>
                  );
                }

                return (
                  <div
                    key={message.id}
                    className={`flex flex-col ${isOwn ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-center gap-2 mb-1 ${isOwn ? 'flex-row-reverse' : ''}`}>
                      <span className="text-xs font-medium text-gray-400">
                        {message.username}
                      </span>
                      <span className="text-xs text-gray-600">
                        {formatTime(message.timestamp)}
                      </span>
                    </div>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        isOwn
                          ? 'bg-accent-primary text-white rounded-br-md'
                          : 'bg-dark-700 text-white rounded-bl-md'
                      }`}
                    >
                      {message.content}
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSubmit} className="p-4 border-t border-white/5">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 px-4 py-2 bg-dark-700 border border-white/10 rounded-full text-sm focus:outline-none focus:border-accent-primary"
                maxLength={500}
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2 bg-accent-primary hover:bg-accent-hover rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5 text-white" />
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
}

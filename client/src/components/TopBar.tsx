import React, { useState } from 'react';
import { Copy, LogOut, Users, Wifi, WifiOff } from 'lucide-react';
import { copyToClipboard } from '../utils/helpers';
import type { Participant } from '../types';

interface TopBarProps {
  roomId: string;
  isConnected: boolean;
  onLeave: () => void;
  isHost: boolean;
  participants: Participant[];
}

export default function TopBar({ roomId, isConnected, onLeave, isHost, participants }: TopBarProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await copyToClipboard(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = async () => {
    const link = `${window.location.origin}/room/${roomId}`;
    await copyToClipboard(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <header className="bg-dark-800 border-b border-white/5 px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 gradient-primary rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            </div>
            <span className="font-bold text-lg gradient-text">CineSync</span>
          </div>

          <div className="h-6 w-px bg-white/10" />

          <div className="flex items-center gap-2">
            <span className="text-gray-400 text-sm">Room:</span>
            <code className="bg-dark-700 px-3 py-1 rounded-lg font-mono font-bold text-lg text-white">
              {roomId}
            </code>
            <button
              onClick={handleCopy}
              className="btn-ghost"
              title="Copy room code"
            >
              <Copy className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="btn-ghost"
              title="Copy invite link"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </button>
          </div>

          {copied && (
            <span className="text-green-400 text-sm animate-fade-in">Copied!</span>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="w-4 h-4" />
            <span>{participants.length}</span>
          </div>

          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isConnected 
              ? 'bg-green-500/10 text-green-400' 
              : 'bg-red-500/10 text-red-400'
          }`}>
            {isConnected ? (
              <>
                <Wifi className="w-4 h-4" />
                <span>Connected</span>
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                <span>Disconnected</span>
              </>
            )}
          </div>

          <button onClick={onLeave} className="btn-ghost text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut className="w-4 h-4 mr-2" />
            Leave
          </button>
        </div>
      </div>
    </header>
  );
}

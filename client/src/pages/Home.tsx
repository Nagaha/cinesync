import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Play, Users, Video, ArrowRight, Copy, Sparkles } from 'lucide-react';
import axios from 'axios';

export default function Home() {
  const navigate = useNavigate();
  const [roomCode, setRoomCode] = useState('');
  const [username, setUsername] = useState('');
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [actionType, setActionType] = useState<'create' | 'join'>('create');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateRoom = async () => {
    if (!username.trim()) {
      setShowUsernameModal(true);
      setActionType('create');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await axios.post('/api/room/create', { username: username.trim() });
      navigate(`/room/${response.data.roomId}`, { 
        state: { username: username.trim(), isCreating: true } 
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!username.trim()) {
      setShowUsernameModal(true);
      setActionType('join');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await axios.post('/api/room/join', { 
        roomId: roomCode.trim().toUpperCase(),
        username: username.trim()
      });
      navigate(`/room/${roomCode.trim().toUpperCase()}`, { 
        state: { username: username.trim(), isCreating: false } 
      });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to join room');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUsernameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      setShowUsernameModal(false);
      if (actionType === 'create') {
        handleCreateRoom();
      } else {
        handleJoinRoom();
      }
    }
  };

  return (
    <div className="h-screen bg-dark-900 flex items-center justify-center p-4 relative overflow-auto">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-accent-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent-secondary/10 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-2xl">
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center shadow-lg shadow-accent-primary/30 animate-glow">
              <Play className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-6xl font-extrabold mb-4 gradient-text">CineSync</h1>
          <p className="text-xl text-gray-400">Watch videos together with friends in real-time</p>
        </div>

        <div className="card-glass p-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActionType('create')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                actionType === 'create'
                  ? 'gradient-primary text-white shadow-lg'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              Create Room
            </button>
            <button
              onClick={() => setActionType('join')}
              className={`flex-1 flex items-center justify-center gap-2 py-4 px-6 rounded-xl font-semibold transition-all duration-200 ${
                actionType === 'join'
                  ? 'gradient-primary text-white shadow-lg'
                  : 'bg-dark-700 text-gray-300 hover:bg-dark-600'
              }`}
            >
              <Users className="w-5 h-5" />
              Join Room
            </button>
          </div>

          {actionType === 'join' && (
            <div className="mb-6 animate-fade-in">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Room Code
              </label>
              <input
                type="text"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                className="input-field text-center text-2xl tracking-widest font-mono"
                maxLength={6}
              />
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm animate-fade-in">
              {error}
            </div>
          )}

          <button
            onClick={actionType === 'create' ? handleCreateRoom : handleJoinRoom}
            disabled={isLoading}
            className="btn-primary w-full text-lg py-4 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                {actionType === 'create' ? 'Create Your Watch Party' : 'Join the Party'}
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>

          <div className="mt-8 pt-6 border-t border-white/5">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Video className="w-4 h-4" />
                <span>YouTube & Local Videos</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4" />
                <span>Sync Playback</span>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-gray-600 mt-6 text-sm animate-fade-in" style={{ animationDelay: '0.2s' }}>
          No account needed. Just pick a name and start watching.
        </p>
      </div>

      {showUsernameModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="card-glass p-8 w-full max-w-md mx-4">
            <h2 className="text-2xl font-bold mb-2">What's your name?</h2>
            <p className="text-gray-400 mb-6">This will be shown to other viewers in the room.</p>
            <form onSubmit={handleUsernameSubmit}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your display name"
                className="input-field mb-4"
                maxLength={20}
                autoFocus
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowUsernameModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!username.trim()}
                  className="btn-primary flex-1"
                >
                  Continue
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

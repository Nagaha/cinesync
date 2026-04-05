import React, { useState, useCallback, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import TopBar from '../components/TopBar';
import VideoPlayer from '../components/VideoPlayer';
import CameraGrid from '../components/CameraGrid';
import Chat from '../components/Chat';
import ControlBar from '../components/ControlBar';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';
import type { Participant, ChatMessage, Room, VideoState } from '../types';

export default function Room() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const username = location.state?.username as string;

  const [room, setRoom] = useState<Room | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [videoState, setVideoState] = useState<VideoState>({
    url: null,
    type: null,
    currentTime: 0,
    isPlaying: false,
    hostTimestamp: Date.now(),
  });
  const [isHost, setIsHost] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showVideoInput, setShowVideoInput] = useState(false);
  const [localIsMuted, setLocalIsMuted] = useState(true);
  const [localIsCameraOff, setLocalIsCameraOff] = useState(true);

  const {
    isConnected: socketConnected,
    currentUserId: socketUserId,
    emitVideoSync,
    emitChatMessage,
    emitToggleMic,
    emitToggleCamera,
    emitOffer,
    emitAnswer,
    emitIceCandidate,
  } = useSocket({
    roomId: roomId || null,
    username,
    onRoomJoined: useCallback((data) => {
      setRoom(data.room);
      setParticipants(data.participants);
      setMessages(data.messages);
      if (data.room.videoState.url) {
        setVideoState(data.room.videoState);
      }
    }, []),
    onUserJoined: useCallback((participant) => {
      setParticipants(prev => {
        if (prev.some(p => p.id === participant.id)) return prev;
        return [...prev, participant];
      });
    }, []),
    onUserLeft: useCallback((data) => {
      setParticipants(prev => prev.filter(p => p.id !== data.userId));
    }, []),
    onVideoSync: useCallback((state) => {
      setVideoState(state);
    }, []),
    onChatMessage: useCallback((message) => {
      setMessages(prev => [...prev, message]);
    }, []),
    onParticipantsUpdate: useCallback((newParticipants) => {
      setParticipants(newParticipants);
    }, []),
    onToggleMic: useCallback((data) => {
      setParticipants(prev =>
        prev.map(p => p.id === data.userId ? { ...p, isMuted: data.isMuted } : p)
      );
    }, []),
    onToggleCamera: useCallback((data) => {
      setParticipants(prev =>
        prev.map(p => p.id === data.userId ? { ...p, isCameraOff: data.isCameraOff } : p)
      );
    }, []),
    onOffer: useCallback(() => {}, []),
    onAnswer: useCallback(() => {}, []),
    onIceCandidate: useCallback(() => {}, []),
  });

  const {
    localStream,
    streams,
    toggleMic,
    toggleCamera,
  } = useWebRTC({
    currentUserId,
    onOffer: emitOffer,
    onAnswer: emitAnswer,
    onIceCandidate: emitIceCandidate,
    participants,
  });

  useEffect(() => {
    if (socketUserId) {
      setCurrentUserId(socketUserId);
    }
  }, [socketUserId]);

  useEffect(() => {
    setIsConnected(socketConnected);
  }, [socketConnected]);

  useEffect(() => {
    if (room && currentUserId) {
      setIsHost(currentUserId === room.hostId);
    }
  }, [room, currentUserId]);

  const handleVideoSync = useCallback((state: VideoState) => {
    setVideoState(state);
    emitVideoSync(state);
  }, [emitVideoSync]);

  const handleSendMessage = useCallback((content: string) => {
    emitChatMessage(content);
  }, [emitChatMessage]);

  const handleToggleMic = useCallback(() => {
    toggleMic();
    emitToggleMic(!localIsMuted);
    setLocalIsMuted(prev => !prev);
  }, [toggleMic, emitToggleMic, localIsMuted]);

  const handleToggleCamera = useCallback(() => {
    toggleCamera();
    emitToggleCamera(!localIsCameraOff);
    setLocalIsCameraOff(prev => !prev);
  }, [toggleCamera, emitToggleCamera, localIsCameraOff]);

  const handleSetVideoUrl = useCallback((url: string, type: 'youtube' | 'local') => {
    const newState: VideoState = {
      url,
      type,
      currentTime: 0,
      isPlaying: false,
      hostTimestamp: Date.now(),
    };
    setVideoState(newState);
    if (isHost) {
      emitVideoSync(newState);
    }
    setShowVideoInput(false);
  }, [isHost, emitVideoSync]);

  const handleLeave = useCallback(() => {
    navigate('/');
  }, [navigate]);

  useEffect(() => {
    if (!username || !roomId) {
      navigate('/');
    }
  }, [username, roomId, navigate]);

  if (!roomId || !username) {
    return (
      <div className="min-h-screen bg-dark-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-dark-900 flex flex-col overflow-hidden">
      <TopBar
        roomId={roomId}
        isConnected={isConnected}
        onLeave={handleLeave}
        isHost={isHost}
        participants={participants}
      />

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col p-4 gap-4 overflow-auto">
          <VideoPlayer
            videoState={videoState}
            onVideoSync={handleVideoSync}
            isHost={isHost}
            onSetVideoUrl={() => setShowVideoInput(true)}
          />

          <CameraGrid
            localStream={localStream}
            streams={streams}
            participants={participants}
            currentUserId={currentUserId}
            isMuted={localIsMuted}
            isCameraOff={localIsCameraOff}
          />
        </div>

        <div className="w-80 border-l border-white/5 flex-shrink-0">
          <Chat
            messages={messages}
            currentUserId={currentUserId}
            onSendMessage={handleSendMessage}
            participants={participants}
          />
        </div>
      </div>

      <ControlBar
        isMuted={localIsMuted}
        isCameraOff={localIsCameraOff}
        onToggleMic={handleToggleMic}
        onToggleCamera={handleToggleCamera}
        onLeave={handleLeave}
      />

      {showVideoInput && (
        <VideoInputModal
          onClose={() => setShowVideoInput(false)}
          onSubmit={handleSetVideoUrl}
        />
      )}
    </div>
  );
}

function VideoInputModal({ onClose, onSubmit }: { onClose: () => void; onSubmit: (url: string, type: 'youtube' | 'local') => void }) {
  const [url, setUrl] = useState('');

  const isYouTube = url.includes('youtube.com') || url.includes('youtu.be');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onSubmit(url.trim(), isYouTube ? 'youtube' : 'local');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="card-glass p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Add Video</h2>
          <button onClick={onClose} className="btn-ghost">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Video URL
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste YouTube URL or video link..."
              className="input-field"
              autoFocus
            />
            {url && (
              <div className={`mt-2 flex items-center gap-2 text-xs ${isYouTube ? 'text-red-400' : 'text-green-400'}`}>
                <span>{isYouTube ? 'YouTube video detected' : 'Direct video link'}</span>
              </div>
            )}
            <p className="text-xs text-gray-500 mt-3">
              Supported: YouTube URLs, .mp4, .webm, .mov video links
            </p>
          </div>

          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button type="submit" disabled={!url.trim()} className="btn-primary flex-1">
              Play Video
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

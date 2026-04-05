import React from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface ControlBarProps {
  isMuted: boolean;
  isCameraOff: boolean;
  onToggleMic: () => void;
  onToggleCamera: () => void;
  onLeave: () => void;
}

export default function ControlBar({
  isMuted,
  isCameraOff,
  onToggleMic,
  onToggleCamera,
  onLeave,
}: ControlBarProps) {
  return (
    <footer className="bg-dark-800 border-t border-white/5 px-4 py-3">
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={onToggleMic}
          className={`p-4 rounded-full transition-all duration-200 ${
            isMuted
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-dark-600 text-white hover:bg-dark-500'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          {isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>

        <button
          onClick={onToggleCamera}
          className={`p-4 rounded-full transition-all duration-200 ${
            isCameraOff
              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
              : 'bg-dark-600 text-white hover:bg-dark-500'
          }`}
          title={isCameraOff ? 'Turn on camera' : 'Turn off camera'}
        >
          {isCameraOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
        </button>

        <div className="w-px h-8 bg-white/10 mx-2" />

        <button
          onClick={onLeave}
          className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-colors"
          title="Leave room"
        >
          <PhoneOff className="w-6 h-6" />
        </button>
      </div>
    </footer>
  );
}

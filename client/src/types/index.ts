export interface Participant {
  id: string;
  username: string;
  socketId: string;
  isHost: boolean;
  isMuted: boolean;
  isCameraOff: boolean;
  joinedAt: Date;
}

export interface VideoState {
  url: string | null;
  type: 'youtube' | 'local' | null;
  currentTime: number;
  isPlaying: boolean;
  hostTimestamp: number;
}

export interface ChatMessage {
  id: string;
  roomId: string;
  userId: string;
  username: string;
  content: string;
  timestamp: Date;
  type: 'message' | 'join' | 'leave';
}

export interface Room {
  id: string;
  hostId: string;
  videoState: VideoState;
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  roomId: string;
  isHost: boolean;
}

export interface StreamInfo {
  participantId: string;
  stream: MediaStream;
  username: string;
}

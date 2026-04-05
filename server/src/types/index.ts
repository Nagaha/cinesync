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

export interface Room {
  id: string;
  hostId: string;
  participants: Map<string, Participant>;
  videoState: VideoState;
  createdAt: Date;
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

export interface ServerToClientEvents {
  'room-created': (data: { roomId: string }) => void;
  'room-joined': (data: { room: RoomData; participants: Participant[]; messages: ChatMessage[] }) => void;
  'room-error': (data: { message: string }) => void;
  'user-joined': (data: { participant: Participant }) => void;
  'user-left': (data: { userId: string; username: string }) => void;
  'video-sync': (data: VideoState) => void;
  'chat-message': (data: ChatMessage) => void;
  'participants-update': (data: Participant[]) => void;
  'offer': (data: { from: string; to: string; offer: RTCSessionDescriptionInit }) => void;
  'answer': (data: { from: string; to: string; answer: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { from: string; to: string; candidate: RTCIceCandidateInit }) => void;
  'user-toggled-mic': (data: { userId: string; isMuted: boolean }) => void;
  'user-toggled-camera': (data: { userId: string; isCameraOff: boolean }) => void;
}

export interface ClientToServerEvents {
  'create-room': (data: { username: string }, callback: (response: RoomCreatedResponse) => void) => void;
  'join-room': (data: { roomId: string; username: string }, callback: (response: RoomJoinedResponse) => void) => void;
  'leave-room': (data: { roomId: string }) => void;
  'video-sync': (data: { roomId: string; videoState: VideoState }) => void;
  'chat-message': (data: { roomId: string; content: string }) => void;
  'offer': (data: { to: string; offer: RTCSessionDescriptionInit }) => void;
  'answer': (data: { to: string; answer: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { to: string; candidate: RTCIceCandidateInit }) => void;
  'toggle-mic': (data: { roomId: string; isMuted: boolean }) => void;
  'toggle-camera': (data: { roomId: string; isCameraOff: boolean }) => void;
}

export interface RoomData {
  id: string;
  hostId: string;
  videoState: VideoState;
  createdAt: Date;
}

export interface RoomCreatedResponse {
  success: boolean;
  roomId?: string;
  error?: string;
}

export interface RoomJoinedResponse {
  success: boolean;
  room?: RoomData;
  participants?: Participant[];
  messages?: ChatMessage[];
  error?: string;
}

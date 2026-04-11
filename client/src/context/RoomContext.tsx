import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import type { Participant, ChatMessage, Room, VideoState, StreamInfo } from '../types';
import { useSocket } from '../hooks/useSocket';
import { useWebRTC } from '../hooks/useWebRTC';

interface RoomContextType {
  room: Room | null;
  participants: Participant[];
  messages: ChatMessage[];
  streams: Map<string, StreamInfo>;
  localStream: MediaStream | null;
  isMuted: boolean;
  isCameraOff: boolean;
  isHost: boolean;
  isConnected: boolean;
  currentUserId: string | null;
  videoState: VideoState;
  
  setVideoUrl: (url: string | null, type: 'youtube' | 'local') => void;
  syncVideo: (videoState: VideoState) => void;
  sendMessage: (content: string) => void;
  toggleMic: () => void;
  toggleCamera: () => void;
  leaveRoom: () => void;
}

const RoomContext = createContext<RoomContextType | null>(null);

export function RoomProvider({ 
  roomId, 
  username, 
  onLeave 
}: { 
  roomId: string; 
  username: string; 
  onLeave: () => void;
}) {
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

  const handleRoomJoined = useCallback((data: { room: Room; participants: Participant[]; messages: ChatMessage[] }) => {
    setRoom(data.room);
    setParticipants(data.participants);
    setMessages(data.messages);
    if (data.room.videoState.url) {
      setVideoState(data.room.videoState);
    }
  }, []);

  const handleUserJoined = useCallback((participant: Participant) => {
    setParticipants((prev) => [...prev, participant]);
  }, []);

  const handleUserLeft = useCallback((data: { userId: string; username: string }) => {
    setParticipants((prev) => prev.filter((p) => p.id !== data.userId));
  }, []);

  const handleVideoSync = useCallback((state: VideoState) => {
    setVideoState(state);
  }, []);

  const handleChatMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  const handleParticipantsUpdate = useCallback((newParticipants: Participant[]) => {
    setParticipants(newParticipants);
  }, []);

  const handleRemoteToggleMic = useCallback((data: { userId: string; isMuted: boolean }) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === data.userId ? { ...p, isMuted: data.isMuted } : p))
    );
  }, []);

  const handleRemoteToggleCamera = useCallback((data: { userId: string; isCameraOff: boolean }) => {
    setParticipants((prev) =>
      prev.map((p) => (p.id === data.userId ? { ...p, isCameraOff: data.isCameraOff } : p))
    );
  }, []);

  const {
    isConnected,
    currentUserId,
    emitVideoSync,
    emitChatMessage,
    emitToggleMic,
    emitToggleCamera,
  } = useSocket({
    roomId,
    username,
    onRoomJoined: handleRoomJoined,
    onUserJoined: handleUserJoined,
    onUserLeft: handleUserLeft,
    onVideoSync: handleVideoSync,
    onChatMessage: handleChatMessage,
    onParticipantsUpdate: handleParticipantsUpdate,
    onToggleMic: handleRemoteToggleMic,
    onToggleCamera: handleRemoteToggleCamera,
  });

  const handleOffer = useCallback((to: string, offer: RTCSessionDescriptionInit) => {
    // Handled in useWebRTC
  }, []);

  const handleAnswer = useCallback((to: string, answer: RTCSessionDescriptionInit) => {
    // Handled in useWebRTC
  }, []);

  const handleIceCandidate = useCallback((to: string, candidate: RTCIceCandidateInit) => {
    // Handled in useWebRTC
  }, []);

  const { 
    localStream, 
    streams, 
    isMuted, 
    isCameraOff,
    toggleMic: webRCTToggleMic,
    toggleCamera: webRCTToggleCamera,
  } = useWebRTC({
    currentUserId,
    onOffer: handleOffer,
    onAnswer: handleAnswer,
    onIceCandidate: handleIceCandidate,
    participants,
  });

  const isHost = currentUserId === room?.hostId;

  const setVideoUrl = useCallback((url: string | null, type: 'youtube' | 'local') => {
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
  }, [isHost, emitVideoSync]);

  const syncVideo = useCallback((state: VideoState) => {
    emitVideoSync(state);
  }, [emitVideoSync]);

  const sendMessage = useCallback((content: string) => {
    emitChatMessage(content);
  }, [emitChatMessage]);

  const handleToggleMic = useCallback(() => {
    webRCTToggleMic();
    emitToggleMic(!isMuted);
  }, [webRCTToggleMic, emitToggleMic, isMuted]);

  const handleToggleCamera = useCallback(() => {
    webRCTToggleCamera();
    emitToggleCamera(!isCameraOff);
  }, [webRCTToggleCamera, emitToggleCamera, isCameraOff]);

  const leaveRoom = useCallback(() => {
    onLeave();
  }, [onLeave]);

  return (
    <RoomContext.Provider
      value={{
        room,
        participants,
        messages,
        streams,
        localStream,
        isMuted,
        isCameraOff,
        isHost,
        isConnected,
        currentUserId,
        videoState,
        setVideoUrl,
        syncVideo,
        sendMessage,
        toggleMic: handleToggleMic,
        toggleCamera: handleToggleCamera,
        leaveRoom,
      }}
    >
      {null}
    </RoomContext.Provider>
  );
}

export function useRoom() {
  const context = useContext(RoomContext);
  if (!context) {
    throw new Error('useRoom must be used within a RoomProvider');
  }
  return context;
}

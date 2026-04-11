import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import type { Participant, ChatMessage, Room, VideoState } from '../types';

interface UseSocketProps {
  roomId: string | null;
  username: string | null;
  onRoomJoined?: (data: { room: Room; participants: Participant[]; messages: ChatMessage[] }) => void;
  onUserJoined?: (participant: Participant) => void;
  onUserLeft?: (data: { userId: string; username: string }) => void;
  onVideoSync?: (videoState: VideoState) => void;
  onChatMessage?: (message: ChatMessage) => void;
  onParticipantsUpdate?: (participants: Participant[]) => void;
  onOffer?: (data: { from: string; to: string; offer: RTCSessionDescriptionInit }) => void;
  onAnswer?: (data: { from: string; to: string; answer: RTCSessionDescriptionInit }) => void;
  onIceCandidate?: (data: { from: string; to: string; candidate: RTCIceCandidateInit }) => void;
  onToggleMic?: (data: { userId: string; isMuted: boolean }) => void;
  onToggleCamera?: (data: { userId: string; isCameraOff: boolean }) => void;
}

export function useSocket({
  roomId,
  username,
  onRoomJoined,
  onUserJoined,
  onUserLeft,
  onVideoSync,
  onChatMessage,
  onParticipantsUpdate,
  onOffer,
  onAnswer,
  onIceCandidate,
  onToggleMic,
  onToggleCamera,
}: UseSocketProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const currentUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!roomId || !username) return;

    const socket: Socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setIsConnected(true);
      socket.emit('join-room', { roomId, username }, (response: any) => {
        if (response.success) {
          const userId = response.participants?.find((p: any) => p.socketId === socket.id)?.id || null;
          setCurrentUserId(userId);
          currentUserIdRef.current = userId;
          onRoomJoined?.(response);
        }
      });
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socket.on('user-joined', (data) => onUserJoined?.(data.participant));
    socket.on('user-left', (data) => onUserLeft?.(data));
    socket.on('video-sync', (data) => onVideoSync?.(data));
    socket.on('chat-message', (data) => onChatMessage?.(data));
    socket.on('participants-update', (data) => onParticipantsUpdate?.(data));
    socket.on('offer', (data) => onOffer?.(data));
    socket.on('answer', (data) => onAnswer?.(data));
    socket.on('ice-candidate', (data) => onIceCandidate?.(data));
    socket.on('user-toggled-mic', (data) => onToggleMic?.(data));
    socket.on('user-toggled-camera', (data) => onToggleCamera?.(data));

    return () => {
      socket.emit('leave-room', { roomId });
      socket.disconnect();
      socketRef.current = null;
    };
  }, [roomId, username]);

  const emitVideoSync = useCallback((videoState: VideoState) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('video-sync', { roomId, videoState });
    }
  }, [roomId]);

  const emitChatMessage = useCallback((content: string) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('chat-message', { roomId, content });
    }
  }, [roomId]);

  const emitOffer = useCallback((to: string, offer: RTCSessionDescriptionInit) => {
    if (socketRef.current) {
      console.log('[Socket] Emitting offer to:', to);
      socketRef.current.emit('offer', { to, offer });
    }
  }, []);

  const emitAnswer = useCallback((to: string, answer: RTCSessionDescriptionInit) => {
    if (socketRef.current) {
      console.log('[Socket] Emitting answer to:', to);
      socketRef.current.emit('answer', { to, answer });
    }
  }, []);

  const emitIceCandidate = useCallback((to: string, candidate: RTCIceCandidateInit) => {
    if (socketRef.current) {
      console.log('[Socket] Emitting ICE to:', to);
      socketRef.current.emit('ice-candidate', { to, candidate });
    }
  }, []);

  const emitToggleMic = useCallback((isMuted: boolean) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('toggle-mic', { roomId, isMuted });
    }
  }, [roomId]);

  const emitToggleCamera = useCallback((isCameraOff: boolean) => {
    if (socketRef.current && roomId) {
      socketRef.current.emit('toggle-camera', { roomId, isCameraOff });
    }
  }, [roomId]);

  return {
    socket: socketRef.current,
    isConnected,
    currentUserId,
    emitVideoSync,
    emitChatMessage,
    emitOffer,
    emitAnswer,
    emitIceCandidate,
    emitToggleMic,
    emitToggleCamera,
  };
}

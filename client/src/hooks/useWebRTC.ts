import { useEffect, useRef, useState, useCallback } from 'react';
import type { StreamInfo } from '../types';

interface UseWebRTCProps {
  currentUserId: string | null;
  onOffer: (to: string, offer: RTCSessionDescriptionInit) => void;
  onAnswer: (to: string, answer: RTCSessionDescriptionInit) => void;
  onIceCandidate: (to: string, candidate: RTCIceCandidateInit) => void;
  participants: Array<{ id: string; username: string }>;
}

const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
];

export function useWebRTC({
  currentUserId,
  onOffer,
  onAnswer,
  onIceCandidate,
  participants,
}: UseWebRTCProps) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [streams, setStreams] = useState<Map<string, StreamInfo>>(new Map());
  const [isMuted, setIsMuted] = useState(true);
  const [isCameraOff, setIsCameraOff] = useState(true);
  const [isInitializing, setIsInitializing] = useState(false);
  const [streamReady, setStreamReady] = useState(false);

  const peerConnections = useRef<Map<string, RTCPeerConnection>>(new Map());
  const sentOffers = useRef<Set<string>>(new Set());
  const pendingOffers = useRef<Map<string, RTCSessionDescriptionInit>>(new Map());

  const initializeLocalStream = useCallback(async () => {
    if (localStream) return localStream;
    
    try {
      setIsInitializing(true);
      console.log('Requesting camera and microphone permissions...');
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
        },
      });
      
      console.log('Media stream obtained:', stream);
      setLocalStream(stream);
      setStreamReady(true);
      
      stream.getAudioTracks().forEach((track) => {
        track.enabled = false;
      });
      stream.getVideoTracks().forEach((track) => {
        track.enabled = false;
      });
      
      return stream;
    } catch (error) {
      console.error('Failed to get local stream:', error);
      alert('Could not access camera/microphone. Please allow permissions and try again.');
      return null;
    } finally {
      setIsInitializing(false);
    }
  }, [localStream]);

  const addTracksToPeerConnection = useCallback((pc: RTCPeerConnection, stream: MediaStream) => {
    stream.getTracks().forEach((track) => {
      pc.addTrack(track, stream);
    });
  }, []);

  const createPeerConnection = useCallback((peerId: string, username: string): RTCPeerConnection => {
    const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    pc.onicecandidate = (event) => {
      if (event.candidate && currentUserId) {
        onIceCandidate(peerId, event.candidate.toJSON());
      }
    };

    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (stream) {
        console.log('Received remote stream from:', peerId);
        setStreams((prev) => {
          const updated = new Map(prev);
          updated.set(peerId, { participantId: peerId, stream, username });
          return updated;
        });
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log(`ICE connection state with ${peerId}:`, pc.iceConnectionState);
      if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
        pc.close();
        peerConnections.current.delete(peerId);
        setStreams((prev) => {
          const updated = new Map(prev);
          updated.delete(peerId);
          return updated;
        });
      }
    };

    if (localStream) {
      addTracksToPeerConnection(pc, localStream);
    }

    return pc;
  }, [currentUserId, onIceCandidate, localStream, addTracksToPeerConnection]);

  const connectToPeer = useCallback(async (peerId: string, username: string) => {
    if (peerConnections.current.has(peerId)) return;
    if (sentOffers.current.has(peerId)) return;

    console.log('[WebRTC] Creating peer connection for:', peerId);
    const pc = createPeerConnection(peerId, username);
    peerConnections.current.set(peerId, pc);
    sentOffers.current.add(peerId);

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Sending offer to:', peerId);
      onOffer(peerId, offer);
    } catch (error) {
      console.error('[WebRTC] Error creating offer:', error);
    }
  }, [createPeerConnection, onOffer]);

  const handleOffer = useCallback(async (from: string, offer: RTCSessionDescriptionInit) => {
    console.log('[WebRTC] Received offer from:', from);
    if (!currentUserId) return;

    let stream = localStream;
    if (!stream) {
      try {
        stream = await initializeLocalStream();
      } catch (e) {
        console.log('[WebRTC] Could not get local stream, proceeding without it');
      }
    }

    let pc = peerConnections.current.get(from);
    if (!pc) {
      pc = createPeerConnection(from, participants.find(p => p.id === from)?.username || 'Unknown');
      peerConnections.current.set(from, pc);
    }

    const state = pc.signalingState;
    console.log('[WebRTC] Offer received, current state:', state);
    
    if (state !== 'stable') {
      console.log('[WebRTC] Wrong state for offer:', state);
      return;
    }

    try {
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Remote description set, creating answer');
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[WebRTC] Sending answer to:', from);
      onAnswer(from, answer);
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error);
    }
  }, [currentUserId, localStream, initializeLocalStream, createPeerConnection, participants, onAnswer]);

  const handleAnswer = useCallback(async (from: string, answer: RTCSessionDescriptionInit) => {
    console.log('[WebRTC] Received answer from:', from);
    const pc = peerConnections.current.get(from);
    if (!pc) {
      console.log('[WebRTC] No peer connection found for:', from);
      return;
    }
    const state = pc.signalingState;
    console.log('[WebRTC] Peer connection state before answer:', state);
    if (state !== 'have-local-offer') {
      console.log('[WebRTC] Skipping answer, wrong state:', state);
      return;
    }
    try {
      await pc.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Answer set successfully');
    } catch (error) {
      console.error('[WebRTC] Error handling answer:', error);
    }
  }, []);

  const handleIceCandidate = useCallback(async (from: string, candidate: RTCIceCandidateInit) => {
    const pc = peerConnections.current.get(from);
    if (pc && candidate) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (error) {
        console.error('Error adding ICE candidate:', error);
      }
    }
  }, []);

  const toggleMic = useCallback(async () => {
    let stream = localStream;
    if (!stream) {
      stream = await initializeLocalStream();
    }
    
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log('Microphone:', audioTrack.enabled ? 'enabled' : 'disabled');
      }
    }
  }, [localStream, initializeLocalStream]);

  const toggleCamera = useCallback(async () => {
    let stream = localStream;
    if (!stream) {
      stream = await initializeLocalStream();
    }
    
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
        console.log('Camera:', videoTrack.enabled ? 'enabled' : 'disabled');
      }
    }
  }, [localStream, initializeLocalStream]);

  useEffect(() => {
    const existingIds = new Set(Array.from(peerConnections.current.keys()));
    const currentIds = new Set(participants.map(p => p.id));

    existingIds.forEach((id) => {
      if (!currentIds.has(id) && id !== currentUserId) {
        const pc = peerConnections.current.get(id);
        if (pc) {
          pc.close();
          peerConnections.current.delete(id);
        }
        setStreams((prev) => {
          const updated = new Map(prev);
          updated.delete(id);
          return updated;
        });
      }
    });

    participants.forEach((p) => {
      if (p.id !== currentUserId && !peerConnections.current.has(p.id)) {
        if (currentUserId && p.id > currentUserId) {
          connectToPeer(p.id, p.username);
        }
      }
    });
  }, [participants, currentUserId, connectToPeer]);

  useEffect(() => {
    if (streamReady && pendingOffers.current.size > 0) {
      pendingOffers.current.forEach(async (offer, from) => {
        await handleOffer(from, offer);
      });
      pendingOffers.current.clear();
    }
  }, [streamReady, handleOffer]);

  useEffect(() => {
    if (localStream) {
      peerConnections.current.forEach((pc) => {
        const senders = pc.getSenders();
        const videoSender = senders.find(s => s.track?.kind === 'video');
        
        if (!videoSender) {
          localStream.getTracks().forEach(track => {
            pc.addTrack(track, localStream!);
          });
        }
      });
    }
  }, [localStream]);

  useEffect(() => {
    return () => {
      peerConnections.current.forEach((pc) => pc.close());
      peerConnections.current.clear();
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return {
    localStream,
    streams,
    isMuted,
    isCameraOff,
    isInitializing,
    initializeLocalStream,
    toggleMic,
    toggleCamera,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
  };
}

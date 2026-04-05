import React, { useRef, useEffect, useMemo } from 'react';
import { Mic, MicOff, VideoOff, User, Video } from 'lucide-react';
import type { Participant, StreamInfo } from '../types';

interface CameraGridProps {
  localStream: MediaStream | null;
  streams: Map<string, StreamInfo>;
  participants: Participant[];
  currentUserId: string | null;
  isMuted: boolean;
  isCameraOff: boolean;
}

function RemoteVideoTile({ 
  streamInfo, 
  participant 
}: { 
  streamInfo: StreamInfo; 
  participant?: Participant;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && streamInfo.stream) {
      videoRef.current.srcObject = streamInfo.stream;
      videoRef.current.play().catch(console.error);
    }
  }, [streamInfo.stream]);

  return (
    <div className="relative aspect-video bg-dark-700 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full h-full object-cover"
      />
      <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
        <span className="text-xs bg-black/50 px-2 py-1 rounded-full text-white truncate max-w-[70%]">
          {participant?.username || streamInfo.username}
          {participant?.isHost && <span className="ml-1 text-accent-primary">(Host)</span>}
        </span>
        <div className="flex items-center gap-1">
          {participant?.isMuted ? (
            <div className="p-1 bg-red-500 rounded-full">
              <MicOff className="w-3 h-3 text-white" />
            </div>
          ) : (
            <div className="p-1 bg-green-500 rounded-full">
              <Mic className="w-3 h-3 text-white" />
            </div>
          )}
          {participant?.isCameraOff && (
            <div className="p-1 bg-red-500 rounded-full">
              <VideoOff className="w-3 h-3 text-white" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CameraGrid({
  localStream,
  streams,
  participants,
  currentUserId,
  isMuted,
  isCameraOff,
}: CameraGridProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
      localVideoRef.current.play().catch(console.error);
    }
  }, [localStream]);

  const currentUser = participants.find(p => p.id === currentUserId);
  
  const remoteParticipants = useMemo(() => {
    return participants.filter(p => p.id !== currentUserId);
  }, [participants, currentUserId]);

  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-white/5">
      <h3 className="text-sm font-medium text-gray-400 mb-3">
        Participants ({participants.length})
      </h3>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
        <div className="relative aspect-video bg-dark-700 rounded-lg overflow-hidden border-2 border-accent-primary">
          {localStream ? (
            <>
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              {isCameraOff && (
                <div className="absolute inset-0 bg-dark-800 flex items-center justify-center">
                  <div className="text-center">
                    <VideoOff className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                    <span className="text-xs text-gray-500">Camera Off</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <div className="text-center">
                <Video className="w-8 h-8 text-gray-600 mx-auto mb-2" />
                <span className="text-xs text-gray-600">No camera</span>
              </div>
            </div>
          )}
          
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <span className="text-xs bg-black/50 px-2 py-1 rounded-full text-white truncate max-w-[70%]">
              {currentUser?.username || 'You'}
              {currentUser?.isHost && <span className="ml-1 text-accent-primary">(Host)</span>}
            </span>
            <div className="flex items-center gap-1">
              {isMuted ? (
                <div className="p-1 bg-red-500 rounded-full">
                  <MicOff className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="p-1 bg-green-500 rounded-full">
                  <Mic className="w-3 h-3 text-white" />
                </div>
              )}
              {isCameraOff ? (
                <div className="p-1 bg-red-500 rounded-full">
                  <VideoOff className="w-3 h-3 text-white" />
                </div>
              ) : (
                <div className="p-1 bg-green-500 rounded-full">
                  <Video className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {remoteParticipants.map((participant) => {
          const streamInfo = streams.get(participant.id);
          if (streamInfo) {
            return (
              <RemoteVideoTile
                key={participant.id}
                streamInfo={streamInfo}
                participant={participant}
              />
            );
          }
          return (
            <div
              key={participant.id}
              className="relative aspect-video bg-dark-700 rounded-lg overflow-hidden flex items-center justify-center"
            >
              <div className="text-center">
                <div className="w-10 h-10 bg-dark-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <User className="w-5 h-5 text-gray-500" />
                </div>
                <span className="text-xs text-gray-400 truncate block max-w-full">
                  {participant.username}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

import { Server, Socket } from 'socket.io';
import { roomStore } from '../utils/roomStore.js';
import type { ClientToServerEvents, ServerToClientEvents, VideoState } from '../types/index.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupVideoSyncHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    socket.on('video-sync', ({ roomId, videoState }) => {
      const userId = roomStore.getUserId(socket.id);
      const room = roomStore.getRoom(roomId);
      
      if (!room || !userId) return;
      
      if (room.hostId !== userId) {
        console.log(`Non-host ${userId} tried to sync video in room ${roomId}`);
        return;
      }

      roomStore.updateVideoState(roomId, {
        ...videoState,
        hostTimestamp: Date.now(),
      });

      socket.to(roomId).emit('video-sync', roomStore.getRoom(roomId)!.videoState);
    });
  });
}

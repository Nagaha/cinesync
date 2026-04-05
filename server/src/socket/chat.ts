import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { roomStore } from '../utils/roomStore.js';
import type { ClientToServerEvents, ServerToClientEvents, ChatMessage } from '../types/index.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupChatHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    socket.on('chat-message', ({ roomId, content }) => {
      const userId = roomStore.getUserId(socket.id);
      
      if (!userId) return;
      
      const participants = roomStore.getParticipants(roomId);
      const participant = participants.find(p => p.id === userId);
      
      if (!participant) return;
      
      const message: ChatMessage = {
        id: uuidv4(),
        roomId,
        userId,
        username: participant.username,
        content: content.trim(),
        timestamp: new Date(),
        type: 'message',
      };
      
      roomStore.addChatMessage(message);
      
      io.to(roomId).emit('chat-message', message);
    });

    socket.on('toggle-mic', ({ roomId, isMuted }) => {
      const userId = roomStore.getUserId(socket.id);
      if (!userId) return;
      
      roomStore.toggleMic(roomId, userId, isMuted);
      socket.to(roomId).emit('user-toggled-mic', { userId, isMuted });
    });

    socket.on('toggle-camera', ({ roomId, isCameraOff }) => {
      const userId = roomStore.getUserId(socket.id);
      if (!userId) return;
      
      roomStore.toggleCamera(roomId, userId, isCameraOff);
      socket.to(roomId).emit('user-toggled-camera', { userId, isCameraOff });
    });
  });
}

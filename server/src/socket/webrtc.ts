import { Server, Socket } from 'socket.io';
import { roomStore } from '../utils/roomStore.js';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/index.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupWebRTCHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[WebRTC] Client connected: ${socket.id}`);
    
    socket.on('offer', ({ to, offer }) => {
      const fromUserId = roomStore.getUserId(socket.id);
      console.log(`[WebRTC] offer from ${fromUserId} to ${to}`);
      if (!fromUserId) return;
      
      const toSocketId = roomStore.getSocketId(to);
      if (toSocketId) {
        io.to(toSocketId).emit('offer', {
          from: fromUserId,
          to,
          offer,
        });
      } else {
        console.log(`[WebRTC] target user ${to} not found`);
      }
    });

    socket.on('answer', ({ to, answer }) => {
      const fromUserId = roomStore.getUserId(socket.id);
      console.log(`[WebRTC] answer from ${fromUserId} to ${to}`);
      if (!fromUserId) return;
      
      const toSocketId = roomStore.getSocketId(to);
      if (toSocketId) {
        io.to(toSocketId).emit('answer', {
          from: fromUserId,
          to,
          answer,
        });
      }
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      const fromUserId = roomStore.getUserId(socket.id);
      if (!fromUserId) return;
      
      const toSocketId = roomStore.getSocketId(to);
      if (toSocketId) {
        io.to(toSocketId).emit('ice-candidate', {
          from: fromUserId,
          to,
          candidate,
        });
      }
    });
  });
}

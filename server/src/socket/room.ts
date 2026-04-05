import { Server, Socket } from 'socket.io';
import { roomStore } from '../utils/roomStore.js';
import type { ClientToServerEvents, ServerToClientEvents, RoomData, Participant, ChatMessage } from '../types/index.js';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSocketHandlers(io: TypedServer) {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('create-room', ({ username }, callback) => {
      try {
        const room = roomStore.createRoom(socket.id, username);
        
        socket.join(room.id);
        
        const roomData: RoomData = {
          id: room.id,
          hostId: room.hostId,
          videoState: room.videoState,
          createdAt: room.createdAt,
        };
        
        callback({
          success: true,
          roomId: room.id,
        });

        socket.emit('room-created', { roomId: room.id });
        socket.emit('room-joined', {
          room: roomData,
          participants: roomStore.getParticipants(room.id),
          messages: roomStore.getChatMessages(room.id),
        });
        
        console.log(`Room created: ${room.id} by ${username}`);
      } catch (error) {
        callback({
          success: false,
          error: 'Failed to create room',
        });
      }
    });

    socket.on('join-room', ({ roomId, username }, callback) => {
      try {
        const result = roomStore.joinRoom(roomId, socket.id, username);
        
        if (!result) {
          callback({
            success: false,
            error: 'Room not found',
          });
          return;
        }

        socket.join(roomId);
        
        const roomData: RoomData = {
          id: result.room.id,
          hostId: result.room.hostId,
          videoState: result.room.videoState,
          createdAt: result.room.createdAt,
        };

        callback({
          success: true,
          room: roomData,
          participants: roomStore.getParticipants(roomId),
          messages: roomStore.getChatMessages(roomId),
        });

        socket.to(roomId).emit('user-joined', { participant: result.participant });
        socket.to(roomId).emit('participants-update', roomStore.getParticipants(roomId));
        
        console.log(`${username} joined room: ${roomId}`);
      } catch (error) {
        callback({
          success: false,
          error: 'Failed to join room',
        });
      }
    });

    socket.on('leave-room', ({ roomId }) => {
      handleLeaveRoom(socket, roomId);
    });

    socket.on('disconnect', () => {
      const room = roomStore.getRoomBySocket(socket.id);
      if (room) {
        handleLeaveRoom(socket, room.id);
      }
      console.log(`Client disconnected: ${socket.id}`);
    });

    function handleLeaveRoom(socket: TypedSocket, roomId: string) {
      const result = roomStore.leaveRoom(socket.id);
      
      if (result) {
        socket.leave(roomId);
        
        socket.to(roomId).emit('user-left', {
          userId: result.userId,
          username: result.username,
        });
        socket.to(roomId).emit('participants-update', roomStore.getParticipants(roomId));
        
        console.log(`${result.username} left room: ${roomId}`);
      }
    }
  });
}

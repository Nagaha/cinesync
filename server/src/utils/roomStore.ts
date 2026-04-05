import { v4 as uuidv4 } from 'uuid';
import type { Room, Participant, VideoState, ChatMessage } from '../types/index.js';

class RoomStore {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private socketToUser: Map<string, string> = new Map();
  private chatMessages: Map<string, ChatMessage[]> = new Map();

  createRoom(hostId: string, username: string): Room {
    const roomId = this.generateRoomCode();
    const host: Participant = {
      id: uuidv4(),
      username,
      socketId: hostId,
      isHost: true,
      isMuted: true,
      isCameraOff: true,
      joinedAt: new Date(),
    };

    const room: Room = {
      id: roomId,
      hostId: host.id,
      participants: new Map([[host.id, host]]),
      videoState: {
        url: null,
        type: null,
        currentTime: 0,
        isPlaying: false,
        hostTimestamp: Date.now(),
      },
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    this.socketToRoom.set(hostId, roomId);
    this.socketToUser.set(hostId, host.id);
    this.chatMessages.set(roomId, []);

    return room;
  }

  joinRoom(roomId: string, socketId: string, username: string): { room: Room; participant: Participant } | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant: Participant = {
      id: uuidv4(),
      username,
      socketId,
      isHost: false,
      isMuted: true,
      isCameraOff: true,
      joinedAt: new Date(),
    };

    room.participants.set(participant.id, participant);
    this.socketToRoom.set(socketId, roomId);
    this.socketToUser.set(socketId, participant.id);

    const systemMessage: ChatMessage = {
      id: uuidv4(),
      roomId,
      userId: 'system',
      username: 'System',
      content: `${username} joined the room`,
      timestamp: new Date(),
      type: 'join',
    };
    this.addChatMessage(systemMessage);

    return { room, participant };
  }

  leaveRoom(socketId: string): { roomId: string; userId: string; username: string } | null {
    const roomId = this.socketToRoom.get(socketId);
    const userId = this.socketToUser.get(socketId);
    
    if (!roomId || !userId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const participant = room.participants.get(userId);
    const username = participant?.username || 'Unknown';

    room.participants.delete(userId);
    this.socketToRoom.delete(socketId);
    this.socketToUser.delete(socketId);

    if (participant) {
      const systemMessage: ChatMessage = {
        id: uuidv4(),
        roomId,
        userId: 'system',
        username: 'System',
        content: `${username} left the room`,
        timestamp: new Date(),
        type: 'leave',
      };
      this.addChatMessage(systemMessage);
    }

    if (room.participants.size === 0) {
      this.rooms.delete(roomId);
      this.chatMessages.delete(roomId);
    } else if (room.hostId === userId) {
      const newHost = room.participants.values().next().value;
      if (newHost) {
        newHost.isHost = true;
        room.hostId = newHost.id;
      }
    }

    return { roomId, userId, username };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getRoomBySocket(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  getUserId(socketId: string): string | undefined {
    return this.socketToUser.get(socketId);
  }

  getSocketId(userId: string): string | undefined {
    for (const [socketId, uid] of this.socketToUser) {
      if (uid === userId) return socketId;
    }
    return undefined;
  }

  updateVideoState(roomId: string, videoState: Partial<VideoState>): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    room.videoState = { ...room.videoState, ...videoState };
    return true;
  }

  getParticipants(roomId: string): Participant[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.participants.values()) : [];
  }

  addChatMessage(message: ChatMessage): void {
    const messages = this.chatMessages.get(message.roomId) || [];
    messages.push(message);
    if (messages.length > 100) messages.shift();
    this.chatMessages.set(message.roomId, messages);
  }

  getChatMessages(roomId: string): ChatMessage[] {
    return this.chatMessages.get(roomId) || [];
  }

  toggleMic(roomId: string, userId: string, isMuted: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    const participant = room.participants.get(userId);
    if (!participant) return false;
    
    participant.isMuted = isMuted;
    return true;
  }

  toggleCamera(roomId: string, userId: string, isCameraOff: boolean): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    
    const participant = room.participants.get(userId);
    if (!participant) return false;
    
    participant.isCameraOff = isCameraOff;
    return true;
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (this.rooms.has(code)) {
      return this.generateRoomCode();
    }
    return code;
  }
}

export const roomStore = new RoomStore();

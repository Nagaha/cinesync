import { Server } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents } from '../types/index.js';
import { setupSocketHandlers } from './room.js';
import { setupVideoSyncHandlers } from './videoSync.js';
import { setupChatHandlers } from './chat.js';
import { setupWebRTCHandlers } from './webrtc.js';

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

export function setupSockets(io: TypedServer) {
  setupSocketHandlers(io);
  setupVideoSyncHandlers(io);
  setupChatHandlers(io);
  setupWebRTCHandlers(io);
}

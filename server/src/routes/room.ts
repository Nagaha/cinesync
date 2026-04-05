import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { roomStore } from '../utils/roomStore.js';

const router = Router();

router.post('/create', (req: Request, res: Response) => {
  const { username } = req.body;
  
  if (!username || typeof username !== 'string' || username.trim().length === 0) {
    res.status(400).json({ error: 'Username is required' });
    return;
  }

  if (username.length > 20) {
    res.status(400).json({ error: 'Username must be 20 characters or less' });
    return;
  }

  const room = roomStore.createRoom(uuidv4(), username.trim());
  
  res.json({
    roomId: room.id,
    hostId: room.hostId,
  });
});

router.get('/:roomId', (req: Request, res: Response) => {
  const { roomId } = req.params;
  const room = roomStore.getRoom(roomId);

  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  res.json({
    id: room.id,
    hostId: room.hostId,
    participantCount: room.participants.size,
    videoType: room.videoState.type,
    createdAt: room.createdAt,
  });
});

router.post('/join', (req: Request, res: Response) => {
  const { roomId, username } = req.body;

  if (!roomId || !username) {
    res.status(400).json({ error: 'Room ID and username are required' });
    return;
  }

  const room = roomStore.getRoom(roomId);
  if (!room) {
    res.status(404).json({ error: 'Room not found' });
    return;
  }

  if (username.length > 20) {
    res.status(400).json({ error: 'Username must be 20 characters or less' });
    return;
  }

  res.json({
    success: true,
    roomId: room.id,
  });
});

export default router;

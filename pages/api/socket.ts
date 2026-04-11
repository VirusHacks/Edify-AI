// pages/api/socket.ts
// Legacy Next API route for socket.io server-side initialization.
// Using Pages API (not App Router) so we can access res.socket.server
import { NextApiRequest, NextApiResponse } from 'next';
import { Server } from 'socket.io';

// @ts-ignore
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Make sure we only initialize the socket server once
  if ((res.socket as any).server.io) {
    // Socket is already running
    res.end();
    return;
  }

  console.log('Initializing socket.io server...');
  const io = new Server((res.socket as any).server, {
    path: '/api/socket',
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  (res.socket as any).server.io = io;

  io.on('connection', (socket) => {
    console.log('New socket connection:', socket.id);

    socket.on('join-room', (roomId: string) => {
      socket.join(roomId);
      console.log(`Socket ${socket.id} joined room: ${roomId}`);
    });

    socket.on('send-message', (message: any) => {
      const { roomId, content } = message || {};
      if (roomId) {
        io.to(roomId).emit('receive-message', { sender: socket.id, content });
      }
      console.log(`Message sent to room ${roomId}: ${content}`);
    });
  });

  res.end();
}

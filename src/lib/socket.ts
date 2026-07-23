import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    // In dev and prod, socket connects to window.location.origin
    socket = io(window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000
    });

    socket.on('connect', () => {
      console.log('🔌 Connected to SyncWatch Server Socket:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Disconnected from SyncWatch Server Socket:', reason);
    });
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

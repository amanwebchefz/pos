import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;
  private currentUserId: string | null = null;
  private readonly SERVER_URL = 'http://localhost:3001';

  connect(userId?: string): Socket {
    if (!this.socket) {
      this.socket = io(this.SERVER_URL, {
        transports: ['websocket', 'polling'],
        withCredentials: true,
      });

      this.socket.on('connect', () => {
        console.log('Connected to Socket.io server with ID:', this.socket?.id);
        if (userId) {
          this.joinRoom(userId);
        }
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from Socket.io server');
      });

      this.socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    } else if (userId && this.currentUserId !== userId) {
      // If socket exists but userId changed, join new room
      this.joinRoom(userId);
    }

    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      if (this.currentUserId) {
        this.leaveRoom(this.currentUserId);
      }
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
    }
  }

  joinRoom(userId: string): void {
    if (this.socket) {
      this.currentUserId = userId;
      this.socket.emit('join-room', userId);
      console.log(`Joining room for user: ${userId}`);
    }
  }

  leaveRoom(userId: string): void {
    if (this.socket) {
      this.socket.emit('leave-room', userId);
      console.log(`Leaving room for user: ${userId}`);
    }
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  emitCartUpdate(cartData: any): void {
    if (this.socket) {
      console.log('Emitting cart update:', cartData);
      this.socket.emit('cart-update', cartData);
    } else {
      console.error('Socket not connected, cannot emit cart update');
    }
  }

  onCartUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.on('cart-update', callback);
      console.log('Listening for cart updates');
    }
  }

  offCartUpdate(callback: (data: any) => void): void {
    if (this.socket) {
      this.socket.off('cart-update', callback);
    }
  }
}

export const socketService = new SocketService();

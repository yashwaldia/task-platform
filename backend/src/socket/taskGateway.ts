import { Server as HttpServer } from 'http';
import { Server, Socket }       from 'socket.io';
import jwt                      from 'jsonwebtoken';
import { env }                  from '../config/env';
import { JwtPayload }           from '../utils/generateTokens';


let io: Server;


/** Get the initialized Socket.io server instance */
export const getIO = (): Server => {
  if (!io) throw new Error('[Socket] Socket.io has not been initialized');
  return io;
};


/** Called once from server.ts at startup */
export const initSocket = (httpServer: HttpServer): Server => {
  io = new Server(httpServer, {
    cors: {
      origin:      env.FRONTEND_URL,      // ← FIXED: was env.CORS_ORIGIN (key does not exist in env.ts)
      methods:     ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout:  60000,
    pingInterval: 25000,
  });


  // JWT authentication middleware for Socket.io connections
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      return next(new Error('Authentication error: Token not provided'));
    }

    try {
      const decoded        = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayload; // ← FIXED: was env.JWT_SECRET
      (socket as any).user = decoded;
      next();
    } catch {
      next(new Error('Authentication error: Invalid or expired token'));
    }
  });


  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as JwtPayload;

    // Each user joins their own private room for targeted events
    socket.join(`user:${user.userId}`);

    // Admins also join a global admin broadcast room
    if (user.role === 'admin') {
      socket.join('admin');
    }

    console.log(
      `🔌 [Socket] Connected: ${socket.id} | user: ${user.userId} | role: ${user.role}`
    );

    socket.on('disconnect', (reason) => {
      console.log(`❌ [Socket] Disconnected: ${socket.id} | reason: ${reason}`);
    });
  });


  console.log('🔌 [Socket] Socket.io initialized');
  return io;
};


// ─── Emit Helpers (used by task/user services in Phase 3+) ──────────────────


/** Send event to a specific user's private room */
export const emitToUser = (userId: string, event: string, data: unknown): void => {
  if (io) io.to(`user:${userId}`).emit(event, data);
};


/** Send event to all admin clients */
export const emitToAdmins = (event: string, data: unknown): void => {
  if (io) io.to('admin').emit(event, data);
};


/** Send event to a specific user AND all admins */
export const emitToUserAndAdmins = (
  userId: string,
  event:  string,
  data:   unknown
): void => {
  if (io) {
    io.to(`user:${userId}`).emit(event, data);
    io.to('admin').emit(event, data);
  }
};


/** Broadcast event to ALL connected clients */
export const emitToAll = (event: string, data: unknown): void => {
  if (io) io.emit(event, data);
};

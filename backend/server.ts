import { createServer } from 'http';
import { connectDB }    from './src/config/db';
import { env }          from './src/config/env';
import app              from './src/app';
import { initSocket }   from './src/socket/taskGateway';

const httpServer = createServer(app);

// Initialize Socket.io on the HTTP server
initSocket(httpServer);

const start = async (): Promise<void> => {
  try {
    // Connect to MongoDB before accepting requests
    await connectDB();

    httpServer.listen(env.PORT, () => {
      console.log('');
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`🚀 Server running on port ${env.PORT}`);
      console.log(`🌍 Environment   : ${env.NODE_ENV}`);
      console.log(`🔗 Health check  : http://localhost:${env.PORT}/health`);
      console.log(`📡 API base      : http://localhost:${env.PORT}/api/v1`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log('');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// ─── Process-Level Error Handling ─────────────────────────────────────────────
process.on('uncaughtException', (err: Error) => {
  console.error('💥 UNCAUGHT EXCEPTION — shutting down:', err.name, err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err: unknown) => {
  console.error('💥 UNHANDLED REJECTION — shutting down:', err);
  httpServer.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received. Closing server gracefully...');
  httpServer.close(() => {
    console.log('✅ HTTP server closed.');
    process.exit(0);
  });
});

start();

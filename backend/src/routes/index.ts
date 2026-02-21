import { Router } from 'express';
import authRoutes from './auth.routes';
import taskRoutes from './task.routes';
import userRoutes from './user.routes';

const router = Router();

// ─── API Health Check ─────────────────────────────────────────────────────────
router.get('/health', (req, res) => {
  res.status(200).json({
    success:     true,
    message:     'API is operational',
    version:     '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    timestamp:   new Date().toISOString(),
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
router.use('/auth',  authRoutes);
router.use('/tasks', taskRoutes);
router.use('/users', userRoutes);

export default router;

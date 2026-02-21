import express, { Application } from 'express';
import cors         from 'cors';
import helmet       from 'helmet';
import cookieParser from 'cookie-parser';
import morgan       from 'morgan';
import swaggerUi          from 'swagger-ui-express';
import { env }            from './config/env';
import { swaggerSpec }    from './config/swagger';
import { apiRateLimiter } from './middleware/rateLimiter';
import { notFound }       from './middleware/notFound';
import { errorHandler }   from './middleware/errorHandler';
import router             from './routes/index';


const app: Application = express();


// ─── CORS — MUST be first, before helmet ──────────────────────────────────────
// Handles preflight OPTIONS for all routes before any other middleware
const corsOptions: cors.CorsOptions = {
  origin:         process.env.FRONTEND_URL ?? 'http://localhost:5173',
  credentials:    true,   // required for httpOnly refresh token cookie
  methods:        ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  optionsSuccessStatus: 200, // some legacy browsers choke on 204
};

app.use(cors(corsOptions));


// ─── Security Headers ─────────────────────────────────────────────────────────
// crossOriginResourcePolicy must be cross-origin, otherwise helmet
// overrides and blocks CORS responses from reaching the browser
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);


// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));


// ─── Cookie Parser ────────────────────────────────────────────────────────────
app.use(cookieParser());


// ─── HTTP Request Logging ─────────────────────────────────────────────────────
// Silenced in test environment — prevents 40+ line HTTP log flood in jest output
if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}


// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use('/api', apiRateLimiter);


// ─── Server Health Check ──────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.status(200).json({
    status:      'healthy',
    environment: env.NODE_ENV,
    timestamp:   new Date().toISOString(),
  });
});


// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', router);


// ─── Swagger API Docs (development only — never exposed in production) ─────────
if (env.NODE_ENV !== 'production') {
  app.use(
    '/api/v1/docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: 'Task Platform API Docs',
      swaggerOptions: {
        persistAuthorization: true, // keeps Bearer token across page refresh
        docExpansion:         'list', // endpoints collapsed by default — cleaner view
        filter:               true,  // enables search bar across endpoints
      },
    })
  );
  console.log(`📚 [Docs] Swagger UI: http://localhost:${env.PORT}/api/v1/docs`);
}


// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use(notFound);


// ─── Global Error Handler (must be last) ──────────────────────────────────────
app.use(errorHandler);


export default app;

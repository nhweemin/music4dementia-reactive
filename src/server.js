import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import jwt from '@fastify/jwt';
import websocket from '@fastify/websocket';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Import our modules
import { connectDatabase } from './utils/database.js';
import { setupWebSocketHandlers } from './reactive/websocket-handler.js';
import { setupRoutes } from './routes/index.js';
import { ReactiveSessionManager } from './reactive/session-manager.js';
import { MusicRecommendationEngine } from './reactive/music-engine.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create Fastify instance with logging
const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info',
    transport: process.env.NODE_ENV === 'development' ? {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname',
      },
    } : undefined,
  },
});

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  if (error.validation) {
    reply.status(400).send({
      error: 'Validation Error',
      message: error.message,
      details: error.validation
    });
    return;
  }
  
  reply.status(error.statusCode || 500).send({
    error: error.name || 'Internal Server Error',
    message: error.message || 'Something went wrong'
  });
});

// Setup plugins
async function setupPlugins() {
  // Security
  await fastify.register(helmet, {
    contentSecurityPolicy: false
  });
  
  // CORS
  await fastify.register(cors, {
    origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  });
  
  // Rate limiting
  await fastify.register(rateLimit, {
    max: 100,
    timeWindow: '1 minute',
    skipOnError: true
  });
  
  // JWT
  await fastify.register(jwt, {
    secret: process.env.JWT_SECRET || 'super-secret-key-change-in-production'
  });
  
  // WebSocket support
  await fastify.register(websocket, {
    options: {
      maxPayload: 1048576, // 1MB
      verifyClient: (info) => {
        // Add WebSocket authentication logic here if needed
        return true;
      }
    }
  });
}

// Health check route
fastify.get('/health', async (request, reply) => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    features: {
      websockets: true,
      reactive: true,
      musicEngine: true,
      realTime: true
    }
  };
});

// Reactive features
async function setupReactiveFeatures() {
  // Initialize reactive session manager
  const sessionManager = new ReactiveSessionManager();
  fastify.decorate('sessionManager', sessionManager);
  
  // Initialize music recommendation engine
  const musicEngine = new MusicRecommendationEngine();
  fastify.decorate('musicEngine', musicEngine);
  
  // Setup WebSocket handlers
  setupWebSocketHandlers(fastify);
  
  fastify.log.info('Reactive features initialized');
}

// Main server startup
async function start() {
  try {
    // Setup plugins
    await setupPlugins();
    
    // Connect to database
    await connectDatabase();
    
    // Setup reactive features
    await setupReactiveFeatures();
    
    // Setup routes
    await setupRoutes(fastify);
    
    // Start server
    const port = process.env.PORT || 3000;
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    fastify.log.info(`🎵 Fuxi Reactive Backend running on http://${host}:${port}`);
    fastify.log.info('🚀 Real-time music therapy sessions ready!');
    
  } catch (error) {
    fastify.log.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  fastify.log.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await fastify.close();
    fastify.log.info('Server closed successfully');
    process.exit(0);
  } catch (error) {
    fastify.log.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  fastify.log.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start the server
start();

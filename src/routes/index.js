import authRoutes from './auth.js';
import profileRoutes from './profiles.js';
import trackRoutes from './tracks.js';
import playlistRoutes from './playlists.js';
import sessionRoutes from './sessions.js';
import analyticsRoutes from './analytics.js';

export async function setupRoutes(fastify) {
  // API versioning
  await fastify.register(async function(fastify) {
    // Authentication routes (no auth required)
    await fastify.register(authRoutes, { prefix: '/auth' });
    
    // Protected routes (require authentication)
    await fastify.register(async function(fastify) {
      // Add JWT authentication hook
      fastify.addHook('preHandler', async (request, reply) => {
        try {
          await request.jwtVerify();
        } catch (err) {
          reply.code(401).send({ 
            error: 'Unauthorized',
            message: 'Valid JWT token required'
          });
        }
      });
      
      // Register protected routes
      await fastify.register(profileRoutes, { prefix: '/profiles' });
      await fastify.register(trackRoutes, { prefix: '/tracks' });
      await fastify.register(playlistRoutes, { prefix: '/playlists' });
      await fastify.register(sessionRoutes, { prefix: '/sessions' });
      await fastify.register(analyticsRoutes, { prefix: '/analytics' });
      
    });
  }, { prefix: '/api/v1' });
  
  fastify.log.info('All routes registered successfully');
}

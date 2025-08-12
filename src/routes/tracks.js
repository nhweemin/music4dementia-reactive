import Track from '../models/Track.js';

export default async function trackRoutes(fastify, options) {
  // Search tracks
  fastify.post('/search', {
    schema: {
      body: {
        type: 'object',
        required: ['query'],
        properties: {
          query: { type: 'string', minLength: 1 },
          limit: { type: 'number', minimum: 1, maximum: 100, default: 20 }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { query, limit = 20 } = request.body;
      
      const tracks = await Track.searchTracks(query).limit(limit);
      
      reply.send({
        success: true,
        data: { tracks }
      });
      
    } catch (error) {
      fastify.log.error('Search tracks error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to search tracks'
      });
    }
  });
  
  // Get track by ID
  fastify.get('/:trackId', async (request, reply) => {
    try {
      const { trackId } = request.params;
      
      const track = await Track.findById(trackId);
      if (!track) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Track not found'
        });
      }
      
      reply.send({
        success: true,
        data: { track }
      });
      
    } catch (error) {
      fastify.log.error('Get track error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get track'
      });
    }
  });
  
  // Get tracks by artist
  fastify.get('/artist/:artist', async (request, reply) => {
    try {
      const { artist } = request.params;
      const { limit = 20 } = request.query;
      
      const tracks = await Track.findByArtist(artist).limit(limit);
      
      reply.send({
        success: true,
        data: { tracks }
      });
      
    } catch (error) {
      fastify.log.error('Get tracks by artist error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get tracks by artist'
      });
    }
  });
  
  // Get popular tracks
  fastify.get('/popular', async (request, reply) => {
    try {
      const { limit = 20 } = request.query;
      
      const tracks = await Track.getPopularTracks(limit);
      
      reply.send({
        success: true,
        data: { tracks }
      });
      
    } catch (error) {
      fastify.log.error('Get popular tracks error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get popular tracks'
      });
    }
  });
  
  // Get similar tracks
  fastify.get('/:trackId/similar', async (request, reply) => {
    try {
      const { trackId } = request.params;
      const { limit = 10 } = request.query;
      
      const tracks = await Track.getSimilarTracks(trackId, limit);
      
      reply.send({
        success: true,
        data: { tracks }
      });
      
    } catch (error) {
      fastify.log.error('Get similar tracks error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get similar tracks'
      });
    }
  });
}


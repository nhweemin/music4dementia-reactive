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
  
  // Upload new track (admin/content creator endpoint)
  fastify.post('/upload', {
    schema: {
      body: {
        type: 'object',
        required: ['title', 'language'],
        properties: {
          title: { type: 'string', minLength: 1 },
          artist: { type: 'string' },
          language: { type: 'string' },
          genre: { type: 'string' },
          era: { type: 'number' },
          ytId: { type: 'string' },
          imageUrl: { type: 'string' },
          uri: { type: 'string' },
          features: {
            type: 'object',
            properties: {
              energy: { type: 'number', minimum: 0, maximum: 1 },
              valence: { type: 'number', minimum: 0, maximum: 1 },
              tempo: { type: 'number' },
              acousticness: { type: 'number', minimum: 0, maximum: 1 },
              danceability: { type: 'number', minimum: 0, maximum: 1 },
              instrumentalness: { type: 'number', minimum: 0, maximum: 1 }
            }
          },
          tags: { type: 'array', items: { type: 'string' } },
          duration: { type: 'number' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const trackData = request.body;
      
      // Create new track
      const track = new Track(trackData);
      await track.save();
      
      fastify.log.info(`New track uploaded: ${track.title} by ${track.artist}`);
      
      reply.code(201).send({
        success: true,
        message: 'Track uploaded successfully',
        data: { track }
      });
      
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate ytId
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Track with this YouTube ID already exists'
        });
      }
      
      fastify.log.error('Upload track error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to upload track'
      });
    }
  });
  
  // Update track
  fastify.put('/:trackId', {
    schema: {
      params: {
        type: 'object',
        properties: {
          trackId: { type: 'string' }
        },
        required: ['trackId']
      }
    }
  }, async (request, reply) => {
    try {
      const { trackId } = request.params;
      const updateData = request.body;
      
      const track = await Track.findByIdAndUpdate(
        trackId, 
        updateData, 
        { new: true, runValidators: true }
      );
      
      if (!track) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Track not found'
        });
      }
      
      reply.send({
        success: true,
        message: 'Track updated successfully',
        data: { track }
      });
      
    } catch (error) {
      fastify.log.error('Update track error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update track'
      });
    }
  });
  
  // Delete track
  fastify.delete('/:trackId', async (request, reply) => {
    try {
      const { trackId } = request.params;
      
      const track = await Track.findByIdAndUpdate(
        trackId,
        { isActive: false },
        { new: true }
      );
      
      if (!track) {
        return reply.code(404).send({
          error: 'Not Found', 
          message: 'Track not found'
        });
      }
      
      reply.send({
        success: true,
        message: 'Track deleted successfully'
      });
      
    } catch (error) {
      fastify.log.error('Delete track error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to delete track'
      });
    }
  });
}


export default async function sessionRoutes(fastify, options) {
  // Create a new music therapy session
  fastify.post('/', {
    schema: {
      body: {
        type: 'object',
        properties: {
          profileId: { type: 'string' },
          settings: {
            type: 'object',
            properties: {
              autoNext: { type: 'boolean' },
              reactionThreshold: { type: 'number' },
              maxParticipants: { type: 'number' }
            }
          }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { profileId, settings } = request.body;
      
      const session = fastify.sessionManager.createSession({
        settings,
        createdBy: request.user.id
      });
      
      // If profileId provided, auto-join the session
      if (profileId) {
        await fastify.sessionManager.joinSession(session.id, {
          userId: request.user.id,
          profileId,
          connectionId: 'http_' + Date.now()
        });
      }
      
      reply.code(201).send({
        success: true,
        message: 'Session created successfully',
        data: { session }
      });
      
    } catch (error) {
      fastify.log.error('Create session error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to create session'
      });
    }
  });
  
  // Get session details
  fastify.get('/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params;
      const session = fastify.sessionManager.getSession(sessionId);
      
      if (!session) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Session not found'
        });
      }
      
      const metrics = fastify.sessionManager.getSessionMetrics(sessionId);
      
      reply.send({
        success: true,
        data: { 
          session,
          metrics
        }
      });
      
    } catch (error) {
      fastify.log.error('Get session error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get session'
      });
    }
  });
  
  // Get all active sessions
  fastify.get('/', async (request, reply) => {
    try {
      const sessions = fastify.sessionManager.getActiveSessions();
      
      reply.send({
        success: true,
        data: { sessions }
      });
      
    } catch (error) {
      fastify.log.error('Get sessions error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get sessions'
      });
    }
  });
  
  // Join a session
  fastify.post('/:sessionId/join', {
    schema: {
      body: {
        type: 'object',
        required: ['profileId'],
        properties: {
          profileId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.params;
      const { profileId } = request.body;
      
      const session = await fastify.sessionManager.joinSession(sessionId, {
        userId: request.user.id,
        profileId,
        connectionId: 'http_' + Date.now()
      });
      
      // Get initial recommendations
      const recommendations = await fastify.musicEngine.getSessionRecommendations(sessionId, profileId);
      
      reply.send({
        success: true,
        message: 'Joined session successfully',
        data: { 
          session,
          recommendations
        }
      });
      
    } catch (error) {
      fastify.log.error('Join session error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to join session'
      });
    }
  });
  
  // Leave a session
  fastify.post('/:sessionId/leave', async (request, reply) => {
    try {
      const { sessionId } = request.params;
      
      fastify.sessionManager.leaveSession(sessionId, 'http_' + request.user.id);
      
      reply.send({
        success: true,
        message: 'Left session successfully'
      });
      
    } catch (error) {
      fastify.log.error('Leave session error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to leave session'
      });
    }
  });
  
  // Update current track in session
  fastify.post('/:sessionId/track', {
    schema: {
      body: {
        type: 'object',
        required: ['trackId'],
        properties: {
          trackId: { type: 'string' },
          title: { type: 'string' },
          artist: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.params;
      const trackInfo = request.body;
      
      fastify.sessionManager.updateCurrentTrack(sessionId, trackInfo);
      
      reply.send({
        success: true,
        message: 'Track updated successfully'
      });
      
    } catch (error) {
      fastify.log.error('Update track error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to update track'
      });
    }
  });
  
  // Submit reaction
  fastify.post('/:sessionId/reaction', {
    schema: {
      body: {
        type: 'object',
        required: ['trackId', 'reaction'],
        properties: {
          trackId: { type: 'string' },
          reaction: { 
            type: 'string',
            enum: ['strongly dislike', 'dislike', 'neutral', 'like', 'strongly like']
          },
          intensity: { type: 'number', minimum: 1, maximum: 5 },
          profileId: { type: 'string' }
        }
      }
    }
  }, async (request, reply) => {
    try {
      const { sessionId } = request.params;
      const reactionData = {
        ...request.body,
        timestamp: Date.now()
      };
      
      // Update session manager
      fastify.sessionManager.updateUserReaction(sessionId, reactionData);
      
      // Process through music engine
      const result = await fastify.musicEngine.processReaction({
        sessionId,
        ...reactionData
      });
      
      reply.send({
        success: true,
        message: 'Reaction recorded successfully',
        data: result
      });
      
    } catch (error) {
      fastify.log.error('Submit reaction error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to record reaction'
      });
    }
  });
  
  // Get session recommendations
  fastify.get('/:sessionId/recommendations', async (request, reply) => {
    try {
      const { sessionId } = request.params;
      const { profileId } = request.query;
      
      const recommendations = await fastify.musicEngine.getSessionRecommendations(sessionId, profileId);
      
      reply.send({
        success: true,
        data: { recommendations }
      });
      
    } catch (error) {
      fastify.log.error('Get recommendations error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get recommendations'
      });
    }
  });
  
  // End session
  fastify.delete('/:sessionId', async (request, reply) => {
    try {
      const { sessionId } = request.params;
      
      fastify.sessionManager.endSession(sessionId);
      
      reply.send({
        success: true,
        message: 'Session ended successfully'
      });
      
    } catch (error) {
      fastify.log.error('End session error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to end session'
      });
    }
  });
}


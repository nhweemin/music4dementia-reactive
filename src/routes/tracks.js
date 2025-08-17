import Track from '../models/Track.js';
import { uploadAudioFile, uploadImageFile } from '../utils/gridfs.js';

export default async function trackRoutes(fastify, options) {
  // Get all tracks (paginated)
  fastify.get('/', async (request, reply) => {
    try {
      const { page = 1, limit = 20, genre, language, sortBy = 'createdAt', sortOrder = 'desc' } = request.query;
      const skip = (page - 1) * limit;
      
      // Build filter query
      const filter = { isActive: true };
      if (genre) filter.genre = genre;
      if (language) filter.language = language;
      
      // Build sort query
      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;
      
      const tracks = await Track.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit));
      
      const totalTracks = await Track.countDocuments(filter);
      const totalPages = Math.ceil(totalTracks / limit);
      
      reply.send({
        success: true,
        data: {
          tracks: tracks.map(track => track.toJSONWithUrls()),
          pagination: {
            currentPage: parseInt(page),
            totalPages,
            totalTracks,
            hasNextPage: page < totalPages,
            hasPrevPage: page > 1
          }
        }
      });
      
    } catch (error) {
      fastify.log.error('Get tracks error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve tracks'
      });
    }
  });

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
        data: { 
          tracks: tracks.map(track => track.toJSONWithUrls())
        }
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
        data: { track: track.toJSONWithUrls() }
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
        data: { tracks: tracks.map(track => track.toJSONWithUrls()) }
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
        data: { tracks: tracks.map(track => track.toJSONWithUrls()) }
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
        data: { tracks: tracks.map(track => track.toJSONWithUrls()) }
      });
      
    } catch (error) {
      fastify.log.error('Get similar tracks error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get similar tracks'
      });
    }
  });
  
  // Upload new track with files (multipart form data)
  fastify.post('/upload', async (request, reply) => {
    try {
      fastify.log.info('📤 Starting file upload process');

      const parts = request.parts();
      const trackData = {};
      let audioFileId = null;
      let imageFileId = null;

      // Process multipart form data
      for await (const part of parts) {
        if (part.type === 'file') {
          fastify.log.info(`📁 Processing file: ${part.filename}, type: ${part.mimetype}, size: ${part.file?.bytesRead || 'unknown'}`);
          const buffer = await part.toBuffer();
          fastify.log.info(`📦 File buffered successfully, size: ${buffer.length} bytes`);
          
          if (part.fieldname === 'audio') {
            // Validate audio file
            if (!part.mimetype.startsWith('audio/')) {
              return reply.code(400).send({
                error: 'Bad Request',
                message: 'Invalid audio file type'
              });
            }

            // Upload audio to GridFS
            fastify.log.info(`🎵 Uploading audio file to GridFS: ${part.filename}`);
            const audioInfo = await uploadAudioFile(part.filename, buffer, {
              contentType: part.mimetype,
              originalName: part.filename,
              uploadedBy: request.user?.id
            });
            audioFileId = audioInfo.fileId;
            fastify.log.info(`✅ Audio file uploaded successfully, ID: ${audioFileId}`);

          } else if (part.fieldname === 'image') {
            // Validate image file
            if (!part.mimetype.startsWith('image/')) {
              return reply.code(400).send({
                error: 'Bad Request',
                message: 'Invalid image file type'
              });
            }

            // Upload image to GridFS
            fastify.log.info(`🖼️ Uploading image file to GridFS: ${part.filename}`);
            const imageInfo = await uploadImageFile(part.filename, buffer, {
              contentType: part.mimetype,
              originalName: part.filename,
              uploadedBy: request.user?.id
            });
            imageFileId = imageInfo.fileId;
            fastify.log.info(`✅ Image file uploaded successfully, ID: ${imageFileId}`);
          }
        } else {
          // Handle form fields
          trackData[part.fieldname] = part.value;
        }
      }

      // Validate required fields
      if (!trackData.title || !trackData.language) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Title and language are required'
        });
      }

      // Parse JSON fields if they exist
      if (trackData.features && typeof trackData.features === 'string') {
        try {
          trackData.features = JSON.parse(trackData.features);
        } catch (e) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid features JSON format'
          });
        }
      }

      if (trackData.tags && typeof trackData.tags === 'string') {
        try {
          trackData.tags = JSON.parse(trackData.tags);
        } catch (e) {
          return reply.code(400).send({
            error: 'Bad Request',
            message: 'Invalid tags JSON format'
          });
        }
      }

      // Convert numeric fields
      if (trackData.era) trackData.era = parseInt(trackData.era);
      if (trackData.duration) trackData.duration = parseInt(trackData.duration);

      // Add file IDs to track data
      if (audioFileId) trackData.audioFileId = audioFileId;
      if (imageFileId) trackData.imageFileId = imageFileId;

      // Generate unique identifier if no ytId provided
      if (!trackData.ytId) {
        // Generate a unique track ID based on title and timestamp
        trackData.ytId = `track_${Date.now()}_${trackData.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      }

      // Create new track
      const track = new Track(trackData);
      await track.save();
      
      fastify.log.info(`New track uploaded: ${track.title} by ${track.artist}`);
      
      reply.code(201).send({
        success: true,
        message: 'Track uploaded successfully',
        data: { 
          track: track.toJSONWithUrls(),
          files: {
            audio: audioFileId ? { fileId: audioFileId } : null,
            image: imageFileId ? { fileId: imageFileId } : null
          }
        }
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

  // Upload track metadata only (JSON endpoint)
  fastify.post('/upload-metadata', {
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
          audioFileId: { type: 'string' },
          imageFileId: { type: 'string' },
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
      
      // Generate unique identifier if no ytId provided
      if (!trackData.ytId) {
        // Generate a unique track ID based on title and timestamp
        trackData.ytId = `track_${Date.now()}_${trackData.title.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase()}`;
      }
      
      // Create new track
      const track = new Track(trackData);
      await track.save();
      
      fastify.log.info(`New track metadata uploaded: ${track.title} by ${track.artist}`);
      
      reply.code(201).send({
        success: true,
        message: 'Track metadata uploaded successfully',
        data: { track: track.toJSONWithUrls() }
      });
      
    } catch (error) {
      if (error.code === 11000) {
        // Duplicate ytId
        return reply.code(409).send({
          error: 'Conflict',
          message: 'Track with this YouTube ID already exists'
        });
      }
      
      fastify.log.error('Upload track metadata error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to upload track metadata'
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


import mongoose from 'mongoose';
import {
  uploadAudioFile,
  uploadImageFile,
  streamAudioFile,
  streamImageFile,
  getAudioFileInfo,
  getImageFileInfo,
  deleteAudioFile,
  deleteImageFile,
  listFiles
} from '../utils/gridfs.js';

export default async function fileRoutes(fastify, options) {
  // Register multipart support if not already available
  if (!fastify.hasContentTypeParser('multipart/form-data')) {
    await fastify.register(import('@fastify/multipart'), {
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
      }
    });
  }

  // Upload audio file
  fastify.post('/upload/audio', async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      // Validate file type
      if (!data.mimetype.startsWith('audio/')) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Only audio files are allowed'
        });
      }

      // Convert stream to buffer
      const buffer = await data.toBuffer();
      
      // Upload to GridFS
      const fileInfo = await uploadAudioFile(data.filename, buffer, {
        contentType: data.mimetype,
        originalName: data.filename,
        uploadedBy: request.user?.id,
        size: buffer.length
      });

      reply.code(201).send({
        success: true,
        message: 'Audio file uploaded successfully',
        data: {
          fileId: fileInfo.fileId,
          filename: fileInfo.filename,
          size: fileInfo.length,
          contentType: data.mimetype,
          uploadDate: fileInfo.uploadDate
        }
      });

    } catch (error) {
      fastify.log.error('Upload audio error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to upload audio file'
      });
    }
  });

  // Upload image file
  fastify.post('/upload/image', async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'No file uploaded'
        });
      }

      // Validate file type
      if (!data.mimetype.startsWith('image/')) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Only image files are allowed'
        });
      }

      // Convert stream to buffer
      const buffer = await data.toBuffer();
      
      // Upload to GridFS
      const fileInfo = await uploadImageFile(data.filename, buffer, {
        contentType: data.mimetype,
        originalName: data.filename,
        uploadedBy: request.user?.id,
        size: buffer.length
      });

      reply.code(201).send({
        success: true,
        message: 'Image file uploaded successfully',
        data: {
          fileId: fileInfo.fileId,
          filename: fileInfo.filename,
          size: fileInfo.length,
          contentType: data.mimetype,
          uploadDate: fileInfo.uploadDate
        }
      });

    } catch (error) {
      fastify.log.error('Upload image error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to upload image file'
      });
    }
  });

  // Stream audio file
  fastify.get('/audio/:fileId', async (request, reply) => {
    try {
      const { fileId } = request.params;
      
      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid file ID'
        });
      }

      // Get file info first
      const fileInfo = await getAudioFileInfo(new mongoose.Types.ObjectId(fileId));
      if (!fileInfo) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Audio file not found'
        });
      }

      // Set appropriate headers
      reply.header('Content-Type', fileInfo.metadata?.contentType || 'audio/mpeg');
      reply.header('Content-Length', fileInfo.length);
      reply.header('Accept-Ranges', 'bytes');
      reply.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Stream the file
      const downloadStream = streamAudioFile(new mongoose.Types.ObjectId(fileId));
      
      downloadStream.on('error', (error) => {
        fastify.log.error('Stream audio error:', error);
        if (!reply.sent) {
          reply.code(500).send({
            error: 'Internal Server Error',
            message: 'Failed to stream audio file'
          });
        }
      });

      return reply.send(downloadStream);

    } catch (error) {
      fastify.log.error('Get audio file error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve audio file'
      });
    }
  });

  // Stream image file
  fastify.get('/image/:fileId', async (request, reply) => {
    try {
      const { fileId } = request.params;
      
      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid file ID'
        });
      }

      // Get file info first
      const fileInfo = await getImageFileInfo(new mongoose.Types.ObjectId(fileId));
      if (!fileInfo) {
        return reply.code(404).send({
          error: 'Not Found',
          message: 'Image file not found'
        });
      }

      // Set appropriate headers
      reply.header('Content-Type', fileInfo.metadata?.contentType || 'image/jpeg');
      reply.header('Content-Length', fileInfo.length);
      reply.header('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

      // Stream the file
      const downloadStream = streamImageFile(new mongoose.Types.ObjectId(fileId));
      
      downloadStream.on('error', (error) => {
        fastify.log.error('Stream image error:', error);
        if (!reply.sent) {
          reply.code(500).send({
            error: 'Internal Server Error',
            message: 'Failed to stream image file'
          });
        }
      });

      return reply.send(downloadStream);

    } catch (error) {
      fastify.log.error('Get image file error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to retrieve image file'
      });
    }
  });

  // Get file info
  fastify.get('/info/:type/:fileId', async (request, reply) => {
    try {
      const { type, fileId } = request.params;
      
      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid file ID'
        });
      }

      if (!['audio', 'image'].includes(type)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid file type. Must be "audio" or "image"'
        });
      }

      const fileInfo = type === 'audio' 
        ? await getAudioFileInfo(new mongoose.Types.ObjectId(fileId))
        : await getImageFileInfo(new mongoose.Types.ObjectId(fileId));

      if (!fileInfo) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `${type} file not found`
        });
      }

      reply.send({
        success: true,
        data: {
          fileId: fileInfo._id,
          filename: fileInfo.filename,
          size: fileInfo.length,
          contentType: fileInfo.metadata?.contentType,
          uploadDate: fileInfo.uploadDate,
          metadata: fileInfo.metadata
        }
      });

    } catch (error) {
      fastify.log.error('Get file info error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get file info'
      });
    }
  });

  // Delete file
  fastify.delete('/:type/:fileId', async (request, reply) => {
    try {
      const { type, fileId } = request.params;
      
      if (!mongoose.Types.ObjectId.isValid(fileId)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid file ID'
        });
      }

      if (!['audio', 'image'].includes(type)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid file type. Must be "audio" or "image"'
        });
      }

      const deleted = type === 'audio'
        ? await deleteAudioFile(new mongoose.Types.ObjectId(fileId))
        : await deleteImageFile(new mongoose.Types.ObjectId(fileId));

      if (!deleted) {
        return reply.code(404).send({
          error: 'Not Found',
          message: `${type} file not found`
        });
      }

      reply.send({
        success: true,
        message: `${type} file deleted successfully`
      });

    } catch (error) {
      fastify.log.error('Delete file error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to delete file'
      });
    }
  });

  // List files
  fastify.get('/list/:type', async (request, reply) => {
    try {
      const { type } = request.params;
      const { limit = 50, skip = 0 } = request.query;

      if (!['audio', 'image'].includes(type)) {
        return reply.code(400).send({
          error: 'Bad Request',
          message: 'Invalid file type. Must be "audio" or "image"'
        });
      }

      const files = await listFiles(type, parseInt(limit), parseInt(skip));

      reply.send({
        success: true,
        data: {
          files,
          pagination: {
            limit: parseInt(limit),
            skip: parseInt(skip),
            count: files.length
          }
        }
      });

    } catch (error) {
      fastify.log.error('List files error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to list files'
      });
    }
  });

  // Bulk upload files
  fastify.post('/upload/bulk', async (request, reply) => {
    try {
      const parts = request.parts();
      const uploadedFiles = [];
      const errors = [];

      for await (const part of parts) {
        if (part.type === 'file') {
          try {
            const buffer = await part.toBuffer();
            let fileInfo;

            if (part.mimetype.startsWith('audio/')) {
              fileInfo = await uploadAudioFile(part.filename, buffer, {
                contentType: part.mimetype,
                originalName: part.filename,
                uploadedBy: request.user?.id,
                size: buffer.length
              });
              uploadedFiles.push({
                type: 'audio',
                fileId: fileInfo.fileId,
                filename: fileInfo.filename,
                size: fileInfo.length
              });
            } else if (part.mimetype.startsWith('image/')) {
              fileInfo = await uploadImageFile(part.filename, buffer, {
                contentType: part.mimetype,
                originalName: part.filename,
                uploadedBy: request.user?.id,
                size: buffer.length
              });
              uploadedFiles.push({
                type: 'image',
                fileId: fileInfo.fileId,
                filename: fileInfo.filename,
                size: fileInfo.length
              });
            } else {
              errors.push({
                filename: part.filename,
                error: 'Unsupported file type'
              });
            }
          } catch (error) {
            errors.push({
              filename: part.filename,
              error: error.message
            });
          }
        }
      }

      reply.code(201).send({
        success: true,
        message: `Uploaded ${uploadedFiles.length} files successfully`,
        data: {
          uploaded: uploadedFiles,
          errors: errors,
          summary: {
            total: uploadedFiles.length + errors.length,
            successful: uploadedFiles.length,
            failed: errors.length
          }
        }
      });

    } catch (error) {
      fastify.log.error('Bulk upload error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to process bulk upload'
      });
    }
  });

  // Get storage statistics
  fastify.get('/stats', async (request, reply) => {
    try {
      const audioFiles = await listFiles('audio', 1000, 0);
      const imageFiles = await listFiles('image', 1000, 0);

      const audioStats = audioFiles.reduce((acc, file) => {
        acc.count++;
        acc.totalSize += file.length || 0;
        return acc;
      }, { count: 0, totalSize: 0 });

      const imageStats = imageFiles.reduce((acc, file) => {
        acc.count++;
        acc.totalSize += file.length || 0;
        return acc;
      }, { count: 0, totalSize: 0 });

      reply.send({
        success: true,
        data: {
          audio: {
            count: audioStats.count,
            totalSize: audioStats.totalSize,
            averageSize: audioStats.count > 0 ? Math.round(audioStats.totalSize / audioStats.count) : 0
          },
          image: {
            count: imageStats.count,
            totalSize: imageStats.totalSize,
            averageSize: imageStats.count > 0 ? Math.round(imageStats.totalSize / imageStats.count) : 0
          },
          total: {
            count: audioStats.count + imageStats.count,
            totalSize: audioStats.totalSize + imageStats.totalSize
          }
        }
      });

    } catch (error) {
      fastify.log.error('Get stats error:', error);
      reply.code(500).send({
        error: 'Internal Server Error',
        message: 'Failed to get storage statistics'
      });
    }
  });
}

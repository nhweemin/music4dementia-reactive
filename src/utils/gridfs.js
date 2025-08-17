import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';

let audioBucket;
let imageBucket;

// Initialize GridFS buckets
export function initializeGridFS() {
  if (!mongoose.connection.db) {
    throw new Error('MongoDB connection not established');
  }

  // Create separate buckets for audio and image files
  audioBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'audioFiles'
  });

  imageBucket = new GridFSBucket(mongoose.connection.db, {
    bucketName: 'imageFiles'
  });

  console.log('✅ GridFS buckets initialized');
}

// Get audio bucket
export function getAudioBucket() {
  if (!audioBucket) {
    throw new Error('Audio bucket not initialized. Call initializeGridFS() first.');
  }
  return audioBucket;
}

// Get image bucket
export function getImageBucket() {
  if (!imageBucket) {
    throw new Error('Image bucket not initialized. Call initializeGridFS() first.');
  }
  return imageBucket;
}

// Upload file to GridFS
export async function uploadFileToGridFS(bucket, filename, buffer, metadata = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = bucket.openUploadStream(filename, {
      metadata: {
        ...metadata,
        uploadDate: new Date(),
        contentType: metadata.contentType || 'application/octet-stream'
      }
    });

    uploadStream.on('error', reject);
    uploadStream.on('finish', () => {
      // Fixed: Use uploadStream.id instead of file._id (file parameter doesn't exist)
      resolve({
        fileId: uploadStream.id,
        filename: filename,
        length: buffer.length,
        uploadDate: new Date(),
        metadata: metadata
      });
    });

    uploadStream.end(buffer);
  });
}

// Download file from GridFS
export async function downloadFileFromGridFS(bucket, fileId) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    const downloadStream = bucket.openDownloadStream(fileId);

    downloadStream.on('data', (chunk) => {
      chunks.push(chunk);
    });

    downloadStream.on('error', reject);
    downloadStream.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
  });
}

// Get file info from GridFS
export async function getFileInfo(bucket, fileId) {
  try {
    const files = await bucket.find({ _id: fileId }).toArray();
    return files.length > 0 ? files[0] : null;
  } catch (error) {
    throw new Error(`Failed to get file info: ${error.message}`);
  }
}

// Delete file from GridFS
export async function deleteFileFromGridFS(bucket, fileId) {
  try {
    await bucket.delete(fileId);
    return true;
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
}

// Stream file from GridFS (for serving files)
export function streamFileFromGridFS(bucket, fileId) {
  return bucket.openDownloadStream(fileId);
}

// Upload audio file
export async function uploadAudioFile(filename, buffer, metadata = {}) {
  const bucket = getAudioBucket();
  return uploadFileToGridFS(bucket, filename, buffer, {
    ...metadata,
    contentType: metadata.contentType || 'audio/mpeg',
    fileType: 'audio'
  });
}

// Upload image file
export async function uploadImageFile(filename, buffer, metadata = {}) {
  const bucket = getImageBucket();
  return uploadFileToGridFS(bucket, filename, buffer, {
    ...metadata,
    contentType: metadata.contentType || 'image/jpeg',
    fileType: 'image'
  });
}

// Download audio file
export async function downloadAudioFile(fileId) {
  const bucket = getAudioBucket();
  return downloadFileFromGridFS(bucket, fileId);
}

// Download image file
export async function downloadImageFile(fileId) {
  const bucket = getImageBucket();
  return downloadFileFromGridFS(bucket, fileId);
}

// Stream audio file
export function streamAudioFile(fileId) {
  const bucket = getAudioBucket();
  return streamFileFromGridFS(bucket, fileId);
}

// Stream image file
export function streamImageFile(fileId) {
  const bucket = getImageBucket();
  return streamFileFromGridFS(bucket, fileId);
}

// Get audio file info
export async function getAudioFileInfo(fileId) {
  const bucket = getAudioBucket();
  return getFileInfo(bucket, fileId);
}

// Get image file info
export async function getImageFileInfo(fileId) {
  const bucket = getImageBucket();
  return getFileInfo(bucket, fileId);
}

// Delete audio file
export async function deleteAudioFile(fileId) {
  const bucket = getAudioBucket();
  return deleteFileFromGridFS(bucket, fileId);
}

// Delete image file
export async function deleteImageFile(fileId) {
  const bucket = getImageBucket();
  return deleteFileFromGridFS(bucket, fileId);
}

// List files in bucket
export async function listFiles(bucketName, limit = 50, skip = 0) {
  const bucket = bucketName === 'audio' ? getAudioBucket() : getImageBucket();
  
  try {
    const files = await bucket.find({})
      .limit(limit)
      .skip(skip)
      .sort({ uploadDate: -1 })
      .toArray();
    
    return files.map(file => ({
      fileId: file._id,
      filename: file.filename,
      length: file.length,
      uploadDate: file.uploadDate,
      metadata: file.metadata
    }));
  } catch (error) {
    throw new Error(`Failed to list files: ${error.message}`);
  }
}

# MongoDB GridFS File Storage API Documentation

## Overview

The Fuxi Reactive Backend now uses MongoDB GridFS for storing audio and image files directly in the database. This provides a unified storage solution with atomic operations, metadata support, and efficient streaming capabilities.

## Base URL
```
https://adaptable-youth-production-ad8a.up.railway.app/api/v1
```

## Authentication
All file operations require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## File Management Endpoints

### 1. Upload Audio File
**POST** `/files/upload/audio`

Upload a single audio file to GridFS.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (required): Audio file (mp3, wav, m4a, etc.)

**Example:**
```bash
curl -X POST "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/files/upload/audio" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@song.mp3"
```

**Response:**
```json
{
  "success": true,
  "message": "Audio file uploaded successfully",
  "data": {
    "fileId": "507f1f77bcf86cd799439011",
    "filename": "song.mp3",
    "size": 5242880,
    "contentType": "audio/mpeg",
    "uploadDate": "2023-12-14T10:30:00.000Z"
  }
}
```

### 2. Upload Image File
**POST** `/files/upload/image`

Upload a single image file to GridFS.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `file` (required): Image file (jpg, png, gif, etc.)

**Example:**
```bash
curl -X POST "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/files/upload/image" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "file=@cover.jpg"
```

### 3. Bulk Upload Files
**POST** `/files/upload/bulk`

Upload multiple files (audio and/or images) in a single request.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- Multiple files with any field names

**Example:**
```bash
curl -X POST "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/files/upload/bulk" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio1=@song1.mp3" \
  -F "audio2=@song2.mp3" \
  -F "cover=@album_cover.jpg"
```

**Response:**
```json
{
  "success": true,
  "message": "Uploaded 3 files successfully",
  "data": {
    "uploaded": [
      {
        "type": "audio",
        "fileId": "507f1f77bcf86cd799439011",
        "filename": "song1.mp3",
        "size": 5242880
      },
      {
        "type": "audio", 
        "fileId": "507f1f77bcf86cd799439012",
        "filename": "song2.mp3",
        "size": 4194304
      },
      {
        "type": "image",
        "fileId": "507f1f77bcf86cd799439013", 
        "filename": "album_cover.jpg",
        "size": 1048576
      }
    ],
    "errors": [],
    "summary": {
      "total": 3,
      "successful": 3,
      "failed": 0
    }
  }
}
```

### 4. Stream Audio File
**GET** `/files/audio/{fileId}`

Stream an audio file directly from GridFS. Supports range requests for efficient streaming.

**Parameters:**
- `fileId` (path): MongoDB ObjectId of the audio file

**Example:**
```bash
curl "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/files/audio/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response Headers:**
```
Content-Type: audio/mpeg
Content-Length: 5242880
Accept-Ranges: bytes
Cache-Control: public, max-age=31536000
```

### 5. Stream Image File
**GET** `/files/image/{fileId}`

Stream an image file directly from GridFS.

**Parameters:**
- `fileId` (path): MongoDB ObjectId of the image file

**Example:**
```bash
curl "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/files/image/507f1f77bcf86cd799439013" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### 6. Get File Information
**GET** `/files/info/{type}/{fileId}`

Get metadata about a specific file.

**Parameters:**
- `type` (path): File type (`audio` or `image`)
- `fileId` (path): MongoDB ObjectId of the file

**Example:**
```bash
curl "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/files/info/audio/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "507f1f77bcf86cd799439011",
    "filename": "song.mp3",
    "size": 5242880,
    "contentType": "audio/mpeg",
    "uploadDate": "2023-12-14T10:30:00.000Z",
    "metadata": {
      "originalName": "song.mp3",
      "uploadedBy": "507f1f77bcf86cd799439000",
      "fileType": "audio"
    }
  }
}
```

### 7. Delete File
**DELETE** `/files/{type}/{fileId}`

Delete a file from GridFS.

**Parameters:**
- `type` (path): File type (`audio` or `image`)
- `fileId` (path): MongoDB ObjectId of the file

**Example:**
```bash
curl -X DELETE "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/files/audio/507f1f77bcf86cd799439011" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "message": "audio file deleted successfully"
}
```

### 8. List Files
**GET** `/files/list/{type}`

List files of a specific type with pagination.

**Parameters:**
- `type` (path): File type (`audio` or `image`)
- `limit` (query): Number of files to return (default: 50, max: 100)
- `skip` (query): Number of files to skip (default: 0)

**Example:**
```bash
curl "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/files/list/audio?limit=20&skip=0" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "files": [
      {
        "fileId": "507f1f77bcf86cd799439011",
        "filename": "song1.mp3",
        "length": 5242880,
        "uploadDate": "2023-12-14T10:30:00.000Z",
        "metadata": {
          "contentType": "audio/mpeg",
          "originalName": "song1.mp3"
        }
      }
    ],
    "pagination": {
      "limit": 20,
      "skip": 0,
      "count": 1
    }
  }
}
```

### 9. Get Storage Statistics
**GET** `/files/stats`

Get storage statistics for audio and image files.

**Example:**
```bash
curl "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/files/stats" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "audio": {
      "count": 25,
      "totalSize": 131072000,
      "averageSize": 5242880
    },
    "image": {
      "count": 10,
      "totalSize": 10485760,
      "averageSize": 1048576
    },
    "total": {
      "count": 35,
      "totalSize": 141557760
    }
  }
}
```

## Track Upload with Files

### Upload Complete Track with Files
**POST** `/tracks/upload`

Upload a track with audio file, image, and metadata in a single request.

**Content-Type:** `multipart/form-data`

**Form Fields:**
- `audio` (optional): Audio file
- `image` (optional): Image file
- `title` (required): Track title
- `artist` (optional): Artist name
- `language` (required): Track language
- `genre` (optional): Music genre
- `era` (optional): Year/era (number)
- `features` (optional): JSON string with music features
- `tags` (optional): JSON array of tags

**Example:**
```bash
curl -X POST "https://adaptable-youth-production-ad8a.up.railway.app/api/v1/tracks/upload" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@song.mp3" \
  -F "image=@cover.jpg" \
  -F "title=Beautiful Song" \
  -F "artist=Amazing Artist" \
  -F "language=English" \
  -F "genre=Pop" \
  -F "era=2023" \
  -F 'features={"energy":0.8,"valence":0.7,"tempo":120}' \
  -F 'tags=["therapy","relaxing"]'
```

**Response:**
```json
{
  "success": true,
  "message": "Track uploaded successfully",
  "data": {
    "track": {
      "_id": "507f1f77bcf86cd799439020",
      "title": "Beautiful Song",
      "artist": "Amazing Artist",
      "language": "English",
      "genre": "Pop",
      "era": 2023,
      "audioFileId": "507f1f77bcf86cd799439011",
      "imageFileId": "507f1f77bcf86cd799439013",
      "audioUrl": "/api/v1/files/audio/507f1f77bcf86cd799439011",
      "imageUrl": "/api/v1/files/image/507f1f77bcf86cd799439013",
      "hasAudio": true,
      "hasImage": true,
      "features": {
        "energy": 0.8,
        "valence": 0.7,
        "tempo": 120
      },
      "tags": ["therapy", "relaxing"]
    },
    "files": {
      "audio": {
        "fileId": "507f1f77bcf86cd799439011"
      },
      "image": {
        "fileId": "507f1f77bcf86cd799439013"
      }
    }
  }
}
```

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": "Error Type",
  "message": "Detailed error message"
}
```

**Common HTTP Status Codes:**
- `400` - Bad Request (invalid parameters, unsupported file type)
- `401` - Unauthorized (missing or invalid JWT token)
- `404` - Not Found (file not found)
- `409` - Conflict (duplicate resource)
- `413` - Payload Too Large (file exceeds 50MB limit)
- `500` - Internal Server Error

## File Size Limits

- Maximum file size: **50MB**
- Supported audio formats: mp3, wav, m4a, ogg, flac
- Supported image formats: jpg, jpeg, png, gif, webp

## Best Practices

1. **Use appropriate endpoints**: Use `/tracks/upload` for complete track uploads, `/files/upload/*` for standalone files
2. **Handle errors gracefully**: Check response status and handle errors appropriately
3. **Use bulk upload**: For multiple files, use `/files/upload/bulk` for better performance
4. **Cache file URLs**: Audio and image URLs are stable and can be cached
5. **Stream large files**: Use range requests for efficient audio streaming
6. **Monitor storage**: Use `/files/stats` to monitor storage usage

## Integration Examples

### Frontend Integration (React Native)
```javascript
// Upload track with files
const uploadTrack = async (audioFile, imageFile, metadata) => {
  const formData = new FormData();
  
  if (audioFile) {
    formData.append('audio', {
      uri: audioFile.uri,
      type: audioFile.type,
      name: audioFile.name
    });
  }
  
  if (imageFile) {
    formData.append('image', {
      uri: imageFile.uri,
      type: imageFile.type,
      name: imageFile.name
    });
  }
  
  Object.keys(metadata).forEach(key => {
    if (typeof metadata[key] === 'object') {
      formData.append(key, JSON.stringify(metadata[key]));
    } else {
      formData.append(key, metadata[key]);
    }
  });
  
  const response = await fetch(`${API_URL}/api/v1/tracks/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'multipart/form-data',
    },
    body: formData
  });
  
  return response.json();
};
```

### Web Integration (JavaScript)
```javascript
// Upload single audio file
const uploadAudio = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await fetch(`${API_URL}/api/v1/files/upload/audio`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};

// Stream audio file
const getAudioUrl = (fileId) => {
  return `${API_URL}/api/v1/files/audio/${fileId}`;
};
```

This comprehensive file storage system provides a robust, scalable solution for managing music files in the Fuxi music therapy application.

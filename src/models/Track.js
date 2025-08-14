import mongoose from 'mongoose';

const { Schema } = mongoose;

const trackSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  ytId: {
    type: String,
    required: false, // Optional for uploaded tracks
    unique: true,
    sparse: true, // Allow multiple null values
    index: true
  },
  artist: {
    type: String,
    required: false,
    trim: true,
    index: true
  },
  language: {
    type: String,
    required: true,
    index: true
  },
  genre: {
    type: String,
    required: false,
    index: true
  },
  imageUrl: {
    type: String,
    required: false // Optional external image URL
  },
  imageFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // GridFS file ID for stored image
  },
  era: {
    type: Number,
    required: false,
    index: true
  },
  uri: {
    type: String,
    required: false // Optional external URI for backward compatibility
  },
  audioFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false // GridFS file ID for stored audio file
  },
  // Additional reactive features
  features: {
    energy: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    valence: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    tempo: {
      type: Number,
      default: 120
    },
    acousticness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    danceability: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    },
    instrumentalness: {
      type: Number,
      min: 0,
      max: 1,
      default: 0.5
    }
  },
  // Reactive analytics
  analytics: {
    totalPlays: {
      type: Number,
      default: 0
    },
    totalLikes: {
      type: Number,
      default: 0
    },
    totalDislikes: {
      type: Number,
      default: 0
    },
    averageRating: {
      type: Number,
      default: 3.0
    },
    lastPlayed: {
      type: Date,
      default: null
    },
    popularityScore: {
      type: Number,
      default: 0
    }
  },
  // Metadata for recommendations
  tags: [{
    type: String,
    trim: true
  }],
  duration: {
    type: Number, // in seconds
    default: 180
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound indexes for efficient queries
trackSchema.index({ genre: 1, era: 1 });
trackSchema.index({ language: 1, genre: 1 });
trackSchema.index({ 'analytics.popularityScore': -1 });
trackSchema.index({ isActive: 1 });

// Static methods
trackSchema.statics.searchTracks = function(query) {
  return this.find({
    $and: [
      { isActive: true },
      {
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { artist: { $regex: query, $options: 'i' } },
          { genre: { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      }
    ]
  }).sort({ 'analytics.popularityScore': -1 });
};

trackSchema.statics.findByArtist = function(artist) {
  return this.find({
    isActive: true,
    artist: { $regex: artist, $options: 'i' }
  }).sort({ 'analytics.popularityScore': -1 });
};

trackSchema.statics.getPopularTracks = function(limit = 20) {
  return this.find({ isActive: true })
    .sort({ 'analytics.popularityScore': -1 })
    .limit(limit);
};

trackSchema.statics.getSimilarTracks = function(trackId, limit = 10) {
  // TODO: Implement similarity algorithm based on features
  return this.find({ 
    isActive: true,
    _id: { $ne: trackId }
  })
  .sort({ 'analytics.popularityScore': -1 })
  .limit(limit);
};

// Instance methods
trackSchema.methods.updateAnalytics = function(reaction) {
  if (reaction === 'like') {
    this.analytics.totalLikes += 1;
  } else if (reaction === 'dislike') {
    this.analytics.totalDislikes += 1;
  }
  
  this.analytics.totalPlays += 1;
  this.analytics.lastPlayed = new Date();
  
  // Update popularity score (simple algorithm)
  const totalReactions = this.analytics.totalLikes + this.analytics.totalDislikes;
  if (totalReactions > 0) {
    this.analytics.averageRating = (this.analytics.totalLikes / totalReactions) * 5;
    this.analytics.popularityScore = this.analytics.totalPlays * (this.analytics.averageRating / 5);
  }
  
  return this.save();
};

// Get audio file URL (GridFS or external)
trackSchema.methods.getAudioUrl = function() {
  if (this.audioFileId) {
    return `/api/v1/files/audio/${this.audioFileId}`;
  }
  return this.uri || null;
};

// Get image file URL (GridFS or external)
trackSchema.methods.getImageUrl = function() {
  if (this.imageFileId) {
    return `/api/v1/files/image/${this.imageFileId}`;
  }
  return this.imageUrl || null;
};

// Check if track has audio file
trackSchema.methods.hasAudioFile = function() {
  return !!(this.audioFileId || this.uri);
};

// Check if track has image file
trackSchema.methods.hasImageFile = function() {
  return !!(this.imageFileId || this.imageUrl);
};

// Get track with file URLs
trackSchema.methods.toJSONWithUrls = function() {
  const trackObj = this.toObject();
  return {
    ...trackObj,
    audioUrl: this.getAudioUrl(),
    imageUrl: this.getImageUrl(),
    hasAudio: this.hasAudioFile(),
    hasImage: this.hasImageFile()
  };
};
trackSchema.index({ artist: 1, genre: 1 });
trackSchema.index({ 'features.energy': 1, 'features.valence': 1 });

const Track = mongoose.model('Track', trackSchema);

export default Track;

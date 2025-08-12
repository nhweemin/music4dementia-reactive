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
    required: true,
    unique: true,
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
    required: true
  },
  era: {
    type: Number,
    required: false,
    index: true
  },
  uri: {
    type: String,
    required: false // URI to loaded mp3 file from S3 bucket
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
trackSchema.index({ artist: 1, genre: 1 });
trackSchema.index({ 'features.energy': 1, 'features.valence': 1 });
trackSchema.index({ 'analytics.popularityScore': -1 });
trackSchema.index({ 'analytics.averageRating': -1 });

// Text search index
trackSchema.index({ 
  title: 'text', 
  artist: 'text', 
  genre: 'text',
  tags: 'text'
});

// Virtual for YouTube URL
trackSchema.virtual('youtubeUrl').get(function() {
  return this.ytId ? `https://www.youtube.com/watch?v=${this.ytId}` : null;
});

// Virtual for display name
trackSchema.virtual('displayName').get(function() {
  return this.artist ? `${this.title} - ${this.artist}` : this.title;
});

// Instance methods
trackSchema.methods.updateAnalytics = function(reaction) {
  this.analytics.totalPlays += 1;
  this.analytics.lastPlayed = new Date();
  
  if (reaction === 'like' || reaction === 'strongly like') {
    this.analytics.totalLikes += 1;
  } else if (reaction === 'dislike' || reaction === 'strongly dislike') {
    this.analytics.totalDislikes += 1;
  }
  
  // Update average rating and popularity score
  const totalReactions = this.analytics.totalLikes + this.analytics.totalDislikes;
  if (totalReactions > 0) {
    this.analytics.averageRating = (this.analytics.totalLikes * 5 + this.analytics.totalDislikes * 1) / totalReactions;
    this.analytics.popularityScore = (this.analytics.totalLikes - this.analytics.totalDislikes) / this.analytics.totalPlays;
  }
  
  return this.save();
};

trackSchema.methods.calculateSimilarity = function(otherTrack) {
  const features1 = this.features;
  const features2 = otherTrack.features;
  
  // Calculate Euclidean distance in feature space
  const energyDiff = Math.pow(features1.energy - features2.energy, 2);
  const valenceDiff = Math.pow(features1.valence - features2.valence, 2);
  const tempoDiff = Math.pow((features1.tempo - features2.tempo) / 100, 2); // Normalize tempo
  const acousticDiff = Math.pow(features1.acousticness - features2.acousticness, 2);
  const danceDiff = Math.pow(features1.danceability - features2.danceability, 2);
  
  const distance = Math.sqrt(energyDiff + valenceDiff + tempoDiff + acousticDiff + danceDiff);
  
  // Convert distance to similarity (0-1 scale)
  const similarity = 1 / (1 + distance);
  
  // Boost similarity for same genre/artist
  let boost = 1;
  if (this.genre === otherTrack.genre) boost += 0.2;
  if (this.artist === otherTrack.artist) boost += 0.3;
  if (Math.abs(this.era - otherTrack.era) <= 10) boost += 0.1;
  
  return Math.min(similarity * boost, 1);
};

// Static methods
trackSchema.statics.findByGenre = function(genre) {
  return this.find({ genre: new RegExp(genre, 'i'), isActive: true });
};

trackSchema.statics.findByArtist = function(artist) {
  return this.find({ artist: new RegExp(artist, 'i'), isActive: true });
};

trackSchema.statics.findByEra = function(startYear, endYear) {
  return this.find({ 
    era: { $gte: startYear, $lte: endYear },
    isActive: true 
  });
};

trackSchema.statics.searchTracks = function(query) {
  return this.find(
    { $text: { $search: query }, isActive: true },
    { score: { $meta: 'textScore' } }
  ).sort({ score: { $meta: 'textScore' } });
};

trackSchema.statics.getPopularTracks = function(limit = 20) {
  return this.find({ isActive: true })
    .sort({ 'analytics.popularityScore': -1 })
    .limit(limit);
};

trackSchema.statics.getRecentlyPlayed = function(limit = 20) {
  return this.find({ 
    isActive: true,
    'analytics.lastPlayed': { $ne: null }
  })
    .sort({ 'analytics.lastPlayed': -1 })
    .limit(limit);
};

trackSchema.statics.getSimilarTracks = function(trackId, limit = 10) {
  // This would be implemented with vector similarity search in production
  // For now, we'll use a simplified approach
  return this.findById(trackId).then(track => {
    if (!track) return [];
    
    return this.find({
      _id: { $ne: trackId },
      isActive: true,
      $or: [
        { genre: track.genre },
        { artist: track.artist },
        { era: { $gte: track.era - 10, $lte: track.era + 10 } }
      ]
    }).limit(limit);
  });
};

const Track = mongoose.model('Track', trackSchema);

export default Track;

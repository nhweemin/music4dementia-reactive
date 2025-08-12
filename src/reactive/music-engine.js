import { BehaviorSubject, Subject, combineLatest, interval } from 'rxjs';
import { 
  map, 
  filter, 
  debounceTime, 
  distinctUntilChanged, 
  switchMap, 
  startWith,
  scan,
  tap
} from 'rxjs/operators';

export class MusicRecommendationEngine {
  constructor() {
    // Reactive streams for music data
    this.userPreferences$ = new BehaviorSubject(new Map());
    this.trackFeatures$ = new BehaviorSubject(new Map());
    this.sessionContext$ = new BehaviorSubject(new Map());
    this.realtimeReactions$ = new Subject();
    
    // ML model states (simplified for demo)
    this.collaborativeModel$ = new BehaviorSubject(new Map());
    this.contentModel$ = new BehaviorSubject(new Map());
    
    // Recommendation streams
    this.recommendations$ = combineLatest([
      this.userPreferences$,
      this.trackFeatures$,
      this.sessionContext$,
      this.realtimeReactions$.pipe(startWith(null))
    ]).pipe(
      debounceTime(500), // Prevent excessive recalculations
      map(([preferences, features, context, lastReaction]) => 
        this.generateRecommendations(preferences, features, context, lastReaction)
      )
    );
    
    // Initialize with default data
    this.initializeEngine();
    
    console.log('Reactive Music Recommendation Engine initialized');
  }
  
  // Initialize the engine with default data and models
  async initializeEngine() {
    // Load pre-computed track features (in real app, this would come from DB)
    const trackFeatures = new Map([
      ['track1', { genre: 'classical', era: 1960, energy: 0.3, valence: 0.7, tempo: 80 }],
      ['track2', { genre: 'folk', era: 1970, energy: 0.5, valence: 0.8, tempo: 100 }],
      ['track3', { genre: 'jazz', era: 1950, energy: 0.6, valence: 0.6, tempo: 120 }],
      ['track4', { genre: 'blues', era: 1960, energy: 0.4, valence: 0.5, tempo: 90 }],
      ['track5', { genre: 'classical', era: 1940, energy: 0.2, valence: 0.9, tempo: 70 }]
    ]);
    
    this.trackFeatures$.next(trackFeatures);
    
    // Start periodic model updates
    interval(30000).subscribe(() => {
      this.updateModels();
    });
  }
  
  // Process user feedback reactively
  async processUserFeedback(feedbackData) {
    const { sessionId, trackId, action, timestamp } = feedbackData;
    
    // Emit reaction for real-time processing
    this.realtimeReactions$.next({
      sessionId,
      trackId,
      action,
      timestamp,
      weight: this.getActionWeight(action)
    });
    
    // Update user preferences
    await this.updateUserPreferences(sessionId, trackId, action);
    
    // Generate immediate recommendations
    const recommendations = await this.getSessionRecommendations(sessionId);
    
    return {
      success: true,
      nextTracks: recommendations,
      sessionMetrics: this.getSessionMetrics(sessionId)
    };
  }
  
  // Process reaction with intensity
  async processReaction(reactionData) {
    const { sessionId, trackId, reaction, intensity, profileId, timestamp } = reactionData;
    
    // Convert reaction to numerical score
    const score = this.reactionToScore(reaction, intensity);
    
    // Emit for real-time processing
    this.realtimeReactions$.next({
      sessionId,
      trackId,
      profileId,
      score,
      timestamp,
      reaction,
      intensity
    });
    
    // Update preferences with weighted score
    await this.updateUserPreferencesWithScore(profileId, trackId, score);
    
    // Get adaptive recommendations
    const nextTracks = await this.getAdaptiveRecommendations(sessionId, profileId, reactionData);
    
    return {
      success: true,
      nextTracks,
      confidence: this.calculateConfidence(sessionId, profileId),
      sessionMetrics: this.getSessionMetrics(sessionId)
    };
  }
  
  // Get session-specific recommendations
  async getSessionRecommendations(sessionId, profileId = null) {
    const context = this.sessionContext$.value.get(sessionId) || {};
    const preferences = profileId ? this.userPreferences$.value.get(profileId) : new Map();
    
    // Collaborative filtering recommendations
    const collaborativeRecs = await this.getCollaborativeRecommendations(profileId, 5);
    
    // Content-based recommendations
    const contentRecs = await this.getContentBasedRecommendations(context, preferences, 5);
    
    // Real-time context recommendations
    const contextRecs = await this.getContextualRecommendations(sessionId, 5);
    
    // Combine and rank recommendations
    const combinedRecs = this.combineRecommendations([
      { recommendations: collaborativeRecs, weight: 0.4 },
      { recommendations: contentRecs, weight: 0.4 },
      { recommendations: contextRecs, weight: 0.2 }
    ]);
    
    return combinedRecs.slice(0, 10); // Return top 10
  }
  
  // Get adaptive recommendations based on real-time feedback
  async getAdaptiveRecommendations(sessionId, profileId, lastReaction) {
    const { trackId, reaction, intensity } = lastReaction;
    const trackFeatures = this.trackFeatures$.value.get(trackId);
    
    if (!trackFeatures) {
      return this.getSessionRecommendations(sessionId, profileId);
    }
    
    // If positive reaction, find similar tracks
    if (reaction === 'like' || reaction === 'strongly like' || intensity >= 4) {
      return this.getSimilarTracks(trackFeatures, 5);
    }
    
    // If negative reaction, find contrasting tracks
    if (reaction === 'dislike' || reaction === 'strongly dislike' || intensity <= 2) {
      return this.getContrastingTracks(trackFeatures, 5);
    }
    
    // Neutral reaction - maintain diversity
    return this.getDiverseRecommendations(sessionId, profileId, 5);
  }
  
  // Collaborative filtering
  async getCollaborativeRecommendations(profileId, count) {
    const collaborativeModel = this.collaborativeModel$.value;
    const similarUsers = collaborativeModel.get(profileId) || [];
    
    // Find tracks liked by similar users
    const recommendations = [];
    for (const similarUser of similarUsers.slice(0, 5)) {
      const userPrefs = this.userPreferences$.value.get(similarUser.userId) || new Map();
      for (const [trackId, score] of userPrefs) {
        if (score >= 4) { // High rated tracks
          recommendations.push({
            trackId,
            score: score * similarUser.similarity,
            reason: 'collaborative'
          });
        }
      }
    }
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }
  
  // Content-based filtering
  async getContentBasedRecommendations(context, preferences, count) {
    const trackFeatures = this.trackFeatures$.value;
    const recommendations = [];
    
    // Calculate preference vector from user's history
    const preferenceVector = this.calculatePreferenceVector(preferences);
    
    // Score all tracks based on content similarity
    for (const [trackId, features] of trackFeatures) {
      const similarity = this.calculateContentSimilarity(preferenceVector, features);
      const contextBoost = this.calculateContextBoost(features, context);
      
      recommendations.push({
        trackId,
        score: similarity * contextBoost,
        reason: 'content'
      });
    }
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }
  
  // Contextual recommendations based on current session
  async getContextualRecommendations(sessionId, count) {
    const context = this.sessionContext$.value.get(sessionId) || {};
    const { timeOfDay, sessionDuration, averageReaction, lastTracks } = context;
    
    const trackFeatures = this.trackFeatures$.value;
    const recommendations = [];
    
    for (const [trackId, features] of trackFeatures) {
      // Skip recently played tracks
      if (lastTracks && lastTracks.includes(trackId)) continue;
      
      let score = 0.5; // Base score
      
      // Time of day influence
      if (timeOfDay === 'morning' && features.energy > 0.5) score += 0.2;
      if (timeOfDay === 'evening' && features.energy < 0.5) score += 0.2;
      
      // Session duration influence
      if (sessionDuration > 30 * 60 * 1000) { // More than 30 minutes
        score += features.valence * 0.3; // Prefer positive tracks for long sessions
      }
      
      // Average reaction influence
      if (averageReaction > 3.5 && features.valence > 0.6) score += 0.3;
      if (averageReaction < 2.5 && features.valence < 0.4) score -= 0.2;
      
      recommendations.push({
        trackId,
        score,
        reason: 'contextual'
      });
    }
    
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }
  
  // Find tracks similar to the given track
  getSimilarTracks(targetFeatures, count) {
    const trackFeatures = this.trackFeatures$.value;
    const similarities = [];
    
    for (const [trackId, features] of trackFeatures) {
      const similarity = this.calculateContentSimilarity(targetFeatures, features);
      similarities.push({
        trackId,
        score: similarity,
        reason: 'similar'
      });
    }
    
    return similarities
      .sort((a, b) => b.score - a.score)
      .slice(1, count + 1); // Skip the target track itself
  }
  
  // Find tracks contrasting to the given track
  getContrastingTracks(targetFeatures, count) {
    const trackFeatures = this.trackFeatures$.value;
    const contrasts = [];
    
    for (const [trackId, features] of trackFeatures) {
      const contrast = 1 - this.calculateContentSimilarity(targetFeatures, features);
      contrasts.push({
        trackId,
        score: contrast,
        reason: 'contrasting'
      });
    }
    
    return contrasts
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
  }
  
  // Get diverse recommendations
  getDiverseRecommendations(sessionId, profileId, count) {
    const context = this.sessionContext$.value.get(sessionId) || {};
    const playedTracks = context.lastTracks || [];
    
    const trackFeatures = this.trackFeatures$.value;
    const diverse = [];
    
    // Group tracks by genre and era for diversity
    const genreGroups = new Map();
    for (const [trackId, features] of trackFeatures) {
      if (playedTracks.includes(trackId)) continue;
      
      const key = `${features.genre}_${Math.floor(features.era / 10) * 10}`;
      if (!genreGroups.has(key)) {
        genreGroups.set(key, []);
      }
      genreGroups.get(key).push({ trackId, features });
    }
    
    // Select one track from each group
    for (const [group, tracks] of genreGroups) {
      if (diverse.length >= count) break;
      
      const randomTrack = tracks[Math.floor(Math.random() * tracks.length)];
      diverse.push({
        trackId: randomTrack.trackId,
        score: 0.5 + Math.random() * 0.3, // Add some randomness
        reason: 'diverse'
      });
    }
    
    return diverse.slice(0, count);
  }
  
  // Combine multiple recommendation sources
  combineRecommendations(sources) {
    const combined = new Map();
    
    for (const { recommendations, weight } of sources) {
      for (const rec of recommendations) {
        const existing = combined.get(rec.trackId);
        if (existing) {
          existing.score += rec.score * weight;
          existing.reasons.push(rec.reason);
        } else {
          combined.set(rec.trackId, {
            trackId: rec.trackId,
            score: rec.score * weight,
            reasons: [rec.reason]
          });
        }
      }
    }
    
    return Array.from(combined.values())
      .sort((a, b) => b.score - a.score);
  }
  
  // Helper methods
  getActionWeight(action) {
    const weights = {
      'PLAY': 0.1,
      'PAUSE': -0.1,
      'SKIP': -0.5,
      'LIKE': 1.0,
      'DISLIKE': -1.0,
      'REPEAT': 0.8
    };
    return weights[action] || 0;
  }
  
  reactionToScore(reaction, intensity) {
    const baseScores = {
      'strongly like': 5,
      'like': 4,
      'neutral': 3,
      'dislike': 2,
      'strongly dislike': 1
    };
    
    return intensity || baseScores[reaction] || 3;
  }
  
  calculateContentSimilarity(features1, features2) {
    // Simple cosine similarity for demo
    const genres = features1.genre === features2.genre ? 1 : 0;
    const eras = 1 - Math.abs(features1.era - features2.era) / 50; // Normalize era difference
    const energy = 1 - Math.abs(features1.energy - features2.energy);
    const valence = 1 - Math.abs(features1.valence - features2.valence);
    const tempo = 1 - Math.abs(features1.tempo - features2.tempo) / 100;
    
    return (genres * 0.3 + eras * 0.2 + energy * 0.2 + valence * 0.2 + tempo * 0.1);
  }
  
  calculatePreferenceVector(preferences) {
    // Calculate average preferences from user history
    const vector = { genre: new Map(), era: 0, energy: 0, valence: 0, tempo: 0 };
    let count = 0;
    
    for (const [trackId, score] of preferences) {
      const features = this.trackFeatures$.value.get(trackId);
      if (features && score >= 3) { // Only positive ratings
        vector.genre.set(features.genre, (vector.genre.get(features.genre) || 0) + score);
        vector.era += features.era * score;
        vector.energy += features.energy * score;
        vector.valence += features.valence * score;
        vector.tempo += features.tempo * score;
        count += score;
      }
    }
    
    if (count > 0) {
      vector.era /= count;
      vector.energy /= count;
      vector.valence /= count;
      vector.tempo /= count;
    }
    
    return vector;
  }
  
  calculateContextBoost(features, context) {
    let boost = 1.0;
    
    // Add context-specific boosts
    if (context.preferredGenres && context.preferredGenres.includes(features.genre)) {
      boost += 0.3;
    }
    
    if (context.energyLevel && Math.abs(context.energyLevel - features.energy) < 0.2) {
      boost += 0.2;
    }
    
    return Math.min(boost, 2.0); // Cap at 2x boost
  }
  
  calculateConfidence(sessionId, profileId) {
    const preferences = this.userPreferences$.value.get(profileId);
    const context = this.sessionContext$.value.get(sessionId);
    
    if (!preferences || preferences.size < 5) return 0.3; // Low confidence with few data points
    if (!context || !context.reactionHistory || context.reactionHistory.length < 3) return 0.5;
    
    return Math.min(0.9, 0.3 + (preferences.size * 0.02) + (context.reactionHistory.length * 0.05));
  }
  
  getSessionMetrics(sessionId) {
    const context = this.sessionContext$.value.get(sessionId) || {};
    return {
      sessionId,
      trackCount: context.tracksPlayed || 0,
      averageReaction: context.averageReaction || 3,
      engagementLevel: context.engagementLevel || 0.5,
      recommendationAccuracy: context.recommendationAccuracy || 0.5
    };
  }
  
  // Update methods
  async updateUserPreferences(sessionId, trackId, action) {
    // Implementation for updating user preferences
    // This would typically update the database
  }
  
  async updateUserPreferencesWithScore(profileId, trackId, score) {
    const preferences = this.userPreferences$.value;
    const userPrefs = preferences.get(profileId) || new Map();
    
    userPrefs.set(trackId, score);
    preferences.set(profileId, userPrefs);
    this.userPreferences$.next(new Map(preferences));
  }
  
  updateModels() {
    // Placeholder for ML model updates
    console.log('Updating ML models with latest data...');
  }
}


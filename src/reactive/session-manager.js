import { BehaviorSubject, Subject, combineLatest } from 'rxjs';
import { map, filter, scan, startWith } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export class ReactiveSessionManager {
  constructor() {
    // Reactive state for all sessions
    this.sessions$ = new BehaviorSubject(new Map());
    this.userReactions$ = new Subject();
    this.sessionEvents$ = new Subject();
    
    // Session metrics stream
    this.sessionMetrics$ = combineLatest([
      this.sessions$,
      this.userReactions$.pipe(startWith(null))
    ]).pipe(
      map(([sessions, lastReaction]) => {
        const metrics = new Map();
        
        sessions.forEach((session, sessionId) => {
          metrics.set(sessionId, this.calculateSessionMetrics(session));
        });
        
        return metrics;
      })
    );
    
    // Track active sessions
    this.activeSessions = new Map();
    this.userSessions = new Map(); // userId -> sessionId mapping
    
    console.log('ReactiveSessionManager initialized');
  }
  
  // Create a new music therapy session
  createSession(options = {}) {
    const sessionId = options.sessionId || uuidv4();
    const session = {
      id: sessionId,
      createdAt: Date.now(),
      participants: new Map(),
      currentTrack: null,
      playlist: [],
      reactions: [],
      metrics: {
        totalDuration: 0,
        tracksPlayed: 0,
        positiveReactions: 0,
        negativeReactions: 0,
        averageEngagement: 0
      },
      settings: {
        autoNext: true,
        reactionThreshold: 3,
        maxParticipants: 10,
        ...options.settings
      }
    };
    
    this.activeSessions.set(sessionId, session);
    
    // Update reactive state
    const currentSessions = this.sessions$.value;
    currentSessions.set(sessionId, session);
    this.sessions$.next(new Map(currentSessions));
    
    // Emit session event
    this.sessionEvents$.next({
      type: 'SESSION_CREATED',
      sessionId,
      timestamp: Date.now()
    });
    
    console.log(`Session created: ${sessionId}`);
    return session;
  }
  
  // Add user to session
  async joinSession(sessionId, userInfo) {
    const session = this.activeSessions.get(sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    
    const { userId, profileId, connectionId } = userInfo;
    
    // Add participant
    session.participants.set(userId, {
      userId,
      profileId,
      connectionId,
      joinedAt: Date.now(),
      reactions: [],
      currentEngagement: 0,
      totalListeningTime: 0
    });
    
    // Update user session mapping
    this.userSessions.set(userId, sessionId);
    
    // Update reactive state
    const currentSessions = this.sessions$.value;
    currentSessions.set(sessionId, session);
    this.sessions$.next(new Map(currentSessions));
    
    // Emit session event
    this.sessionEvents$.next({
      type: 'USER_JOINED',
      sessionId,
      userId,
      profileId,
      timestamp: Date.now()
    });
    
    console.log(`User ${userId} joined session ${sessionId}`);
    return session;
  }
  
  // Remove user from session
  leaveSession(sessionId, connectionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    // Find user by connection ID
    let userIdToRemove = null;
    for (const [userId, participant] of session.participants) {
      if (participant.connectionId === connectionId) {
        userIdToRemove = userId;
        break;
      }
    }
    
    if (userIdToRemove) {
      session.participants.delete(userIdToRemove);
      this.userSessions.delete(userIdToRemove);
      
      // Update reactive state
      const currentSessions = this.sessions$.value;
      currentSessions.set(sessionId, session);
      this.sessions$.next(new Map(currentSessions));
      
      // Emit session event
      this.sessionEvents$.next({
        type: 'USER_LEFT',
        sessionId,
        userId: userIdToRemove,
        timestamp: Date.now()
      });
      
      console.log(`User ${userIdToRemove} left session ${sessionId}`);
      
      // Clean up empty sessions
      if (session.participants.size === 0) {
        this.endSession(sessionId);
      }
    }
  }
  
  // Update user reaction
  updateUserReaction(sessionId, reactionData) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    const { trackId, reaction, intensity, profileId, timestamp } = reactionData;
    
    // Add to session reactions
    session.reactions.push({
      trackId,
      reaction,
      intensity,
      profileId,
      timestamp
    });
    
    // Update participant data
    for (const [userId, participant] of session.participants) {
      if (participant.profileId === profileId) {
        participant.reactions.push(reactionData);
        participant.currentEngagement = this.calculateEngagement(participant.reactions);
        break;
      }
    }
    
    // Update session metrics
    this.updateSessionMetrics(session, reactionData);
    
    // Update reactive state
    const currentSessions = this.sessions$.value;
    currentSessions.set(sessionId, session);
    this.sessions$.next(new Map(currentSessions));
    
    // Emit reaction event
    this.userReactions$.next({
      sessionId,
      ...reactionData
    });
    
    console.log(`Reaction updated in session ${sessionId}: ${reaction} (${intensity})`);
  }
  
  // Update currently playing track
  updateCurrentTrack(sessionId, trackInfo) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    session.currentTrack = {
      ...trackInfo,
      startedAt: Date.now()
    };
    
    session.metrics.tracksPlayed++;
    
    // Update reactive state
    const currentSessions = this.sessions$.value;
    currentSessions.set(sessionId, session);
    this.sessions$.next(new Map(currentSessions));
    
    // Emit session event
    this.sessionEvents$.next({
      type: 'TRACK_CHANGED',
      sessionId,
      track: trackInfo,
      timestamp: Date.now()
    });
    
    console.log(`Track updated in session ${sessionId}: ${trackInfo.title}`);
  }
  
  // Get session metrics
  getSessionMetrics(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return null;
    
    return this.calculateSessionMetrics(session);
  }
  
  // Calculate session metrics
  calculateSessionMetrics(session) {
    const now = Date.now();
    const duration = now - session.createdAt;
    
    // Calculate engagement metrics
    const reactions = session.reactions;
    const positiveReactions = reactions.filter(r => 
      r.reaction === 'like' || r.reaction === 'strongly like' || r.intensity >= 4
    ).length;
    const negativeReactions = reactions.filter(r => 
      r.reaction === 'dislike' || r.reaction === 'strongly dislike' || r.intensity <= 2
    ).length;
    
    // Calculate average engagement
    const participantEngagements = Array.from(session.participants.values())
      .map(p => p.currentEngagement || 0);
    const averageEngagement = participantEngagements.length > 0 
      ? participantEngagements.reduce((sum, eng) => sum + eng, 0) / participantEngagements.length 
      : 0;
    
    return {
      sessionId: session.id,
      duration,
      participantCount: session.participants.size,
      tracksPlayed: session.metrics.tracksPlayed,
      totalReactions: reactions.length,
      positiveReactions,
      negativeReactions,
      positivityRatio: reactions.length > 0 ? positiveReactions / reactions.length : 0,
      averageEngagement,
      currentTrack: session.currentTrack,
      isActive: true,
      lastActivity: reactions.length > 0 ? Math.max(...reactions.map(r => r.timestamp)) : session.createdAt
    };
  }
  
  // Calculate user engagement score
  calculateEngagement(reactions) {
    if (!reactions || reactions.length === 0) return 0;
    
    // Recent reactions have more weight
    const now = Date.now();
    const weightedScores = reactions.map(reaction => {
      const ageWeight = Math.exp(-(now - reaction.timestamp) / (5 * 60 * 1000)); // 5 min decay
      const intensityScore = reaction.intensity || 3;
      return intensityScore * ageWeight;
    });
    
    return weightedScores.reduce((sum, score) => sum + score, 0) / weightedScores.length;
  }
  
  // Update session metrics
  updateSessionMetrics(session, reactionData) {
    const { reaction, intensity } = reactionData;
    
    if (reaction === 'like' || reaction === 'strongly like' || intensity >= 4) {
      session.metrics.positiveReactions++;
    } else if (reaction === 'dislike' || reaction === 'strongly dislike' || intensity <= 2) {
      session.metrics.negativeReactions++;
    }
    
    // Recalculate average engagement
    const participantEngagements = Array.from(session.participants.values())
      .map(p => p.currentEngagement || 0);
    session.metrics.averageEngagement = participantEngagements.length > 0 
      ? participantEngagements.reduce((sum, eng) => sum + eng, 0) / participantEngagements.length 
      : 0;
  }
  
  // Check if profile is in session
  isProfileInSession(sessionId, profileId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return false;
    
    for (const participant of session.participants.values()) {
      if (participant.profileId === profileId) {
        return true;
      }
    }
    return false;
  }
  
  // End session
  endSession(sessionId) {
    const session = this.activeSessions.get(sessionId);
    if (!session) return;
    
    // Clean up user mappings
    for (const participant of session.participants.values()) {
      this.userSessions.delete(participant.userId);
    }
    
    // Remove from active sessions
    this.activeSessions.delete(sessionId);
    
    // Update reactive state
    const currentSessions = this.sessions$.value;
    currentSessions.delete(sessionId);
    this.sessions$.next(new Map(currentSessions));
    
    // Emit session event
    this.sessionEvents$.next({
      type: 'SESSION_ENDED',
      sessionId,
      timestamp: Date.now(),
      finalMetrics: this.calculateSessionMetrics(session)
    });
    
    console.log(`Session ended: ${sessionId}`);
  }
  
  // Get all active sessions
  getActiveSessions() {
    return Array.from(this.activeSessions.values());
  }
  
  // Get session by ID
  getSession(sessionId) {
    return this.activeSessions.get(sessionId);
  }
  
  // Get user's current session
  getUserSession(userId) {
    const sessionId = this.userSessions.get(userId);
    return sessionId ? this.activeSessions.get(sessionId) : null;
  }
}

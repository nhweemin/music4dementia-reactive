import { Subject, BehaviorSubject, fromEvent, merge } from 'rxjs';
import { 
  map, 
  filter, 
  debounceTime, 
  distinctUntilChanged,
  switchMap,
  takeUntil,
  tap,
  catchError
} from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';

export function setupWebSocketHandlers(fastify) {
  // Global subjects for reactive streams
  const sessionUpdates$ = new Subject();
  const musicEvents$ = new Subject();
  const userReactions$ = new Subject();
  
  // WebSocket route for music therapy sessions
  fastify.register(async function (fastify) {
    fastify.get('/ws/session/:sessionId', { websocket: true }, (connection, request) => {
      const sessionId = request.params.sessionId;
      const connectionId = uuidv4();
      
      fastify.log.info(`New WebSocket connection: ${connectionId} for session: ${sessionId}`);
      
      // Create observables for this connection
      const disconnect$ = fromEvent(connection.socket, 'close');
      const message$ = fromEvent(connection.socket, 'message').pipe(
        map(data => {
          try {
            return JSON.parse(data.toString());
          } catch (error) {
            fastify.log.error('Invalid JSON received:', data.toString());
            return null;
          }
        }),
        filter(data => data !== null)
      );
      
      // Handle different message types reactively
      const musicControls$ = message$.pipe(
        filter(msg => msg.type === 'MUSIC_CONTROL'),
        tap(msg => fastify.log.info(`Music control: ${msg.action} in session ${sessionId}`))
      );
      
      const userReactions$ = message$.pipe(
        filter(msg => msg.type === 'USER_REACTION'),
        debounceTime(300), // Prevent spam reactions
        tap(msg => fastify.log.info(`User reaction: ${msg.reaction} for track ${msg.trackId}`))
      );
      
      const sessionJoin$ = message$.pipe(
        filter(msg => msg.type === 'JOIN_SESSION'),
        tap(msg => fastify.log.info(`User ${msg.userId} joined session ${sessionId}`))
      );
      
      // Subscribe to reactive streams
      
      // Handle music controls (play, pause, skip, etc.)
      musicControls$.pipe(
        switchMap(async (msg) => {
          const { action, trackId, timestamp } = msg;
          
          // Broadcast to all clients in the session
          const musicEvent = {
            type: 'MUSIC_EVENT',
            sessionId,
            action,
            trackId,
            timestamp: timestamp || Date.now(),
            connectionId
          };
          
          musicEvents$.next(musicEvent);
          
          // Update music recommendation engine
          if (action === 'SKIP' || action === 'LIKE' || action === 'DISLIKE') {
            try {
              const recommendations = await fastify.musicEngine.processUserFeedback({
                sessionId,
                trackId,
                action,
                timestamp
              });
              
              return {
                type: 'RECOMMENDATIONS_UPDATED',
                sessionId,
                recommendations
              };
            } catch (error) {
              fastify.log.error('Error processing music feedback:', error);
              return null;
            }
          }
          
          return musicEvent;
        }),
        filter(event => event !== null),
        takeUntil(disconnect$)
      ).subscribe({
        next: (event) => {
          connection.socket.send(JSON.stringify(event));
        },
        error: (error) => {
          fastify.log.error('Music controls stream error:', error);
        }
      });
      
      // Handle user reactions with real-time processing
      userReactions$.pipe(
        switchMap(async (msg) => {
          const { trackId, reaction, intensity, profileId } = msg;
          
          try {
            // Process reaction through music engine
            const response = await fastify.musicEngine.processReaction({
              sessionId,
              trackId,
              reaction,
              intensity: intensity || 3,
              profileId,
              timestamp: Date.now()
            });
            
            // Update session manager
            fastify.sessionManager.updateUserReaction(sessionId, {
              trackId,
              reaction,
              intensity,
              profileId,
              timestamp: Date.now()
            });
            
            return {
              type: 'REACTION_PROCESSED',
              sessionId,
              trackId,
              reaction,
              suggestions: response.nextTracks || [],
              sessionMetrics: response.sessionMetrics || {}
            };
          } catch (error) {
            fastify.log.error('Error processing user reaction:', error);
            return {
              type: 'REACTION_ERROR',
              error: 'Failed to process reaction'
            };
          }
        }),
        takeUntil(disconnect$)
      ).subscribe({
        next: (response) => {
          connection.socket.send(JSON.stringify(response));
        },
        error: (error) => {
          fastify.log.error('User reactions stream error:', error);
        }
      });
      
      // Handle session join and initialize reactive session
      sessionJoin$.pipe(
        switchMap(async (msg) => {
          const { userId, profileId } = msg;
          
          try {
            // Register user in session
            const sessionInfo = await fastify.sessionManager.joinSession(sessionId, {
              userId,
              profileId,
              connectionId,
              joinedAt: Date.now()
            });
            
            // Get initial recommendations
            const initialRecommendations = await fastify.musicEngine.getSessionRecommendations(sessionId, profileId);
            
            return {
              type: 'SESSION_JOINED',
              sessionId,
              sessionInfo,
              initialRecommendations,
              connectionId
            };
          } catch (error) {
            fastify.log.error('Error joining session:', error);
            return {
              type: 'SESSION_JOIN_ERROR',
              error: 'Failed to join session'
            };
          }
        }),
        takeUntil(disconnect$)
      ).subscribe({
        next: (response) => {
          connection.socket.send(JSON.stringify(response));
        },
        error: (error) => {
          fastify.log.error('Session join stream error:', error);
        }
      });
      
      // Send periodic session updates
      const sessionUpdates = setInterval(() => {
        const sessionMetrics = fastify.sessionManager.getSessionMetrics(sessionId);
        if (sessionMetrics) {
          connection.socket.send(JSON.stringify({
            type: 'SESSION_UPDATE',
            sessionId,
            metrics: sessionMetrics,
            timestamp: Date.now()
          }));
        }
      }, 10000); // Every 10 seconds
      
      // Handle connection close
      disconnect$.subscribe(() => {
        fastify.log.info(`WebSocket disconnected: ${connectionId} from session: ${sessionId}`);
        clearInterval(sessionUpdates);
        
        // Remove user from session
        fastify.sessionManager.leaveSession(sessionId, connectionId);
      });
      
      // Send welcome message
      connection.socket.send(JSON.stringify({
        type: 'CONNECTION_ESTABLISHED',
        connectionId,
        sessionId,
        timestamp: Date.now(),
        message: 'Connected to Fuxi Music Therapy Session'
      }));
    });
    
    // WebSocket route for real-time music analytics
    fastify.get('/ws/analytics/:profileId', { websocket: true }, (connection, request) => {
      const profileId = request.params.profileId;
      const connectionId = uuidv4();
      
      fastify.log.info(`Analytics WebSocket connected: ${connectionId} for profile: ${profileId}`);
      
      const disconnect$ = fromEvent(connection.socket, 'close');
      
      // Stream real-time analytics
      const analytics$ = musicEvents$.pipe(
        filter(event => event.sessionId && fastify.sessionManager.isProfileInSession(event.sessionId, profileId)),
        map(event => ({
          type: 'ANALYTICS_UPDATE',
          profileId,
          event,
          timestamp: Date.now()
        })),
        takeUntil(disconnect$)
      );
      
      analytics$.subscribe({
        next: (analyticsData) => {
          connection.socket.send(JSON.stringify(analyticsData));
        },
        error: (error) => {
          fastify.log.error('Analytics stream error:', error);
        }
      });
      
      disconnect$.subscribe(() => {
        fastify.log.info(`Analytics WebSocket disconnected: ${connectionId}`);
      });
      
      connection.socket.send(JSON.stringify({
        type: 'ANALYTICS_CONNECTED',
        profileId,
        connectionId,
        timestamp: Date.now()
      }));
    });
  });
  
  // Expose reactive streams for other modules
  fastify.decorate('reactiveStreams', {
    sessionUpdates$,
    musicEvents$,
    userReactions$
  });
  
  fastify.log.info('WebSocket handlers setup complete with reactive streams');
}


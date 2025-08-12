# Fuxi Reactive Backend 🎵⚡

A cutting-edge reactive music therapy backend built with Node.js, WebSockets, and RxJS for real-time dementia patient care.

## 🌟 Features

### 🚀 Reactive Architecture
- **Real-time WebSocket connections** for live music therapy sessions
- **RxJS streams** for reactive data processing
- **Event-driven architecture** with reactive state management
- **Live session analytics** with real-time metrics

### 🎵 Advanced Music Engine
- **Reactive recommendation engine** with real-time adaptation
- **Multi-strategy filtering**: Collaborative, content-based, and contextual
- **Real-time preference learning** from user reactions
- **Dynamic playlist generation** based on live feedback

### 🔄 Real-time Features
- **Live session management** with multiple participants
- **Real-time reaction processing** (1-5 scale + emotional reactions)
- **Instant music recommendations** based on current context
- **Live analytics dashboard** for caregivers
- **Session monitoring** with engagement metrics

### 🏥 Healthcare Focused
- **Dementia-specific algorithms** optimized for memory care
- **Caregiver dashboard** with real-time patient insights
- **Safety features** with reaction monitoring
- **Accessibility-first design** for elderly users

## 🛠️ Tech Stack

### Core Framework
- **Fastify** - High-performance Node.js web framework
- **RxJS** - Reactive programming with observables
- **WebSockets** - Real-time bidirectional communication
- **MongoDB** - Flexible document database with reactive queries

### Reactive Technologies
- **Socket.io** - Enhanced WebSocket functionality
- **Redis** - Real-time data caching and pub/sub
- **Event Streams** - Reactive data flow architecture
- **Real-time Analytics** - Live metrics and monitoring

### Security & Authentication
- **JWT** - Secure token-based authentication
- **bcrypt** - Password hashing
- **Rate limiting** - API protection
- **CORS** - Cross-origin security

## 🏗️ Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Frontend      │◄──►│  WebSocket API   │◄──►│  Session Manager│
│  (React Native)│    │  (Fastify +      │    │  (Reactive)     │
└─────────────────┘    │   Socket.io)     │    └─────────────────┘
                       └──────────────────┘              │
                                 │                       │
                       ┌──────────────────┐    ┌─────────────────┐
                       │   REST API       │    │  Music Engine   │
                       │  (Authentication)│    │  (RxJS Streams) │
                       └──────────────────┘    └─────────────────┘
                                 │                       │
                       ┌──────────────────┐    ┌─────────────────┐
                       │    MongoDB       │    │     Redis       │
                       │   (Database)     │    │   (Cache/Pub)   │
                       └──────────────────┘    └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MongoDB 4.4+
- Redis (optional, for scaling)

### Installation

1. **Clone and setup**
   ```bash
   git clone <repository>
   cd fuxi_reactive_backend
   npm install
   ```

2. **Environment configuration**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Test the health endpoint**
   ```bash
   curl http://localhost:3000/health
   ```

## 🔧 API Endpoints

### Authentication
```
POST /api/v1/auth/signup      - Create account
POST /api/v1/auth/signin      - Login
POST /api/v1/auth/verify      - Verify account with OTP
POST /api/v1/auth/forgot-password - Request password reset
POST /api/v1/auth/reset-password  - Reset password
```

### Real-time Sessions
```
POST /api/v1/sessions         - Create therapy session
GET  /api/v1/sessions/:id     - Get session details
POST /api/v1/sessions/:id/join - Join session
POST /api/v1/sessions/:id/reaction - Submit reaction
GET  /api/v1/sessions/:id/recommendations - Get live recommendations
```

### WebSocket Endpoints
```
ws://localhost:3000/ws/session/:sessionId    - Join therapy session
ws://localhost:3000/ws/analytics/:profileId  - Live analytics stream
```

### Music & Tracks
```
POST /api/v1/tracks/search    - Search tracks
GET  /api/v1/tracks/:id       - Get track details
GET  /api/v1/tracks/:id/similar - Get similar tracks
GET  /api/v1/tracks/popular   - Get popular tracks
```

## 🔌 WebSocket Events

### Client → Server
```javascript
// Join session
{
  "type": "JOIN_SESSION",
  "userId": "user123",
  "profileId": "profile456"
}

// Submit reaction (real-time)
{
  "type": "USER_REACTION",
  "trackId": "track789",
  "reaction": "like",
  "intensity": 4
}

// Music controls
{
  "type": "MUSIC_CONTROL",
  "action": "SKIP",
  "trackId": "track789"
}
```

### Server → Client
```javascript
// Session updates
{
  "type": "SESSION_UPDATE",
  "sessionId": "session123",
  "metrics": {
    "participantCount": 2,
    "averageEngagement": 0.8
  }
}

// Real-time recommendations
{
  "type": "RECOMMENDATIONS_UPDATED",
  "sessionId": "session123",
  "recommendations": [...]
}

// Live analytics
{
  "type": "ANALYTICS_UPDATE",
  "profileId": "profile456",
  "metrics": {...}
}
```

## 🎵 Music Recommendation Engine

### Reactive Algorithms

1. **Collaborative Filtering**
   - Real-time user similarity calculation
   - Live preference updates
   - Cross-user recommendation streams

2. **Content-Based Filtering**
   - Audio feature analysis (energy, valence, tempo)
   - Genre and era matching
   - Real-time feature vector updates

3. **Contextual Recommendations**
   - Session context awareness
   - Time-of-day optimization
   - Caregiver preferences

4. **Adaptive Learning**
   - Real-time reaction processing
   - Dynamic weight adjustment
   - Immediate playlist updates

### Reaction Processing
```javascript
// Real-time reaction processing
const reactionStream$ = userReactions$.pipe(
  debounceTime(300),
  map(reaction => processReaction(reaction)),
  switchMap(result => updateRecommendations(result))
);
```

## 📊 Real-time Analytics

### Session Metrics
- **Live engagement tracking**
- **Real-time reaction analysis**
- **Participant monitoring**
- **Music preference insights**

### Patient Analytics
- **Listening patterns**
- **Emotional response trends**
- **Cognitive engagement levels**
- **Progress tracking**

## 🔒 Security Features

- **JWT Authentication** with secure token management
- **Rate limiting** to prevent API abuse
- **Input validation** with comprehensive schemas
- **CORS configuration** for secure cross-origin requests
- **WebSocket authentication** for secure real-time connections

## 🚀 Deployment

### Railway Deployment

1. **Initialize Railway project**
   ```bash
   railway init
   railway add --database mongo
   ```

2. **Set environment variables**
   ```bash
   railway variables set JWT_SECRET=your-secret-key
   railway variables set MAILER_USERNAME=your-email@gmail.com
   railway variables set MAILER_PASSWORD=your-app-password
   ```

3. **Deploy**
   ```bash
   railway up
   ```

### Environment Variables

Required:
```env
MONGODB_URI=mongodb://...
JWT_SECRET=your-jwt-secret
MAILER_USERNAME=your-email@gmail.com
MAILER_PASSWORD=your-app-password
```

Optional:
```env
PORT=3000
NODE_ENV=production
LOG_LEVEL=info
REDIS_URL=redis://...
```

## 🧪 Testing

### Manual Testing
```bash
# Health check
curl http://localhost:3000/health

# WebSocket connection test
wscat -c ws://localhost:3000/ws/session/test123
```

### Load Testing
```bash
# Test WebSocket concurrent connections
# Test real-time reaction processing
# Test recommendation engine performance
```

## 📈 Performance Features

### Reactive Optimizations
- **Debounced reaction processing** (300ms)
- **Stream-based recommendation updates**
- **Efficient WebSocket message handling**
- **Real-time caching** with Redis

### Database Optimizations
- **Indexed queries** for fast track search
- **Aggregation pipelines** for analytics
- **Connection pooling** for scalability

## 🔄 Reactive Programming Patterns

### Key RxJS Operators Used
```javascript
// Debounced user reactions
userReactions$.pipe(debounceTime(300))

// Combined recommendation streams
combineLatest([preferences$, context$, reactions$])

// Real-time session updates
sessionUpdates$.pipe(distinctUntilChanged())

// Error handling
musicStream$.pipe(catchError(handleMusicError))
```

### Stream Architecture
- **Hot observables** for real-time data
- **Cold observables** for on-demand processing
- **Subject patterns** for event coordination
- **Backpressure handling** for high-frequency events

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing reactive feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the original [Project Fuxi repository](https://github.com/Coding-For-Good-UWC/Project-Fuxi) for details.

## 🙏 Acknowledgments

- **Coding for Good UWC** - Original Project Fuxi team
- **UWCSEA Community** - Support and collaboration
- **Apex Harmony Lodge** - Real-world testing and feedback
- **RxJS Community** - Reactive programming inspiration

---

**🎵 Real-time music therapy for better dementia care! 🧠💙**

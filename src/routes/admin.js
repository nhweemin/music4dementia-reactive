import Track from '../models/Track.js';

// Sample therapeutic music tracks (same as in seed script)
const therapeuticTracks = [
  // Meditation & Mindfulness
  {
    title: "Ocean Waves Meditation",
    artist: "Nature Sounds Collective",
    language: "None",
    genre: "Meditation",
    era: 2023,
    duration: 600,
    features: {
      energy: 0.1,
      valence: 0.7,
      tempo: 60,
      acousticness: 0.9,
      danceability: 0.1,
      instrumentalness: 1.0
    },
    tags: ["meditation", "ocean", "relaxation", "sleep", "anxiety-relief"],
    ytId: "ocean_waves_meditation_2023"
  },
  {
    title: "Breathing Space",
    artist: "Mindful Melodies",
    language: "English",
    genre: "Meditation",
    era: 2022,
    duration: 480,
    features: {
      energy: 0.2,
      valence: 0.8,
      tempo: 72,
      acousticness: 0.8,
      danceability: 0.1,
      instrumentalness: 0.7
    },
    tags: ["breathing", "mindfulness", "guided", "stress-relief", "focus"],
    ytId: "breathing_space_mindful_2022"
  },
  {
    title: "Forest Rain Ambience",
    artist: "Peaceful Soundscapes",
    language: "None",
    genre: "Nature Sounds",
    era: 2023,
    duration: 900,
    features: {
      energy: 0.1,
      valence: 0.6,
      tempo: 55,
      acousticness: 1.0,
      danceability: 0.0,
      instrumentalness: 1.0
    },
    tags: ["rain", "forest", "nature", "sleep", "concentration"],
    ytId: "forest_rain_ambience_2023"
  },
  // Classical Therapy
  {
    title: "Clair de Lune",
    artist: "Claude Debussy",
    language: "None",
    genre: "Classical",
    era: 1905,
    duration: 300,
    features: {
      energy: 0.3,
      valence: 0.7,
      tempo: 80,
      acousticness: 0.9,
      danceability: 0.2,
      instrumentalness: 1.0
    },
    tags: ["classical", "piano", "peaceful", "emotional-healing", "beauty"],
    ytId: "debussy_clair_de_lune_therapy"
  },
  {
    title: "Air on the G String",
    artist: "Johann Sebastian Bach",
    language: "None",
    genre: "Classical",
    era: 1731,
    duration: 360,
    features: {
      energy: 0.4,
      valence: 0.8,
      tempo: 90,
      acousticness: 0.8,
      danceability: 0.2,
      instrumentalness: 1.0
    },
    tags: ["classical", "baroque", "strings", "uplifting", "harmony"],
    ytId: "bach_air_g_string_therapy"
  },
  // Ambient & Electronic Therapy
  {
    title: "Weightless",
    artist: "Marconi Union",
    language: "None",
    genre: "Ambient",
    era: 2011,
    duration: 480,
    features: {
      energy: 0.1,
      valence: 0.6,
      tempo: 50,
      acousticness: 0.3,
      danceability: 0.1,
      instrumentalness: 1.0
    },
    tags: ["ambient", "scientifically-proven", "anxiety-reduction", "calm", "therapeutic"],
    ytId: "marconi_union_weightless_therapy"
  },
  {
    title: "Stellardrone - Light Years",
    artist: "Stellardrone",
    language: "None",
    genre: "Ambient",
    era: 2012,
    duration: 420,
    features: {
      energy: 0.3,
      valence: 0.7,
      tempo: 85,
      acousticness: 0.2,
      danceability: 0.2,
      instrumentalness: 1.0
    },
    tags: ["space-ambient", "cosmic", "meditation", "journey", "transcendence"],
    ytId: "stellardrone_light_years_therapy"
  },
  // Binaural Beats & Frequencies
  {
    title: "432Hz Healing Frequency",
    artist: "Frequency Healers",
    language: "None",
    genre: "Therapy",
    era: 2023,
    duration: 720,
    features: {
      energy: 0.2,
      valence: 0.8,
      tempo: 60,
      acousticness: 0.1,
      danceability: 0.0,
      instrumentalness: 1.0
    },
    tags: ["432hz", "healing-frequency", "chakra", "energy-healing", "vibration"],
    ytId: "432hz_healing_frequency_2023"
  },
  {
    title: "Alpha Waves - Focus & Creativity",
    artist: "Brainwave Entrainment Lab",
    language: "None",
    genre: "Binaural",
    era: 2022,
    duration: 900,
    features: {
      energy: 0.3,
      valence: 0.7,
      tempo: 70,
      acousticness: 0.1,
      danceability: 0.1,
      instrumentalness: 1.0
    },
    tags: ["alpha-waves", "focus", "creativity", "study", "cognitive-enhancement"],
    ytId: "alpha_waves_focus_creativity_2022"
  },
  // World Music Therapy
  {
    title: "Tibetan Singing Bowls",
    artist: "Himalayan Healers",
    language: "None",
    genre: "World",
    era: 2023,
    duration: 600,
    features: {
      energy: 0.2,
      valence: 0.8,
      tempo: 45,
      acousticness: 0.9,
      danceability: 0.0,
      instrumentalness: 1.0
    },
    tags: ["tibetan", "singing-bowls", "chakra-healing", "meditation", "spiritual"],
    ytId: "tibetan_singing_bowls_2023"
  },
  {
    title: "Native American Flute Journey",
    artist: "Wind Spirit",
    language: "None",
    genre: "World",
    era: 2022,
    duration: 540,
    features: {
      energy: 0.3,
      valence: 0.7,
      tempo: 65,
      acousticness: 0.9,
      danceability: 0.1,
      instrumentalness: 1.0
    },
    tags: ["native-american", "flute", "nature-connection", "grounding", "ancestral"],
    ytId: "native_american_flute_journey_2022"
  },
  // Gentle Pop & Acoustic Therapy
  {
    title: "Breathe Me",
    artist: "Sia",
    language: "English",
    genre: "Pop",
    era: 2004,
    duration: 270,
    features: {
      energy: 0.4,
      valence: 0.5,
      tempo: 95,
      acousticness: 0.6,
      danceability: 0.3,
      instrumentalness: 0.1
    },
    tags: ["emotional-release", "vulnerability", "healing", "self-acceptance", "therapeutic-pop"],
    ytId: "sia_breathe_me_therapy"
  },
  {
    title: "Mad World",
    artist: "Gary Jules",
    language: "English",
    genre: "Alternative",
    era: 2001,
    duration: 195,
    features: {
      energy: 0.2,
      valence: 0.3,
      tempo: 75,
      acousticness: 0.8,
      danceability: 0.2,
      instrumentalness: 0.2
    },
    tags: ["melancholy", "introspection", "emotional-processing", "solitude", "reflection"],
    ytId: "gary_jules_mad_world_therapy"
  },
  // Uplifting & Motivational
  {
    title: "Here Comes the Sun",
    artist: "The Beatles",
    language: "English",
    genre: "Pop",
    era: 1969,
    duration: 185,
    features: {
      energy: 0.6,
      valence: 0.9,
      tempo: 130,
      acousticness: 0.5,
      danceability: 0.5,
      instrumentalness: 0.1
    },
    tags: ["uplifting", "hope", "optimism", "joy", "seasonal-depression"],
    ytId: "beatles_here_comes_sun_therapy"
  },
  {
    title: "Three Little Birds",
    artist: "Bob Marley",
    language: "English",
    genre: "Reggae",
    era: 1977,
    duration: 180,
    features: {
      energy: 0.5,
      valence: 0.9,
      tempo: 110,
      acousticness: 0.4,
      danceability: 0.6,
      instrumentalness: 0.1
    },
    tags: ["reassurance", "positive-thinking", "worry-relief", "comfort", "peace"],
    ytId: "bob_marley_three_little_birds_therapy"
  },
  // Sleep & Deep Relaxation
  {
    title: "Deep Sleep Delta Waves",
    artist: "Sleep Therapy Institute",
    language: "None",
    genre: "Sleep",
    era: 2023,
    duration: 3600,
    features: {
      energy: 0.05,
      valence: 0.6,
      tempo: 40,
      acousticness: 0.1,
      danceability: 0.0,
      instrumentalness: 1.0
    },
    tags: ["sleep", "delta-waves", "insomnia-relief", "deep-rest", "recovery"],
    ytId: "deep_sleep_delta_waves_2023"
  },
  {
    title: "Moonlight Sonata - 1st Movement",
    artist: "Ludwig van Beethoven",
    language: "None",
    genre: "Classical",
    era: 1801,
    duration: 900,
    features: {
      energy: 0.2,
      valence: 0.4,
      tempo: 55,
      acousticness: 0.9,
      danceability: 0.1,
      instrumentalness: 1.0
    },
    tags: ["classical", "piano", "melancholy", "contemplation", "night-music"],
    ytId: "beethoven_moonlight_sonata_therapy"
  },
  // Anxiety & Stress Relief
  {
    title: "Calm Piano for Anxiety",
    artist: "Peaceful Piano",
    language: "None",
    genre: "Piano",
    era: 2023,
    duration: 600,
    features: {
      energy: 0.2,
      valence: 0.7,
      tempo: 70,
      acousticness: 0.9,
      danceability: 0.1,
      instrumentalness: 1.0
    },
    tags: ["piano", "anxiety-relief", "calm", "gentle", "soothing"],
    ytId: "calm_piano_anxiety_2023"
  },
  {
    title: "Stress Relief Soundscape",
    artist: "Relaxation Masters",
    language: "None",
    genre: "Ambient",
    era: 2022,
    duration: 720,
    features: {
      energy: 0.1,
      valence: 0.8,
      tempo: 60,
      acousticness: 0.7,
      danceability: 0.0,
      instrumentalness: 1.0
    },
    tags: ["stress-relief", "workplace-wellness", "tension-release", "mindfulness", "peace"],
    ytId: "stress_relief_soundscape_2022"
  },
  // Focus & Concentration
  {
    title: "Lo-Fi Study Beats",
    artist: "Study Music Collective",
    language: "None",
    genre: "Lo-Fi",
    era: 2023,
    duration: 1800,
    features: {
      energy: 0.4,
      valence: 0.6,
      tempo: 85,
      acousticness: 0.3,
      danceability: 0.4,
      instrumentalness: 0.9
    },
    tags: ["lo-fi", "study", "concentration", "productivity", "background-music"],
    ytId: "lofi_study_beats_2023"
  }
];

export default async function adminRoutes(fastify, options) {
  // Seed database endpoint
  fastify.post('/seed-database', async (request, reply) => {
    try {
      fastify.log.info('🌱 Starting database seeding via API...');
      
      // Get current track count
      const existingCount = await Track.countDocuments();
      fastify.log.info(`📊 Found ${existingCount} existing tracks in database`);
      
      // Check if already seeded
      if (existingCount >= therapeuticTracks.length) {
        return reply.send({
          success: true,
          message: 'Database already contains sample tracks',
          data: {
            existingTracks: existingCount,
            sampleTracks: therapeuticTracks.length,
            action: 'no_seeding_needed'
          }
        });
      }

      // Insert therapeutic tracks
      fastify.log.info('🎵 Inserting therapeutic music tracks...');
      const insertedTracks = await Track.insertMany(therapeuticTracks);
      fastify.log.info(`✅ Successfully inserted ${insertedTracks.length} tracks`);

      // Get summary statistics
      const genreCounts = await Track.aggregate([
        { $group: { _id: '$genre', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const languageCounts = await Track.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const totalTracks = await Track.countDocuments();

      reply.send({
        success: true,
        message: `Successfully seeded database with ${insertedTracks.length} therapeutic music tracks!`,
        data: {
          tracksInserted: insertedTracks.length,
          totalTracks: totalTracks,
          genreBreakdown: genreCounts,
          languageBreakdown: languageCounts,
          sampleTracks: insertedTracks.slice(0, 5).map(track => ({
            title: track.title,
            artist: track.artist,
            genre: track.genre,
            tags: track.tags
          }))
        }
      });

    } catch (error) {
      fastify.log.error('❌ Error seeding database:', error);
      reply.code(500).send({
        success: false,
        error: 'Database Seeding Failed',
        message: error.message
      });
    }
  });

  // Get database statistics
  fastify.get('/database-stats', async (request, reply) => {
    try {
      const totalTracks = await Track.countDocuments();
      
      const genreCounts = await Track.aggregate([
        { $group: { _id: '$genre', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const languageCounts = await Track.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      const recentTracks = await Track.find()
        .sort({ createdAt: -1 })
        .limit(10)
        .select('title artist genre createdAt tags');

      reply.send({
        success: true,
        data: {
          totalTracks,
          genreBreakdown: genreCounts,
          languageBreakdown: languageCounts,
          recentTracks: recentTracks
        }
      });

    } catch (error) {
      fastify.log.error('Error getting database stats:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to get database statistics',
        message: error.message
      });
    }
  });

  // Clear database (use with caution)
  fastify.delete('/clear-database', async (request, reply) => {
    try {
      const deletedCount = await Track.deleteMany({});
      
      fastify.log.warn(`🗑️ Cleared ${deletedCount.deletedCount} tracks from database`);
      
      reply.send({
        success: true,
        message: `Cleared ${deletedCount.deletedCount} tracks from database`,
        data: {
          deletedCount: deletedCount.deletedCount
        }
      });

    } catch (error) {
      fastify.log.error('Error clearing database:', error);
      reply.code(500).send({
        success: false,
        error: 'Failed to clear database',
        message: error.message
      });
    }
  });
}

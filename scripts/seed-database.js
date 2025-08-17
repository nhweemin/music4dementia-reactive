import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Track from '../src/models/Track.js';
import { connectDatabase } from '../src/utils/database.js';

// Load environment variables
dotenv.config();

// Sample therapeutic music tracks
const therapeuticTracks = [
  // Meditation & Mindfulness
  {
    title: "Ocean Waves Meditation",
    artist: "Nature Sounds Collective",
    language: "Instrumental",
    genre: "Meditation",
    era: 2023,
    duration: 600, // 10 minutes
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
    duration: 480, // 8 minutes
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
    language: "Instrumental",
    genre: "Nature Sounds",
    era: 2023,
    duration: 900, // 15 minutes
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
    language: "Instrumental",
    genre: "Classical",
    era: 1905,
    duration: 300, // 5 minutes
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
    language: "Instrumental",
    genre: "Classical",
    era: 1731,
    duration: 360, // 6 minutes
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
    language: "Instrumental",
    genre: "Ambient",
    era: 2011,
    duration: 480, // 8 minutes
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
    language: "Instrumental",
    genre: "Ambient",
    era: 2012,
    duration: 420, // 7 minutes
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
    language: "Instrumental",
    genre: "Therapy",
    era: 2023,
    duration: 720, // 12 minutes
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
    language: "Instrumental",
    genre: "Binaural",
    era: 2022,
    duration: 900, // 15 minutes
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
    language: "Instrumental",
    genre: "World",
    era: 2023,
    duration: 600, // 10 minutes
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
    language: "Instrumental",
    genre: "World",
    era: 2022,
    duration: 540, // 9 minutes
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
    duration: 270, // 4.5 minutes
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
    duration: 195, // 3.25 minutes
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
    duration: 185, // 3 minutes
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
    duration: 180, // 3 minutes
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
    language: "Instrumental",
    genre: "Sleep",
    era: 2023,
    duration: 3600, // 1 hour
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
    language: "Instrumental",
    genre: "Classical",
    era: 1801,
    duration: 900, // 15 minutes
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
    language: "Instrumental",
    genre: "Piano",
    era: 2023,
    duration: 600, // 10 minutes
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
    language: "Instrumental",
    genre: "Ambient",
    era: 2022,
    duration: 720, // 12 minutes
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
    language: "Instrumental",
    genre: "Lo-Fi",
    era: 2023,
    duration: 1800, // 30 minutes
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
  },
  {
    title: "White Noise for Focus",
    artist: "Concentration Sounds",
    language: "Instrumental",
    genre: "White Noise",
    era: 2023,
    duration: 3600, // 1 hour
    features: {
      energy: 0.3,
      valence: 0.5,
      tempo: 0, // No tempo for white noise
      acousticness: 0.0,
      danceability: 0.0,
      instrumentalness: 1.0
    },
    tags: ["white-noise", "focus", "adhd-support", "concentration", "masking"],
    ytId: "white_noise_focus_2023"
  }
];

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await connectDatabase();
    console.log('✅ Connected to MongoDB');

    // Clear existing tracks (optional - comment out if you want to keep existing data)
    const existingCount = await Track.countDocuments();
    console.log(`📊 Found ${existingCount} existing tracks in database`);
    
    if (existingCount > 0) {
      console.log('🗑️  Clearing existing tracks...');
      await Track.deleteMany({});
      console.log('✅ Existing tracks cleared');
    }

    // Insert therapeutic tracks
    console.log('🎵 Inserting therapeutic music tracks...');
    const insertedTracks = await Track.insertMany(therapeuticTracks);
    console.log(`✅ Successfully inserted ${insertedTracks.length} tracks`);

    // Display summary by genre
    const genreCounts = await Track.aggregate([
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n📈 Tracks by Genre:');
    genreCounts.forEach(genre => {
      console.log(`   ${genre._id}: ${genre.count} tracks`);
    });

    // Display summary by language
    const languageCounts = await Track.aggregate([
      { $group: { _id: '$language', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    console.log('\n🌍 Tracks by Language:');
    languageCounts.forEach(lang => {
      console.log(`   ${lang._id}: ${lang.count} tracks`);
    });

    // Display some sample tracks
    console.log('\n🎼 Sample Tracks Added:');
    const sampleTracks = await Track.find().limit(5).select('title artist genre tags');
    sampleTracks.forEach(track => {
      console.log(`   "${track.title}" by ${track.artist} (${track.genre})`);
      console.log(`      Tags: ${track.tags.join(', ')}`);
    });

    console.log('\n🎉 Database seeding completed successfully!');
    console.log(`\n📍 You can now test the system with ${insertedTracks.length} therapeutic music tracks.`);
    console.log('🌐 Visit your upload page: https://adaptable-youth-production-ad8a.up.railway.app/upload');
    
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
}

// Run the seeding script
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase();
}

export default seedDatabase;

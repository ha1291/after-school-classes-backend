const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
let db;
let client;

async function connectToDatabase() {
  try {
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    db = client.db('after_school_db');
    console.log('✅ Connected to MongoDB Atlas');
    
    // Initialize sample data if collections are empty
    await initializeSampleData();
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
}

// Initialize sample lessons data
async function initializeSampleData() {
  try {
    const lessonsCollection = db.collection('lessons');
    const lessonCount = await lessonsCollection.countDocuments();
    
    if (lessonCount === 0) {
      const sampleLessons = [
        { _id: new ObjectId(), subject: 'Math', location: 'London', price: 50, spaces: 5, image: 'math.jpg' },
        { _id: new ObjectId(), subject: 'English', location: 'Manchester', price: 45, spaces: 5, image: 'english.jpg' },
        { _id: new ObjectId(), subject: 'Science', location: 'Birmingham', price: 55, spaces: 5, image: 'science.jpg' },
        { _id: new ObjectId(), subject: 'Art', location: 'Leeds', price: 40, spaces: 5, image: 'art.jpg' },
        { _id: new ObjectId(), subject: 'Music', location: 'Liverpool', price: 60, spaces: 5, image: 'music.jpg' },
        { _id: new ObjectId(), subject: 'Drama', location: 'Bristol', price: 35, spaces: 5, image: 'drama.jpg' },
        { _id: new ObjectId(), subject: 'Programming', location: 'Glasgow', price: 70, spaces: 5, image: 'programming.jpg' },
        { _id: new ObjectId(), subject: 'Sports', location: 'Cardiff', price: 30, spaces: 5, image: 'sports.jpg' },
        { _id: new ObjectId(), subject: 'Dance', location: 'Edinburgh', price: 45, spaces: 5, image: 'dance.jpg' },
        { _id: new ObjectId(), subject: 'Cooking', location: 'Newcastle', price: 65, spaces: 5, image: 'cooking.jpg' }
      ];
      
      await lessonsCollection.insertMany(sampleLessons);
      console.log('✅ Sample lessons data inserted (10 lessons)');
    } else {
      console.log(`✅ Lessons collection already has ${lessonCount} lessons`);
    }
  } catch (error) {
    console.error('Error initializing sample data:', error);
  }
}

// ✅ GET /lessons - Get all lessons (REQUIREMENT)
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

// Update server startup to connect to database first
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
  }
  console.log('Database connection closed.');
  process.exit(0);
});
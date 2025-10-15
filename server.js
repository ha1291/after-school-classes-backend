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

// ✅ POST /orders - Save a new order (REQUIREMENT)
app.post('/orders', async (req, res) => {
  try {
    const { name, phone, lessonIds } = req.body;
    
    // Validate required fields
    if (!name || !phone || !lessonIds || !Array.isArray(lessonIds)) {
      return res.status(400).json({ error: 'Name, phone, and lessonIds array are required' });
    }

    // Validate that lessonIds array is not empty
    if (lessonIds.length === 0) {
      return res.status(400).json({ error: 'At least one lesson must be selected' });
    }
    
    // Validate name (letters only) and phone (numbers only)
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^\d+$/;
    
    if (!nameRegex.test(name)) {
      return res.status(400).json({ error: 'Name must contain letters only' });
    }
    
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone must contain numbers only' });
    }

    // Validate that all lesson IDs exist in the database
    const validLessons = [];
    for (const lessonId of lessonIds) {
      if (!ObjectId.isValid(lessonId)) {
        return res.status(400).json({ error: `Invalid lesson ID format: ${lessonId}` });
      }
      
      const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId) });
      if (!lesson) {
        return res.status(404).json({ error: `Lesson not found with ID: ${lessonId}` });
      }
      
      // Also check if the lesson has available spaces
      if (lesson.spaces < 1) {
        return res.status(400).json({ error: `No spaces available for lesson: ${lesson.subject}` });
      }
      
      validLessons.push(lesson);
    }
    
    // Create order document
    const order = {
      name,
      phone,
      lessonIds: lessonIds.map(id => new ObjectId(id)),
      lessonNames: validLessons.map(lesson => lesson.subject),
      orderDate: new Date()
    };
    
    // Insert order into database
    const result = await db.collection('orders').insertOne(order);
    
    res.status(201).json({ 
      message: 'Order created successfully', 
      orderId: result.insertedId,
      lessons: validLessons.map(lesson => ({
        subject: lesson.subject,
        location: lesson.location,
        price: lesson.price
      }))
    });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// ✅ PUT /lessons/:id - Update lesson spaces (REQUIREMENT)
app.put('/lessons/:id', async (req, res) => {
  try {
    const lessonId = req.params.id;
    const { spaces, subject, location, price } = req.body;
    
    // Validate lesson ID
    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({ error: 'Invalid lesson ID' });
    }
    
    // Build update object
    const updateFields = {};
    if (spaces !== undefined) updateFields.spaces = spaces;
    if (subject !== undefined) updateFields.subject = subject;
    if (location !== undefined) updateFields.location = location;
    if (price !== undefined) updateFields.price = price;
    
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: updateFields }
    );
    
    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Lesson not found' });
    }
    
    res.json({ 
      message: 'Lesson updated successfully',
      updatedFields: updateFields
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    res.status(500).json({ error: 'Failed to update lesson' });
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
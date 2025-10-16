/**
 * After School Classes Backend API
 * Node.js/Express.js REST API with MongoDB Atlas integration
 * BSC Computer Science - CST3144 Full Stack Development Assignment
 */

// Import required modules
const express = require('express');
const { MongoClient, ObjectId } = require('mongodb');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Initialize Express application
const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URI = process.env.MONGODB_URI;

// ======================
// MIDDLEWARE SETUP
// ======================

// Enable CORS for cross-origin requests (front-end communication)
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

/**
 * Logger Middleware - Assignment Requirement
 * Logs all incoming requests with timestamp, method, and URL
 * Outputs to server console for inspection
 */
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

/**
 * Static File Middleware - Assignment Requirement
 * Serves lesson images from public/images directory
 * Returns 404 error with JSON message if image not found
 */
app.use('/images', express.static(path.join(__dirname, 'public/images')));
app.use('/images', (req, res, next) => {
  const imagePath = path.join(__dirname, 'public/images', req.path);
  if (!fs.existsSync(imagePath)) {
    return res.status(404).json({ error: 'Image not found' });
  }
  next();
});

// ======================
// DATABASE CONNECTION
// ======================

let db;  // Database instance
let client;  // MongoDB client

/**
 * Connect to MongoDB Atlas database
 * Uses connection string from environment variables
 * Initializes sample data if collections are empty
 */
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

/**
 * Initialize sample lessons data - Assignment Requirement
 * Creates 10 lessons with 5 spaces each if collection is empty
 * Includes subject, location, price, spaces, and image fields
 */
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

// ======================
// ROOT ROUTE
// ======================

// Root route - Welcome message and API documentation
app.get('/', (req, res) => {
  res.json({ 
    message: '🎓 After School Classes API is running!',
    version: '1.0.0',
    deployed: true,
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      lessons: 'GET /lessons - Get all lessons',
      orders: 'POST /orders - Create a new order',
      update_lesson: 'PUT /lessons/:id - Update lesson attributes',
      search: 'GET /search?q=:query - Search lessons',
      images: 'GET /images/:filename - Serve lesson images'
    },
    documentation: 'See README.md for detailed API documentation',
    repository: 'https://github.com/ha1291/after-school-classes-backend'
  });
});

// ======================
// REST API ENDPOINTS
// ======================

/**
 * GET /lessons - Assignment Requirement
 * Retrieves all lessons from the database
 * Used by front-end to display lesson list
 */
app.get('/lessons', async (req, res) => {
  try {
    const lessons = await db.collection('lessons').find({}).toArray();
    res.json(lessons);
  } catch (error) {
    console.error('Error fetching lessons:', error);
    res.status(500).json({ error: 'Failed to fetch lessons' });
  }
});

/**
 * POST /orders - Assignment Requirement
 * Creates a new order with validation
 * Validates: name (letters only), phone (numbers only), lesson existence, available spaces
 */
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
    
    // Validate name (letters only) and phone (numbers only) - Assignment Requirement
    const nameRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^\d+$/;
    
    if (!nameRegex.test(name)) {
      return res.status(400).json({ error: 'Name must contain letters only' });
    }
    
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ error: 'Phone must contain numbers only' });
    }

    // Validate that all lesson IDs exist and have available spaces
    const validLessons = [];
    for (const lessonId of lessonIds) {
      if (!ObjectId.isValid(lessonId)) {
        return res.status(400).json({ error: `Invalid lesson ID format: ${lessonId}` });
      }
      
      const lesson = await db.collection('lessons').findOne({ _id: new ObjectId(lessonId) });
      if (!lesson) {
        return res.status(404).json({ error: `Lesson not found with ID: ${lessonId}` });
      }
      
      // Check if the lesson has available spaces
      if (lesson.spaces < 1) {
        return res.status(400).json({ error: `No spaces available for lesson: ${lesson.subject}` });
      }
      
      validLessons.push(lesson);
    }
    
    // Create order document for database
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

/**
 * PUT /lessons/:id - Assignment Requirement
 * Updates lesson attributes (spaces, price, location, subject)
 * Can update any attribute to any value (not just increment/decrement)
 */
app.put('/lessons/:id', async (req, res) => {
  try {
    const lessonId = req.params.id;
    const { spaces, subject, location, price } = req.body;
    
    // Validate lesson ID format
    if (!ObjectId.isValid(lessonId)) {
      return res.status(400).json({ error: 'Invalid lesson ID' });
    }
    
    // Build update object with provided fields
    const updateFields = {};
    if (spaces !== undefined) updateFields.spaces = spaces;
    if (subject !== undefined) updateFields.subject = subject;
    if (location !== undefined) updateFields.location = location;
    if (price !== undefined) updateFields.price = price;
    
    // Ensure at least one field is provided for update
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }
    
    // Update lesson in database
    const result = await db.collection('lessons').updateOne(
      { _id: new ObjectId(lessonId) },
      { $set: updateFields }
    );
    
    // Check if lesson was found and updated
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

/**
 * GET /search - Assignment Challenge Requirement
 * Full-text search across lesson fields (subject, location, price, spaces)
 * Implements Approach 2 for higher marks (back-end search)
 */
app.get('/search', async (req, res) => {
  try {
    const { q } = req.query;
    
    // Validate search query parameter
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const searchRegex = new RegExp(q, 'i'); // Case-insensitive regex
    
    // Search text fields (subject and location)
    const textResults = await db.collection('lessons').find({
      $or: [
        { subject: searchRegex },
        { location: searchRegex }
      ]
    }).toArray();
    
    // Search numeric fields (price and spaces) by converting to numbers
    const numericResults = await db.collection('lessons').find({
      $or: [
        { price: isNaN(q) ? -1 : parseInt(q) },
        { spaces: isNaN(q) ? -1 : parseInt(q) }
      ]
    }).toArray();
    
    // Combine results and remove duplicates
    const allResults = [...textResults, ...numericResults];
    const uniqueResults = allResults.filter((lesson, index, self) => 
      index === self.findIndex(l => l._id.toString() === lesson._id.toString())
    );
    
    res.json(uniqueResults);
  } catch (error) {
    console.error('Error searching lessons:', error);
    res.status(500).json({ error: 'Failed to search lessons' });
  }
});

// ======================
// SERVER STARTUP
// ======================

/**
 * Start server after successful database connection
 */
connectToDatabase().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`📚 API endpoints available at http://localhost:${PORT}`);
  });
});

/**
 * Graceful shutdown - close database connection on process termination
 */
process.on('SIGINT', async () => {
  if (client) {
    await client.close();
  }
  console.log('Database connection closed.');
  process.exit(0);
});
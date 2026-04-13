// Load .env file — path is explicit to avoid any issues
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');
const Book     = require('./models/Book');
const books    = require('./data/books.json');

// Fallback: if .env is not loaded, use the default local MongoDB URI
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookhaven';

async function seed() {
  try {
    console.log('🔗 Connecting to:', MONGO_URI);
    await mongoose.connect(MONGO_URI);
    console.log('✅ Connected to MongoDB');

    await Book.deleteMany({});
    console.log('🗑️  Cleared existing books');

    await Book.insertMany(books);
    console.log(`📚 Seeded ${books.length} books into MongoDB`);

    await mongoose.disconnect();
    console.log('✅ Done! Database seeded successfully.');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express    = require('express');
const session    = require('express-session');
const flash      = require('connect-flash');
const { MongoStore } = require('connect-mongo');
const connectDB  = require('./config/db');
const Book       = require('./models/Book');

// Connect to MongoDB
connectDB();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/bookhaven';

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Session — stored in MongoDB
app.use(session({
  secret: process.env.SESSION_SECRET || 'bookstore-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  store: new MongoStore({
    mongoUrl: MONGO_URI,
    ttl: 24 * 60 * 60
  }),
  cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

app.use(flash());

// Global middleware — inject user into every EJS view
app.use((req, res, next) => {
  res.locals.user    = req.session.user || null;
  res.locals.success = req.flash('success');
  res.locals.error   = req.flash('error');
  next();
});

// Routes
app.use('/',      require('./routes/auth'));
app.use('/books', require('./routes/books'));
app.use('/user',  require('./routes/user'));

// Home
app.get('/', async (req, res) => {
  try {
    const books      = await Book.find({}).sort({ id: 1 });
    const featured   = books.filter(b => b.bestseller).slice(0, 6);
    const categories = [...new Set(books.map(b => b.category))];
    res.render('home', { books, featured, categories, title: 'Online Book Store' });
  } catch (err) {
    console.error('Home error:', err);
    res.render('home', { books: [], featured: [], categories: [], title: 'Online Book Store' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`📚 Bookstore running at http://localhost:${PORT}`));

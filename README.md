# 📚 Leafr — Online Book Store SaaS

A premium full-stack book reading and purchasing platform built with **Node.js + Express + MongoDB + EJS + Bootstrap**.

---

## ✨ Features

- **48 Curated Books** — 25 Indian + 23 Foreign authors
- **Free Online Reader** — Font size control, dark/light mode, reading progress bar
- **Cart & Purchase System** — Add to cart, checkout, permanent library
- **User Dashboard** — Sidebar with Overview, Cart, Library, Reading History panels
- **Book Detail with Tabs** — About · Index (Table of Contents) · Preview
- **MongoDB** — Users, sessions, and books all stored in MongoDB Atlas
- **Secure Auth** — bcryptjs password hashing + Mongoose pre-save hook
- **Scroll Reveal Animations** — Smooth entrance animations on scroll
- **Dark SaaS Design** — Deep ink theme with gold accents, Fraunces serif font

---

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env` file in the project root
```
MONGO_URI=mongodb+srv://your-atlas-uri/bookhaven
SESSION_SECRET=your-secret-key-here
PORT=3000
```

### 3. Seed the database (run once)
```bash
npm run seed
```

### 4. Start the server
```bash
npm start
```

Open **http://localhost:3000** in your browser.

---

## 📁 Project Structure

```
bookstore/
├── app.js                 # Server entry point
├── seed.js                # Seed 48 books into MongoDB
├── .env                   # Environment variables (not committed)
├── config/
│   └── db.js              # MongoDB connection
├── models/
│   ├── User.js            # User schema (name, email, readBooks, cart, purchased)
│   └── Book.js            # Book schema (title, author, fullText, index, etc.)
├── routes/
│   ├── auth.js            # Register / Login / Logout
│   ├── books.js           # Browse / Detail / Read / Buy / Checkout
│   └── user.js            # Dashboard / Cart remove
├── views/
│   ├── partials/
│   │   ├── header.ejs     # Navbar + toast notifications
│   │   └── footer.ejs     # Footer + scripts
│   ├── home.ejs           # Landing page
│   ├── books.ejs          # Browse library
│   ├── book-detail.ejs    # Book page (About · Index · Preview tabs)
│   ├── read.ejs           # Online reader
│   ├── dashboard.ejs      # User dashboard
│   ├── login.ejs
│   ├── register.ejs
│   └── 404.ejs
├── public/
│   ├── css/style.css      # Full SaaS design system
│   └── js/main.js         # Animations, reader, tabs
└── data/
    └── books.json         # Source data (seeded into MongoDB)
```

---

## 🛠 Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB + Mongoose                  |
| Sessions   | express-session + connect-mongo     |
| Auth       | bcryptjs                            |
| Templates  | EJS                                 |
| Styling    | Custom CSS + Bootstrap 5            |
| Fonts      | Fraunces (serif) + Inter (sans)     |

---

## 📦 npm Scripts

```bash
npm start      # Start production server
npm run dev    # Start with nodemon (auto-restart)
npm run seed   # Seed all 48 books into MongoDB
```

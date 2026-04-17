# BookHaven - Production Upgrade (Phase 1)

Production-ready backend refactor in progress for a full-stack bookstore platform built with Node.js + Express + MongoDB + EJS.

---

## Completed in Phase 1

- JWT-based authentication (cookie and Bearer token support)
- Password hashing with bcrypt (Mongoose pre-save)
- Route protection middleware and role-based authorization middleware
- Input validation using express-validator
- Security middleware stack: Helmet, rate limiting, request logging (Morgan)
- Centralized not-found and global error handling middleware
- MVC-oriented layering started: controllers, services, middlewares, validators, utils

---

## 🚀 Setup

### 1. Install Dependencies
```bash
npm install
```

### 2. Create `.env` file in the project root
```
MONGO_URI=mongodb+srv://your-atlas-uri/bookhaven
SESSION_SECRET=your-session-secret
JWT_ACCESS_SECRET=your-jwt-secret
JWT_ACCESS_EXPIRES_IN=1d
PORT=3000
```

You can copy from `.env.example` and replace values with real secrets.

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

## Updated Structure

```
bookstore/
├── app.js                 # Server entry point
├── seed.js                # Seed 48 books into MongoDB
├── .env.example           # Environment template
├── config/
│   └── db.js              # MongoDB connection
├── controllers/
│   └── auth.controller.js
├── services/
│   └── auth.service.js
├── middlewares/
│   ├── auth.middleware.js
│   ├── error.middleware.js
│   ├── rateLimit.middleware.js
│   └── validation.middleware.js
├── models/
│   ├── User.js            # User schema + role
│   └── Book.js
├── routes/
│   ├── auth.js            # Web auth routes
│   ├── admin.js           # Protected admin example route
│   ├── books.js
│   ├── user.js
│   └── api/
│       └── auth.js        # API auth routes
├── validators/
│   └── auth.validator.js
├── utils/
│   ├── AppError.js
│   ├── asyncHandler.js
│   └── jwt.js
├── views/
│   └── ...
├── public/
│   └── ...
└── data/
    └── books.json
```

## Authentication Endpoints

- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/logout
- GET /api/auth/me (protected)

## Payment Endpoints (Razorpay)

- POST /payments/create-order (protected)
- POST /payments/verify (protected)

Checkout now creates an order, opens Razorpay on client, and unlocks purchased books only after server-side signature verification.

## Admin Routes (RBAC: admin only)

- GET /admin or /admin/dashboard (dashboard)
- GET /admin/books/new
- POST /admin/books
- GET /admin/books/:id/edit
- POST /admin/books/:id/update
- POST /admin/books/:id/delete
- POST /admin/users/:id/role
- POST /admin/users/:id/delete

## Discovery + Social Features

- GET /books?search=&category=&origin=&availability=&minRating=&sort=&page=&perPage=
- POST /wishlist/toggle/:bookId
- GET /wishlist
- POST /books/:id/reviews
- POST /books/:id/reviews/:reviewId/delete

Search filters now support free/paid books, minimum rating, sort order, and **pagination** (page, perPage with defaults page=1, perPage=12). Wishlist and reviews are persisted in dedicated collections.

## Pagination

All list endpoints support pagination parameters:

- `page`: Current page number (default: 1)
- `perPage`: Items per page (default: 12, max: 50)

Example:
```
GET /books?page=2&perPage=20
```

Dashboard preview sections show limited items with "View more" links for full lists.

## Example Protected Route

- GET /admin/dashboard (protected + admin-only role check)

---

## Tech Stack

| Layer      | Technology                          |
|------------|-------------------------------------|
| Backend    | Node.js, Express.js                 |
| Database   | MongoDB + Mongoose                  |
| Sessions   | express-session + connect-mongo (flash messaging) |
| Auth       | JWT + bcryptjs                      |
| Security   | helmet, express-rate-limit, morgan, express-validator |
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

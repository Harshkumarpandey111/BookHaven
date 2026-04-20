const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback',
    scope: ['profile', 'email']
  },
  async (accessToken, refreshToken, profile, done) => {
    try {
      const email = profile.emails && profile.emails[0] ? profile.emails[0].value.toLowerCase() : null;
      if (!email) {
        return done(new Error('No email found in Google profile'), null);
      }

      // Check if user already exists with this Google ID
      let user = await User.findOne({ googleId: profile.id });
      
      if (user) {
        return done(null, user);
      }

      // Check if user already exists with this email (registered normally)
      user = await User.findOne({ email: email });

      if (user) {
        // Link Google account to existing user
        user.googleId = profile.id;
        if (!user.name || user.name === email) {
          user.name = profile.displayName || user.name;
        }
        await user.save();
        return done(null, user);
      }

      // Create new user
      user = await User.create({
        name: profile.displayName || email.split('@')[0],
        email: email,
        googleId: profile.id,
        password: require('crypto').randomBytes(32).toString('hex'), // Random password for OAuth users
        role: 'user'
      });

      // Send welcome email (fire-and-forget)
      const { sendWelcomeEmail } = require('../services/email.service');
      sendWelcomeEmail({ to: user.email, name: user.name });

      // Create welcome notification
      const Notification = require('../models/Notification');
      Notification.create({
        user: user._id,
        type: 'welcome',
        title: 'Welcome to BookHaven! 🎉',
        message: `Hi ${user.name}, your account is ready. You signed in with Google. Start exploring our library!`,
        link: '/books'
      }).catch(() => {});

      return done(null, user);
    } catch (err) {
      console.error('Google OAuth error:', err);
      return done(err, null);
    }
  }
));

module.exports = passport;

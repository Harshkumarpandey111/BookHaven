const authService = require('../services/auth.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

function buildTokenCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000
  };
}

function isApiRequest(req) {
  return req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json');
}

const renderRegister = (req, res) => {
  if (req.user) return res.redirect('/');
  return res.render('register', { title: 'Register' });
};

const register = asyncHandler(async (req, res) => {
  await authService.registerUser(req.body);

  if (isApiRequest(req)) {
    return res.status(201).json({ message: 'Account created successfully. Please login.' });
  }

  req.flash('success', 'Account created! Please login.');
  return res.redirect('/login');
});

const renderLogin = (req, res) => {
  if (req.user) return res.redirect('/');
  return res.render('login', { title: 'Login' });
};

const login = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.loginUser(req.body);

  res.cookie('accessToken', accessToken, buildTokenCookieOptions());

  if (isApiRequest(req)) {
    return res.status(200).json({
      message: 'Login successful',
      accessToken,
      user
    });
  }

  req.flash('success', `Welcome back, ${user.name}!`);
  return res.redirect('/');
});

const logout = (req, res) => {
  res.clearCookie('accessToken');

  if (isApiRequest(req)) {
    return res.status(200).json({ message: 'Logged out successfully' });
  }

  req.flash('success', 'Logged out successfully');
  return res.redirect('/');
};

const getProfile = asyncHandler(async (req, res) => {
  if (!req.user) {
    throw new AppError('Authentication required', 401);
  }

  return res.status(200).json({ user: req.user });
});

module.exports = {
  renderRegister,
  register,
  renderLogin,
  login,
  logout,
  getProfile
};

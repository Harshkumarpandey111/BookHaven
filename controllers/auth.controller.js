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
  await authService.startRegistration(req.body);

  if (isApiRequest(req)) {
    return res.status(202).json({
      message: 'OTP sent to your email. Verify OTP to complete registration.'
    });
  }

  req.flash('success', 'OTP sent to your email. Verify OTP to complete registration.');
  return res.redirect(`/verify-email?email=${encodeURIComponent(req.body.email.toLowerCase())}`);
});

const renderVerifyEmail = (req, res) => {
  if (req.user) return res.redirect('/');
  return res.render('verify-email', {
    title: 'Verify Email',
    email: req.query.email || ''
  });
};

const verifyEmail = asyncHandler(async (req, res) => {
  const { user, accessToken } = await authService.verifyRegistrationOtp(req.body);

  res.cookie('accessToken', accessToken, buildTokenCookieOptions());

  if (isApiRequest(req)) {
    return res.status(201).json({
      message: 'Email verified. Account created successfully.',
      accessToken,
      user
    });
  }

  req.flash('success', `Welcome, ${user.name}! Your account is ready.`);
  return res.redirect('/');
});

const renderLogin = (req, res) => {
  if (req.user) return res.redirect('/');
  return res.render('login', { title: 'Login' });
};

const renderForgotPassword = (req, res) => {
  if (req.user) return res.redirect('/');
  return res.render('forgot-password', { title: 'Forgot Password' });
};

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.startPasswordReset(req.body);

  if (isApiRequest(req)) {
    return res.status(200).json({
      message: 'If your email is registered, an OTP has been sent.'
    });
  }

  req.flash('success', 'If your email is registered, an OTP has been sent.');
  return res.redirect(`/reset-password?email=${encodeURIComponent(req.body.email.toLowerCase())}`);
});

const renderResetPassword = (req, res) => {
  if (req.user) return res.redirect('/');
  return res.render('reset-password', {
    title: 'Reset Password',
    email: req.query.email || ''
  });
};

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPasswordWithOtp(req.body);

  if (isApiRequest(req)) {
    return res.status(200).json({ message: 'Password reset successful. Please login.' });
  }

  req.flash('success', 'Password reset successful. Please login.');
  return res.redirect('/login');
});

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
  renderVerifyEmail,
  verifyEmail,
  renderLogin,
  login,
  renderForgotPassword,
  forgotPassword,
  renderResetPassword,
  resetPassword,
  logout,
  getProfile
};

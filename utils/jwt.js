const jwt = require('jsonwebtoken');

function getJwtSecret() {
  return process.env.JWT_ACCESS_SECRET || process.env.SESSION_SECRET || 'dev-jwt-secret';
}

function signAccessToken(payload) {
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '1d'
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, getJwtSecret());
}

module.exports = {
  signAccessToken,
  verifyAccessToken
};

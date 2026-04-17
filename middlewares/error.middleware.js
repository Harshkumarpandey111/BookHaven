function notFoundHandler(req, res, _next) {
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ message: 'Route not found' });
  }
  return res.status(404).render('404', { title: 'Not Found' });
}

function globalErrorHandler(err, req, res, _next) {
  const statusCode = err.statusCode || 500;
  const message = err.isOperational ? err.message : 'Internal server error';

  if (req.originalUrl.startsWith('/api') || req.headers.accept?.includes('application/json')) {
    return res.status(statusCode).json({ message });
  }

  if (statusCode >= 500) {
    console.error('Unhandled error:', err);
  }

  req.flash('error', message);
  if (statusCode === 401) {
    return res.redirect('/login');
  }
  return res.status(statusCode).redirect(req.get('Referrer') || '/');
}

module.exports = {
  notFoundHandler,
  globalErrorHandler
};

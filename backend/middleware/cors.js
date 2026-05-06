/**
 * CORS Middleware
 * Public, no-auth tool — open to all origins.
 * Restricting CORS adds zero security here (no sessions/cookies).
 */
const cors = require('cors');

module.exports = cors({
  origin: true,
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type'],
  credentials: false,
});

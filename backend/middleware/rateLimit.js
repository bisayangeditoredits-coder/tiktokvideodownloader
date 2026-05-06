/**
 * Rate Limiting Middleware
 * IP-based only — no account required.
 */
const rateLimit = require('express-rate-limit');

const makeHandler = (msg) => (_req, res) => {
  res.status(429).json({ success: false, error: msg, code: 'RATE_LIMIT' });
};

/** 10 req/min — POST /api/fetch */
const fetchLimiter = rateLimit({
  windowMs: 60_000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Slow down a bit! Try again in a minute.'),
});

/** 3 req/min — POST /api/batch */
const batchLimiter = rateLimit({
  windowMs: 60_000,
  max: 3,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Batch limit reached. Wait a minute before submitting again.'),
});

/** 100 req/min — GET /api/download */
const downloadLimiter = rateLimit({
  windowMs: 60_000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: makeHandler('Download rate limit reached. Please wait a moment.'),
});

module.exports = { fetchLimiter, batchLimiter, downloadLimiter };

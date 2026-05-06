/**
 * TikTok Watermark Remover — Backend Entry Point
 */
'use strict';

require('dotenv').config();

const express   = require('express');
const helmet    = require('helmet');
const path      = require('path');
const cors      = require('./middleware/cors');
const apiRoutes = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security headers ───────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,       // Frontend loads CDN fonts/scripts
  crossOriginEmbedderPolicy: false,
}));

// ── CORS (open — public no-auth tool) ─────────────────────────
app.use(cors);

// ── Body parser ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── API routes ────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Catch unmatched /api/* calls → always JSON, never HTML ────
app.all('/api/*', (_req, res) => {
  res.status(404).json({ success: false, error: 'API endpoint not found', code: 'NOT_FOUND' });
});

// ── Serve frontend static files ───────────────────────────────
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// ── Catch-all → index.html (SPA fallback) ─────────────────────
app.get('*', (_req, res) => {
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ── Global error handler (MUST be last, after all routes) ─────
// Ensures Express never returns an HTML error page to the client.
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err.message);
  res.status(err.status || 500).json({
    success: false,
    error: err.expose ? err.message : 'Internal server error',
    code: 'SERVER_ERROR',
  });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ TikTok Watermark Remover running  → http://localhost:${PORT}`);
  console.log(`   Health endpoint     → http://localhost:${PORT}/api/health`);
});

module.exports = app;

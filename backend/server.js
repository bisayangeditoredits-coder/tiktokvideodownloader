/**
 * TikSave Pro — Backend Entry Point
 */
'use strict';

require('dotenv').config();

const express = require('express');
const helmet  = require('helmet');
const path    = require('path');
const cors    = require('./middleware/cors');
const apiRoutes = require('./routes/api');

const app  = express();
const PORT = process.env.PORT || 3001;

// ── Security headers (relaxed CSP for CDN fonts/scripts) ──────
app.use(helmet({
  contentSecurityPolicy: false, // Frontend uses CDN resources
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──────────────────────────────────────────────────────
app.use(cors);

// ── Body parser ───────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));

// ── API routes ────────────────────────────────────────────────
app.use('/api', apiRoutes);

// ── Serve frontend ────────────────────────────────────────────
const FRONTEND_DIR = path.join(__dirname, '..', 'frontend');
app.use(express.static(FRONTEND_DIR));

// Catch-all → index.html (SPA)
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(FRONTEND_DIR, 'index.html'));
});

// ── Global error handler ─────────────────────────────────────
app.use((err, _req, res, _next) => {
  console.error('[Global Error]', err.message);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// ── Start ─────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅ TikSave Pro API running → http://localhost:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health`);
});

module.exports = app;

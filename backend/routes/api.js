/**
 * API Routes
 * POST /api/fetch   — resolve TikTok URL → download links
 * POST /api/batch   — batch process up to 5 URLs
 * GET  /api/download — proxy video stream
 * GET  /api/health  — server status
 */
'use strict';

const express    = require('express');
const router     = express.Router();
const { fetchVideoInfo }  = require('../services/tiktok');
const { proxyDownload }   = require('../services/downloader');
const { fetchAllSizes }   = require('../utils/fileSize');
const { resolveShortUrl } = require('../utils/urlResolver');
const analytics           = require('../services/analytics');
const { validateUrl }     = require('../middleware/validator');
const { fetchLimiter, batchLimiter, downloadLimiter } = require('../middleware/rateLimit');

// ─────────────────────────────────────────────────────────────
// POST /api/fetch
// ─────────────────────────────────────────────────────────────
router.post('/fetch', fetchLimiter, validateUrl, async (req, res) => {
  const { url } = req.body;

  try {
    const resolvedUrl = await resolveShortUrl(url.trim());
    const info = await fetchVideoInfo(resolvedUrl);

    // Fetch file sizes in parallel (non-blocking — if it fails, sizes are null)
    const sizes = await fetchAllSizes({
      hdUrl       : info.hdUrl,
      sdUrl       : info.sdUrl,
      watermarkUrl: info.watermarkUrl,
      audioUrl    : info.audioUrl,
    }).catch(() => ({ hd: null, sd: null, watermark: null, audio: null }));

    analytics.increment('success');

    return res.json({
      success : true,
      platform: 'tiktok',
      title   : info.title,
      author  : info.author,
      avatar  : info.avatar,
      thumbnail: info.thumbnail,
      duration : info.duration,
      views   : info.views,
      source  : info.source,
      downloads: {
        hd       : { url: info.hdUrl,        size: sizes.hd        },
        sd       : { url: info.sdUrl,        size: sizes.sd        },
        watermark: { url: info.watermarkUrl, size: sizes.watermark },
        audio    : { url: info.audioUrl,     size: sizes.audio, bitrate: '128kbps' },
      },
    });

  } catch (err) {
    analytics.increment('error');
    const status = err.code === 'VIDEO_UNAVAILABLE' ? 404 : 502;
    return res.status(status).json({
      success: false,
      error  : err.message || 'Something went wrong. Please try again shortly.',
      code   : err.code    || 'FETCH_FAILED',
    });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/batch  — up to 5 URLs
// ─────────────────────────────────────────────────────────────
router.post('/batch', batchLimiter, async (req, res) => {
  const { urls } = req.body;

  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ success: false, error: 'urls must be a non-empty array' });
  }
  if (urls.length > 5) {
    return res.status(400).json({ success: false, error: 'Maximum 5 URLs per batch request' });
  }

  const results = await Promise.allSettled(
    urls.map(async (url) => {
      const resolved = await resolveShortUrl(url.trim());
      const info = await fetchVideoInfo(resolved);
      analytics.increment('success');
      return { success: true, url, title: info.title, author: info.author, thumbnail: info.thumbnail, downloads: {
        hd   : { url: info.hdUrl },
        sd   : { url: info.sdUrl },
        audio: { url: info.audioUrl },
      }};
    })
  );

  const items = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { success: false, url: urls[i], error: r.reason?.message || 'Failed' }
  );

  return res.json({ success: true, results: items });
});

// ─────────────────────────────────────────────────────────────
// GET /api/download — proxy stream
// ─────────────────────────────────────────────────────────────
router.get('/download', downloadLimiter, proxyDownload);

// ─────────────────────────────────────────────────────────────
// GET /api/health
// ─────────────────────────────────────────────────────────────
router.get('/health', (_req, res) => {
  res.json({ status: 'ok', stats: analytics.getStats(), timestamp: new Date().toISOString() });
});

module.exports = router;

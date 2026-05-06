/**
 * URL Validator Middleware
 * Validates that incoming URLs look like TikTok links.
 */

const TIKTOK_HOSTS = new Set([
  'www.tiktok.com', 'tiktok.com',
  'vm.tiktok.com', 'vt.tiktok.com', 'm.tiktok.com',
]);

function isValidTikTokUrl(raw) {
  if (!raw || typeof raw !== 'string') return false;
  try {
    const { hostname } = new URL(raw.trim());
    return TIKTOK_HOSTS.has(hostname.toLowerCase());
  } catch {
    return false;
  }
}

/** Middleware: validates req.body.url */
function validateUrl(req, res, next) {
  const { url } = req.body;
  if (!url || url.trim() === '') {
    return res.status(400).json({ success: false, error: 'Please paste a TikTok video link.', code: 'EMPTY_URL' });
  }
  if (!isValidTikTokUrl(url)) {
    return res.status(400).json({ success: false, error: "That doesn't look like a TikTok link.", code: 'INVALID_URL' });
  }
  next();
}

module.exports = { validateUrl, isValidTikTokUrl };

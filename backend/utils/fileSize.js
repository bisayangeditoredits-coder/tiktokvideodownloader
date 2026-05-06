/**
 * File Size Utility
 * Estimates file size by firing a HEAD request and reading Content-Length.
 */
const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

/**
 * Returns human-readable size string (e.g. "24.3 MB") or null if unknown.
 */
async function getFileSize(url) {
  if (!url) return null;
  try {
    const res = await axios.head(url, {
      timeout: 6_000,
      validateStatus: () => true,
      headers: { 'User-Agent': UA, 'Referer': 'https://www.tiktok.com/' },
      maxRedirects: 5,
    });
    const bytes = parseInt(res.headers['content-length'], 10);
    if (!bytes || isNaN(bytes)) return null;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  } catch {
    return null;
  }
}

/**
 * Fetch sizes for multiple URLs in parallel.
 * Returns { hd, sd, watermark, audio } — each may be null.
 */
async function fetchAllSizes({ hdUrl, sdUrl, watermarkUrl, audioUrl }) {
  const [hd, sd, watermark, audio] = await Promise.all([
    getFileSize(hdUrl),
    getFileSize(sdUrl),
    getFileSize(watermarkUrl),
    getFileSize(audioUrl),
  ]);
  return { hd, sd, watermark, audio };
}

module.exports = { getFileSize, fetchAllSizes };

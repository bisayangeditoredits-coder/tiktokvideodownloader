/**
 * URL Resolver Utility
 * Expands short TikTok URLs (vm.tiktok.com, vt.tiktok.com) to full URLs.
 */
const axios = require('axios');

const SHORT_HOSTS = new Set(['vm.tiktok.com', 'vt.tiktok.com']);

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

async function resolveShortUrl(url) {
  try {
    const { hostname } = new URL(url);
    if (!SHORT_HOSTS.has(hostname)) return url;

    const res = await axios.get(url, {
      maxRedirects: 10,
      validateStatus: () => true,
      headers: { 'User-Agent': UA },
      timeout: 10_000,
    });

    return res.request?.res?.responseUrl || res.config?.url || url;
  } catch {
    return url; // fall back to original on any error
  }
}

module.exports = { resolveShortUrl };

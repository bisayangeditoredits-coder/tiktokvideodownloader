/**
 * TikTok Scraper Service
 * Triple-fallback chain: tikwm → ssstik → snaptik
 */
const axios = require('axios');
const { extractSsstikLinks } = require('../utils/htmlParser');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

// ── Helpers ───────────────────────────────────────────────────

function formatDuration(seconds) {
  if (!seconds) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatViews(n) {
  if (!n) return null;
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

// ── Source 1: tikwm.com ───────────────────────────────────────

async function fetchFromTikwm(videoUrl) {
  const form = new URLSearchParams({ url: videoUrl, hd: '1' });

  const res = await axios.post(
    process.env.TIKWM_API_URL || 'https://www.tikwm.com/api/',
    form,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': UA, 'Accept': 'application/json' },
      timeout: 15_000,
    }
  );

  const data = res.data;
  if (!data || data.code !== 0 || !data.data) throw new Error(data?.msg || 'tikwm: no data');

  const d = data.data;
  return {
    source    : 'tikwm',
    title     : d.title || 'TikTok Video',
    author    : `@${d.author?.unique_id || d.author?.nickname || 'unknown'}`,
    avatar    : d.author?.avatar || null,
    thumbnail : d.cover || d.origin_cover || null,
    duration  : formatDuration(d.duration),
    views     : formatViews(d.play_count),
    hdUrl     : d.hdplay || d.play || null,
    sdUrl     : d.play || null,
    watermarkUrl: d.wmplay || d.play || null,
    audioUrl  : d.music || null,
  };
}

// ── Source 2: ssstik.io ───────────────────────────────────────

async function fetchFromSsstik(videoUrl) {
  const homeRes = await axios.get('https://ssstik.io', {
    headers: { 'User-Agent': UA },
    timeout: 10_000,
  });

  const ttMatch = homeRes.data.match(/s_tt\s*=\s*["']([^"']+)["']/);
  if (!ttMatch) throw new Error('ssstik: could not extract token');

  const form = new URLSearchParams({ id: videoUrl, locale: 'en', tt: ttMatch[1] });

  const apiRes = await axios.post(
    process.env.SSSTIK_API_URL || 'https://ssstik.io/abc',
    form,
    {
      params : { url: 'dl' },
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent'  : UA,
        'Referer'     : 'https://ssstik.io/',
        'Origin'      : 'https://ssstik.io',
        'Accept'      : '*/*',
      },
      timeout: 15_000,
    }
  );

  const html = apiRes.data;
  if (typeof html !== 'string' || html.length < 100) throw new Error('ssstik: empty response');

  const links = extractSsstikLinks(html);
  if (!links.hdUrl && !links.sdUrl) throw new Error('ssstik: no download links — video may be private');

  return {
    source    : 'ssstik',
    title     : links.title,
    author    : '@unknown',
    avatar    : null,
    thumbnail : links.thumbnail,
    duration  : null,
    views     : null,
    hdUrl     : links.hdUrl,
    sdUrl     : links.sdUrl,
    watermarkUrl: links.sdUrl,
    audioUrl  : links.audioUrl,
  };
}

// ── Source 3: snaptik.app ─────────────────────────────────────

async function fetchFromSnaptik(videoUrl) {
  const homeRes = await axios.get('https://snaptik.app', {
    headers: { 'User-Agent': UA },
    timeout: 10_000,
  });

  const tokenMatch = homeRes.data.match(/name="token"\s+value="([^"]+)"/i);
  if (!tokenMatch) throw new Error('snaptik: token not found');

  const form = new URLSearchParams({ url: videoUrl, token: tokenMatch[1] });

  const apiRes = await axios.post('https://snaptik.app/abc2.php', form, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'User-Agent'  : UA,
      'Referer'     : 'https://snaptik.app/',
      'Origin'      : 'https://snaptik.app',
    },
    timeout: 15_000,
  });

  const html = apiRes.data;
  if (typeof html !== 'string' || html.length < 100) throw new Error('snaptik: empty response');

  const hdMatch = html.match(/href="(https:\/\/[^"]+)"[^>]*class="[^"]*abutton[^"]*"/i)
               || html.match(/href="(https:\/\/[^"]+)"[^>]*>\s*Download HD\s*/i)
               || html.match(/href="(https:\/\/[^"]+video[^"]+)"/i);

  if (!hdMatch) throw new Error('snaptik: no download link found');

  return {
    source    : 'snaptik',
    title     : 'TikTok Video',
    author    : '@unknown',
    avatar    : null,
    thumbnail : null,
    duration  : null,
    views     : null,
    hdUrl     : hdMatch[1],
    sdUrl     : hdMatch[1],
    watermarkUrl: hdMatch[1],
    audioUrl  : null,
  };
}

// ── Public: Triple-fallback fetch ─────────────────────────────

async function fetchVideoInfo(videoUrl) {
  const sources = [
    { name: 'tikwm',    fn: () => fetchFromTikwm(videoUrl) },
    { name: 'ssstik',   fn: () => fetchFromSsstik(videoUrl) },
    { name: 'snaptik',  fn: () => fetchFromSnaptik(videoUrl) },
  ];

  let lastError;
  for (const { name, fn } of sources) {
    try {
      const result = await fn();
      console.log(`[tiktok] ${name} succeeded for ${videoUrl}`);
      return result;
    } catch (err) {
      console.warn(`[tiktok] ${name} failed:`, err.message);
      lastError = err;
    }
  }

  // All failed
  const msg = lastError?.message?.toLowerCase() || '';
  if (msg.includes('private')) throw { code: 'VIDEO_UNAVAILABLE', message: 'This video is private or has been removed.' };
  throw { code: 'FETCH_FAILED', message: 'Could not fetch video info. The video may be private or unavailable.' };
}

module.exports = { fetchVideoInfo };

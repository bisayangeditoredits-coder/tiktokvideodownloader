/**
 * Downloader Service
 * Streams video/audio files through the server to bypass CORS.
 * Supports Range requests for resumable downloads.
 */
const axios = require('axios');

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36';

async function proxyDownload(req, res) {
  const { url, filename = 'tiktokwatermarkremover-video.mp4', type = 'video/mp4' } = req.query;

  if (!url) return res.status(400).json({ success: false, error: 'Missing url parameter' });

  let parsedUrl;
  try { parsedUrl = new URL(url); }
  catch { return res.status(400).json({ success: false, error: 'Invalid URL' }); }

  console.log(`[downloader] Proxying ${parsedUrl.hostname} → ${filename}`);

  // Forward Range header if present (resumable downloads)
  const headers = {
    'User-Agent': UA,
    'Referer'   : 'https://www.tiktok.com/',
  };
  if (req.headers.range) headers['Range'] = req.headers.range;

  try {
    const upstream = await axios.get(url, {
      responseType: 'stream',
      timeout     : 60_000,
      headers,
      maxRedirects: 10,
      validateStatus: (s) => s < 500,
    });

    const status = upstream.status === 206 ? 206 : 200;
    const contentType = upstream.headers['content-type'] || type;

    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Accept-Ranges', 'bytes');

    if (upstream.headers['content-length']) res.setHeader('Content-Length', upstream.headers['content-length']);
    if (upstream.headers['content-range']) res.setHeader('Content-Range', upstream.headers['content-range']);

    res.status(status);
    upstream.data.pipe(res);

    upstream.data.on('error', (err) => {
      console.error('[downloader] stream error:', err.message);
      if (!res.headersSent) res.status(500).json({ success: false, error: 'Stream error' });
    });

  } catch (err) {
    console.error('[downloader] error:', err.message);
    if (!res.headersSent) res.status(500).json({ success: false, error: 'Failed to proxy download' });
  }
}

module.exports = { proxyDownload };

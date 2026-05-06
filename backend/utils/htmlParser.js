/**
 * HTML Parser Utility
 * Shared regex/cheerio helpers for scraping download links from HTML responses.
 */

function extractHref(html, pattern) {
  const m = html.match(pattern);
  return m ? m[1] : null;
}

function extractSsstikLinks(html) {
  const hdUrl = extractHref(html, /href="(https:\/\/[^"]+)"[^>]*>\s*Without watermark/i)
             || extractHref(html, /href="(https:\/\/[^"]+)"[^>]*class="[^"]*download_link[^"]*"/i);

  const sdUrl = extractHref(html, /href="(https:\/\/[^"]+)"[^>]*>\s*With watermark/i);

  const audioUrl = extractHref(html, /href="(https:\/\/[^"]+)"[^>]*>\s*Download Music/i)
                || extractHref(html, /href="(https:\/\/[^"]+\.mp3[^"]*)"[^>]*/i);

  const thumbnail = extractHref(html, /src="(https:\/\/[^"]+)"[^>]*class="[^"]*rounded[^"]*"/i)
                 || extractHref(html, /<img[^>]+src="(https:\/\/p[^"]+)"/i);

  const titleMatch = html.match(/<p[^>]*class="[^"]*maintext[^"]*"[^>]*>([^<]+)<\/p>/i)
                  || html.match(/<title[^>]*>([^<]+)<\/title>/i);
  const title = titleMatch
    ? titleMatch[1].trim().replace(/\s*-\s*ssstik.*$/i, '').replace(/\s*\|\s*.*$/i, '').trim()
    : 'TikTok Video';

  return { hdUrl, sdUrl, audioUrl, thumbnail, title };
}

module.exports = { extractHref, extractSsstikLinks };

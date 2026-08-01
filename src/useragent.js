// Spoofed user agent used for all windows that load music.apple.com,
// so the site serves the full web player instead of an "outdated
// browser" page. Kept in one place so it only needs updating here.
function defaultUserAgent() {
  return 'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36';
}

module.exports = defaultUserAgent;

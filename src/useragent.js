// Shared User-Agent override for every window that loads Apple Music.
//
// The stock Electron UA contains "Electron/x.y.z", which makes some sites
// (Apple Music among them) refuse to play or show "browser outdated" notices
// even though this build supports Widevine. Presenting a plain Chrome UA
// avoids that.
//
// The platform token has to match the host OS, otherwise a Windows user looks
// like a Linux one. Chrome's reduced User-Agent freezes the OS version and
// the CPU token, so these strings are what real Chrome reports:
//   Windows: Windows NT 10.0; Win64; x64   (on every Windows version and arch)
//   macOS:   Macintosh; Intel Mac OS X 10_15_7   (including Apple Silicon)
//   Linux:   X11; Linux x86_64
// The Chrome major version is taken from the bundled Chromium so it stays
// current when Electron is upgraded. Real Chrome freezes the rest to 0.0.0.
function platformToken() {
  switch (process.platform) {
    case 'win32':
      return 'Windows NT 10.0; Win64; x64';
    case 'darwin':
      return 'Macintosh; Intel Mac OS X 10_15_7';
    default:
      // Linux, and the BSDs, which Chrome also reports as X11
      return 'X11; Linux x86_64';
  }
}

function defaultUserAgent() {
  const chromeMajor = process.versions.chrome.split('.')[0];
  return 'Mozilla/5.0 (' + platformToken() + ') AppleWebKit/537.36 (KHTML, like Gecko) '
    + 'Chrome/' + chromeMajor + '.0.0.0 Safari/537.36';
}

module.exports = { defaultUserAgent, platformToken };

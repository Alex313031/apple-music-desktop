const Os = require('os');
const remote = require('@electron/remote');

// Globally export what OS we are on
const isLinux = process.platform === 'linux';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

// Show version numbers of bundled Electron.
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  for (const dependency of ['electron', 'chrome', 'node', 'v8']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
});

// Get app version from package.json
const appVersion = remote.app.getVersion();

let osType;
if (isLinux) {
  osType = 'Linux';
} else if (isWin) {
  osType = 'Win';
} else if (isMac) {
  osType = 'MacOS';
} else {
  osType = 'BSD';
}
const archType = Os.arch();

// Show app version in about.html
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  replaceText('app-version', appVersion);
  replaceText('os-type', osType);
  replaceText('arch-type', archType);
});

console.log('electron.renderer: Electron versions exported');

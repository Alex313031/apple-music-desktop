const remote = require('@electron/remote');

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
var appVersion = remote.app.getVersion();

// Show app version in about.html
window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  replaceText(`yiff-version`, appVersion)
});

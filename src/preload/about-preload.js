const { ipcRenderer } = require('electron');

// Globally export what OS we are on
const isLinux = process.platform === 'linux';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

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

// Show app version, OS info and version numbers of bundled Electron in about.html
window.addEventListener('DOMContentLoaded', async () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }
  for (const dependency of ['electron', 'chrome', 'node', 'v8']) {
    replaceText(`${dependency}-version`, process.versions[dependency])
  }
  replaceText('os-type', osType);
  replaceText('arch-type', process.arch);
  const appVersion = await ipcRenderer.invoke('get-app-version');
  replaceText('app-version', appVersion);
});

console.log('electron.renderer: Electron versions exported');

// Fills in about.html. A preload script keeps DOM access even with
// contextIsolation enabled, so no page script or @electron/remote is needed.
const { ipcRenderer } = require('electron');

let osType;
if (process.platform === 'linux') {
  osType = 'Linux';
} else if (process.platform === 'win32') {
  osType = 'Win';
} else if (process.platform === 'darwin') {
  osType = 'MacOS';
} else {
  osType = 'BSD';
}

const replaceText = (selector, text) => {
  const element = document.getElementById(selector);
  if (element) element.innerText = text;
};

window.addEventListener('DOMContentLoaded', async () => {
  // Show version numbers of bundled Electron
  for (const dependency of [ 'electron', 'chrome', 'node', 'v8' ]) {
    replaceText(`${dependency}-version`, process.versions[dependency]);
  }
  replaceText('os-type', osType);
  replaceText('arch-type', process.arch);

  // The app version lives in package.json, which only the main process reads
  try {
    replaceText('app-version', await ipcRenderer.invoke('get-app-version'));
  } catch (error) {
    console.error('Could not get the app version: ' + error);
  }
});

console.log('electron.renderer: Electron versions exported');

const { contextBridge, ipcRenderer } = require('electron');

// The main window loads remote content (music.apple.com), so only expose a
// narrow, allow-listed bridge instead of the raw ipcRenderer object.
// renderer/info.js (injected via executeJavaScript) calls ipc.send('track-name', ...).
const allowedSendChannels = ['track-name'];

contextBridge.exposeInMainWorld('ipc', {
  send: (channel, ...args) => {
    if (allowedSendChannels.includes(channel)) {
      ipcRenderer.send(channel, ...args);
    }
  }
});

ipcRenderer.invoke('finished-preload');

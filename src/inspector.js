// Opens a DevTools window attached to the MAIN process (not a page).
//
// Electron has no API for this, so it is done in two steps:
//   1. node:inspector exposes the main process V8 inspector over a local
//      WebSocket (same thing `electron --inspect` does, but on demand).
//   2. The Node-only DevTools frontend lives at a devtools:// URL, which a
//      normal BrowserWindow is not allowed to load. Passing a window's
//      webContents to setDevToolsWebContents() grants it DevTools privileges,
//      after which it can be navigated to that frontend.
const { BrowserWindow } = require('electron');
const inspector = require('node:inspector');
const electronLog = require('electron-log');

let inspectorWindow; // Window hosting the main process DevTools
let privilegeHost; // Hidden window used only to mint a privileged webContents
let openedInspector; // Whether we started the inspector (vs. --inspect at launch)

function openMainProcessDevTools() {
  // Focus the existing window instead of opening a second debugger client,
  // since the V8 inspector only accepts one connection at a time.
  if (inspectorWindow && !inspectorWindow.isDestroyed()) {
    inspectorWindow.show();
    inspectorWindow.focus();
    electronLog.info('Main process DevTools already open');
    return;
  }

  try {
    // Reuse the existing endpoint if the app was started with --inspect,
    // otherwise listen on an ephemeral port, loopback only, without blocking.
    if (!inspector.url()) {
      inspector.open(0, '127.0.0.1', false);
      openedInspector = true;
    }
    const inspectorUrl = inspector.url();
    if (!inspectorUrl) {
      electronLog.error('Could not start the main process inspector');
      return;
    }

    inspectorWindow = new BrowserWindow({
      width: 1024,
      height: 768,
      useContentSize: true,
      title: 'Main Process DevTools'
    });
    // The DevTools frontend sets document.title to "DevTools", which would
    // otherwise hide which process this window is attached to
    inspectorWindow.on('page-title-updated', (event) => {
      event.preventDefault();
    });

    privilegeHost = new BrowserWindow({ show: false });
    privilegeHost.webContents.setDevToolsWebContents(inspectorWindow.webContents);
    privilegeHost.webContents.openDevTools({ mode: 'detach' });

    const frontendUrl = 'devtools://devtools/bundled/js_app.html?v8only=true&ws='
      + inspectorUrl.replace(/^ws:\/\//, '');
    inspectorWindow.webContents.loadURL(frontendUrl).catch((error) => {
      electronLog.error('Could not load the main process DevTools frontend: ' + error);
    });

    inspectorWindow.on('closed', () => {
      inspectorWindow = undefined;
      if (privilegeHost && !privilegeHost.isDestroyed()) {
        privilegeHost.destroy();
      }
      privilegeHost = undefined;
      // Don't leave the debug port listening once the window is gone, unless
      // the app was launched with --inspect and something else owns it
      if (openedInspector) {
        inspector.close();
        openedInspector = false;
      }
      electronLog.info('Closed main process DevTools');
    });

    electronLog.info('Opened main process DevTools on ' + inspectorUrl);
  } catch (error) {
    electronLog.error('openMainProcessDevTools() failed: ' + error);
  }
}

module.exports = { openMainProcessDevTools };

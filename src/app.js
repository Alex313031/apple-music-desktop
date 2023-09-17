const { app, BrowserWindow, components, dialog, Menu, nativeTheme, shell, Tray } = require('electron');
const electronLog = require('electron-log');
const contextMenu = require('electron-context-menu');
const Store = require('electron-store');
const path = require('path');
const fs = require('fs');
const url = require('url');
const appName = app.getName();
const userDataDir = app.getPath('userData');
const userLogFile = path.join(userDataDir, 'logs/main.log');

// Initialize Electron remote module
require('@electron/remote/main').initialize();

// Get app version from package.json
var appVersion = app.getVersion();
// Get Electron versions
var electronVersion = process.versions.electron;
var chromeVersion = process.versions.chrome;
var nodeVersion = process.versions.node;
var v8Version = process.versions.v8;

// Globally export what OS we are on
const isLinux = process.platform === 'linux';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

let mainWindow; // Global Windows object
let mainActivated; // Global activate? object
let mainURL; // Global URL destination object
const argsCmd = process.argv; // Global cmdline object.
const mainMenu = require('./menu'); // menu.js
// Create config.json
const store = new Store();

if (store.get('options.useBetaSite')) {
  mainURL = 'https://beta.music.apple.com/';
} else {
  mainURL = 'https://music.apple.com/';
}

function createWindow () {
  mainWindow = new BrowserWindow({
    title: 'Apple Music',
    resizable: true,
    maximizable: true,
    width: 1024,
    height: 700,
    useContentSize: true,
    icon: isWin ? path.join(__dirname, 'imgs/icon.ico') : path.join(__dirname, 'imgs/icon64.png'),
    darkTheme: store.get('options.useLightMode') ? false : true,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: false,
      sandbox: true,
      experimentalFeatures: true,
      webviewTag: true,
      devTools: true,
      javascript: true,
      plugins: true,
      enableRemoteModule: true,
      // Preload before renderer processes
      preload: path.join(__dirname, 'preload.js')
    }
  });
  require("@electron/remote/main").enable(mainWindow.webContents);
  Menu.setApplicationMenu(mainMenu(app, store));

  if (store.get('options.useLightMode')) {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'dark';
  }

  // Load the index.html or webpage of the app.
  mainWindow.loadURL(mainURL);

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindowClosed();
  });
}

app.on('change-site', () => {
  if (store.get('options.useBetaSite')) {
    mainURL = 'https://beta.music.apple.com/';
  } else {
    mainURL = 'https://music.apple.com/';
  }
  mainWindow.loadURL(mainURL);
});

function minimizeToTray () {
  mainWindow.hide();
  electronLog.info('Minimized to Tray');
}

app.on('minimize-to-tray', () => {
  minimizeToTray();
});

function handleTray() {
  if (store.get('options.disableTray')) {
    return;
  } else {
    const trayContextMenu = Menu.buildFromTemplate([
      { label: 'Minimize to Tray',
        click: function () {
          minimizeToTray();
        }
      },
      { label: 'Quit',
        click: function () {
          app.quit();
        }
      }
    ]);

    // Set the tray icon and name
    const trayIcon = isWin ? path.join(__dirname, 'imgs/icon.ico') : path.join(__dirname, 'imgs/icon64.png'),
    tray = new Tray(trayIcon);
    tray.setToolTip(appName);
    // Create tray menu items
    tray.setContextMenu(trayContextMenu)
    tray.on('click', () => {
      if (mainWindow.isVisible()) {
        mainWindow.focus();
      } else {
        mainWindow.show();
      }
    });
    electronLog.info('handleTray() succeeded');
  }
}

app.on('handle-tray', () => {
  handleTray();
});

function createPopOutWindow() {
  const popoutWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    title: undefined,
    useContentSize: true,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: false,
      sandbox: true,
      experimentalFeatures: true,
      webviewTag: true,
      devTools: true,
      javascript: true,
      plugins: true,
      enableRemoteModule: true,
    }
  });
  popoutWindow.loadURL('https://www.google.com/');
}

app.on('popout', () => {
  createPopOutWindow();
});

contextMenu({
  showSelectAll: false,
  showCopyImage: true,
  showCopyImageAddress: true,
  showSaveImageAs: true,
  showCopyVideoAddress: true,
  showSaveVideoAs: true,
  showCopyLink: true,
  showSaveLinkAs: true,
  showInspectElement: true,
  showLookUpSelection: true,
  showSearchWithGoogle: true,
  prepend: (defaultActions, parameters, browserWindow) => [
  { label: 'Open Video in New Window',
    // Only show it when right-clicking text
    visible: parameters.mediaType === 'video',
    click: (srcURL) => {
      const vidURL = parameters.srcURL;
      let vidTitle;
      vidTitle = vidURL.substring(vidURL.lastIndexOf('/') + 1);
      const newWin = new BrowserWindow({
        title: vidTitle,
        useContentSize: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          contextIsolation: false,
          sandbox: true,
          experimentalFeatures: true,
          webviewTag: true,
          devTools: true,
          javascript: true,
          plugins: true,
          enableRemoteModule: true,
        }
      });
      newWin.loadURL(vidURL);
      electronLog.info('Popped out Video');
    }
  },
  { label: 'Open Link in New Window',
    // Only show it when right-clicking a link
    visible: parameters.linkURL.trim().length > 0,
    click: (linkURL) => {
      const newWin = new BrowserWindow({
        title: 'New Window',
        width: 1024,
        height: 700,
        useContentSize: true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          contextIsolation: false,
          sandbox: true,
          experimentalFeatures: true,
          webviewTag: true,
          devTools: true,
          javascript: true,
          plugins: true,
          enableRemoteModule: true,
        }
      });
      const toURL = parameters.linkURL;
      newWin.loadURL(toURL);
      electronLog.info('Opened New Window');
    }
  }]
});

// Full restart, quitting Electron. Triggered by developer menu and disabling acceleration
app.on('restart', () => {
  electronLog.warn('Restarting App...');
  // Tell app we are going to relaunch
  app.relaunch();
  // Kill Electron to initiate the relaunch
  app.quit();
});

// Dialog box asking if user really wants to restart app
app.on('restart-confirm', () => {
    dialog.showMessageBox(mainWindow, {
        'type': 'question',
        'title': 'Restart Confirmation',
        'message': "Are you sure you want to restart Apple Music?",
        'buttons': [
            'Yes',
            'No'
        ]
    })
      // Dialog returns a promise so let's handle it correctly
      .then((result) => {
          // Bail if the user pressed "No" or escaped (ESC) from the dialog box
          if (result.response !== 0) { return; }
          // Testing.
          if (result.response === 0) {
              //console.log('The "Yes" button was pressed (main process)');
              //app.relaunch();
              //app.quit();
              app.emit('restart');
          }
      })
});

// Run when window is closed. This cleans up the mainWindow object to save resources.
function mainWindowClosed() {
  mainActivated = null;
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on('activate', () => {
  if (mainActivated === null) {
    electronLog.info('App Re-Activated [ Loading app.js ]');
    createWindow();
  }
});

app.whenReady().then(async () => {
  if (argsCmd.includes('--cdm-info')) {
    await components.whenReady();
    console.log('WidevineCDM Component Info:\n');
    console.log(components.status());
    app.quit();
  } else {
    // Initialize Widevine
    await components.whenReady();
    electronLog.info('WidevineCDM component ready.');
    logAppInfo();
    createWindow();
    handleTray();
  }
});

function logAppInfo () {
  electronLog.info('Welcome to Apple Music Desktop!');
  electronLog.info('App Version: ' + [ appVersion ]);
  electronLog.info('Electron Version: ' + [ electronVersion ]);
  electronLog.info('Chromium Version: ' + [ chromeVersion ]);
  electronLog.info('NodeJS Version: ' + [ nodeVersion ]);
  electronLog.info('V8 Version: ' + [ v8Version ]);
  electronLog.info('User Data Dir: ' + userDataDir);
}

// app.commandLine.appendSwitch('enable-experimental-web-platform-features');
app.commandLine.appendSwitch('allow-file-access-from-files');
app.commandLine.appendSwitch('enable-local-file-accesses');
app.commandLine.appendSwitch('enable-quic');
app.commandLine.appendSwitch('enable-ui-devtools');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-features','CSSColorSchemeUARendering,ImpulseScrollAnimations,ParallelDownloading,Portals,StorageBuckets,JXL');

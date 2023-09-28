const { app, BrowserWindow, components, dialog, ipcMain, ipcRenderer, Menu, nativeTheme, Tray } = require('electron');
const electronLog = require('electron-log');
const contextMenu = require('electron-context-menu');
const Store = require('electron-store');
const audioControlJS = require('./audiocontrol.js');
const fs = require('fs');
const path = require('path');
const mainMenu = require('./menu.js'); // For making native menu
const mainLogger = require('./logger.js'); // Misc. logging
// Create config.json
const store = new Store();
const appName = app.getName();
const userDataDir = app.getPath('userData');
const userLogFile = path.join(userDataDir, 'logs/main.log');
const userOldLogFile = path.join(userDataDir, 'logs/main.log.old');

// Initialize Electron remote module
require('@electron/remote/main').initialize();
// Restrict main.log size to 100Kb
electronLog.transports.file.maxSize = 1024 * 100;

// Load in the header scripts for modifying DOM
const injectScript = fs.readFileSync(path.join(__dirname, 'js/index.js'), 'utf8');
const volumeScript = fs.readFileSync(path.join(__dirname, 'js/volume.js'), 'utf8');
const musicKitInit = fs.readFileSync(path.join(__dirname, 'js/musickit.js'), 'utf8');
// Get app version from package.json
var appVersion = app.getVersion();

mainLogger.handleLogging(store);

// Globally export what OS we are on
const isLinux = process.platform === 'linux';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

let mainWindow; // Global Windows object
let mainActivated; // Global activate? object
let mainURL; // Global URL destination object
let windowTitle; // Global Window title object
const argsCmd = process.argv; // Global cmdline object.

if (store.get('options.useBetaSite')) {
  if (store.get('options.useBrowse')) {
    mainURL = 'https://beta.music.apple.com/us/browse';
    windowTitle = appName + ' - Browse';
  } else if (store.get('options.useRecent')) {
    mainURL = 'https://beta.music.apple.com/us/library/recently-added';
    windowTitle = appName + ' - Recently Added';
  } else if (store.get('options.useArtists')) {
    mainURL = 'https://beta.music.apple.com/us/library/artists';
    windowTitle = appName + ' - Artists';
  } else {
    mainURL = 'https://beta.music.apple.com/';
    windowTitle = appName;
  }
} else {
  if (store.get('options.useBrowse')) {
    mainURL = 'https://music.apple.com/us/browse';
    windowTitle = appName + ' - Browse';
  } else if (store.get('options.useRecent')) {
    mainURL = 'https://music.apple.com/us/library/recently-added';
    windowTitle = appName + ' - Recently Added';
  } else if (store.get('options.useArtists')) {
    mainURL = 'https://music.apple.com/us/library/artists';
    windowTitle = appName + ' - Artists';
  } else {
    mainURL = 'https://music.apple.com/';
    windowTitle = appName;
  }
}

async function createWindow () {
  mainWindow = new BrowserWindow({
    title: windowTitle,
    resizable: true,
    maximizable: true,
    width: 1024,
    height: 700,
    useContentSize: true,
    icon: isWin ? path.join(__dirname, 'imgs/icon.ico') : path.join(__dirname, 'imgs/icon64.png'),
    darkTheme: store.get('options.useLightMode') ? false : true,
    vibrancy: store.get('options.useLightMode') ? 'light' : 'ultra-dark',
    frame: isMac ? true : true,
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
      preload: path.join(__dirname, 'preload/client-preload.js')
    }
  });
  require("@electron/remote/main").enable(mainWindow.webContents);
  Menu.setApplicationMenu(mainMenu(app, mainWindow, store));

  // Reset the Window's size and location
  let windowDetails = store.get('options.windowDetails');
  let relaunchWindowDetails = store.get('relaunch.windowDetails');
  if (relaunchWindowDetails) {
    mainWindow.setPosition(
      relaunchWindowDetails.position[0],
      relaunchWindowDetails.position[1]
    );
    store.delete('relaunch.windowDetails');
  } else if (windowDetails) {
    mainWindow.setPosition(
      windowDetails.position[0],
      windowDetails.position[1]
    );
  }

  if (store.get('options.useLightMode')) {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'dark';
  }

  // Load the index.html or webpage of the app.
  mainWindow.loadURL(mainURL);
  mainWindow.on('page-title-updated', function(e) {
    e.preventDefault()
  });
  // Inject Header scripts on page load
  mainWindow.webContents.on('did-stop-loading', () => {
    mainWindow.webContents.executeJavaScript(injectScript);
    mainWindow.webContents.executeJavaScript(volumeScript);
    mainWindow.webContents.executeJavaScript(musicKitInit);
  });
  mainWindow.webContents.on('did-finish-load', () => {
    browserDomReady();
  });
  if (mainURL == 'https://beta.music.apple.com/') {
    electronLog.warn('Note: Using Beta site');
  }

  // Emitted when the window is closing
  mainWindow.on('close', () => {
    // If enabled store the window details so they can be restored upon restart
    if (store.get('options.windowDetails')) {
      if (mainWindow) {
        store.set('options.windowDetails', {
          position: mainWindow.getPosition()
        });
        electronLog.info('Saved windowDetails.');
      } else {
        electronLog.error('Error: mainWindow was not defined while trying to save windowDetails.');
      }
    }
    pauseTrack();
    electronLog.info('mainWindow.close()');
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindowClosed();
  });
}

app.on('change-site', () => {
  let logMessage;
  if (store.get('options.useBetaSite')) {
    if (store.get('options.useBrowse')) {
      mainURL = 'https://beta.music.apple.com/us/browse';
      windowTitle = appName + ' - Browse';
    } else if (store.get('options.useRecent')) {
      mainURL = 'https://beta.music.apple.com/us/library/recently-added';
      windowTitle = appName + ' - Recently Added';
    } else if (store.get('options.useArtists')) {
      mainURL = 'https://beta.music.apple.com/us/library/artists';
      windowTitle = appName + ' - Artists';
    } else {
      mainURL = 'https://beta.music.apple.com/';
      windowTitle = appName;
    }
  } else {
    if (store.get('options.useBrowse')) {
      mainURL = 'https://music.apple.com/us/browse';
      windowTitle = appName + ' - Browse';
    } else if (store.get('options.useRecent')) {
      mainURL = 'https://music.apple.com/us/library/recently-added';
      windowTitle = appName + ' - Recently Added';
    } else if (store.get('options.useArtists')) {
      mainURL = 'https://music.apple.com/us/library/artists';
      windowTitle = appName + ' - Artists';
    } else {
      mainURL = 'https://music.apple.com/';
      windowTitle = appName;
    }
  }
  electronLog.info('Switching to ' + mainURL);
  mainWindow.loadURL(mainURL);
  mainWindow.setTitle(windowTitle);
  mainWindow.on('page-title-updated', function(e) {
    e.preventDefault()
  });
  mainWindow.webContents.on('did-stop-loading', () => {
    mainWindow.webContents.executeJavaScript(injectScript);
    mainWindow.webContents.executeJavaScript(volumeScript);
    mainWindow.webContents.executeJavaScript(musicKitInit);
  });
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.webContents.executeJavaScript(injectScript);
    mainWindow.webContents.executeJavaScript(volumeScript);
    mainWindow.webContents.executeJavaScript(musicKitInit);
  });
});

function minimizeToTray () {
  mainWindow.hide();
  electronLog.info('Minimized to Tray');
}

function showFromTray () {
  if (mainWindow.isVisible()) {
    mainWindow.focus();
  } else {
    mainWindow.show();
  }
}

app.on('minimize-to-tray', () => {
  minimizeToTray();
});

function handleTray() {
  try {
    if (store.get('options.disableTray')) {
      return;
    } else {
      var needsFixing = (isLinux);
      const trayContextMenu = Menu.buildFromTemplate([
        { label: 'Play/Pause',
          click: function () {
            app.emit('play-pause');
          }
        },
        { label: 'Next Track',
          click: function () {
            app.emit('next-track');
          }
        },
        { label: 'Previous Track',
          click: function () {
            app.emit('previous-track');
          }
        },
        { label: 'Get Info',
          click: function () {
            app.emit('get-track-info');
          }
        },
        { type: 'separator' },
        { label: 'Minimize to Tray',
          click: function () {
            minimizeToTray();
          }
        },
        { label: 'Show',
          visible: needsFixing,
          click: function () {
            mainWindow.show();
            electronLog.info('Restored from Tray');
          }
        },
        { label: 'Quit',
          role: 'quit',
          click: function () {
            app.quit();
          }
        }
      ]);

      // Set the tray icon and name
      const trayIcon = isWin ? path.join(__dirname, 'imgs/icon.ico') : path.join(__dirname, 'imgs/icon48.png'),
      tray = new Tray(trayIcon);
      tray.setToolTip(appName);
      // Create tray menu items
      tray.setContextMenu(trayContextMenu)
      tray.on('click', () => {
        if (isLinux) {
          mainWindow.show();
        } else {
          showFromTray();
        }
        electronLog.info('Restored from Tray');
      });
      electronLog.info('handleTray() succeeded');
    }
  } catch (error) {
    electronLog.error('handleTray() failed: ' + error);
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
  prepend: (defaultActions, parameters) => [
  { label: 'Open Video in New Window',
    // Only show it when right-clicking text
    visible: parameters.mediaType === 'video',
    click: () => {
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
    click: () => {
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

// Full restart, quitting Electron.
app.on('restart', () => {
  electronLog.warn('Restarting App...');

  store.set('relaunch.windowDetails', {
    position: mainWindow.getPosition()
  });

  // Close Window
  mainWindow.removeListener('closed', mainWindowClosed);

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
              app.emit('restart');
          }
      })
});

ipcMain.handle('finished-preload', () => {
  electronLog.info('[ electron:preload ] IPC Listeners Created');
});

ipcMain.on('track-name', (event, trackName) => {
  electronLog.info('Now Playing: ' + trackName)
});

// This method is called when the BrowserWindow's DOM is ready
// it is used to inject the index.js into the webpage.
function browserDomReady() {
  // TODO: This is a temp fix and a proper fix should be developed
  if (mainWindow !== null) {
    mainWindow.webContents.executeJavaScript(injectScript);
    mainWindow.webContents.executeJavaScript(volumeScript);
    mainWindow.webContents.executeJavaScript(musicKitInit);
  }
  if (store.get('options.devToolsOnStart')) {
    mainWindow.openDevTools({ mode: 'detach' });
  }
}

function pauseTrack () {
  mainWindow.webContents.executeJavaScript(audioControlJS.pause());
}

app.on('get-track-info', () => {
  mainWindow.webContents.executeJavaScript(audioControlJS.getInfo());
});

app.on('play-pause', () => {
  mainWindow.webContents.executeJavaScript(audioControlJS.playPause());
});

app.on('next-track', () => {
  mainWindow.webContents.executeJavaScript(audioControlJS.nextTrack());
});

app.on('previous-track', () => {
  mainWindow.webContents.executeJavaScript(audioControlJS.previousTrack());
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

app.on('before-quit', () => {
  pauseTrack();
});

app.on('quit', () => {
  app.exit();
  app.quit();
});

// On macOS it's common to re-create a window in the app when the
// dock icon is clicked and there are no other windows open.
app.on('activate', () => {
  if (mainActivated === null) {
    electronLog.info('App Re-Activated [ Loading app.js ]');
    createWindow();
  }
});

// Append some Chromium command-line switches for GPU acceleration and other features
app.commandLine.appendSwitch('enable-local-file-accesses');
app.commandLine.appendSwitch('enable-quic');
app.commandLine.appendSwitch('enable-ui-devtools');
app.commandLine.appendSwitch('ignore-gpu-blocklist');
app.commandLine.appendSwitch('enable-gpu-rasterization');
app.commandLine.appendSwitch('enable-features','CSSColorSchemeUARendering,ImpulseScrollAnimations,ParallelDownloading,Portals,StorageBuckets,JXL');
// Enable remote debugging only if we in development mode
if (process.env.NODE_ENV === 'development') {
  const portNumber = '9222'
  app.commandLine.appendSwitch('remote-debugging-port', portNumber);
  electronLog.warn('Remote debugging open on port ' + [ portNumber ]);
}

// I'm a Log freak, can you tell?
function logAppInfo () {
  mainLogger.startLogging(store);
}

// Called on disallowed remote APIs below
function rejectEvent(event) {
  event.preventDefault();
}

/* Restrict certain Electron APIs in the renderer process for security */
app.on('remote-require', rejectEvent);
app.on('remote-get-current-window', rejectEvent);
app.on('remote-get-current-web-contents', rejectEvent);
app.on('remote-get-guest-web-contents', rejectEvent);

// Fire it up
app.whenReady().then(async () => {
  if (argsCmd.includes('--cdm-info')) {
    await components.whenReady();
    console.log('WidevineCDM Component Info:\n');
    console.log(components.status());
    app.quit();
  } else {
    // Initialize Widevine
    await components.whenReady();
    electronLog.info('Welcome to Apple Music Desktop!');
    electronLog.info('WidevineCDM component ready.');
    logAppInfo();
    handleTray();
    createWindow();
    store.set('version', appVersion);
    electronLog.info('mainURL is: ' + mainURL);
  }
});

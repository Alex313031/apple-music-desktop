const { app, BrowserWindow, session, ipcMain, Menu, nativeTheme } = require('electron');
const electronLog = require('electron-log');
const contextMenu = require('electron-context-menu');
const Store = require('electron-store');
const audioControlJS = require('./audiocontrol.js');
const fs = require('fs');
const path = require('path');
const mainMenu = require('./menu.js'); // For making native menu
const mainLogger = require('./logger.js'); // Misc. logging
const isDev = process.env.NODE_ENV === 'development';

// Create config.json
const store = new Store();

// Initialize Electron remote module
require('@electron/remote/main').initialize();

// Restrict main.log size to 100Kb
electronLog.initialize();
electronLog.transports.file.maxSize = 1024 * 100;

// Load in the header scripts for modifying DOM
const injectScript = fs.readFileSync(path.join(__dirname, 'renderer/index.js'), 'utf8');
const volumeScript = fs.readFileSync(path.join(__dirname, 'renderer/volume.js'), 'utf8');
const musicKitInit = fs.readFileSync(path.join(__dirname, 'renderer/musickit.js'), 'utf8');
const trackInfoScript = fs.readFileSync(path.join(__dirname, 'renderer/info.js'), 'utf8');

// Get app details from package.json
const appName = app.getName();
const appVersion = app.getVersion();

// Initialize logging (if enabled)
mainLogger.handleLogging(store);

// Globally export what OS we are on
const isLinux = process.platform === 'linux';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

const argsCmd = process.argv; // Global cmdline object.
let mainWindow; // Main Window object
let tray; // OS tray object
let mainActivated; // Global activate? object
let mainURL; // Global URL destination object
let mediaIsPlaying; // Global media state object
let windowTitle; // Global Window title object
// To be defined later when createTrackDialog() is invoked
let trackTitle;
let trackAlbum;
let trackArtist;

if (store.get('options.useBetaSite')) {
  if (store.get('options.useBrowse')) {
    mainURL = 'https://beta.music.apple.com/us/browse';
  } else if (store.get('options.useRecent')) {
    mainURL = 'https://beta.music.apple.com/us/library/recently-added';
  } else if (store.get('options.useArtists')) {
    mainURL = 'https://beta.music.apple.com/us/library/artists';
  } else {
    mainURL = 'https://beta.music.apple.com/';
  }
  windowTitle = appName + ' Beta';
} else {
  if (store.get('options.useBrowse')) {
    mainURL = 'https://music.apple.com/us/browse';
  } else if (store.get('options.useRecent')) {
    mainURL = 'https://music.apple.com/us/library/recently-added';
  } else if (store.get('options.useArtists')) {
    mainURL = 'https://music.apple.com/us/library/artists';
  } else {
    mainURL = 'https://music.apple.com/';
  }
  windowTitle = appName;
}

async function createWindow() {
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
    autoHideMenuBar: store.get('options.autoHideMenuBar') ? true : false,
    frame: isMac ? true : true,
    webPreferences: {
      nodeIntegration: false,
      nodeIntegrationInWorker: false,
      contextIsolation: false,
      sandbox: true,
      experimentalFeatures: true,
      devTools: true,
      preload: path.join(__dirname, 'preload/client-preload.js')
    }
  });
  require('@electron/remote/main').enable(mainWindow.webContents);
  Menu.setApplicationMenu(mainMenu(app, mainWindow, store));

  // Reset the Window's size and location
  const windowDetails = store.get('options.windowDetails');
  const relaunchWindowDetails = store.get('relaunch.windowDetails');
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

  // Detect and set config on null version
  if (!store.get('version')) {
    store.set('version', appVersion);
    store.set('options.windowDetails', true);
    electronLog.info('Initialized Configuration');
  } else {
    store.set('version', appVersion);
  }

  if (store.get('options.useLightMode')) {
    nativeTheme.themeSource = 'light';
  } else {
    nativeTheme.themeSource = 'dark';
  }

  // Load the index.html or webpage of the app.
  mainWindow.loadURL(mainURL);
  mainWindow.on('page-title-updated', function(e) {
    e.preventDefault();
  });
  // Inject Header scripts on page load
  mainWindow.webContents.on('did-stop-loading', () => {
    browserDomReady();
  });
  if (mainURL === 'https://beta.music.apple.com/') {
    electronLog.warn('Note: Using Beta site');
  }

  // Handler for when the DOM is being unloaded
  mainWindow.onbeforeunload = (e) => {
    app.emit('pause');
    e.returnValue = false
  };

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
    app.emit('pause');
    store.delete('options.useMiniPlayer');
    electronLog.info('Closed mainWindow');
    if (tray) {
     // tray.destroy();
    }
    mainWindow.destroy();
  });

  mainWindow.webContents.on('media-started-playing', () => {
    handleMediaState();
  });

  // Emitted when the window is closed.
  mainWindow.on('closed', () => {
    mainWindowClosed();
    if (isDev) {
      electronLog.warn('mainWindowClosed()');
    }
  });
}

app.on('reload', () => {
  mainWindow.reload();
  electronLog.info('mainWindow reloaded');
});

app.on('change-site', () => {
  let logMessage;
  if (store.get('options.useBetaSite')) {
    if (store.get('options.useBrowse')) {
      mainURL = 'https://beta.music.apple.com/us/browse';
    } else if (store.get('options.useRecent')) {
      mainURL = 'https://beta.music.apple.com/us/library/recently-added';
    } else if (store.get('options.useArtists')) {
      mainURL = 'https://beta.music.apple.com/us/library/artists';
    } else {
      mainURL = 'https://beta.music.apple.com/';
    }
    logMessage = 'Note: Switching to beta site';
    windowTitle = appName + ' Beta';
  } else {
    if (store.get('options.useBrowse')) {
      mainURL = 'https://music.apple.com/us/browse';
    } else if (store.get('options.useRecent')) {
      mainURL = 'https://music.apple.com/us/library/recently-added';
    } else if (store.get('options.useArtists')) {
      mainURL = 'https://music.apple.com/us/library/artists';
    } else {
      mainURL = 'https://music.apple.com/';
    }
    logMessage = 'Note: Switching to regular site';
    windowTitle = appName;
  }
  electronLog.info('Switching to ' + mainURL);
  electronLog.warn(logMessage);
  mainWindow.loadURL(mainURL);
  mainWindow.setTitle(windowTitle);
  mainWindow.on('page-title-updated', function(e) {
    e.preventDefault();
  });
});

function showFromTray() {
    if (mainWindow.isVisible()) {
      mainWindow.focus();
      if (!mainWindow.isFocused()) {
        electronLog.info('Focused mainWindow');
      }
    } else {
      mainWindow.show();
      electronLog.info('Restored from Tray');
    }
}

function minimizeToTray() {
  if (mainWindow.isVisible()) {
    mainWindow.hide();
    electronLog.info('Minimized to Tray');
  } else {
    electronLog.info('mainWindow already minimized to Tray');
  }
}

app.on('minimize-to-tray', () => {
  minimizeToTray();
});

app.on('show-from-tray', () => {
  showFromTray();
});

async function handleTray() {
  try {
    if (store.get('options.disableTray')) {
      return;
    } else {
      const trayContextMenu = require('./tray.js');
      // Set the tray icon and name
      const trayIcon = isWin ? path.join(__dirname, 'imgs/icon.ico') : path.join(__dirname, 'imgs/icon48.png');
      tray = new Tray(trayIcon);
      tray.setToolTip(appName);
      // Create tray menu items
      tray.setContextMenu(trayContextMenu(app))
      tray.on('click', () => {
        tray.popUpContextMenu();
      });
    }
  } catch (error) {
    electronLog.error('handleTray() failed: ' + error);
    if (isLinux) {
      electronLog.warn('Note: Some Linux distros lack a tray');
    }
  }
}

// miniPlayer
app.on('toggle-miniplayer', () => {
  if (store.get('options.useMiniPlayer')) {
    electronLog.info('Switching to MiniPlayer mode');
    if (mainWindow.isMaximized) {
      mainWindow.unmaximize();
    }
    mainWindow.setSize(500, 500);
    mainWindow.setSize(360, 350);
    mainWindow.webContents.reload();
    // mainWindow.webContents.executeJavaScript("_miniPlayer.setMiniPlayer(true)").catch((e) => console.error(e));
    Menu.setApplicationMenu(mainMenu(app, mainWindow, store));
    mainWindow.isMiniplayerActive = true;
  } else {
    electronLog.info('Switching to normal mode');
    mainWindow.setSize(1024, 700);
    mainWindow.webContents.reload();
    Menu.setApplicationMenu(mainMenu(app, mainWindow, store));
    mainWindow.isMiniplayerActive = false;
  }
  if (mainWindow.isMiniplayerActive === true) {
    electronLog.info('MiniPlayer is active');
  } else {
    electronLog.info('MiniPlayer disabled');
  }
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
  {
    label: 'Open Link in New Window',
    // Only show it when right-clicking a link
    visible: parameters.linkURL.trim().length > 0,
    click: () => {
      const toURL = parameters.linkURL;
      const linkWin = new BrowserWindow({
        title: 'New Window',
        width: 1024,
        height: 700,
        useContentSize: true,
        darkTheme: store.get('options.useLightMode') ? false : true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      linkWin.loadURL(toURL);
      electronLog.info('Opened Link in New Window');
    }
  },
  {
    label: 'Open Image in New Window',
    // Only show it when right-clicking an image
    visible: parameters.mediaType === 'image',
    click: () => {
      const imgURL = parameters.srcURL;
      const imgTitle = imgURL.substring(imgURL.lastIndexOf('/') + 1);
      const imgWin = new BrowserWindow({
        title: imgTitle,
        useContentSize: true,
        darkTheme: store.get('options.useLightMode') ? false : true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      imgWin.loadURL(imgURL);
      electronLog.info('Opened Image in New Window');
    }
  },
  {
    label: 'Open Video in New Window',
    // Only show it when right-clicking a video
    visible: parameters.mediaType === 'video',
    click: () => {
      const vidURL = parameters.srcURL;
      const vidTitle = vidURL.substring(vidURL.lastIndexOf('/') + 1);
      const vidWin = new BrowserWindow({
        title: vidTitle,
        useContentSize: true,
        darkTheme: store.get('options.useLightMode') ? false : true,
        webPreferences: {
          nodeIntegration: false,
          nodeIntegrationInWorker: false,
          experimentalFeatures: true,
          devTools: true
        }
      });
      vidWin.loadURL(vidURL);
      electronLog.info('Popped out Video');
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

app.on('relaunch', () => {
  electronLog.info('Relaunching ' + appName + '...');

  store.set('relaunch.windowDetails', {
    position: mainWindow.getPosition()
  });

  // Close Window
  mainWindow.removeListener('closed', mainWindowClosed);

  // Close App
  mainWindow.close();
  mainWindow = undefined;

  // Create a New BrowserWindow
  handleTray();
  createWindow();
  electronLog.info('App relaunched! [ Loading main.js ]');
});

// Dialog box asking if user really wants to restart app
app.on('restart-confirm', () => {
  dialog.showMessageBox(mainWindow, {
    'type': 'question',
    'title': 'Restart Confirmation',
    'message': 'Are you sure you want to restart Apple Music?',
    'buttons': [
      'Yes',
      'No'
    ]
  })
  // Dialog returns a promise so let's handle it correctly
  .then((result) => {
    // Bail if the user pressed "No" or escaped (ESC) from the dialog box
    if (result.response !== 0) {
      return;
    }
    // Continue emitting the restart
    if (result.response === 0) {
      app.emit('restart');
    }
  });
});

ipcMain.handle('finished-preload', () => {
  electronLog.info('[ electron:preload ] IPC Listeners Created');
});

ipcMain.on('track-name', (event, trackName, trackAlbumName, trackArtistName) => {
  trackTitle = trackName;
  trackAlbum = trackAlbumName;
  trackArtist = trackArtistName;
  // Print currently playing song to the terminal
  if (trackName == 'NOTRACK') {
    electronLog.info('Track is not playing');
  } else {
    electronLog.info('Now Playing: ' + trackTitle);
  }
  const trackInfo = [
    'Currently playing Track is: ' + trackTitle,
    '',
    'From Album: ' + trackAlbum,
    '',
    'By Artist: ' + trackArtist
  ];
  dialog.showMessageBox({
    type: 'info',
    title: 'Now Playing Info',
    message: trackInfo.join('\n'),
    buttons: ['Ok']
  });
});

function createTrackDialog() {
  mainWindow.webContents.executeJavaScript(trackInfoScript);
}

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

app.on('get-track-info', () => {
  mainWindow.webContents.executeJavaScript(audioControlJS.getInfo());
  createTrackDialog();
});

app.on('play', () => {
  mainWindow.webContents.executeJavaScript(audioControlJS.play());
});

app.on('pause', () => {
  mainWindow.webContents.executeJavaScript(audioControlJS.pause());
  if (mediaIsPlaying === true) {
    electronLog.info('Media was playing');
  }
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
  mainWindow = null;
  mainActivated = null;
}

function handleMediaState() {
  mediaIsPlaying = true;
}

app.on('toggle-menubar', () => {
  if (store.get('options.autoHideMenuBar')) {
    mainWindow.autoHideMenuBar = true;
    mainWindow.menuBarVisible = false;
  } else {
    mainWindow.autoHideMenuBar = false;
    mainWindow.menuBarVisible = true;
  }
  electronLog.info('Note: Changed menu visibility setting');
});

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  //if (process.platform !== 'darwin') {
    app.quit();
  //}
});

app.on('will-quit', () => {
  electronLog.warn(appName + ' is quitting now');
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
app.commandLine.appendSwitch('enable-features', 'CSSColorSchemeUARendering,ImpulseScrollAnimations,ParallelDownloading,Portals,StorageBuckets,JXL');
app.commandLine.appendSwitch('disable-features', 'ChromeRefresh2023,ChromeRefreshSecondary2023,CustomizeChromeSidePanel,ChromeWebuiRefresh2023');
// Enable remote debugging only if we are in development mode
if (isDev) {
  const portNumber = '9222'
  app.commandLine.appendSwitch('remote-debugging-port', portNumber);
  electronLog.warn('Remote debugging open on port ' + [ portNumber ]);
}

// I'm a Log freak, can you tell?
function logAppInfo() {
  mainLogger.startLogging(store);
}

// Called on disallowed remote APIs below
function rejectEvent(event) {
  event.preventDefault();
}

/* Restrict certain Electron APIs in the renderer process for security */
app.on('remote-get-current-window', rejectEvent);
app.on('remote-get-guest-web-contents', rejectEvent);

// Fire it up
app.whenReady().then(async () => {
  // if (argsCmd.includes('--cdm-info')) {
  //   await components.whenReady();
  //   console.log('WidevineCDM Component Info:\n');
  //   console.log(components.status());
  //   app.quit();
  // } else {
      logAppInfo();
      handleTray();
      createWindow();
      electronLog.info('Loading mainURL: ' + mainURL);
  // }
});

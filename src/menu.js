const { app, BrowserWindow, Menu, nativeTheme, shell } = require('electron');
const electronLog = require('electron-log');
const path = require('path');
const appName = app.getName();
const userDataDir = app.getPath('userData');
const userLogFile = path.join(userDataDir, 'logs/main.log');
const userConfigJson = path.join(userDataDir, 'config.json');

// Globally export what OS we are on
const isLinux = process.platform === 'linux';
const isWin = process.platform === 'win32';
const isMac = process.platform === 'darwin';

module.exports = (app, mainWindow, store) => {
  return Menu.buildFromTemplate([
  {
    role: 'fileMenu',
    label: appName,
    submenu: [
      {
        label: 'Go Back',
        accelerator: 'Alt+Left',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.goBack();
          const currentURL = focusedWindow.webContents.getURL();
          electronLog.info('Navigated backward to ' + [ currentURL ]);
        }
      },
      {
        label: 'Go Forward',
        accelerator: 'Alt+Right',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.goForward();
          const currentURL = focusedWindow.webContents.getURL();
          electronLog.info('Navigated forward to ' + [ currentURL ]);
        }
      },
      {
        label: 'Minimize to Tray',
        visible: store.get('options.disableTray') ? false : true,
        accelerator: 'CmdorCtrl+M',
        acceleratorWorksWhenHidden: false,
        click() {
          app.emit('minimize-to-tray');
        }
      },
      {
        label: 'Minimize Window',
        visible: store.get('options.disableTray') ? true : false,
        accelerator: 'CmdorCtrl+M',
        acceleratorWorksWhenHidden: false,
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.minimize();
          electronLog.info('Minimized a Window');
        }
      },
      {
        label: 'Close Window',
        accelerator: 'CmdorCtrl+W',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.close();
          electronLog.info('Closed a Window');
        }
      },
      { type: 'separator' },
      {
        label: 'Relaunch',
        click() {
          app.emit('restart-confirm');
        }
      },
      {
        label: 'Quit ' + appName,
        accelerator: 'CmdOrCtrl+Q',
        role: 'quit'
      }
    ]
  },
  {
    label: 'Settings',
    submenu: [
      {
        label: store.get('options.useLightMode') ? 'Use Dark Mode' : 'Use Light Mode',
        type: 'checkbox',
        accelerator: 'CmdorCtrl+Shift+D',
        click() {
          if (store.get('options.useLightMode')) {
            store.set('options.useLightMode', false);
          } else {
            store.set('options.useLightMode', true);
          }
          app.emit('restart-confirm');
        },
        checked: false
      },
      {
        label: 'Use Beta Site',
        type: 'checkbox',
        click() {
          if (store.get('options.useBetaSite')) {
            store.set('options.useBetaSite', false);
          } else {
            store.set('options.useBetaSite', true);
          }
          app.emit('pause');
          function changeSite() {
            app.emit('change-site');
          }
          setTimeout(changeSite, 500);
        },
        checked: store.get('options.useBetaSite')
      },
      {
        label: 'Toggle Mini Player',
        type: 'checkbox',
        click() {
          if (store.get('options.useMiniPlayer')) {
            store.set('options.useMiniPlayer', false);
          } else {
            store.set('options.useMiniPlayer', true);
          }
          app.emit('toggle-miniplayer');
        },
        checked: false
      },
      {
        label: 'Start Tab',
        submenu: [
          {
            label: 'Browse',
            type: 'checkbox',
            click() {
              if (store.get('options.useBrowse')) {
                store.set('options.useBrowse', false);
              } else {
                store.set('options.useBrowse', true);
                store.set('options.useRecent', false);
                store.set('options.useArtists', false);
              }
              app.emit('change-site');
            },
            checked: store.get('options.useBrowse')
          },
          {
            label: 'Recently Added',
            type: 'checkbox',
            click() {
              if (store.get('options.useRecent')) {
                store.set('options.useRecent', false);
              } else {
                store.set('options.useRecent', true);
                store.set('options.useBrowse', false);
                store.set('options.useArtists', false);
              }
              app.emit('change-site');
            },
            checked: store.get('options.useRecent')
          },
          {
            label: 'Artists',
            type: 'checkbox',
            click() {
              if (store.get('options.useArtists')) {
                store.set('options.useArtists', false);
              } else {
                store.set('options.useArtists', true);
                store.set('options.useBrowse', false);
                store.set('options.useRecent', false);
              }
              app.emit('change-site');
            },
            checked: store.get('options.useArtists')
          }
        ]
      },
      {
        label: 'Remember Window Position',
        type: 'checkbox',
        click() {
          if (store.get('options.windowDetails')) {
            store.delete('options.windowDetails');
          } else {
            store.set('options.windowDetails', {});
          }
        },
        checked: !!store.get('options.windowDetails')
      },
      {
        label: store.get('options.disableTray') ? 'Enable Tray' : 'Disable Tray',
        type: 'checkbox',
        click() {
          if (store.get('options.disableTray')) {
            store.set('options.disableTray', false);
          } else {
            store.set('options.disableTray', true);
          }
          app.emit('restart-confirm');
        },
        checked: false
      },
      {
        label: store.get('options.disableLogging') ? 'Enable Logging' : 'Disable Logging',
        type: 'checkbox',
        click() {
          if (store.get('options.disableLogging')) {
            store.set('options.disableLogging', false);
          } else {
            store.set('options.disableLogging', true);
          }
          app.emit('restart-confirm');
        },
        checked: false
      },
      {
        label: 'Edit Config File',
        click() {
          electronLog.info('Editing Config File');
          if (isLinux) {
            electronLog.info('\n Note that JSON must be a recognized file type \n for the OS to open the config.json file.\n');
            electronLog.info('\n On Linux, a default text editor for handling JSON files must also be present and configured correctly.\n');
            store.openInEditor();
            return;
          } else {
            electronLog.info('\n Note that JSON must be a recognized file type \n for the OS to open the config.json file.\n');
            store.openInEditor();
          }
        }
      }
    ]
  },
  {
    role: 'editMenu',
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      { role: 'pasteAndMatchStyle' },
      { role: 'delete' },
      { type: 'separator' },
      { role: 'selectAll' }
    ]
  },
  {
    role: 'viewMenu',
    label: 'View',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      {
        label: 'Toggle Developer Tools',
        accelerator: isMac ? 'Alt+Command+I' : 'Ctrl+Shift+I',
        click(item, focusedWindow) {
          const currentURL = focusedWindow.webContents.getURL();
          electronLog.info('Toggling Developer Tools on ' + currentURL);
          focusedWindow.webContents.toggleDevTools();
        }
      },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Developer',
    submenu: [
      {
        label: 'Reload F5',
        accelerator: 'F5',
        visible: false,
        acceleratorWorksWhenHidden: true,
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.reload();
        }
      },
      {
        label: 'Open Log File',
        click() {
          electronLog.info('Opening ' + [ userLogFile ]);
          const logWindow = new BrowserWindow({ width: 600, height: 700, useContentSize: true, title: userLogFile });
          logWindow.loadFile(userLogFile);
        }
      },
      {
        label: 'Open config.json',
        click() {
          electronLog.info('Opening ' + [ userConfigJson ]);
          const confWindow = new BrowserWindow({ width: 600, height: 700, useContentSize: true, title: userConfigJson });
          confWindow.loadFile(userConfigJson);
        }
      },
      {
        label: 'Open User Data Dir',
        click() {
          electronLog.info('Opening ' + [ userDataDir ]);
          shell.openPath(userDataDir);
        }
      },
      {
        label: 'Create Popout Window',
        click() {
          app.emit('popout');
        }
      },
      { type: 'separator' },
      {
        label: 'Open Electron DevTools',
        accelerator: isMac ? 'Cmd+Shift+F12' : 'F12',
        click(item, focusedWindow) {
          electronLog.info('Opening Electron DevTools on mainWindow.');
          focusedWindow.openDevTools({ mode: 'detach' });
        }
      },
      {
        label: 'Open Electron DevTools Extra',
        accelerator: 'Ctrl+Shift+F12',
        visible: false,
        acceleratorWorksWhenHidden: true,
        click() {
          electronLog.info('Opening Electron DevTools on mainWindow.');
          mainWindow.openDevTools({ mode: 'detach' });
        }
      },
      {
        label: store.get('options.devToolsOnStart') ? 'Disable DevTools on Start' : 'Enable DevTools on Start',
        type: 'checkbox',
        click() {
          if (store.get('options.devToolsOnStart')) {
            store.set('options.devToolsOnStart', false);
          } else {
            store.set('options.devToolsOnStart', true);
          }
          app.emit('restart-confirm');
        },
        checked: false
      },
      {
        label: 'Open chrome://gpu',
        accelerator: 'CmdorCtrl+Alt+G',
        click() {
          const gpuWindow = new BrowserWindow({ width: 900, height: 700, useContentSize: true, title: 'GPU Internals' });
          gpuWindow.loadURL('chrome://gpu');
          electronLog.info('Opened chrome://gpu');
        }
      },
      {
        label: 'Open chrome://process-internals',
        accelerator: 'CmdorCtrl+Alt+P',
        click() {
          const procsWindow = new BrowserWindow({ width: 900, height: 700, useContentSize: true, title: 'Process Model Internals' });
          procsWindow.loadURL('chrome://process-internals');
          electronLog.info('Opened chrome://process-internals');
        }
      },
      {
        label: 'Open chrome://media-internals',
        accelerator: 'CmdorCtrl+Alt+M',
        click() {
          const mediaWindow = new BrowserWindow({ width: 900, height: 700, useContentSize: true, title: 'Media Internals' });
          mediaWindow.loadURL('chrome://media-internals');
          electronLog.info('Opened chrome://media-internals');
        }
      }
    ]
  },
  {
    role: 'help',
    label: 'About',
    submenu: [
      { label: 'Apple Music Desktop v' + app.getVersion(), enabled: false },
      {
        label: 'Created by Alex313031',
        click() {
          new BrowserWindow({ width: 1024, height: 700, useContentSize: true }).loadURL('https://github.com/Alex313031/apple-music-desktop#readme');
        }
      },
      { type: 'separator' },
      {
        label: 'View Humans.txt',
        accelerator: 'CmdorCtrl+Alt+Shift+H',
        click() {
          const humansWindow = new BrowserWindow({ width: 400, height: 450, useContentSize: true, title: 'humans.txt', darkTheme: store.get('options.useLightMode') ? false : true });
          humansWindow.loadFile('./humans.txt');
          electronLog.info('Opened humans.txt :)');
        }
      },
      {
        label: 'View License',
        accelerator: 'CmdorCtrl+Alt+Shift+L',
        click() {
          const licenseWindow = new BrowserWindow({ width: 532, height: 632, useContentSize: true, title: 'License', darkTheme: store.get('options.useLightMode') ? false : true });
          licenseWindow.loadFile('./license.md');
          electronLog.info('Opened license.md');
        }
      },
      {
        label: 'About App',
        accelerator: 'CmdorCtrl+Alt+A',
        click() {
          const aboutWindow = new BrowserWindow({
            width: 350,
            height: 320,
            useContentSize: true,
            title: 'About App',
            icon: isWin ? path.join(__dirname, 'imgs/icon.ico') : path.join(__dirname, 'imgs/icon64.png'),
            darkTheme: store.get('options.useLightMode') ? false : true,
            webPreferences: {
              nodeIntegration: false,
              nodeIntegrationInWorker: false,
              contextIsolation: false,
              sandbox: false,
              experimentalFeatures: true,
              webviewTag: true,
              devTools: true,
              javascript: true,
              plugins: true,
              enableRemoteModule: true,
              preload: path.join(__dirname, 'preload/preload.js')
            }
          });
          require('@electron/remote/main').enable(aboutWindow.webContents);
          if (store.get('options.useLightMode')) {
            nativeTheme.themeSource = 'light';
          } else {
            nativeTheme.themeSource = 'dark';
          }
          aboutWindow.loadFile('./about.html');
          electronLog.info('Opened about.html');
        }
      }
    ]
  }
  ]);
};

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

module.exports = (app, store) => {
  return Menu.buildFromTemplate([
  {
    role: 'fileMenu',
    label: 'Apple Music',
    submenu: [
      {
        label: 'Go Back',
        accelerator: 'Alt+Left',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.goBack();
          electronLog.info('Navigated back');
        }
      },
      {
        label: 'Go Forward',
        accelerator: 'Alt+Right',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.goForward();
          electronLog.info('Navigated forward');
        }
      },
      {
        label: 'Minimize to Tray',
        visible: store.get('options.disableTray') ? false : true,
        accelerator: 'CmdorCtrl+M',
        acceleratorWorksWhenHidden: false,
        click(item, focusedWindow) {
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
          electronLog.info('Minimized Window');
        }
      },
      {
        label: 'Close Window',
        accelerator: 'CmdorCtrl+W',
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.close();
          electronLog.info('Closed a window');
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
        click(e) {
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
        click(e) {
          if (store.get('options.useBetaSite')) {
            store.set('options.useBetaSite', false);
          } else {
            store.set('options.useBetaSite', true);
          }
          app.emit('change-site');
        },
        checked: store.get('options.useBetaSite')
      },
      {
        label: store.get('options.disableTray') ? 'Enable Tray' : 'Disable Tray',
        type: 'checkbox',
        click(e) {
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
        label: 'Open Config File',
        click() {
          store.openInEditor();
          electronLog.info('Editing Config File');
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
      { role: 'pasteandmatchstyle' },
      { role: 'delete' },
      { type: 'separator' },
      { role: 'selectall' }
    ]
  },
  {
    role: 'viewMenu',
    label: 'View',
    submenu: [
      { role: 'reload' },
      {
        label: 'Reload F5',
        accelerator:  'F5',
        visible: false,
        acceleratorWorksWhenHidden: true,
        click(item, focusedWindow) {
          if (focusedWindow) focusedWindow.webContents.reload();
        }
      },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
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
        label: 'Open Electron DevTools',
        accelerator: isMac ? 'CmdorCtrl+Shift+F12' : 'F12',
        click(item, focusedWindow) {
          focusedWindow.openDevTools({ mode: 'detach' });
        }
      },
      {
        label: 'Open Log File',
        click() {
          electronLog.info('Opening ' + [ userLogFile ]);
          const logWindow = new BrowserWindow({width: 600, height: 700, useContentSize: true, title: "main.log"});
          logWindow.loadFile(userLogFile);
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
        label: 'Create PopOut Window',
        click() {
          app.emit('popout');
        }
      },
      { type: 'separator' },
      {
        label: 'Open chrome://gpu',
        accelerator: 'CmdorCtrl+Alt+G',
        click() {
          const gpuWindow = new BrowserWindow({width: 900, height: 700, useContentSize: true, title: "GPU Internals"});
          gpuWindow.loadURL('chrome://gpu');
          electronLog.info('Opened chrome://gpu');
        }
      },
      {
        label: 'Open chrome://media-internals',
        accelerator: 'CmdorCtrl+Alt+M',
        click() {
          const mediaWindow = new BrowserWindow({width: 900, height: 700, useContentSize: true, title: "Media Internals"});
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
      { label: 'Created by Alex313031',
        click() {
          new BrowserWindow({width: 1024, height: 768, useContentSize: true}).loadURL('https://github.com/Alex313031/apple-music-desktop#readme');
        }
      },
      { type: 'separator' },
      {
        label: 'View Humans.txt',
        accelerator: 'CmdorCtrl+Alt+Shift+H',
        click() {
          const humansWindow = new BrowserWindow({width: 400, height: 432, useContentSize: true, title: "humans.txt", darkTheme: store.get('options.useLightMode') ? false : true});
          humansWindow.loadFile('./humans.txt');
          electronLog.info('Opened humans.txt :)');
        }
      },
      {
        label: 'View License',
        accelerator: 'CmdorCtrl+Alt+Shift+L',
        click() {
          const licenseWindow = new BrowserWindow({width: 532, height: 632, useContentSize: true, title: "License", darkTheme: store.get('options.useLightMode') ? false : true});
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
            title: "About App",
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
              preload: path.join(__dirname, 'preload.js')
            },
          });
          require("@electron/remote/main").enable(aboutWindow.webContents);
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

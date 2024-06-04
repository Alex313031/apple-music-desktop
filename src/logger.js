const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const electronLog = require('electron-log');

// Get app details
const appName = app.getName();
const appVersion = app.getVersion();
const userDataDir = app.getPath('userData');
// Get Electron versions
const electronVersion = process.versions.electron;
const chromeVersion = process.versions.chrome;
const nodeVersion = process.versions.node;
const v8Version = process.versions.v8;

module.exports.startLogging = (store) => {
  if (store.get('options.disableLogging')) {
    console.info('App Version: ' + [ appVersion ]);
  } else {
    // I'm a Log freak, can you tell?
    electronLog.info('Welcome to ' + appName + ' Desktop!');
    electronLog.info('WidevineCDM component ready.');
    electronLog.info('App Version: ' + [ appVersion ]);
    electronLog.info('Electron Version: ' + [ electronVersion ]);
    electronLog.info('Chromium Version: ' + [ chromeVersion ]);
    electronLog.info('NodeJS Version: ' + [ nodeVersion ]);
    electronLog.info('V8 Version: ' + [ v8Version ]);
    electronLog.info('User Data Dir: ' + userDataDir);
  }
};

module.exports.handleLogging = (store) => {
  const userLogFile = path.join(userDataDir, 'logs/main.log');
  const userOldLogFile = path.join(userDataDir, 'logs/main.log.old');
  if (store.get('options.disableLogging')) {
    console.warn('Note: Logging is disabled');
    if (fs.existsSync(userLogFile)) {
      fs.rename(userLogFile, userOldLogFile, () => {
        console.log('  main.log renamed > main.log.old');
      });
    }
    electronLog.transports.console.level = false;
    electronLog.transports.file.level = false;
  }
};

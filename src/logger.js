const { app, BrowserWindow, Menu, nativeTheme, shell } = require('electron');
const electronLog = require('electron-log');
const fs = require('fs');
const path = require('path');
const userDataDir = app.getPath('userData');
const userLogFile = path.join(userDataDir, 'logs/main.log');
const userOldLogFile = path.join(userDataDir, 'logs/main.log.old');

// Get app version from package.json
var appVersion = app.getVersion();
// Get Electron versions
var electronVersion = process.versions.electron;
var chromeVersion = process.versions.chrome;
var nodeVersion = process.versions.node;
var v8Version = process.versions.v8;

module.exports.startLogging = (store) => {
  var disableLogging
  if (store.get('options.disableLogging')) {
    disableLogging = true;
  } else {
    disableLogging = false;
  }

  if (disableLogging == true) {
    return 0;
    electronLog.warn('Note: Logging is disabled');
  } else {
    // I'm a Log freak, can you tell?
    electronLog.info('App Version: ' + [ appVersion ]);
    electronLog.info('Electron Version: ' + [ electronVersion ]);
    electronLog.info('Chromium Version: ' + [ chromeVersion ]);
    electronLog.info('NodeJS Version: ' + [ nodeVersion ]);
    electronLog.info('V8 Version: ' + [ v8Version ]);
    electronLog.info('User Data Dir: ' + userDataDir);
  }
};

module.exports.handleLogging = (store) => {
if (store.get('options.disableLogging')) {
  electronLog.warn('Note: Logging Disabled');
  if (fs.existsSync(userLogFile)) {
    fs.rename(userLogFile, userOldLogFile, () => {
      console.log('  main.log renamed > main.log.old');
    });
  }
  electronLog.transports.console.level = false;
  electronLog.transports.file.level = false;
}
};

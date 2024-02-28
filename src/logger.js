const { app } = require('electron');
const fs = require('fs');
const path = require('path');
const electronLog = require('electron-log');

// Get app details
const appVersion = app.getVersion();
const userDataDir = app.getPath('userData');

module.exports.startLogging = (store) => {
  let disableLogging
  if (store.get('options.disableLogging')) {
    disableLogging = true;
  } else {
    disableLogging = false;
  }

  // Get Electron versions
  const electronVersion = process.versions.electron;
  const chromeVersion = process.versions.chrome;
  const nodeVersion = process.versions.node;
  const v8Version = process.versions.v8;

  if (disableLogging === true) {
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
  const userLogFile = path.join(userDataDir, 'logs/main.log');
  const userOldLogFile = path.join(userDataDir, 'logs/main.log.old');
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

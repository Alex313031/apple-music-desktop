const { Menu, nativeImage } = require('electron');
const path = require('path');

module.exports = (app) => {
  const appName = app.getName();
  const appVersion = app.getVersion();
  const isWin = process.platform === 'win32';
  const isLinux = process.platform === 'linux';
  const isMac = process.platform === 'darwin';
  const trayImage = isWin ? path.join(__dirname, 'imgs/icon.ico') : path.join(__dirname, 'imgs/icon48.png');
  const trayIcon = nativeImage.createFromPath(trayImage);
  const getTrayMenuIcon = () => {
    if (isWin) {
        return trayIcon.resize({height: 16});
    } else if (isLinux) {
        return trayIcon.resize({height: 24});
    } else if (isMac) {
        return trayIcon.resize({height: 22});
    } else {
        return trayIcon;
        electronLog.info('Running on BSD');
    }
  };
  return Menu.buildFromTemplate([
  {
    label: appName + ' ' + appVersion,
    icon: getTrayMenuIcon(),
    enabled: false
  },
  { type: 'separator' },
  {
    label: 'Play/Pause',
    click() {
      app.emit('play-pause');
    }
  },
  {
    label: 'Next Track',
    click() {
      app.emit('next-track');
    }
  },
  {
    label: 'Previous Track',
    click() {
      app.emit('previous-track');
    }
  },
  {
    label: 'Get Info',
    visible: true,
    click() {
      app.emit('get-track-info');
    }
  },
  { type: 'separator' },
  {
    label: 'Show',
    visible: true,
    click() {
      app.emit('show-from-tray');
    }
  },
  {
    label: 'Minimize to Tray',
    click() {
      app.emit('minimize-to-tray');
    }
  },
  {
    label: 'Quit',
    role: 'quit',
    click() {
      app.quit();
    }
  }
  ]);
}

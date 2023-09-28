module.exports = (app, electronLog, mainWindow, store) => {
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
      const trayIcon = isWin ? path.join(__dirname, 'imgs/icon.ico') : path.join(__dirname, 'imgs/icon64.png'),
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

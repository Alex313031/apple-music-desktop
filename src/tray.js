const { Menu } = require('electron');
const isDev = process.env.NODE_ENV === 'development';

module.exports = (app) => {
  return Menu.buildFromTemplate([
  {
    label: 'Play/Pause',
    click: function() {
      app.emit('play-pause');
    }
  },
  {
    label: 'Next Track',
    click: function() {
      app.emit('next-track');
    }
  },
  {
    label: 'Previous Track',
    click: function() {
      app.emit('previous-track');
    }
  },
  {
    label: 'Get Info',
    visible: isDev,
    click: function() {
      app.emit('get-track-info');
    }
  },
  { type: 'separator' },
  {
    label: 'Show',
    visible: true,
    click: function() {
      app.emit('show-from-tray');
    }
  },
  {
    label: 'Minimize to Tray',
    click: function() {
      app.emit('minimize-to-tray');
    }
  },
  {
    label: 'Quit',
    role: 'quit',
    click: function() {
      app.quit();
    }
  }
  ]);
}

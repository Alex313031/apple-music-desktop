document.addEventListener('musickitloaded', function() {
  // eslint-disable-next-line
  MusicKit.configure({
    developerToken: 'fricktest',
    app: {
      name: 'apple-music-desktop',
      build: '2.1.2'
    }
    // MusicKit global is now defined
  });
  console.log('MusicKit.configure() Suceeded!');
});
console.log('electron-renderer: musickit loaded!');

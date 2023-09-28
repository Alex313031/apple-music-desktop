document.addEventListener('musickitloaded', function() {
  // MusicKit global is now defined
  MusicKit.configure({
    developerToken: 'fricktest',
    app: {
      name: 'apple-music-desktop',
      build: '2.0.0'
    }
  });
  console.log('MusicKit.configure() Suceeded!');
});
console.log('electron-renderer: musickit loaded!');

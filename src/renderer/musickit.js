async function musicConfigure() {
  try {
    // eslint-disable-next-line
    await MusicKit.configure({
      developerToken: 'fricktest',
      app: {
        name: 'apple-music-desktop',
        build: '2.1.5'
      }
      // MusicKit global is now defined
    });
    console.log('MusicKit.configure() Suceeded!');
    console.log('MusicKit global is now defined');
  } catch (error) {
    console.log('MusicKit.configure() Failed. ' + error);
  }
}

try {
  musicConfigure();
  console.log('electron-renderer: musickit.js loaded');
} catch (error) {
  console.log('electron-renderer: musickit.js loading failed: ' + error);
}

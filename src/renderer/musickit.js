async function musicConfigure() {
  // The Apple Music web player configures MusicKit itself and no longer
  // exposes MusicKit.configure(), so calling it just throws. Only run this
  // against builds of the site that still provide it.
  if (typeof MusicKit === 'undefined') {
    console.log('MusicKit is not defined on this page yet');
    return;
  }
  if (typeof MusicKit.configure !== 'function') {
    console.log('MusicKit.configure() is unavailable; the page configures MusicKit itself');
    return;
  }
  try {
    await MusicKit.configure({
      developerToken: 'fricktest',
      app: {
        name: 'apple-music-desktop',
        build: '2.4.0'
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

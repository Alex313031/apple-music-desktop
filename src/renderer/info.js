/* eslint-disable */
/* Evaluated via webContents.executeJavaScript(); the resulting
   object (or null when nothing is playing) is returned directly
   to the main process as the promise value. */
(() => {
  try {
    const nowPlaying = MusicKit.getInstance().nowPlayingItem;
    return {
      name: nowPlaying.attributes.name,
      album: nowPlaying.attributes.albumName,
      artist: nowPlaying.attributes.artistName
    };
  } catch {
    return null;
  }
})();

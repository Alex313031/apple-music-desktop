/* eslint-disable */
try {
  let trackName = MusicKit.getInstance().nowPlayingItem.attributes.name;
  let trackAlbumName = MusicKit.getInstance().nowPlayingItem.attributes.albumName;
  let trackArtistName = MusicKit.getInstance().nowPlayingItem.attributes.artistName;
  /* Send track information back to the main process via ipcRenderer */
  ipc.send('track-name', trackName, trackAlbumName, trackArtistName);
} catch {
  let trackName = 'NOTRACK';
  let trackAlbumName = 'NOALBUM';
  let trackArtistName = 'NOARTIST';
  ipc.send('track-name', trackName, trackAlbumName, trackArtistName);
}

//window.addEventListener('DOMContentLoaded', () => {
//  const replaceText = (selector, text) => {
//    const element = document.getElementById(selector)
//    if (element) element.innerText = text
//  }
//  replaceText(`current-track`, trackName)
//});

// Audio functions used in the tray. They inject into the webpage
// but it is also a module that the main process require()s.
// These are called with or without authorization:
function play() {
  return `
         MusicKit.getInstance().play().catch(console.error);
         console.log('Played a Track');
         `
}

function pause() {
  return `
         MusicKit.getInstance().pause();
         console.log('Paused a Track');
         `
}

function playPause() {
  return `
         if (MusicKit.getInstance().isPlaying) {
           MusicKit.getInstance().pause();
         } else if (MusicKit.getInstance().nowPlayingItem != null) {
           MusicKit.getInstance().play().catch(console.error);
         }
         console.log('Played/Paused a Track');
         `
}

function nextTrack() {
  return `
         MusicKit.getInstance().skipToNextItem();
         console.log('Skipped to the next Track');
         `
}

function previousTrack() {
  return `
         MusicKit.getInstance().skipToPreviousItem();
         console.log('Went to the previous Track');
         `
}

function getInfo() {
  return `
    try {
      let trackName = MusicKit.getInstance().nowPlayingItem.attributes.name;
      console.log('Current Track Title is ' + trackName);
    } catch {
      console.log('Track is not playing');
    }`
}

exports.play = play;
exports.pause = pause;
exports.playPause = playPause;
exports.nextTrack = nextTrack;
exports.previousTrack = previousTrack;
exports.getInfo = getInfo;

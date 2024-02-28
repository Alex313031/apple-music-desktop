global.ipcRenderer = require("electron").ipcRenderer;

// Audio functions used in the tray. They inject into the webpage
// but it is also a module that the main process require()s.
// These are called with or without authorization:
function play() {
  return `MusicKitInterop.play();
  console.log('Played a Track');`
}

function pause() {
  return `MusicKitInterop.pause();
  console.log('Paused a Track');`
}

function playPause() {
  return `MusicKitInterop.playPause();
  console.log('Played/Paused a Track');`
}

function nextTrack() {
  return `
  MusicKitInterop.next();
  console.log('Went to next Track');
  `
}

function previousTrack() {
  return `MusicKitInterop.previous();
  console.log('Went to previous Track');`
}

function getInfo() {
  return `
    try {
      let trackName = MusicKitInterop.getAttributes().name;
      console.log('Current Track Title is ' + trackName);
      /* Print currently playing Song to the terminal */
      ipcRenderer.send('track-name', trackName);
    } catch {
      let trackName = 'null';
      console.log('Track is not playing');
      ipcRenderer.send('track-name', trackName);
    }`
}

exports.play = play;
exports.pause = pause;
exports.playPause = playPause;
exports.nextTrack = nextTrack;
exports.previousTrack = previousTrack;
exports.getInfo = getInfo;

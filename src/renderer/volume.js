/* Reduce video volume */
function reduceVolume() {
  // getElementsByTagName() returns a live collection; iterate it rather than
  // looping on length (which never changes here and would hang the page).
  const elements = document.getElementsByTagName('video');
  for (const element of elements) {
    element.volume = 0.20;
  }
}

reduceVolume();

console.log('electron.renderer: Reduced <video> volume');

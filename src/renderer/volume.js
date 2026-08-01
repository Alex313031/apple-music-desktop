/* Reduce video volume */
function reduceVolume() {
  const elements = document.getElementsByTagName('video');
  for (const element of elements) {
    element.volume = 0.20;
  }
}

reduceVolume();

console.log('electron.renderer: Reduced <video> volume');

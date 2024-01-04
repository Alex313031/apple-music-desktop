/* Reduce video volume */
function reduceVolume() {
  const elements = document.getElementsByTagName('video');
  while (elements.length > 0) {
    elements[0].volume = 0.20;
  }
}

reduceVolume();
console.log('electron.renderer: Reduced <video> volume');

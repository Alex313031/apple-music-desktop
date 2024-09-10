/* This is injected into webpages to add
or remove elements as needed.
*/

/* Clean up the "Open in Music" div */
function removeElementsByClass() {
  const element1 = document.getElementsByClassName('svelte-ba5e5y');
  while (element1.length > 0) {
    element1[0].parentNode.removeChild(element1[0]);
  }

  const element2 = document.getElementsByClassName('upsell-banner');
  while (element2.length > 0) {
    element2[0].parentNode.removeChild(element2[0]);
  }
}

removeElementsByClass();

console.log('electron.renderer: Injected index.js script');

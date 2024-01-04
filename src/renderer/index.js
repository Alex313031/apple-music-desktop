/* This is injecting into remote webpages to add
or remove elements as needed.
*/

/* Clean up the "Open in Music" div */
function removeElementsByClass() {
  const elements = document.getElementsByClassName('svelte-agv6qn');
  while (elements.length > 0) {
    elements[0].parentNode.removeChild(elements[0]);
  }
}

removeElementsByClass();

console.log('electron.renderer: Injected index.js script');

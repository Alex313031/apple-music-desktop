// Reduce video volume

function reduceVolume () {
  var vid1 = document.getElementById("vid1");
  vid1.volume = 0.20;

  var vid2 = document.getElementById("vid2");
  vid2.volume = 0.50;

  var vid3 = document.getElementById("vid3");
  vid3.volume = 1.00;
}

reduceVolume();

var blessed = require('blessed');


var screen = blessed.screen({
  smartCSR: true,
  dockBorders: true
});

var image = blessed.ANSIImage({ 
    parent: screen,
    file : "/home/hugo/Pictures/tradingbars.png" ,
    width: 100,
    height: 20,
    style: {
        bg: "black",
    }
});


screen.key('q', function() {
  return process.exit(0);
});

screen.render();



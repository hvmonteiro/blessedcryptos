const blessed = require('blessed');

// Create a screen object.
const screen = blessed.screen({
    smartCSR: true
});

const clientOptions = {
    convert: "USD"
}

screen.title = 'Terminal';
// Create a list box
const symbolsListTable = blessed.ListTable({
    top: 'top',
    left: 'left',
    width: '100%',
    height: '50%',
    tags: true,
    keys: true,
    noCellBorders: false,
    border: {
        type: 'line',
    },
    style: {
        fg: 'white',
        bg: 'black',
        border: {
            fg: '#efefef'
        },
        header: {
            bg: "black",
            fg: "white"
        },
        scrollbar: {
            bg: 'red',
            fg: 'blue'
        }
    },
    rows: [ 
        [
            "#",
            "Name",
            "Symbol",
            "% 1h",
            "% 24h",
            "% 7d",
            `Price (${clientOptions.convert})`,
            `Market Cap (${clientOptions.convert})`,
            `Circulating Supply (${clientOptions.convert})`,
            `Volume (24h/${clientOptions.convert})`
        ]
    ]
});


const symbolsInfoBox = blessed.box({
    top: 'center',
    left: 'center',
    width: '200',
    height: '200',
    tags: true,
    keys: true,
    border: {
        type: 'line'
    },
    style: {
        fg: 'white',
        bg: 'black',
        border: {
            fg: '#f0f0f0'
        },
        hover: {
            bg: 'orange'
        }
    }
});


// Append our box to the screen.
screen.append(symbolsListTable);


// If box is focused, handle `enter`/`return` and give us some more content.
symbolsListTable.key('enter', function(ch, key) {
    symbolsInfoBox.add('{right}Even different {black-fg}content{/black-fg}.{/right}\n');
    screen.append(symbolsInfoBox);
    screen.render();
});
symbolsListTable.add("1 col2 col3");
symbolsListTable.add("line2");
symbolsListTable.add("line3");
symbolsListTable.add("line4");


// Quit on Escape, q, or Control-C.
screen.key(['escape', 'q', 'C-c'], function(ch, key) {
    return process.exit(0);
});

// Focus our element.
symbolsListTable.focus();

// Render the screen.
screen.render();


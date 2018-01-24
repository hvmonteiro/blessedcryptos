#!/usr/bin/env node
"use strict";

const programParams = require("commander");
const formatCurrency = require("format-currency");
const CoinMarketCap = require("node-coinmarketcap");
const blessed = require("blessed");
const program = blessed.program();


const MIN_SCREEN_WIDTH = 140;
const MIN_SCREEN_HEIGHT = 40;

const DEFAULT_CURRENCY = "USD";

const supportedCurrencies = [
    "AUD", "BRL", "CAD", "CHF", 
    "CLP", "CNY", "CZK", "DKK", 
    "EUR", "GBP", "HKD", "HUF", 
    "IDR", "ILS", "INR", "JPY", 
    "KRW", "MXN", "MYR", "NOK", 
    "NZD", "PHP", "PKR", "PLN", 
    "RUB", "SEK", "SGD", "USD",
    "THB", "TRY", "TWD", "ZAR"
];


const formatGrowth = val => {
    return val.indexOf("-") === -1 ? "{green-fg}"+val+"{/}" : "{red-fg}"+val+"{/}";
};

const formatDefault = val => {
    return val;
};

const readableNumber = val => {

    const humanReadableNumbers = [ "hundred", "thoushand", "million", "billion"];
    if (val === null) return "0"; // if undefined,  return a zero
    var e = Math.floor(Math.log(val) / Math.log(1000));
    return (val/ Math.pow(1000, e)).toFixed(2) + " " + humanReadableNumbers[e]
}

const coinMarketCapOptions = {
    // Refresh time in seconds
    refresh: programParams.refresh,
    // Enable event system: true|false
    events: (programParams.refresh > 0),
    // Convert price to different currencies
    convert: (supportedCurrencies.indexOf(programParams.base) === -1) ? DEFAULT_CURRENCY : programParams.base
}


const formatTableRow = (data = {}) => {
    let {
        rank,
        name,
        symbol,
        price_usd,
        market_cap_usd,
        "24h_volume_usd": volume_usd,
        available_supply,
        percent_change_1h,
        percent_change_24h,
        percent_change_7d
    } = data;

    percent_change_1h = formatGrowth(percent_change_1h);
    percent_change_24h = formatGrowth(percent_change_24h);
    percent_change_7d = formatGrowth(percent_change_7d);

    price_usd = Number.parseFloat(price_usd),
        market_cap_usd = Number.parseFloat(market_cap_usd),
        available_supply = Number.parseFloat(available_supply),
        volume_usd = Number.parseFloat(volume_usd);

    return [
        formatDefault(rank),
        formatDefault(name),
        formatDefault(symbol),
        percent_change_1h,
        percent_change_24h,
        percent_change_7d,
        formatDefault(formatCurrency(price_usd)),
        formatDefault(readableNumber(market_cap_usd)),
        formatDefault(readableNumber(available_supply)),
        formatDefault(readableNumber(volume_usd))
    ];
};

//function list(val) {
const list = (val = {}) => {
    return val.split(",");
}


var tickersRawData = [];

programParams
    .version("0.1.0")
    .option("-c, --currency <value>", "Get market information about the symbol (ex: BTC, ETH, etc.).", function (value) { return value.split(",")} )
    .option("-b, --base <value>", "Get market price against the specified base currency symbol. (Default: USD)", "USD")
//    .option("-p, --price <n>", "Alert when the market matches the specified price.", parseFloat)
//    .option("-P, --percentage <n>", "Alert when the market matches the specified percentage. (Default: 5)", parseFloat, "5")
    .option("-t, --top [n] ", "Get specified top currencies (Default: 10)", parseInt, 10)
//    .option("-a, --all ", "Get all existing currencies on the market", parseInt, 10)
    .option("-R, --rawstats", "Displays symbol information as raw data (JSON format) instead of human readable. (Default: false)")
    .option("-r, --refresh [n]", "Refresh information every <n> seconds. Run once and exit if not specified. (Default: 300)", 300, parseInt)
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    programParams.outputHelp();
    process.exit(1);
}
if (programParams.args != "") {
    console.log("\n Error: unknown command %s", programParams.args);
    process.exit(1);
}

var cryptosList = programParams.currency; // Converted into an array by "list" function

if (!programParams.top) { 
    if (cryptosList == undefined) {
        console.log("Error: Mandatory parameter 'currency' is missing."); 
        process.exit(1);
    }
}
if (supportedCurrencies.indexOf(programParams.base) === -1) {
    console.log("Error: Specified convert currency not supported: %s", programParams.base); 
    process.exit(1);
}
if (Number.isNaN(programParams.refresh))  {
    console.log("Error: Incorrect refresh number specified: %s", programParams.refresh); 
    process.exit(1);
}

var topNumber = programParams.top;

const coinMarketCap = new CoinMarketCap(coinMarketCapOptions);

// Create a screen object.
const screen = blessed.screen({
    smartCSR: true,
    terminal: "xterm-256color",
});

const runTop = () => {

    const tableListHeader = [
        [
            "#",
            "Name",
            "Symbol",
            "% 1h",
            "% 24h",
            "% 7d",
            `Price (${coinMarketCapOptions.convert})`,
            `Market Cap (${coinMarketCapOptions.convert})`,
            `Circulating Supply (${coinMarketCapOptions.convert})`,
            `Volume (24h/${coinMarketCapOptions.convert})`
        ]
    ];

    loaderBox.load("Loading...");
    coinMarketCap.getTop(topNumber, data => {

        tickersRawData = data;
        var rows = data.map(function (value, index) { return formatTableRow(value); });

        tickerListTable.setRows(tableListHeader.concat(rows));
        loaderBox.stop();
        screen.render();
    });
};

screen.title = "Blessed Cryptos";


// Create a list box
const tickerListTable = blessed.ListTable({
    label: " {bold}T{/}icker List ",
    parent: screen,
    top: 0,
    left: 0,
    width: "100%",
    height: 18,
    tags: true,
    keys: true,
    vi: true,
    noCellBorders: false,
    //    terminal: "xterm-256color",
    border: {
        type: "line"
    },
    style: {
        bg: "black",
        border: {
            fg: "gray",
            //bg: "black"
        },
        header: {
            fg: "white",
            bg: "black"
        },
        selected: {
            fg: "red",
            //bg: "white",
            bold: true,
        },
        item: {
            hover: {
                bg: 'blue'
            },
            fg: "gray90",
            bg: "black"
        },
    },
    scrollbar: {
        ch: ' ',
        track: {
            bg: 'cyan'
        },
        style: {
            inverse: true
        }
    },
    search: function(callback) {
        promptBox.input("Prompt: ", "", function(err, value) {
            if (err) return;
            return callback(null, value);
        });
    }
});


const tickerDetailBox = blessed.box({
    parent: screen,
    top: 18,
    left: "0",
    width: "50%",
    height: "50%",
    tags: true,
    keys: false,
    border: {
        type: "line"
    },
    style: {
        bg: "black",
        border: {
            fg: "gray"
        }
    },
    label: " Ticker {bold}D{/}etail ",
    content: "{center}ticker detail{/}",
});

var promptBox = blessed.prompt({
    parent: screen,
    bottom: 2,
    left: 0,
    height: 1,
    width: "100%",
    keys: true,
    vi: true,
    mouse: true,
    tags: true,
    border: false,
});

var statusLine = blessed.box({
    parent: screen,
    bottom: 0,
    height: 1,
    width: "100%",
    align: "left",
    style: {
        bg: "black",
        align: "left"
    },
    content: "This is the status line (`/` for input box)."
});

var RefreshInfoLine = blessed.box({
    parent: screen,
    bottom: 0,
    height: 1,
    align: "right",
    width: "shrink",
    style: {
        align: "right",
        bg: "black"
    },
    content: "Refreshed @ "
});


var loaderBox = blessed.loading({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 5,
    align: 'center',
    width: 50,
    tags: true,
    hidden: true,
    border: 'line'
});


var tickerInfoBox = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 30,
    width: 50,
    align: 'center',
    tags: true,
    hidden: true,
    border: 'line',
    label: " Ticker Info ",
    content: "{center}ticker info{/}",
});

// get and setup tickers first time
if (programParams.top) runTop();

// Enable refresh data event using BTC ticker changes
coinMarketCap.on("BTC", (tickerData, event) => {
    // Refresh ticker information every programParams.refresh seconds
    if (programParams.top) runTop();
});


tickerInfoBox.key(["escape", "enter"], function(ch, key) {
    tickerInfoBox.hide();
    tickerListTable.focus();
    screen.render();
});


// Show when pressing Enter over an item
tickerListTable.on("select", function(el, selected) {
    if (tickerListTable._.rendering) return;

    // Get row as text, trim spaces, remove indent cell spaces and convert to an array
    var tickerInfo = el.getText().trim().replace(/\s\s+/g, " ").split(" ");

    var name = tickerInfo[1];
    //console.log(tickerInfo);
    //console.log(tickersRawData);

    tickerInfoBox.setContent("Hello {bold}world{/bold}!");
    tickerInfoBox.setContent(JSON.stringify(tickerInfo));
    tickerInfoBox.show();
    tickerInfoBox.focus();
    screen.render();

    tickerDetailBox.setContent(name);
});


screen.key(["R", "r"], function(ch, key) {
    // refresh data
    if (programParams.top) runTop();
});



// If box is focused, handle `enter`/`return` and give us some more content.
/*
tickerListTable.key("enter", function(ch, key) {
    tickerInfoBox.setContent("Hello {bold}world{/bold}!");
    tickerInfoBox.show();
    tickerInfoBox.focus();
    screen.render();
});
*/


// Quit on Escape, q, or Control-C.
screen.key(["q", "C-c"], function(ch, key) {
    return process.exit(0);
});

// Focus tableList element.
tickerListTable.focus();


if (program.cols < MIN_SCREEN_WIDTH) {
    console.log("This program can only open on a terminal with a minimum of 140x40 characters.");
    console.log("Your terminal is %sx%s.", program.cols, program.rows);
    process.exit();
}

// Render the screen.
screen.render();



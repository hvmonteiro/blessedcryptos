#!/usr/bin/env node
"use strict";

const program = require("commander");
const formatCurrency = require("format-currency");
const CoinMarketCap = require("node-coinmarketcap");
const blessed = require("blessed");


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
    refresh: program.refresh,
    // Enable event system: true|false
    events: (program.refresh > 0),
    // Convert price to different currencies
    convert: (supportedCurrencies.indexOf(program.base) === -1) ? DEFAULT_CURRENCY : program.base
}


const formatRow = (data = {}) => {
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

program
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
    program.outputHelp();
    process.exit(1);
}
if (program.args != "") {
    console.log("\n Error: unknown command %s", program.args);
    process.exit(1);
}

var cryptosList = program.currency; // Converted into an array by "list" function

if (!program.top) { 
    if (cryptosList == undefined) {
        console.log("Error: Mandatory parameter 'currency' is missing."); 
        process.exit(1);
    }
}
if (supportedCurrencies.indexOf(program.base) === -1) {
    console.log("Error: Specified convert currency not supported: %s", program.base); 
    process.exit(1);
}
if (Number.isNaN(program.refresh))  {
    console.log("Error: Incorrect refresh number specified: %s", program.refresh); 
    process.exit(1);
}

var topNumber = program.top;

const coinMarketCap = new CoinMarketCap(coinMarketCapOptions);

// Create a screen object.
const screen = blessed.screen({
    smartCSR: true,
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

    coinMarketCap.getTop(topNumber, data => {

        var rows = data.map(function (value, index) { return formatRow(value); });

        symbolsListTable.setRows(tableListHeader.concat(rows));
        screen.render();
    });
};

screen.title = "Blessed Cryptos";


// Create a list box
const symbolsListTable = blessed.ListTable({
    top: "top",
    left: "left",
    width: "100%",
    height: "50%",
    tags: true,
    keys: true,
    noCellBorders: false,
    terminal: "xterm-256color",
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
            bg: "white"
        },
        item: {
            fg: "gray90",
            bg: "black"
        },
        scrollbar: {
            bg: 'red',
            fg: 'blue'
        }
    },
});


const symbolsInfoBox = blessed.text({
    top: "50%",
    left: "left",
    width: "50%",
    height: "50%",
    tags: true,
    keys: false,
    content: "{center}Info{/center}",
    noCellBorders: false,
    terminal: "xterm-256color",
    border: {
        type: "line"
    },
    style: {
        bg: "black",
        border: {
            fg: "gray"
        }
    }
});

// Trigger this event every <refreshInterval> seconds

if (program.top) runTop();



//symbolsListTable.setRows(tableListHeader);
// Append our box to the screen.
screen.append(symbolsInfoBox);
screen.append(symbolsListTable);


// If box is focused, handle `enter`/`return` and give us some more content.
symbolsListTable.key("enter", function(ch, key) {
    //symbolsInfoBox.content(symbolsListTable.Selected);
    symbolsListTable.getItem( item => {
        symbolsInfoBox.setContent(item);
    symbolsInfoBox.setContent("Hello {bold}world{/bold}!");
    });
    screen.render();
});


// Quit on Escape, q, or Control-C.
screen.key(["escape", "q", "C-c"], function(ch, key) {
    return process.exit(0);
});

// Focus tableList element.
symbolsListTable.focus();

// Render the screen.
screen.render();



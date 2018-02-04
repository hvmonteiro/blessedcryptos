#!/usr/bin/env node
'use strict'; // jshint ignore:line

// jshint esversion: 6
/* globals require: true, __dirname: true, process: true, console: true */
//
// Copyright (c) 2018 Hugo V. Monteiro
// Use of this source code is governed by the GPL-2.0 license that can be
// found in the LICENSE file.

const programParams = require('commander'),
      formatCurrency = require('format-currency'),
      CoinMarketCap = require('node-coinmarketcap'),
      configJSON = require('json-fs-store')('.config.json'),
      blessed = require('blessed'),
      contrib = require('blessed-contrib'),
      screen = blessed.screen({ smartCSR: true, terminal: 'xterm-256color', ignoreLock: true });

const TITLE = 'Blessed Cryptos';
const VERSION = '0.1.0';
const MIN_SCREEN_WIDTH = 140;
const MIN_SCREEN_HEIGHT = 40;

const DEFAULT_CURRENCY = 'USD';
const TOP_CURRENCIES_NUMBER = 20;

screen.title = TITLE + '(' + VERSION + ')';

const configSettings = {
    'tickers' : [
        'BTC', 
        'ETH', 
        'LTC'],
    'refresh' : '300'
};

const supportedCurrencies = [
    'AUD', 'BRL', 'CAD', 'CHF', 
    'CLP', 'CNY', 'CZK', 'DKK', 
    'EUR', 'GBP', 'HKD', 'HUF', 
    'IDR', 'ILS', 'INR', 'JPY', 
    'KRW', 'MXN', 'MYR', 'NOK', 
    'NZD', 'PHP', 'PKR', 'PLN', 
    'RUB', 'SEK', 'SGD', 'USD',
    'THB', 'TRY', 'TWD', 'ZAR'
];


const formatGrowth = val => {
    return val.indexOf('-') === -1 ? '{green-fg}'+val+'{/}' : '{red-fg}'+val+'{/}';
};

const formatDefault = val => {
    return val;
};

const readableNumber = val => {

    const humanReadableNumbers = [ 'hundred', 'thoushand', 'million', 'billion'];
    if (val === null) return '0'; // if undefined,  return a zero
    var e = Math.floor(Math.log(val) / Math.log(1000));
    return (val/ Math.pow(1000, e)).toFixed(2) + ' ' + humanReadableNumbers[e];
};
/*
 * Calculates in percent, the change between 2 numbers.
 * e.g from 1000 to 500 = 50%
 * 
 * @param oldNumber The initial value
 * @param newNumber The value that changed
 */
function getPercentageChange(oldNumber, newNumber) {
    var decreaseValue = oldNumber - newNumber;

    return (decreaseValue / oldNumber) * 100;
}

function lastPercentVariation(newNumber, percentVariation) {

    return (Number(newNumber) / (100 + Number(percentVariation))) * 100;
}


const coinMarketCapOptions = {
    // Refresh time in seconds
    refresh: 300,
    // Enable event system: true|false
    events: true,
    // Convert price to different currencies
    convert: DEFAULT_CURRENCY
};


/* Response:
 * {
 *  "total_market_cap_usd": 201241796675,
 *  "total_24h_volume_usd": 4548680009,
 *  "bitcoin_percentage_of_market_cap": 62.54,
 *  "active_currencies": 896,
 *  "active_assets": 360,
 *  "active_markets": 6439,
 *  "last_updated": 1509909852
 * }
 *
 */
const formatGlobalMarketData = (data = {}) => {
    let {
        total_market_cap_usd,
        total_24h_volume_usd,
        bitcoin_percentage_of_market_cap,
        active_currencies,
        active_assets,
        active_markets,
    } = data;


    // Calculations
    var circulating_24_volume_percent = Number( (total_24h_volume_usd * 100) / Number(total_market_cap_usd)).toFixed(2);

    // Format
    total_market_cap_usd = readableNumber(total_market_cap_usd);
    total_24h_volume_usd = readableNumber(total_24h_volume_usd);

    return '\n\n' +
        ' {bold}Total Market Cap (USD):{/bold}  ' + total_market_cap_usd + '\n' +
        ' {bold}Total 24 Volume (USD):{/bold}  ' + total_24h_volume_usd + ' (' + circulating_24_volume_percent + '%)\n' +
        '\n' +
        ' {bold}Active Currencies (Coins):{/bold}  ' + active_currencies + '\n' +
        ' {bold}Active Assets (Tokens):{/bold}  ' + active_assets + '\n' +
        ' {bold}Total Active Cryptos:{/bold}  ' + (active_assets + active_currencies) + '\n' +
        ' \n' +
        ' {bold}Active Markets (Exchanges):{/bold}  ' + active_markets + '\n' +
        ' \n' +
        ' {bold}Bitcoin Percentage of Market Cap:{/bold}  ' + bitcoin_percentage_of_market_cap + '%\n' +
        '\n';
};


const formatTickerInfo = (data = {}) => {
    let {
        name,
        symbol,
        rank,
        price_usd,
        price_btc,
        market_cap_usd,
        '24h_volume_usd': volume_usd,
        available_supply,
        total_supply,
        max_supply,
        percent_change_1h,
        percent_change_24h,
        percent_change_7d
    } = data;

    // Calculations
    var circulating_supply_24h = (volume_usd / price_usd);
    var circulating_supply_percent_24h = Number( (circulating_supply_24h * 100) / available_supply).toFixed(2);
    var total_circulating_supply_24h = (available_supply - circulating_supply_24h);
    var total_circulating_supply_percent_24h = Number( (total_circulating_supply_24h * 100) / total_supply).toFixed(2);

    // If max supply is zero (0), it means there is no mining and all cryptos are available.
    max_supply = (Number(max_supply) == 0) ? total_supply : max_supply;

    var total_supply_percent = Number( (total_supply * 100) / max_supply).toFixed(2);
    var available_supply_percent = Number( (available_supply * 100) / max_supply).toFixed(2);

    var circulating_volume_percent = Number((volume_usd * 100) / market_cap_usd).toFixed(2);

    var last_price_change_1h = Number(lastPercentVariation(price_usd, percent_change_1h)).toFixed(2);
    var last_price_change_24h = Number(lastPercentVariation(price_usd, percent_change_24h)).toFixed(2);
    var last_price_change_7d = Number(lastPercentVariation(price_usd, percent_change_7d)).toFixed(2);

    // Format
    price_usd = formatCurrency(price_usd);
    market_cap_usd = readableNumber(market_cap_usd);
    volume_usd = readableNumber(volume_usd);
    available_supply = readableNumber(available_supply);
    total_supply = readableNumber(total_supply);
    max_supply = readableNumber(max_supply);

    total_circulating_supply_24h = readableNumber(total_circulating_supply_24h);
    circulating_supply_24h  = readableNumber(circulating_supply_24h);

    last_price_change_1h = formatCurrency(last_price_change_1h);
    last_price_change_24h = formatCurrency(last_price_change_24h);
    last_price_change_7d = formatCurrency(last_price_change_7d);


    return ' {bold}' + name + '{/bold} #' + symbol + '\n\n' + 
        ' {bold}Rank:{/bold}  ' + rank + '\n' +
        '\n' +
        ' {bold}Max Supply Units:{/bold}  ' + max_supply + '\n' +
        ' {bold}Available Supply Units:{/bold}  ' + total_supply + ' (' + total_supply_percent + '%)\n' +
        ' {bold}Circulating Supply Units:{/bold}  ' + available_supply + ' (' + available_supply_percent + '%)\n' +
        '\n' +
        //        '{bold}Total Circulating Supply in 24h:{/bold}  ' + total_circulating_supply_24h + ' (' + total_circulating_supply_percent_24h + '%)\n' +
        ' {bold}Circulating Supply Units in 24h:{/bold}  ' + circulating_supply_24h + ' (' + circulating_supply_percent_24h + '%)\n' +
        '\n' +
        ' {bold}Market Cap (USD):{/bold}  ' + market_cap_usd + '\n' +
        ' {bold}Current Volume (USD):{/bold}  ' + volume_usd + ' (' + circulating_volume_percent + '%)\n' +
        '\n' +
        ' {bold}Price:{/bold}  ' + price_usd + '$ USD\n' +
        ' {bold}Price:{/bold}  ' + price_btc + ' BTC \n' +
        '\n' +
        ' {bold}Changed Average in 1h:{/bold}  ' + percent_change_1h + ' %    (' + last_price_change_1h + '$ USD)\n' +
        ' {bold}Changed Average in 24h:{/bold}  ' + percent_change_24h + ' %    (' + last_price_change_24h + '$ USD)\n' +
        ' {bold}Changed Average in 7d:{/bold}  ' + percent_change_7d + ' %    (' + last_price_change_7d + '$ USD)\n' +
        ' \n';
};



const formatTableRow = (data = {}) => {
    let {
        rank,
        name,
        symbol,
        price_usd,
        market_cap_usd,
        '24h_volume_usd': volume_usd,
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
        formatDefault(formatCurrency(price_usd)),
        percent_change_1h,
        percent_change_24h,
        percent_change_7d,
        formatDefault(readableNumber(volume_usd)),
        formatDefault(readableNumber(available_supply)),
        //formatDefault(readableNumber(market_cap_usd)),
        "coinmarketcap.com",
    ];
};


const runTop = () => {

    const tableListHeader = [
        [
            '#',
            'Name',
            'Symbol',
            `Price (${coinMarketCapOptions.convert})`,
            '% 1h',
            '% 24h',
            '% 7d',
            `Market Cap (${coinMarketCapOptions.convert})`,
            `Circulating Supply (${coinMarketCapOptions.convert})`,
            //`Volume (24h/${coinMarketCapOptions.convert})`
            'Exchange'
        ]
    ];

    loggingBox.log('CoinMarketCap: Refreshing ticker data...');
    coinMarketCap.getTop(topNumber, data => {

        tickerListTable.rawData = data;
        var date = new Date();
        var rows = data.map(function (value, index) { return formatTableRow(value); });


        var selectedItem = tickerListTable.selected;
        tickerListTable.setRows(tableListHeader.concat(rows));
        tickerListTable.selected = selectedItem;
        tickerListTable.scrollTo(selectedItem);
        RefreshInfoLine.setContent('Refreshed {bold}@{/bold} ' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '  ');
        screen.render();
    });
};

// Create a list table to display ticker information
const mainMenu = blessed.listbar({
    parent: screen,
    top: 0,
    mouse: true,
    //autoCommandKeys: true,
    items: {
        'Account' : { 
            'Login' : 'Logout' 
        },
        'Currency'  : 'Currency',
        'Exchanges' : {
            0: 'Bitfinex',
            1: 'Bittrex'
        },
        'Top 10' : 'Top 10',
        'Help' : 'Help',
        'About' : 'About'
    },
    commands: {
        'Help': {
            keys: ['f1'],
            callback: function() {
                messageBox.display('Pressed f1.');
            },
        },
        'Context Menu': {
            keys: ['f2'],
            callback: function() {
                messageBox.display('Pressed f2.');
            },
        },
        'Quick Info': {
            keys: ['f3'],
            callback: function() {
                messageBox.display('Pressed f3.');
                viewCoinMarketCap.toggle();
                screen.render();
            },
        },
        'Wallets': {
            keys: ['f4'],
            callback: function() {
                messageBox.display('Pressed f4.');
            },
        },
        'Buy': {
            keys: ['f5'],
            callback: function() {
                messageBox.display('Pressed f5.');
            },
        },
        'Sort': {
            keys: ['f6'],
            callback: function() {
                messageBox.setContent('Pressed f6.');
                screen.render();
            },
        },
        'Prompt': {
            keys: ['f7'],
            callback: function() {
                promptBox.input('Prompt: ', '', function(err, value) {
                    if (err) return err;
                    return value;
                });
                screen.render();
            },
        },
        'Temp': {
            keys: ['f8'],
            callback: function() {
                messageBox.setContent('Pressed f8.');
                screen.render();
            },
        },
        'Menu': {
            keys: ['f9'],
            callback: function() {
                messageBox.setContent('Pressed f9.');
                screen.render();
            },
        },
        'Exit': {
            keys: ['f10'],
            callback: function() {
                screen.destroy();
                return process.exit(0);
            },
        },
        'Maximize': {
            keys: ['f11'],
            callback: function() {
                tickerListTable.height = (tickerListTable.height == 20) ? '100%' : 20;
                tickerDetailBox.toggle();
                globalDataList.toggle();
                messageBox.setContent(`Pressed f11.${tickerListTable.height}`);
                screen.render();
            },
        },
        'Unlock': {
            keys: ['f12'],
            callback: function() {
                messageBox.setContent('Pressed f12.');
                screen.render();
            },
        },
    },
});

const viewCoinMarketCap = blessed.box({
    parent: screen,
    top: 1,
    bottom: 9,
    left: 0,
    width: '100%',
    draggable: false,
    noCellBorders: true,
    border: false
});

// Create a list table to display ticker information
const tickerListTable = blessed.ListTable({
    label: ' CoinMarketCap ',
    parent: viewCoinMarketCap,
    top: 0,
    left: 0,
    width: '100%',
    height: 20,
    tags: true,
    keys: true,
    vi: true,
    align: 'right',
    noCellBorders: false,
    //    terminal: 'xterm-256color',
    border: { type: 'line' },
    style: {
        bg: 'black',
        border: {
            fg: 'gray',
            //bg: 'black'
        },
        header: {
            fg: 'white',
            bg: 'black'
        },
        selected: {
            fg: 'red',
            //bg: 'white',
            bold: true,
        },
        item: {
            fg: 'gray90',
            bg: 'black',
            hover: { bg: 'blue' },
        },
    },
    scrollbar: {
        ch: ' ',
        track: { bg: 'cyan' },
        style: { inverse: true }
    },
    search: function(callback) {
        searchBox.input('Search: ', '', function(err, value) {
            if (err) return;
            return callback(null, value);
        });
    }

});


const tickerDetailBox = blessed.box({
    label: ' Ticker Detail ',
    parent: viewCoinMarketCap,
    top: tickerListTable.top + tickerListTable.height,
    bottom: 0,
    left: 0,
    width: '50%',
    tags: true,
    keys: false,
    border: { type: 'line' },
    style: {
        bg: 'black',
        border: {
            fg: 'gray'
        }
    },
    content: '{center}Loading...{/}',
});


const globalDataList = blessed.list({
    label: ' Global Market Data ',
    parent: viewCoinMarketCap,
    top: tickerListTable.top + tickerListTable.height,
    bottom: 0,
    right: 0,
    width: '50%',
    tags: true,
    keys: false,
    border: { type: 'line' },
    style: {
        bg: 'black',
        border: {
            fg: 'gray'
        }
    },
    //rows: [ ['a message'], ['another message'] ]
    content: '{center}Loading...{/}',
});

const loggingBox = contrib.log({
    label: ' Logging Messages ',
    parent: screen,
    bottom: 1,
    left: 0,
    width: '100%',
    height: 8,
    tags: true,
    keys: false,
    draggable: true,
    border: {
        type: 'line'
    },
    style: {
        bg: 'black',
        border: {
            fg: 'gray'
        }
    },
    content: 'Monitoring CoinMarketCap.com...',
});


const searchBox = blessed.prompt({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 8,
    align: 'center',
    width: 50,
    tags: true,
    hidden: true,
    border: 'line',
    keys: true,
    vi: true,
    draggable: true,
    mouse: true,
});


const promptBox = blessed.prompt({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 8,
    align: 'center',
    width: 100,
    tags: true,
    hidden: true,
    border: 'line',
    keys: true,
    vi: true,
    draggable: true,
    mouse: true,
});


const statusLine = blessed.box({
    parent: screen,
    bottom: 0,
    height: 1,
    left: 0,
    width: '100%',
    tags: true,
    style: {
        bg: 'black',
        align: 'left'
    },
    content: '  {bold}Q{/bold}uit | {bold}/{/bold} Prompt | '
});


const RefreshInfoLine = blessed.box({
    parent: screen,
    bottom: 0,
    height: 1,
    right: 0,
    width: 'shrink',
    tags: true,
    style: {
        bg: 'black',
        align: 'right',
    },
    content: 'Refreshed {bold}@{/bold} '
});


const loaderBox = blessed.loading({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 5,
    align: 'center',
    width: 30,
    tags: true,
    hidden: true,
    border: 'line'
});


const tickerPopupBox = blessed.box({
    label: 'Ticker Detail',
    parent: screen,
    top: 'center',
    left: 'center',
    height: 27,
    width: 60,
    tags: true,
    draggable: true,
    hidden: true,
    border: 'line',
    content: '{center}Ticker Detail{/center}',
});


const messageBox = blessed.message({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 'shrink',
    width: '50%',
    align: 'center',
    tags: true,
    hidden: true,
    border: 'line'
});

//function list(val) {
const list = (val = {}) => {
    return val.split(',');
};


var tickersRawData = [];

programParams
    .version(VERSION)
    .option('-c, --currency <value>', 'Get market information about the symbol (ex: BTC, ETH, etc.).', function (value) { return value.split(',');} )
    .option('-b, --base <value>', 'Get market price against the specified base currency symbol. (Default: USD)', 'USD')
//    .option('-p, --price <n>', 'Alert when the market matches the specified price.', parseFloat)
//    .option('-P, --percentage <n>', 'Alert when the market matches the specified percentage. (Default: 5)', parseFloat, '5')
    .option('-t, --top [n] ', 'Get specified top currencies (Default: ' + TOP_CURRENCIES_NUMBER + ')', parseInt, TOP_CURRENCIES_NUMBER)
//    .option('-a, --all ', 'Get all existing currencies on the market', parseInt, 10)
    .option('-R, --rawstats', 'Displays symbol information as raw data (JSON format) instead of human readable. (Default: false)')
    .option('-r, --refresh [n]', 'Refresh information every <n> seconds. Run once and exit if not specified. (Default: 300)', 300, parseInt)
    .parse(process.argv);
/*
if (!process.argv.slice(2).length) {
    programParams.outputHelp();
    process.exit(1);
}
*/


if (programParams.args != '') {
    console.log('\n Error: unknown command %s', programParams.args);
    process.exit(1);

}

var cryptosList = programParams.currency; // Converted into an array by 'list' function

if (!programParams.top) { 
    if (cryptosList == undefined) {
        console.log('Error: Mandatory parameter \'currency\' is missing.'); 
        process.exit(1);
    }
}
if (supportedCurrencies.indexOf(programParams.base) === -1) {

    console.log('Error: Specified convert currency not supported: %s', programParams.base); 
    process.exit(1);
}

if (Number.isNaN(programParams.refresh))  {
    console.log('Error: Incorrect refresh number specified: %s', programParams.refresh); 
    process.exit(1);
}

coinMarketCapOptions.refresh = (Number(coinMarketCapOptions.refresh) < 300) ? programParams.refresh : 300;
loggingBox.log(`Refreshing market data every ${coinMarketCapOptions.refresh} seconds...`);

var topNumber = programParams.top;

const coinMarketCap = new CoinMarketCap(coinMarketCapOptions);


tickerPopupBox.key(['escape', 'enter'], function(ch, key) {
    tickerPopupBox.hide();
    tickerListTable.focus();
    screen.render();
});



// Show when pressing Enter over an item
tickerListTable.on('select', function(item, selected) {
    if (tickerListTable._.rendering) return;

    tickerPopupBox.setContent('\n\n' + formatTickerInfo(tickerListTable.rawData[selected]) + '\n\n{center}(Press ESC to close){/center}');
    tickerPopupBox.show();
    tickerPopupBox.focus();
    screen.render();
});


tickerListTable.key('pageup', function(ch, key) {

    var itemsCount = Object.keys(tickerListTable.items).length - 1; // 1 is the Header
    var selectedIndex = tickerListTable.selected;

    if ((selectedIndex - 10) <= 1) {
        tickerListTable.selected = 1;
    } else {
        tickerListTable.selected = selectedIndex - 10;
    }
    tickerListTable.scrollTo(tickerListTable.selected);
    screen.render();
});

tickerListTable.key('pagedown', function(ch, key) {

    var itemsCount = Object.keys(tickerListTable.items).length - 1; // 1 is the Header
    var selectedIndex = tickerListTable.selected;

    if ((selectedIndex + 10) >= itemsCount) {
        tickerListTable.selected = itemsCount;
    } else {
        tickerListTable.selected = selectedIndex + 10;
    }
    tickerListTable.scrollTo(tickerListTable.selected);
});

//tickerListTable.key(['up', 'down'], function(ch, key) {
tickerListTable.on('select item', function(item, selected) {
    if (tickerListTable._.rendering) return;
    tickerDetailBox.setContent(formatTickerInfo(tickerListTable.rawData[tickerListTable.selected]));
});


screen.key('C-r', function(ch, key) {
    // refresh data
    loaderBox.load('Loading...');
    if (programParams.top) runTop();
    loaderBox.stop();
    screen.render();
});


// If box is focused, handle `enter`/`return` and give us some more content.
/*
tickerListTable.key('enter', function(ch, key) {
    tickerPopupBox.setContent('Hello {bold}world{/bold}!');
    tickerPopupBox.show();
    tickerPopupBox.focus();
    screen.render();
});
*/

if (blessed.program.cols < MIN_SCREEN_WIDTH) {
    console.log('This program can only open on a terminal with a minimum of 140x40 characters.');
    console.log('Your terminal is %sx%s.', blessed.program.cols, blessed.program.rows);
    process.exit();
}

// Focus tableList element.
tickerListTable.focus();

// Render the screen.
screen.render();

// Refresh ticker information every programParams.refresh seconds
coinMarketCap.onMulti( (tickersData, event) => {
    if (programParams.top) runTop();

    coinMarketCap.getGlobalData( globalData => {
        globalDataList.setContent(formatGlobalMarketData(globalData));
    });
});


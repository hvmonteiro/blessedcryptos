#!/usr/bin/env node
'use strict'; // jshint ignore:line

// jshint esversion: 6
/* globals require: true, __dirname: true, process: true, console: true */
//
// Copyright (c) 2018 Hugo V. Monteiro
// Use of this source code is governed by the GPL-2.0 license that can be
// found in the LICENSE file.

const programParams = require('commander');
const formatCurrency = require('format-currency');
const CoinMarketCap = require('node-coinmarketcap');
const blessed = require('blessed');
const configJSON = require('json-fs-store')('.config.json');


const TITLE = 'Blessed Cryptos'
const VERSION = '0.1.0'
const MIN_SCREEN_WIDTH = 140;
const MIN_SCREEN_HEIGHT = 40;

const DEFAULT_CURRENCY = 'USD';
const TOP_CURRENCIES_NUMBER = 20;

const configSettings = {
    'tickers' : [
        'BTC', 
        'ETH', 
        'LTC'],
    'refresh' : '300'
}

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
    return (val/ Math.pow(1000, e)).toFixed(2) + ' ' + humanReadableNumbers[e]
}

const coinMarketCapOptions = {
    // Refresh time in seconds
    refresh: 300,
    // Enable event system: true|false
    events: true,
    // Convert price to different currencies
    convert: DEFAULT_CURRENCY
}


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
        percent_change_1h,
        percent_change_24h,
        percent_change_7d,
        formatDefault(formatCurrency(price_usd)),
        formatDefault(readableNumber(volume_usd)),
        formatDefault(readableNumber(available_supply)),
        //formatDefault(readableNumber(market_cap_usd)),
        "coinmarketcap.com",
    ];
};

// Create a screen object.
const screen = blessed.screen({
    smartCSR: true,
    terminal: 'xterm-256color',
    ignoreLock: true
});

const runTop = () => {

    const tableListHeader = [
        [
            '#',
            'Name',
            'Symbol',
            '% 1h',
            '% 24h',
            '% 7d',
            `Price (${coinMarketCapOptions.convert})`,
            `Market Cap (${coinMarketCapOptions.convert})`,
            `Circulating Supply (${coinMarketCapOptions.convert})`,
            //`Volume (24h/${coinMarketCapOptions.convert})`
            'Exchange'
        ]
    ];

    loaderBox.load('Loading...');
    coinMarketCap.getTop(topNumber, data => {

        tickersRawData = data;
        var date = new Date();
        var rows = data.map(function (value, index) { return formatTableRow(value); });

        tickerListTable.setRows(tableListHeader.concat(rows));
        loaderBox.stop();
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
        'Sell': {
            keys: ['f6'],
            callback: function() {
                loggerMessagesBox.setContent('Pressed f6.');
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
        'Sort': {
            keys: ['f8'],
            callback: function() {
                loggerMessagesBox.setContent('Pressed f8.');
                screen.render();
            },
        },
        'Menu': {
            keys: ['f9'],
            callback: function() {
                loggerMessagesBox.setContent('Pressed f9.');
                screen.render();
            },
        },
        'Exit': {
            keys: ['f10'],
            callback: function() {
                return process.exit(0);
            },
        },
        'Top 10': {
            keys: ['f11'],
            callback: function() {
                loggerMessagesBox.setContent('Pressed f11.');
                screen.render();
            },
        },
        'Unlock': {
            keys: ['f12'],
            callback: function() {
                loggerMessagesBox.setContent('Pressed f12.');
                screen.render();
            },
        },
    },
});

// Create a list table to display ticker information
const tickerListTable = blessed.ListTable({
    label: ' {bold}T{/}icker List ',
    parent: screen,
    top: 1,
    left: 0,
    width: '100%',
    height: 18,
    tags: true,
    keys: true,
    vi: true,
    align: 'right',
    draggable: true,
    noCellBorders: false,
    //    terminal: 'xterm-256color',
    border: {
        type: 'line'
    },
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
            hover: {
                bg: 'blue'
            },
            fg: 'gray90',
            bg: 'black'
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
        promptBox.input('Prompt: ', '', function(err, value) {
            if (err) return;
            return callback(null, value);
        });
    }

});


const tickerDetailBox = blessed.box({
    parent: screen,
    top: tickerListTable.top + tickerListTable.height,
    bottom: 11,
    left: '0',
    width: '50%',
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
    label: ' Ticker {bold}D{/}etail ',
    content: '{center}ticker detail{/}',
});


const loggerMessagesBox = blessed.list({
    parent: screen,
    top: tickerListTable.top + tickerListTable.height,
    bottom: 11,
    right: '0',
    width: '50%',
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
    label: ' {bold}M{/}essages ',
    //rows: [ ['a message'], ['another message'] ]
    content: '{center}ticker info{/}',
});

const ordersInfoBox = blessed.list({
    parent: screen,
    bottom: 1,
    left: 0,
    width: '100%',
    height: 10,
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
    label: ' {bold}O{/}rders ',
    content: 'Selling order ...... ',
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


const tickerInfoBox = blessed.box({
    parent: screen,
    top: 'center',
    left: 'center',
    height: 30,
    width: 50,
    align: 'center',
    tags: true,
    draggable: true,
    hidden: true,
    border: 'line',
    label: ' Ticker Info ',
    content: '{center}ticker info{/center}',
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
}


var tickersRawData = [];

programParams
    .version(VERSION)
    .option('-c, --currency <value>', 'Get market information about the symbol (ex: BTC, ETH, etc.).', function (value) { return value.split(',')} )
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

var topNumber = programParams.top;

const coinMarketCap = new CoinMarketCap(coinMarketCapOptions);


screen.title = TITLE + '(' + VERSION + ')';

// get and setup tickers first time
if (programParams.top) runTop();

// Enable refresh data event using BTC ticker changes
coinMarketCap.on('BTC', (tickerData, event) => {
    // Refresh ticker information every programParams.refresh seconds
    if (programParams.top) runTop();
});


tickerInfoBox.key(['escape', 'enter'], function(ch, key) {
    tickerInfoBox.hide();
    tickerListTable.focus();
    screen.render();
});



// Show when pressing Enter over an item
tickerListTable.on('select', function(el, selected) {
    mainMenu.select(0);
    if (tickerListTable._.rendering) return;

    // Get row as text, trim spaces, remove indent cell spaces and convert to an array
    var tickerInfo = el.getText().trim().replace(/\s\s+/g, ' ').split(' ');

    var name = tickerInfo[1];
    //console.log(tickerInfo);
    //console.log(tickersRawData);

    tickerInfoBox.setContent(JSON.stringify(tickerInfo).replace(/,/g, '\n'));
    tickerInfoBox.show();
    tickerInfoBox.focus();
    screen.render();

    tickerDetailBox.setContent(name);
});


screen.key('C-r', function(ch, key) {
    // refresh data
    if (programParams.top) runTop();
});

tickerDetailBox.setContent('hello\n'
    + '{right}world{/right}\n'
    + '{center}foo{/center}\n'
    + 'left{|}right');


// If box is focused, handle `enter`/`return` and give us some more content.
/*
tickerListTable.key('enter', function(ch, key) {
    tickerInfoBox.setContent('Hello {bold}world{/bold}!');
    tickerInfoBox.show();
    tickerInfoBox.focus();
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



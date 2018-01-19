#!/usr/bin/env node
"use strict";

const program = require("commander");
const CoinMarketCap = require("node-coinmarketcap");
const formatNumber = require("format-num");
const formatCurrency = require("format-currency");
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

const currencyInfo = {
    circulating_supply_24h: "0",
    total_circulating_supply_24h: "0",
    circulating_supply_percent_24h: "0"
}

const coinmarketcap = new CoinMarketCap(options);
var coinMarketInfo = [];
var invalidSymbolList = [];

var currencySymbol = ""
var baseCurrency = "";
var triggerPrice = "";
var triggerPercent = "";
var rawStats = "";
var refreshInterval = "";
var enableMonitor = false;

const formatNumbers = val => {
    return Number.parseFloat(val)
        .toFixed(2)
        .replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,")
}

const formatGrowth = val => {
    return val.indexOf("-") === -1 ? chalk.green(val) : chalk.red(val)
}

const formatDefault = val => {
    return chalk.white(val);
};

const readableNumber = val => {

    const humanReadableNumbers = [ "hundred", "thoushand", "million", "billion"];
    if (val === null) return "0"; // if undefined,  return a zero
    var e = Math.floor(Math.log(val) / Math.log(1000));
    return (val/ Math.pow(1000, e)).toFixed(2) + " " + humanReadableNumbers[e]
}

//const formatRow = async (data = {}) => {
const formatRow = (data = {}) => {
    let {
        id,
        name,
        symbol,
        rank,
        price_usd,
        price_btc,
        '24h_volume_usd' : volume_usd,
        market_cap_usd,
        available_supply,
        total_supply,
        max_supply,
        percent_change_1h,
        percent_change_24h,
        percent_change_7d,
        last_updated
    } = data

    let currencyOpts = { format: '%s%v %c', code: DEFAULT_CURRENCY, symbol: "$" }; // => $10,000,000.15 USD 

    return [
        "ID: " + id,
        name,
        symbol,
        rank,
        formatCurrency(price_usd, currencyOpts),
        formatCurrency(price_btc, currencyOpts),
        formatCurrency(volume_usd, currencyOpts),
        formatCurrency(market_cap_usd, currencyOpts),
        readableNumber(available_supply),
        readableNumber(total_supply),
        readableNumber(max_supply),
        formatNumber(percent_change_1h, 2) + " %",
        formatNumber(percent_change_24h, 2) + " %",
        formatNumber(percent_change_7d, 2) + " %",
        last_updated
    ]

}
/*
 * JSON format returned from API
 *   { id: 'litecoin',
 *       name: 'Litecoin',
 *       symbol: 'LTC',
 *       rank: '6',
 *       price_usd: '161.46',
 *       price_btc: '0.0160353',
 *       '24h_volume_usd': '1177560000.0',
 *       market_cap_usd: '8847456316.0',
 *       available_supply: '54796583.0',
 *       total_supply: '54796583.0',
 *       max_supply: '84000000.0',
 *       percent_change_1h: '-4.34',
 *       percent_change_24h: '-20.4',
 *       percent_change_7d: '-33.54',
 *       last_updated: '1516196941' },
 *
 * */



function list(val) {
    return val.split(",");
}


program
    .version("0.1.0")
    .option("-c, --currency <value>", "Get market information about the symbol (ex: BTC, ETH, etc.).", list)
    .option("-b, --base <value>", "Get market price against the specified base currency symbol. (Default: USD)", "USD")
    .option("-p, --price <n>", "Alert when the market matches the specified price.", parseFloat)
    .option("-P, --percentage <n>", "Alert when the market matches the specified percentage. (Default: 5)", parseFloat, "5")
    .option("-t, --top [n] ", "Get specified top currencies (Default: 10)", parseInt, 10)
    .option("-a, --all ", "Get all existing currencies on the market", parseInt, 10)
    .option("-R, --rawstats", "Displays symbol information as raw data instead of human readable. (Default: false)")
    .option("-r, --refresh <n>", "Refresh information every <n> seconds. Run once and exit if not specified.", parseInt)
    .option("-s, --silent", "Be silent about the output, showing only the response.")
    .parse(process.argv);

if (!process.argv.slice(2).length) {
    program.outputHelp();
    process.exit(1);
}

if (!program.top) { 
    if (!enableMonitor) { // show current price and exit
        if (currencySymbol == undefined) {
            console.log("Error: Mandatory parameter 'currency' is missing."); 
            process.exit(1);
        }
    } else { 
        if ( (currencySymbol == undefined) || (triggerPrice == undefined) ) {
            console.log("Error: Mandatory parameters are 'currency' and 'price' trigger."); 
            process.exit(1);
        }
    }
}

if (supportedCurrencies.indexOf(program.base) === -1) {
    console.log("Error: Specified convert currency not supported: %s", baseCurrency); 
    process.exit(1);
}

currencySymbol = program.currency; // Converted into an array by "list" function
baseCurrency = (supportedCurrencies.indexOf(program.base) === -1) ? DEFAULT_CURRENCY : program.base;
triggerPrice = program.price;
triggerPercent = program.percentage;
rawStats = program.rawstats;
refreshInterval = program.refresh;
enableMonitor = (program.refresh > 0);


var options = {
    events: enableMonitor,      // Enable event system: true|false
    refresh: refreshInterval,   // Refresh time in seconds
    convert: baseCurrency       // Convert price to different currencies
}


if (!program.silent) { // if undefined, show output info

    console.log("Currency symbol(s): ", currencySymbol);
    console.log("Trigger Price: ", triggerPrice);
    console.log("Trigger Percent: ", triggerPercent);
    console.log("Base Currency: ", baseCurrency);
    console.log("Refresh Interval: ", refreshInterval);
    console.log("Enable Monitor: ", enableMonitor);
}


function replacer(key, value) {
// Filtering out properties
    return value.replace('"', "");
}

if (program.top)  {

    if (!program.silent) console.log("TOP %s symbols:\n\n", program.top);

    coinmarketcap.multi( cryptos => {
        var coin = cryptos.getTop(program.top);
        console.log(JSON.stringify(coin.map(formatRow)));
    });


} else {
    if (!enableMonitor) {
        console.log("Getting market information...");
        coinmarketcap.multi(cryptos => {

            for (var i=0; i < currencySymbol.length; ++i) {

                if (!program.silent) { // if undefined, show output info
                    console.log("=========================================");
                    console.log("Information for: "+currencySymbol[i]);
                }
                //coinMarketInfo[coinList[i]] = cryptos.get(currencySymbol[i]);
                console(cryptos.get(currencySymbol[i]));
                /*
                if (coinMarketInfo[coinList[i]] == undefined) {

                    console.log("Error: Invalid currency symbol: ", coinList[i]);

                } else {

                    console.log("-----------------------------------------");
                    console.log(coinMarketInfo[coinList[i]]);

                    if (rawStats)   {

                // Warning: If an exception occurs in this calculations, process will exit without further notice
                        coinExtraInfo.circulating_supply_24h = (coinMarketInfo[coinList[i]]["24h_volume_usd"] / coinMarketInfo[coinList[i]].price_usd);
                        coinExtraInfo.total_circulating_supply_24h = (coinMarketInfo[coinList[i]].available_supply - coinExtraInfo.circulating_supply_24h);
                        coinExtraInfo.circulating_supply_percent_24h = ( (coinExtraInfo.circulating_supply_24h * 100) / coinMarketInfo[coinList[i]].available_supply);

                        console.log("-----------------------------------------");
                        console.log(Object.assign(coin, coinExtraInfo));
                    } else {

                        currencyInfo.circulating_supply_24h = readableNumber( Number( coin["24h_volume_usd"] / coin.price_usd).toFixed(2) );
                        currencyInfo.total_circulating_supply_24h = readableNumber( Number( coin.available_supply - currencyInfo.circulating_supply_24h).toFixed(2));
                        currencyInfo.circulating_supply_percent_24h = readableNumber( Number( (currencyInfo.circulating_supply_24h * 100) / coin.available_supply).toFixed(2) );
                        console.log("-----------------------------------------");
                        console.log(Object.assign(coin, coinExtraInfo));
                    }
                }
                */
            }
        });

    } else {
        // Start monitoring for trigger changes 
        if (!program.silent) { // if undefined, show output info
            console.log("Monitoring changes for currencies: "+currencySymbol+"...");
            console.log("Refreshing every "+refreshInterval+" seconds");
        }

        for (i=0; i < currencySymbol.length; ++i) {

            // Trigger this event when <currencySymbol> price is greater than <triggerPrice>
            coinmarketcap.onGreater(currencySymbol[i], triggerPrice, (coin) => {
                if (coin) console.log(`${coin.name}(${coin.symbol}): ${coin.price_usd}$ > ${triggerPrice}$`);
            });

            // Trigger this event when <currencySymbol> percent change is greater than <triggerPercentage>
            coinmarketcap.onPercentChange24h(currencySymbol[i], triggerPercent, (coin) => {
                if (coin) console.log(`${coin.name}(${coin.symbol}) is ${triggerPercent}% above in the last 24 hours`);
            });
            coinmarketcap.onPercentChange1h(currencySymbol[i], triggerPercent, (coin) => {
                if (coin) console.log(`${coin.name}(${coin.symbol}) is ${triggerPercent}% above in the last hour`);
            });

            // Trigger this event every <refreshInterval> seconds with information about <currencySymbol>
            coinmarketcap.on(currencySymbol[i], (coin) => {
                //console.log(coin);
                if (coin) console.log(`Refreshing info for ${coin.symbol} (Last Price: ${coin.price_usd})...`);
            });
        }
    }
}



#!/usr/bin/env node
"use strict";

const Table = require("cli-table");
const chalk = require("chalk");
const CoinMarketCap = require("node-coinmarketcap");

const DEFAULT_CURRENCY = "USD";

const table = new Table({
    chars: {
        top: "",
        "top-mid": "",
        "top-left": "",
        "top-right": "",
        bottom: "",
        "bottom-mid": "",
        "bottom-left": "",
        "bottom-right": "",
        left: "",
        "left-mid": "",
        mid: "",
        "mid-mid": "",
        right: "",
        "right-mid": "",
        middle: ""
    }
});


const options = {
    events: false,
    refresh: 0,
    convert: DEFAULT_CURRENCY
};
const client = new CoinMarketCap(options);

const formatCurrency = val => {
    return Number.parseFloat(val)
        .toFixed(2)
        .replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
};

const formatGrowth = val => {
    return val.indexOf("-") === -1 ? chalk.green(val) : chalk.red(val);
};

const formatDefault = val => {
    return chalk.white(val);
};

const readableNumber = val => {

    const humanReadableNumbers = [ "hundred", "thoushand", "million", "billion"];
    if (val === null) return "0"; // if undefined,  return a zero
    var e = Math.floor(Math.log(val) / Math.log(1000));
    return (val/ Math.pow(1000, e)).toFixed(2) + " " + humanReadableNumbers[e]
}

const formatRow = (data = {}) => {
    let {
        name,
        symbol,
        rank,
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

const run = () => {
    client.getTop(10, data => {
        table.push(
            [
                "#",
                "Name",
                "Symbol",
                "% 1h",
                "% 24h",
                "% 7d",
                `Price (${options.convert})`,
                `Market Cap (${options.convert})`,
                `Circulating Supply (${options.convert})`,
                `Volume (24h/${options.convert})`
            ].map(val => chalk.bold(val))
        );
        data.map(formatRow).forEach(row => table.push(row));
        console.log(table.toString());
    });
};

console.log("Getting TOP10 crypto currencies information from CoinMarketCap...");
run();

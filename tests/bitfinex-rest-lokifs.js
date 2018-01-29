'use strict'; // jshint ignore:line

// jshint esversion: 6
/* globals require: true, __dirname: true, process: true, console: true */


process.env.DEBUG = 'bfx:examples:*';
const debug = require('debug')('bfx:examples:rest2_trades');
const BFX = require('bitfinex-api-node');
const SocksProxyAgent = require('socks-proxy-agent');
const loki = require('lokijs');

const db = new loki("bitfinex-tickers.db", {
    autoload: true,
    autoloadCallback : databaseInitialize,
    autosave: true, 
    autosaveInterval: 4000
});

const { API_KEY, API_SECRET, REST_URL, WS_URL, SOCKS_PROXY_URL } = process.env;
const agent = SOCKS_PROXY_URL ? new SocksProxyAgent(SOCKS_PROXY_URL) : null;

const bfx = new BFX({
    apiKey: API_KEY,
    apiSecret: API_SECRET,

    ws: {
        url: WS_URL,
        agent
    },

    rest: {
        url: REST_URL,
        agent
    }
});

const rest = bfx.rest(2, { transform: true });

debug('fetching available symbols...');

// implement the autoloadback referenced in loki constructor
function databaseInitialize() {
    var tickerDB = db.getCollection("ticker");
    if (tickerDB === null) {
        tickerDB = db.addCollection("ticker");
    }

    rest.symbols((err, symbols) => {
        if (err) return debug('error: %s', err.message);

        console.log('Saving %s', symbols);
        tickerDB.insert({ id : 0, symbols });
        debug('available symbols are: %s', symbols.join(', '));

        debug('fetching data...');
        var allSymbolsPairs = symbols.join(',').toUpperCase().replace(/^/g, 't').replace(/,/g, ',t').split(',');

        //rest.tickers(symbols.join(',t').split(",") , (err, data) => {
        rest.tickers(allSymbolsPairs, (err, data) => {
            if (err) {
                return debug('error: %j', err);
            }

            data.forEach(ticker => {
                tickerDB.insert({ 'symbol' : ticker.symbol, ticker });
                /*
            debug(
                'tick %s | bid %f | ask %f | daily change %f',
                ticker.symbol, ticker.bid, ticker.ask, Number(ticker.dailyChange)
            );
            */
            });
            debug('Getting tBTCUSD ticker from lokifs db');
            var _ticker = tickerDB.find({ symbol : "tBTCUSD" });
            console.log(_ticker);
            if (_ticker)    {
                debug(
                    'tick %s | bid %f | ask %f | daily change %f',
                    _ticker.symbol, _ticker.ticker.bid, _ticker.ticker.ask, Number(_ticker.ticker.dailyChange)
                );
            }
        }).catch((err) => {
            debug('error: %j', err);
        });

    });
    db.saveDatabase(tickerDB);  // could pass callback if needed for async complete

}
/*
setTimeout( function () {
    db.close();
}, 5000);
*/
db.close();

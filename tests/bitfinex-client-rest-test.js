'use strict'

require('dotenv').config()

process.env.DEBUG = 'bfx:examples:*'
const debug = require('debug')('bfx:examples:rest2_trades')
const BFX = require('bitfinex-api-node')
const SocksProxyAgent = require('socks-proxy-agent')

const { API_KEY, API_SECRET, REST_URL, WS_URL, SOCKS_PROXY_URL } = process.env
const agent = SOCKS_PROXY_URL ? new SocksProxyAgent(SOCKS_PROXY_URL) : null

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
})

const rest = bfx.rest(2, { transform: true })

debug('fetching available symbols...')

rest.symbols((err, symbols) => {
    if (err) return debug('error: %s', err.message)

    debug('available symbols are: %s', symbols.join(', '))

    debug('fetching data...')
    var allSymbolsPairs = symbols.join(',').toUpperCase().replace(/^/g, 't').replace(/,/g, ',t').split(',');

    symbols.forEach( symbol => {
    });
    //rest.tickers(symbols.join(',t').split(",") , (err, data) => {
    rest.tickers(allSymbolsPairs, (err, data) => {
        if (err) {
            return debug('error: %j', err)
        }

        data.forEach((ticker) => {
            debug(
                'tick %s | bid %f | ask %f | daily change %f',
                ticker.symbol, ticker.bid, ticker.ask, Number(ticker.dailyChange)
            )
        })
    }).catch((err) => {
        debug('error: %j', err)
    })

})

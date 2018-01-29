'use strict'

require('dotenv').config()

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

process.env.DEBUG = 'bfx:examples:*'

const debug = require('debug')('bfx:examples:ws2_trades')

const curencyPair = 'NEOUSD'

const ws = bfx.ws(2)

ws.on('open', () => {
  debug('open')
  ws.subscribeTrades('t'+curencyPair)
})

ws.onTradeEntry({ pair: curencyPair }, (trade) => {
  debug('te: %j', trade)
})

ws.onTradeUpdate({ pair: curencyPair }, (trade) => {
  debug('tu: %j', trade)
})

ws.onTrades({ pair: curencyPair }, (trades) => {
  debug('trades: %j', trades)
  console.log('trades: ');
  console.log(trades)
})

ws.open()


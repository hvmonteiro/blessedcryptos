const binance = require('node-binance-api');

// Periods: 1m,3m,5m,15m,30m,1h,2h,4h,6h,8h,12h,1d,3d,1w,1M
binance.websockets.candlesticks(['BNBBTC'], "1m", (candlesticks) => {
	let { e:eventType, E:eventTime, s:symbol, k:ticks } = candlesticks;
	let { o:open, h:high, l:low, c:close, v:volume, n:trades, i:interval, x:isFinal, q:quoteVolume, V:buyVolume, Q:quoteBuyVolume } = ticks;
	console.log(symbol+" "+interval+" candlestick update");
	console.log("open: "+open);
	console.log("high: "+high);
	console.log("low: "+low);
	console.log("close: "+close);
	console.log("volume: "+volume);
	console.log("isFinal: "+isFinal);
});

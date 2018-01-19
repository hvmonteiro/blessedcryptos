# About
BlessedCryptos is a crypto currency monitor that runs in a terminal showing the TOP 10 crypto currencies at the moment.


# Description
BlessedCryptos is a crypto currency monitor that runs in a terminal using [CoinMarketapCap](http://www.coinmarketcap.com) REST API to get crypto currencies market data.
It works behind a proxy if you have setup `https_proxy` or `http_proxy` environment variables.
information display idea taken from [prettycryptos](https://github.com/tiaanduplessis/prettycryptos/)


# Idea
The idea is to have a simple yet powerfull way to get market information about crypto currencies without the assle of having to use a full-blown browser.


# Usage
Clone repository:
```
git clone https://github.com/hvmonteiro/blessedcryptos.git
```

Install NodeJS module dependencies:
```
npm install
```

Execute it to get a pretty table with all market information of the TOP10 Crypto Currencies
```
npm start
```

## Output Example:
![](images/output-example.png?raw=true)

**Tip:** *BlessedCryptos runs best in a terminal with the dimensions 124x22 (or bigger).*

You can refresh the information every <n> seconds (this example is for 10 minutes) using `watch` unix command (remove `FORCE_COLOR=1` for black and white display):
```
watch --differences --beep --no-title --color --interval 300 "FORCE_COLOR=1 npm --silent start"
```

**Notice**: *data on [CoinMarketapCap](http://www.coinmarketcap.com) is only refreshed every 10 minutes, so logic dictates that you will unnecessary overload the API server if your refresh interval is less than `300 seconds (10 min).*


# License
BlessedCryptos is licensed under The MIT License (MIT)
Check LICENSE file for more information.


# Copyright
Hugo Monteiro (c) 2018


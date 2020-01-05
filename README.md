# alpaca-paper-web-app

## Get Your API Keys

Sign up at https://alpaca.markets and https://alphavantage.co to get your API keys. Users might want to copy and paste these to a note somewhere temporarily...

## Setup for config.js

Create a file called "config.js" in the same directory, and then copy and paste the following into it, making the necessary replacements in the keys object:

`
const keys = {
    'apiKey': 'your alpaca api key here',
    'secretKey': 'you alpaca secret key here',
    'alphaVantage': 'your alpha vantage api key here'
}
` 

## Dependencies

None, although this project depends heavily on jQuery

## How to use

This app is based off the idea that stock prices tend to "Ping Pong" back and forth.

You'll probably want to do some research first, looking for ticker symbols that seem to bounce quite a bit between highs and lows. That's where this one tends to shine the best.

You'll want to create a "New Ping" and then type in a list (works best with 4 tickers at a time, as the free APIs have some pretty debilitating limitations) of symbols, comma separated. After they are created, click refresh and then "Toggle Monitor".

If it's a market trading day:
Then, sit back, and let the app do its magic.

If not:
Try again on the next one!

## Limitations

Currently, since it uses free APIs, there is quite a bit of throttling and sometimes the calls just don't work.

Also, everything runs client-side, so without a proper database, there is no persistense and this slows a lot of the operations down.

Lastly, security is a bit of an issue, as credentials are unhashed and stored locally.

## Disclaimer

Please don't use this with a real money account. This was meant merely as a project in building something fun, not as a real trading tool. If you do use this on a live account, you do so at your own personal and financial risk.
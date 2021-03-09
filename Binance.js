const ccxt = require('ccxt')

const cache = {
  tickers: {
    updateTimeoutSeconds: process.env.TICKERS_UPDATE_TIMEOUT_SECONDS || 30,
    lastUpdated: 0,
    data: {}
  },
  balance: {
    updateTimeoutSeconds: process.env.BALANCE_UPDATE_TIMEOUT_SECONDS || 10,
    lastUpdated: 0,
    data: {}
  }
}

const getFromCache = async (key, fetchFn) => {
  if (!cache[key]) { return }

  const now = Date.now()

  if (cache[key].lastUpdated + (1000 * cache[key].updateTimeoutSeconds) <= now) {
    cache[key].data = await fetchFn()
    cache[key].lastUpdated = now
  }
  return cache[key].data
}

const getTickers = async () => getFromCache('tickers', () => binance.fetchTickers())

const getNonEmptyBalances = async () => {
  const all = await getFromCache('balance', () => binance.fetchBalance())
  const total = all.total // obj of all symbols
  return Object.entries(total)
    .filter(
      ([_, val]) => val > 0
    )
}

const getPriceInTickers = (tickers, symbol, currency = 'TRY') => {
  const currUpper = currency.toUpperCase()

  if (tickers[`${symbol}/${currUpper}`]) {
    // Direct
    return tickers[`${symbol}/${currUpper}`].close
  } else if (tickers[`${symbol}/USDT`] && tickers[`${currUpper}/USDT`]) {
    // USDT->currency
    const currInUsd = tickers[`${symbol}/USDT`].close
    const usdPrice = tickers[`${currUpper}/USDT`].close
    return currInUsd * usdPrice
  }

  return null
}

const getBalanceInCurrency = async (currency) => {
  const balances = await getNonEmptyBalances()
  const tickers = await getTickers()
  return balances.map(([symbol, value]) => {
    const price = getPriceInTickers(tickers, symbol, currency)
    return price * value
  })
    .reduce((a, b) => a + b, 0).toFixed(2)
}

const binance = new ccxt.binance({
  apiKey: process.env.API_KEY,
  secret: process.env.API_SECRET
})

module.exports = {
  getBalanceInCurrency
}
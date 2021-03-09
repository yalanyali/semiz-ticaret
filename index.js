require('dotenv').config()

const TelegramBot = require('node-telegram-bot-api')
const Binance = require('./Binance')

const bot = new TelegramBot(process.env.TELEGRAM_API_KEY, { polling: true })

bot.onText(/\/ka[cç] ?(.+)?/, async (msg, match) => {
  const chatId = msg.chat.id

  const currency = match ? match[1] : ''
  let selectedCurrency = 'TRY'

  let responseBalance = 0
  let responseString = ''

  if (currency) {
    const currLower = currency.toLowerCase()

    if (['usd', 'usdt', 'dolar', 'dollar'].includes(currLower)) {
      selectedCurrency = 'USDT'
    } else if (['eur', 'euro', 'yuro'].includes(currLower)) {
      selectedCurrency = 'EUR'
    } else {
      selectedCurrency = currLower.toUpperCase()
    }
    responseBalance = await Binance.getBalanceInCurrency(selectedCurrency)
    responseString = `${responseBalance} ${selectedCurrency}`
  } else {
    // Default tl
    responseBalance = await Binance.getBalanceInCurrency('TRY')
    responseString = `${responseBalance} TRY`
  }

  if (responseBalance && Number(responseBalance) > 0) {
    bot.sendMessage(chatId, responseString)
  }
})

bot.onText(/\/bot/, async (msg) => {
  const chatId = msg.chat.id
  bot.sendMessage(chatId, ';)')
})

const https = require('https')
const config = require('./config')

module.exports = function notify (text, extra) {
  const botToken = config.botToken
  const group = config.notifyTo

  const safeText = encodeURIComponent(text)
  let uri = `https://api.telegram.org/bot${botToken}/sendMessage?chat_id=${group}&text=${safeText}`
  if (extra) uri += '&' + extra
  https.get(uri).on('error', err => {
    console.log('Notify Error: ' + err.stack || err)
  })
}

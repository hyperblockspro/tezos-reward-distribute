const { askNonblank } = require('./src/ask')
const keyutils = require('./src/keyutils')
const config = require('./src/config')
const ask = require('./src/ask')

;(async () => {
  console.log(`Payment address is ${config.paymentAddress}.`)
  const key = askNonblank('Private key for payment address: ', true)
  if (!(await keyutils.isValidKey(key))) {
    return console.log(`That key CANNOT be used because it is not the key for payment address ${config.paymentAddress}`)
  }
  const pwd = ask.askNewPwd()

  try {
    keyutils.saveKey(key, pwd)
    console.log('Done.')
  } catch (error) {
    console.error(error)
  }
})()

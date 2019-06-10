const CONFIG_FILE = 'config.txt'
const IGNORE_FILE = 'ignore.txt'
const path = require('path')
const fs = require('fs')
const config = require('dotenv').config({ path: path.resolve(process.cwd(), CONFIG_FILE) }).parsed

const checkConfig = items => {
  items.forEach(e => {
    if (!config[e]) {
      throw new Error(`You have to set value for ${e} in ${CONFIG_FILE}`)
    }
  })
}

const loadIgnoreList = () => {
  let text = fs.readFileSync(path.resolve(process.cwd(), IGNORE_FILE), { encoding: 'utf8' })
  return text.split(/\r\n|\r|\n/).map(l => l.trim()).filter(l => l)
}

checkConfig(['apiUrl', 'nodeUrl', 'bakerAddress', 'paymentAddress', 'commisionFee', 'transferFee'])
if (!config.apiUrl.endsWith('/')) {
  config.apiUrl += '/'
}
config.transferMin = parseInt(config.transferMin)
if (!config.transferMin || config.transferMin < 0) {
  config.transferMin = 1
}

config.ignoredList = loadIgnoreList()

module.exports = config

const { default: Sotez, crypto } = require('sotez')
const config = require('./config')
const rpc = new Sotez(config.nodeUrl, 'main', 'main', { defaultFee: config.transferFee })

module.exports = { rpc, crypto }

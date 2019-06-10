const largeNumber = 30000000
const config = require('./config')
const axios = require('axios')

function callApi (path, params = {}) {
  return axios(config.apiUrl + path, { params }).then(r => r.data)
}

function callAccApi (path, account, params) {
  return callApi(path + '/' + account, params)
}

function bakerApi (path, params) {
  return callAccApi(path, config.bakerAddress, params)
}

function bakerApiX (path, params = {}) {
  return bakerApi(path, Object.assign({
    p: 0,
    number: largeNumber
  }, params))
}

module.exports = { callApi, callAccApi, bakerApi, bakerApiX }

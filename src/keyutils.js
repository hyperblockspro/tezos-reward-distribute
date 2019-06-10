const KEY_FILE = 'key.txt'
const { crypto } = require('sotez')
const { readText, writeText } = require('./utils')
const { encrypt, decrypt } = require('./encrypt')
const config = require('./config')

function getKey (password) {
  const text = readText(KEY_FILE)
  const key = decrypt(text, password)
  return key
}

function saveKey (key, password) {
  const text = encrypt(key, password)
  writeText(KEY_FILE, text)
  return true
}

function extractKeys (sk) {
  return crypto.extractKeys(sk)
}

async function isValidKey (key) {
  try {
    const keys = await extractKeys(key)
    return (keys.pkh === config.paymentAddress)
  } catch (err) {
    return false
  }
}

module.exports = { getKey, saveKey, extractKeys, isValidKey }

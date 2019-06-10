const { askNewPwd } = require('./src/ask')
const { encode } = require('./src/text')

const txt = askNewPwd('Enter text: ').trim()
console.log(encode(txt))

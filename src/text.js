const encode = pwd => (
  Buffer.from(Buffer.from(pwd).toString('hex').split('').reverse().join(''), 'hex').toString('base64')
)

const decode = pwd => (
  Buffer.from(Buffer.from(pwd, 'base64').toString('hex').split('').reverse().join(''), 'hex').toString()
)

module.exports = { encode, decode }

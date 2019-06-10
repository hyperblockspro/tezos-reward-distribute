const readlineSync = require('readline-sync')
const { cycleTransfered } = require('./transfer')
const chalk = require('chalk')

exports.askCycle = (min, max, def) => {
  let n = readlineSync.question(`Select cycle (${min} ~ ${max}, default ${def}): `)
  if (n === '') {
    n = def
  }

  n = +n
  if (!n || !Number.isInteger || n < 0 || n < min || n > max) {
    console.log('\nInvalid value, please try again.')
    return exports.askCycle(min, max, def)
  } else {
    const payed = cycleTransfered(n)
    if (payed) {
      const repay = (readlineSync.keyInYN(`Cycle ${n} already ${chalk.red('payed')}. Still select it? `) === true)
      if (repay) {
        return [n, payed]
      } else {
        return exports.askCycle(min, max, def)
      }
    } else {
      return [n, payed]
    }
  }
}

exports.askNonblank = (question, password = false) => {
  let p = readlineSync.question(question, { hideEchoBack: !!password })
  if (p === '') {
    return exports.askNonblank(question, password)
  }

  return p
}

exports.askPwd = msg => {
  return exports.askNonblank(msg || 'Enter password to decrypt payment pkey: ', true)
}

exports.askNewPwd = msg => {
  return readlineSync.questionNewPassword(msg || 'Password to encrypt: ')
}

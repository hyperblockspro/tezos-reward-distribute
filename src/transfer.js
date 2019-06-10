const { rpc } = require('./rpc')
const config = require('./config')
const path = require('path')
const { writeText, safeStringify } = require('./utils')
const chalk = require('chalk')
const fs = require('fs')

function writeLog (cycle, state, data) {
  const fileName = path.resolve(process.cwd(), 'paylogs', `${cycle}_${state}_${Date.now()}.json`)
  writeText(fileName, data)
}

function cycleTransfered (cycle) {
  const prefix = `${cycle}_success_`
  return fs.readdirSync(path.resolve(process.cwd(), 'paylogs')).some(f => f.startsWith(prefix))
}

function lastTransfered () {
  const files = fs.readdirSync(path.resolve(process.cwd(), 'paylogs')).filter(f => f.includes('_success_'))
  return files.reduce((prev, f) => {
    const cycle = +f.split('_', 2)[0] || 0
    return Math.max(cycle, prev)
  }, 0)
}

function getTzscanUrl () {
  if (config.apiUrl.includes('alphanet')) {
    return 'https://alphanet.tzscan.io/'
  }

  return 'https://tzscan.io/'
}

function formatError (e) {
  let s = '' + e
  if (e.errors) s += '\nDetails: ' + safeStringify(e.errors, undefined, 2)
  if (e.stack) s += '\nStack: ' + safeStringify(e.stack, undefined, 2)
  return s
}

async function transfer (list, keys, cycle, notify) {
  const ops = []
  Object.keys(list).forEach(tz => {
    const v = list[tz]
    if (!v.ignored && v.rewardToPay >= config.transferMin) {
      const amount = Math.ceil(v.rewardToPay).toString()
      const operation = {
        kind: 'transaction',
        fee: config.transferFee,
        gas_limit: config.gasLimit,
        storage_limit: 0,
        amount,
        destination: tz
      }
      ops.push(operation)
    }
  })
  if (ops.length) {
    await rpc.importKey(keys.sk)
    return rpc.sendOperation({ from: config.paymentAddress, operation: ops })
      .then(r => {
        writeLog(cycle, 'success', safeStringify(r, undefined, 2))
        if (notify) {
          notify(`Tranfer completed successfully. ${getTzscanUrl()}${r.hash}`)
        } else {
          console.log(chalk.green(`Tranfer completed successfully. Tx Hash ${chalk.bold(r.hash)}`))
          console.log(`${getTzscanUrl()}${r.hash}`)
        }
        return r
      })
      .catch(err => {
        console.error('Error while transfer: ', err)
        const fmtError = formatError(err)
        writeLog(cycle, 'error', `[${new Date().toISOString()}] Error while transfer: ${fmtError}`)
        if (notify) {
          notify('Error while transfer: ' + fmtError)
        }
        return err
      })
  } else {
    if (notify) {
      notify('No need to distribute rewards to any delegator.')
    } else {
      console.log(chalk.green('No need to distribute rewards to any delegator.'))
    }
  }
}

module.exports = { transfer, cycleTransfered, lastTransfered }

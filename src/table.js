const Table = require('cli-table')
const chalk = require('chalk')
const { fmtMicro } = require('./utils')

function push (tz, table, v, intLen) {
  table.push([
    v.ignored ? chalk.gray(tz) : tz,
    fmtMicro(v.rewardShare, intLen, v.ignored),
    fmtMicro(v.rewardToPay, intLen, v.ignored),
    v.ignored ? chalk.gray('YES') : ''])
}

function logTable (data) {
  let table = new Table({
    head: ['Address', 'Reward Share', 'Reward to Pay', 'Ignored']
  })

  const max = Object.keys(data).reduce((prev, tz) => {
    const v = data[tz]
    prev += v.ignored ? 0 : v.rewardShare / 1000000
    return prev
  }, 0)
  const intLen = String(Math.ceil(max).toLocaleString('en-US')).length

  const sum = Object.keys(data).reduce((prev, tz) => {
    const v = data[tz]
    if (!v.ignored) {
      prev.rewardShare += v.rewardShare
      prev.rewardToPay += v.rewardToPay
    }
    push(tz, table, v, intLen)
    return prev
  }, { rewardShare: 0, rewardToPay: 0 })

  // SUM row
  table.push([
    chalk.green(chalk.bold('SUM')),
    fmtMicro(sum.rewardShare, intLen),
    chalk.green(fmtMicro(sum.rewardToPay, intLen)), ''])

  console.log(table.toString())
  console.log(chalk.cyan('Note: SUM does not included IGNORED addresses.'))

  return sum
}

module.exports = { logTable }

/**
 * Simple utility to fetch delegators and pay rewards.
 */

const chalk = require('chalk')

const config = require('./src/config')
const { bakerApiX } = require('./src/api')
const { askCycle, askPwd } = require('./src/ask')
const { rpc } = require('./src/rpc')
const { fmtMicro, writeText } = require('./src/utils')
const { logTable } = require('./src/table')
const keyutils = require('./src/keyutils')
const { transfer } = require('./src/transfer')

async function work () {
  console.log('TEZOS AUTO BOT - ' + chalk.magenta('TZSCAN API') + ' MODE')
  console.log(chalk.magenta('Press Ctrl-C anytime you want to quit.'))

  console.log(config)

  const ignoreList = config.ignoredList

  let result
  console.log('Fetching cycles...')
  result = await bakerApiX('rewards_split_cycles', { number: 50 })
  const latestCycle = result[0].cycle
  const latestDeliveredCycle = +(result.find(c => c.status.status === 'rewards_delivered').cycle)
  console.log('Latest cycle: ' + chalk.green(latestCycle))
  console.log('Latest cycle with status rewards_delivered: ', chalk.green(latestDeliveredCycle))

  let [ cycle, payed ] = askCycle(0, latestCycle, latestDeliveredCycle)

  result = await bakerApiX('rewards_split', { cycle })

  if (result.delegators_nb !== result.delegators_balance.length) {
    console.error(chalk.red(`There are ${result.delegators_nb} delegators but only ${result.delegators_balance.length} delegator balance. This tool could not find out why, please check manually.`))
    return
  }

  const stakingBalance = +result.delegate_staking_balance
  const sumReward = (+result.blocks_rewards) + (+result.endorsements_rewards) // + (+result.future_blocks_rewards) +
  // (+result.future_endorsements_rewards) + (+result.revelation_rewards) + (+result.lost_revelation_rewards)
  const sumLosses = (+result.gain_from_denounciation) + (+result.lost_deposit_from_denounciation) +
        (+result.lost_rewards_denounciation) + (+result.lost_fees_denounciation)
  const sumFees = (+result.fees) // + (+result.lost_revelation_fees)
  const actualReward = sumReward + sumFees

  if (sumLosses > 0) {
    console.log(chalk.red(`You lost ${fmtMicro(sumLosses)} in this cycle!`))
  }

  const dbalances = result.delegators_balance.reduce((prev, d) => {
    const b = +d.balance
    const rewardShare = actualReward * b / stakingBalance
    const rewardToPay = (1 - config.commisionFee) * rewardShare
    prev[d.account.tz] = {
      // balance: b,
      // share: b * 100 / stakingBalance,
      rewardShare,
      rewardToPay,
      ignored: ignoreList.includes(d.account.tz)
    }
    return prev
  }, {})

  const sum = logTable(dbalances)

  if (sum.rewardToPay <= config.transferMin) {
    console.log(chalk.green('No need to pay anyone.'))
    return
  }

  const balance = +(await rpc.getBalance(config.paymentAddress))
  const enough = balance >= sum.rewardToPay
  const enoughText = enough ? chalk.bold(chalk.green('ENOUGH')) : chalk.bold(chalk.red('NOT ENOUGH'))
  console.log(`Payment account balance: ${chalk.green(fmtMicro(balance))} (${enoughText})`)

  if (!enough) {
    const lack = fmtMicro(Math.ceil(balance - sum.rewardToPay))
    console.log(`Please transfer at least ${lack} to payment account and try again.`)
    return
  }

  console.log(`Cycle: ${chalk.green(cycle)} - Status: ${payed ? chalk.red('PAYED') : 'not yet payed'}`)

  const pwd = askPwd()
  let pkey
  try {
    pkey = keyutils.getKey(pwd)
  } catch (error) {
    console.log('Invalid password for key not found. You may need to run "node key" to save a key first.')
    return
  }

  const keys = await keyutils.extractKeys(pkey)
  if ((keys.pkh !== config.paymentAddress)) {
    console.log(`Incorrect password or key does not map payment address ${config.paymentAddress}`)
    console.log('Program now exits. You might try to run again.')
    return
  }

  await transfer(dbalances, keys, cycle)
}

function main () {
  try {
    work()
  } catch (err) {
    console.error(String(err))
    console.error('If you think this is unexpected, please send "error.log" file to the developer.')
    writeText('error.log', err.stack || err)
  }
}

main()

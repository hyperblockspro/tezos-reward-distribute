/**
 * This bot checks last success payment and pay the remainning
 */

const { bakerApiX } = require('./src/api')
const { rpc } = require('./src/rpc')
const { lastTransfered } = require('./src/transfer')
const { fmtMicroAnsi: fmtMicro } = require('./src/utils')
const config = require('./src/config')
const cron = require('node-cron')
const notify = require('./src/notify')
const { fmtCycleList } = require('./src/utils')
const { decode } = require('./src/text')
const keyutils = require('./src/keyutils')
const { transfer } = require('./src/transfer')

async function check () {
  const last = lastTransfered()
  let result = await bakerApiX('rewards_split_cycles', { number: 50 })
  const current = +(result.find(c => c.status.status === 'rewards_delivered').cycle)
  const willPay = []

  if (last < current) {
    for (let i = last + 1; i <= current; i++) {
      willPay.push(i)
    }
  }

  return {
    last,
    current,
    willPay
  }
}

async function calculatePay (cycle) {
  const ignoreList = config.ignoredList

  let result = await bakerApiX('rewards_split', { cycle })

  const stakingBalance = +result.delegate_staking_balance
  const sumReward = (+result.blocks_rewards) + (+result.endorsements_rewards)
  const sumFees = (+result.fees)
  const actualReward = sumReward + sumFees

  const dbalances = result.delegators_balance.reduce((prev, d) => {
    const b = +d.balance
    const rewardShare = actualReward * b / stakingBalance
    const rewardToPay = (1 - config.commisionFee) * rewardShare
    prev[d.account.tz] = {
      rewardShare,
      rewardToPay,
      ignored: ignoreList.includes(d.account.tz)
    }
    return prev
  }, {})

  const sum = Object.keys(dbalances).reduce((prev, tz) => {
    const v = dbalances[tz]
    if (!v.ignored) {
      prev.rewardShare += v.rewardShare
      prev.rewardToPay += v.rewardToPay
    }
    return prev
  }, { rewardShare: 0, rewardToPay: 0 })

  return [sum.rewardToPay, dbalances]
}

async function performPay () {
  const payed = await check()
  if (payed.last === 0) {
    notify('There is no success log file. Please check the server.')
  } else if (payed.willPay.length) {
    const cycle = payed.willPay[0]
    const [toPay, dbalances] = await calculatePay(cycle)
    if (toPay <= config.transferMin) {
      notify('No need to pay anyone.')
      return
    }

    const toPayText = fmtMicro(toPay)
    const balance = +(await rpc.getBalance(config.paymentAddress))
    const balanceText = fmtMicro(balance)

    if (toPay > balance) {
      const lack = fmtMicro(Math.ceil(toPay - balance))
      notify(`Not enough balance!\nPayment amount: ${toPayText}\nBalance: ${balanceText}\nLack: ${lack}`)
      return
    }

    const rawPwd = process.env.pass
    if (!rawPwd) {
      notify('Autopay need a password. Please contact admin.')
      return
    }
    const pwd = decode(rawPwd)
    let pkey
    try {
      pkey = keyutils.getKey(pwd)
    } catch (error) {
      console.error(error)
      notify('Invalid password for key not found. You may need to run "node key" to save a key first.')
      return
    }

    const keys = await keyutils.extractKeys(pkey)
    if ((keys.pkh !== config.paymentAddress)) {
      notify('Incorrect password or key does not map payment address')
      return
    }

    await transfer(dbalances, keys, cycle, notify)
  }
}

async function execute () {
  const payed = await check()
  if (payed.last === 0) {
    notify('There is no success log file. Please check the server.')
  } else if (payed.willPay.length) {
    let msg = `Not yet paid: ${fmtCycleList(payed.willPay)}\n`
    const promises = payed.willPay.reduce((prev, cycle) => {
      prev.push(calculatePay(cycle))
      return prev
    }, [])

    const sums = await Promise.all(promises)
    const total = sums.reduce((total, s) => total + s[0], 0)
    const totalS = fmtMicro(total)

    msg += `Amount to Pay: ${totalS}`

    const balance = +(await rpc.getBalance(config.paymentAddress))
    const enough = balance >= total
    const enoughText = enough ? 'ENOUGH' : 'NOT ENOUGH'
    msg += `\nPayment account balance: ${fmtMicro(balance)} (${enoughText})`

    if (!enough) {
      const lack = fmtMicro(Math.ceil(total - balance))
      msg += `\nNeed to transfer at least ${lack} to payment account.`
    }

    if (config.autopay && config.autopay.toLowerCase() === 'on') {
      const minutes = (config.payAfter || 1)
      const ms = minutes * 60 * 1000
      msg += `\nWill autopay for cycle ${payed.willPay[0]} after ${minutes} minute(s). To cancel, login server and execute: pm2 stop all`
      setTimeout(tryPay, ms)
    } else {
      msg += '\nAutopay disabled, please execute "node ." to pay manually.'
    }

    notify(msg)
  }
}

async function tryPay () {
  try {
    await performPay()
  } catch (err) {
    notify('Error while trying autopay: ' + String(err))
  }
}

async function tryExecute () {
  try {
    await execute()
  } catch (err) {
    console.error('Error while checking new cycles: ', err)
    notify('Error while checking new cycles: ' + String(err))
  }
}

function main () {
  const args = process.argv.slice(2)
  if (args && args.length && args[0] === 'now') {
    tryExecute()
  } else {
    cron.schedule(config.checkSchedule || '00 09,16 * * *', tryExecute, {
      scheduled: true,
      timezone: config.timezome || 'Asia/Bangkok'
    })
  }
}

main()

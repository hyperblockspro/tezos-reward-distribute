const chalk = require('chalk')
const path = require('path')
const fs = require('fs')

const fmtNum = n => {
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}
const fmtMicro = (n, intLen, ignored, tz = 'ꜩ') => {
  let s = (n / 1000000).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
    // minimumIntegerDigits: intLen
  })
  if (intLen) {
    const delta = intLen - s.split('.')[0].length
    s = delta > 0 ? s.padStart(s.length + delta) : s
  }
  s += ' ' + tz
  return ignored ? chalk.gray(s) : s
}

const fmtMicroAnsi = (n, intLen, ignored) => fmtMicro(n, intLen, ignored, 'tz')

const readText = fileName => {
  return fs.readFileSync(path.resolve(process.cwd(), fileName), { encoding: 'utf8' })
}

const writeText = (fileName, text) => {
  fs.writeFileSync(path.resolve(process.cwd(), fileName), text, { encoding: 'utf8' })
}

const fmtCycleList = list => {
  if (!list || !list.length) {
    return 'none'
  }

  if (list.length <= 2) {
    return list.join(', ')
  }

  return `${list[0]} ~ ${list[list.length - 1]}`
}

const safeStringify = (value, replacer, space) => {
  try {
    return JSON.stringify(value, replacer, space)
  } catch (err) {
    console.error(err)
    return String(value)
  }
}

module.exports = { fmtMicro, fmtMicroAnsi, fmtNum, readText, writeText, fmtCycleList, safeStringify }

import { ArgumentParser } from 'argparse'
import { BaseModel } from './models/BaseModel'
import { connect } from './connect'
import { UserModel } from './models/UserModel'
import { RuntimeOptions } from './types/RuntimeOptions'
import { FlowPlanModel } from './models/FlowPlanModel'
import { OutputItemModel } from './models/OutputItemModel'
import { Transaction, TransactionExtras, TransactionLine } from './types/API/Transaction'
import { AccountCode } from './types/AccountCode'
import { Timestring, error, sorted } from '@tasenor/common'
import colors from 'colors/safe'
import { sprintf } from 'sprintf-js'
import { Stock } from './lib/Stock'
import { Analyzer } from './lib/analyzer/Analyzer'
import { diff } from 'deep-object-diff'
import fs from 'fs'
import { BatchModel } from './models/BatchModel'
import Decimal from 'decimal.js'
import { dec } from './lib/utils'
import { Setup } from './types/API/Setup'

Decimal.set({ precision: 50 })

/**
 * Get the flow plan.
 */
async function flowPlan(args, options: RuntimeOptions): Promise<FlowPlanModel> {
  const user = await UserModel.find(args.user)
  if (!user) {
    throw new Error(`User '${args.user}' not found.`)
  }

  const plan = await user.findFlowPlan(args.flow) as FlowPlanModel
  if (!plan) {
    throw new Error(`Flow plan '${args.flow}' not found.`)
  }

  options.userId = user.id
  options.flowPlanId = plan.id

  return plan
}

/**
 * Get the batch.
 * @param args
 * @param options
 */
async function batch(args, options: RuntimeOptions): Promise<BatchModel> {
  const flow = await flowPlan(args, options)
  const batch = await BatchModel.getLatest(flow)
  if (!batch) {
    throw new Error(`Cannot find any batches for ${flow}.`)
  }
  return batch
}

/**
 * Run the plan step(s).
 * @param args
 */
async function executeRun(args) {
  const options: RuntimeOptions = {
    userId: 0,
    tracking: args.track || null,
    auth: args.auth || null,
    repeat: args.count === 'all' ? 'MAX' : parseInt(args.count)
  }

  const plan = await flowPlan(args, options)
  const res = await plan.run(options)
  // TODO: We could dig last run and show notes and status.
  if ('success' in res && !res.success) {
    error('Run not successful.')
  }
}

/**
 * Render transaction extras.
 */
function renderExtras(extras: TransactionExtras): string {
  let extrasText = ''
  if (Object.keys(extras).length) {
    if ('asset' in extras && 'assetChange' in extras && extras.assetChange) {
      extrasText = `${dec(extras.assetChange).gte(0) ? '+' : ''}${extras.assetChange} ${extras.asset}`
    } else {
      throw new Error(`Extras ${JSON.stringify(extras)} not yet supported.`)
    }
  }
  return extrasText
}

/**
 * Collect data for report.
 * @param args
 * @returns
 */
async function getData(args): Promise<[Stock, Transaction[]]> {
  const stock = new Stock({})

  const options: RuntimeOptions = {
    userId: 0,
    tracking: args.track || null,
    auth: args.auth || null,
  }
  const plan = await flowPlan(args, options)
  const outputItems = await OutputItemModel.findForFlowPlan(plan.id)
  const setup = plan.data.setup as Setup

  const analyzer = new Analyzer({ currency: 'EUR', language: 'en' }, stock, {}, setup, options)

  // Sort the transactions by their accounts.
  const txs: Transaction[] = OutputItemModel.transactions(outputItems)
  txs.forEach(tx => {
    analyzer.apply(tx)
  })

  return [stock, txs]
}

/**
 * Ledger report.
 * @param args
 */
async function executeLedger(args) {
  const [stock, txs] = await getData(args)

  // Sort the transactions by their accounts.
  const accounts: Record<AccountCode, [Timestring, TransactionLine][]> = {}
  txs.forEach(tx => {
    tx.lines.forEach(line => {
      accounts[line.account] = accounts[line.account] || []
      accounts[line.account].push([tx.time, line])
    })
  })

  // Initialize balances.
  const balance: Record<AccountCode, Decimal> = {}
  Object.keys(accounts).forEach(account => {
    balance[account] = new Decimal(0)
  })

  // Helper to print.
  const out = (...print): void => {
    if (args.json || args.test) {
      return
    }
    console.log(...print)
  }

  // Display report and collect it as JSON.
  out()
  const report: Record<string, string> = {}
  sorted(Object.keys(accounts)).forEach(account => {
    out(colors.blue(account))
    out(colors.blue(sprintf('%.2f', balance[account].mul(100).round().div(100)).padStart(88)))
    accounts[account].forEach(([time, line]) => {
      const { text, amount, extras } = line
      if (text === null) {
        throw new Error(`A transaction line ${JSON.stringify(line)} at ${time} has text as null (missing translations?).`)
      }
      const value = new Decimal(amount)
      balance[account] = balance[account].plus(value)
      const debit = value.gte(0) ? sprintf('%.2f', value.mul(100).round().div(100)) : ''
      const credit = !value.gte(0) ? sprintf('%.2f', value.mul(100).round().div(100)) : ''
      const total = sprintf('%.2f', balance[account].mul(100).round().div(100))
      if (args.time) {
        out('  ', colors.gray(time))
      }
      out(
        '  ',
        text.padEnd(40, ' ').substring(0, 40),
        colors.green(debit.padStart(14)),
        colors.red(credit.padStart(14)),
        colors.magenta(total.padStart(14)),
        ' ',
        colors.cyan(renderExtras(extras))
      )
    })
    out(colors.blue(sprintf('%.2f', balance[account].mul(100).round().div(100)).padStart(88)))
    report[account] = balance[account].toString()
    out()
  })

  if (args.stock) {
    out(colors.blue('STOCK SUMMARY'))
    out()
    const all = stock.getAll()
    sorted(Object.keys(all) as AccountCode[]).forEach(accountCode => {
      Object.keys(all[accountCode]).forEach(ticker => {
        const { amount, value } = all[accountCode][ticker]
        const avg = amount.eq(0) ? 0 : value.div(amount)

        out(
          '  ',
          colors.cyan(ticker.padEnd(6)),
          colors.magenta(sprintf('%.2f', avg).padEnd(8)),
          colors.yellow(`${amount}`)
        )
        report[`${accountCode}: ${ticker}`] = `${amount} x ${avg}`
      })
    })
    out()
  }

  if (args.json) {
    console.log(JSON.stringify(report, null, 2))
  }
  if (args.test) {
    const test = JSON.parse(fs.readFileSync(args.test).toString())
    const changes = Object.keys(diff(test, report))
    if (changes.length) {
      console.log(colors.red('Comparison failed:'))
      console.log(colors.red('                        Correct     Current'))
      changes.forEach(key => {
        console.log('  ', colors.red(key.padEnd(20)), test[key], report[key])
      })
      throw Error('Comparison failed.')
    } else {
      console.log()
      console.log(colors.green('+---------------------+'))
      console.log(colors.green('| Comparison matches! |'))
      console.log(colors.green('+---------------------+'))
      console.log()
    }
  }
}

/**
 * Journal report.
 * @param args
 */
async function executeJournal(args) {
  const [, txs] = await getData(args)

  // Helper to print.
  const out = (...print): void => {
    console.log(...print)
  }

  out()
  txs.forEach(tx => {
    out(colors.gray(tx.time))
    tx.lines.forEach(line => {
      const { account, text, amount, extras } = line
      const value = new Decimal(amount)
      const debit = value.gte(0) ? sprintf('%.2f', value.mul(100).round().div(100)) : ''
      const credit = !value.gte(0) ? sprintf('%.2f', value.mul(100).round().div(100)) : ''
      const ext = args.stock ? renderExtras(extras) : ''
      out('  ',
        colors.blue(account).padEnd(32).substring(0, 32),
        text.padEnd(40).substring(0, 40),
        colors.green(debit.padStart(14)),
        colors.red(credit.padStart(14)),
        colors.cyan(ext.padStart(14))
      )
    })
    out()
  })
}

/**
 * File upload.
 * @param args
 */
async function executeUpload(args) {
  const file = fs.readFileSync(args.path)
  const options: RuntimeOptions = {
    userId: 0,
    tracking: args.track || null,
    auth: args.auth || null,
  }
  const last = await batch(args, options)
  await last.setData(file)
  await last.detectEncoding()

  console.log(`Set data for ${last}.`)
}

export async function execute(...args: string[]): Promise<void> {
  const parser: ArgumentParser = new ArgumentParser({
    description: 'Tasenor Data Exchange command line tool'
  })

  parser.add_argument('--track', { help: 'Store all data fetched to the given directory for easy replication.', required: false })
  parser.add_argument('--auth', { help: 'Authorization code given by the 3rd party.', required: false })
  parser.add_argument('--db', { help: 'Database URL.', default: 'postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex' })
  parser.add_argument('--user', { help: 'Email of the TaDeX user.', default: 'test@localhost' })

  const subparser = parser.add_subparsers()

  // Run command.
  const run = subparser.add_parser('run', { description: 'Execute one or more steps on flow plan.' })
  run.add_argument('flow', { help: 'Name of the flow.' })
  run.add_argument('count', { help: 'Number of iteration or "all".', nargs: '?', default: '1' })
  run.set_defaults({ func: executeRun })

  // Ledger command.
  const ledger = subparser.add_parser('ledger', { description: 'Display ledger report for a specific flow plan.' })
  ledger.add_argument('flow', { help: 'Name of the flow.' })
  ledger.add_argument('--time', { help: 'Show also timestamps.', required: false, action: 'store_true' })
  ledger.add_argument('--stock', { help: 'Show stock summary in the end.', required: false, action: 'store_true' })
  ledger.add_argument('--json', { help: 'Instead of normal display, print meaningful data as JSON.', required: false, action: 'store_true' })
  ledger.add_argument('--test', { help: 'Calculate result and compare result against the given JSON file.', required: false })
  ledger.set_defaults({ func: executeLedger })

  // Journal command.
  const journal = subparser.add_parser('journal', { description: 'Display journal report for a specific flow plan.' })
  journal.add_argument('flow', { help: 'Name of the flow.' })
  journal.add_argument('--stock', { help: 'Show stock changes.', required: false, action: 'store_true' })
  journal.set_defaults({ func: executeJournal })

  // Upload command.
  const upload = subparser.add_parser('upload', { description: 'Upload a file to the batch waiting.' })
  upload.add_argument('flow', { help: 'Name of the flow.' })
  upload.add_argument('path', { help: 'A path to the file to upload.' })
  upload.set_defaults({ func: executeUpload })

  // Prepare and execute.
  const commandArgs = parser.parse_args(args)

  const db = await connect(commandArgs.db)
  BaseModel.setDb(db)

  if (!commandArgs.func) {
    console.log(colors.red('Command is required.'))
    return
  }

  await commandArgs.func(commandArgs)
}

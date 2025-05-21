import { ArgumentParser } from 'argparse'
import { BaseModel } from './models/BaseModel'
import { connect } from './connect'
import { UserModel } from './models/UserModel'
import { RuntimeOptions } from './types/RuntimeOptions'
import { FlowPlanModel } from './models/FlowPlanModel'
import { OutputItemModel } from './models/OutputItemModel'
import { Transaction, TransactionExtras, TransactionLine } from './types/API/Transaction'
import { AccountCode } from './types/AccountCode'
import { Timestring, error, log, note, sorted, warning } from '@tasenor/common'
import colors from 'colors/safe'
import { sprintf } from 'sprintf-js'
import { Stock } from './lib/Stock'
import { Analyzer } from './lib/analyzer/Analyzer'
import { diff } from 'deep-object-diff'
import fs from 'fs'
import { BatchModel } from './models/BatchModel'
import Decimal from 'decimal.js'
import { dec, parseCsv } from './lib/utils'
import { Setup } from './types/API/Setup'
import { initI18N } from './lib/i18n/t'
import { StockData } from './types/API/StockData'
import prisma from '@prisma/client'
import { JsonValue } from '@prisma/client/runtime/library'
import { ServiceModel } from './models/ServiceModel'
import { ServiceQuery } from './lib/services/Service'

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
 * List plans.
 * @param args
 */
async function executeLs(args) {
  const user = await UserModel.find(args.user)
  if (user) {
    const plans = await FlowPlanModel.findForUser(user.id)
    plans instanceof Array && plans.forEach(plan => {
      console.log(`#${plan.id} ${plan.name}`)
    })
  }
}

/**
 * Construct run-time options.
 * @param args
 */
function getOptions(args): RuntimeOptions {
  return {
    userId: 0,
    tracking: args.track || null,
    auth: args.auth || null,
    repeat: args.count === 'all' ? 'MAX' : parseInt(args.count),
  }
}

/**
 * Run the plan step(s).
 * @param args
 */
async function executeRun(args) {
  const options = getOptions(args)
  const plan = await flowPlan(args, options)
  const res = await plan.run(options)

  if ('success' in res && !res.success) {
    const run = await plan.lastRun()
    if (run?.data.result === 'WAITING') {
      warning('Batch is now waiting.')
    } else {
      error('Run not successful.')
      error(run?.data.error)
      return 1
    }
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
 * Fetch and instantiate flowplan.
 * @param args
 */
async function getFlowPlan(args): Promise<FlowPlanModel> {
  const options = getOptions(args)
  const plan = await flowPlan(args, options)
  return plan
}

async function getAnalyzer(args, setup: Setup = {}, stock = new Stock({})): Promise<Analyzer> {
  const options = getOptions(args)
  const analyzer = new Analyzer({ currency: 'EUR', language: 'en' }, stock, {}, setup, options)

  return analyzer
}

/**
 * Collect data for report.
 * @param args
 * @returns
 */
async function getData(args): Promise<[Stock, Transaction[]]> {

  const stock = new Stock({})
  const plan = await getFlowPlan(args)
  const outputItems = await OutputItemModel.findForFlowPlan(plan.id)
  const setup = plan.data.setup as Setup

  const analyzer = await getAnalyzer(args, setup, stock)

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
 * Configure plan.
 * @param args
 */
async function executeSetup(args) {
  const options: RuntimeOptions = {
    userId: 0,
    tracking: args.track || null,
    auth: args.auth || null,
  }
  const plan = await flowPlan(args, options)
  const setup = JSON.parse(args.json)
  note(`Update ${plan} setup: ${JSON.stringify(setup)}`)
  await plan.updateSetup(setup)
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

/**
 * Initialize flow plan assets.
 * @param args
 */
async function executeInitStock(args) {

  const options: RuntimeOptions = {
    userId: 0,
    tracking: args.track || null,
    auth: args.auth || null,
  }

  const flow = await flowPlan(args, options)
  const batch = await BatchModel.getLatest(flow)
  if (batch) {
    throw new Error(`Cannot initialize stock for ${flow} since there are already batches.`)
  }

  const content = fs.readFileSync(args.path).toString('utf-8')
  const data = await parseCsv(content)
  const acc = args.account as AccountCode
  const stock: Record<AccountCode, StockData> = { [acc]: {} }

  data.forEach(line => {
    const [ticker, amount, value] = line
    stock[acc][ticker] = { value: parseFloat(value), amount: parseFloat(amount) }
    log(`Initializing ${acc} ${ticker} to ${amount} with value ${value}`)
  })

  await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(flow, { stock: stock as JsonValue })
}

/**
 * Initialize account balances.
 * @param args
 */
async function executeInitBalance(args) {
  const options: RuntimeOptions = {
    userId: 0,
    tracking: args.track || null,
    auth: args.auth || null,
  }

  const flow = await flowPlan(args, options)
  const batch = await BatchModel.getLatest(flow)
  if (batch) {
    throw new Error(`Cannot initialize stock for ${flow} since there are already batches.`)
  }

  const content = fs.readFileSync(args.path).toString('utf-8')
  const data = await parseCsv(content)
  const total: Record<AccountCode, number> = {}

  data.forEach(line => {
    const [account, balance] = line
    total[account] = parseFloat(balance)
    log(`Initializing ${account} to balance ${total[account]}`)
  })

  await FlowPlanModel.update<prisma.FlowPlan, FlowPlanModel>(flow, { balance: total as JsonValue })
}

/**
 * List or query services.
 * @param args
 */
async function executeService(args) {

  const services = await ServiceModel.findAllFree()

  if (!args.type) {

    console.log(sprintf('%-20s %-15s %4s  %s', 'Name', 'Type', 'Free', 'Settings'))
    const types = new Set<string>()
    services.forEach((service) => {
      console.log(sprintf('%-20s %-15s %4s  %s', service.data.name, service.data.type, service.data.free ? 'FREE' : 'COMM', JSON.stringify(service.data.settings)))
      types.add(service.data.type)
    })
    console.log()
    for (const type of types) {
      switch (type) {
        case 'CURRENCY_RATES':
          console.log('Arguments for CURRENCY_RATES: time="2024-01-01" currency="EUR" valueCurrency="USD"')
          console.log()
          break
        default:
          throw new Error(`Arguments for type ${type} not yet specified.`)
      }
    }

  } else {

    const query = {
      query: args.type,
    }
    args.args.forEach(arg => {
      const match = /^(.+?)=(.*)/.exec(arg)
      if (!match) {
        throw new Error(`Invalid argument ${JSON.stringify(arg)}`)
      }
      query[match[1]] = match[2]
    })

    console.log(`Running query ${JSON.stringify(query)}`)
    const analyzer = await getAnalyzer(args)
    analyzer.setServices(services.map(s => s.getService()))
    const res = await analyzer.askService(query as ServiceQuery)
    console.log()
    console.log('=>')
    console.log()
    console.log(res)
  }
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

  // Ls command.
  const ls = subparser.add_parser('ls', { description: 'List flow plans.' })
  ls.set_defaults({ func: executeLs })

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

  // Setup command.
  const setup = subparser.add_parser('setup', { description: 'Change the plan setup.' })
  setup.add_argument('flow', { help: 'Name of the flow.' })
  setup.add_argument('json', { help: 'Update to the setup in JSON format.' })
  setup.set_defaults({ func: executeSetup })

  // Upload command.
  const upload = subparser.add_parser('upload', { description: 'Upload a file to the batch waiting.' })
  upload.add_argument('flow', { help: 'Name of the flow.' })
  upload.add_argument('path', { help: 'A path to the file to upload.' })
  upload.set_defaults({ func: executeUpload })

  // Initialize assets command.
  const initStock = subparser.add_parser('init-stock', { description: 'Initialize assets with CSV file (columns: ticker, count, price).' })
  initStock.add_argument('flow', { help: 'Name of the flow.' })
  initStock.add_argument('account', { help: 'Symbolic name of the account.' })
  initStock.add_argument('path', { help: 'A path to the file to upload.' })
  initStock.set_defaults({ func: executeInitStock })

  // Initialize balance command.
  const initBalance = subparser.add_parser('init-balance', { description: 'Initialize account balances with CSV file (columns: name, balance).' })
  initBalance.add_argument('flow', { help: 'Name of the flow.' })
  initBalance.add_argument('path', { help: 'A path to the file to upload.' })
  initBalance.set_defaults({ func: executeInitBalance })

  // Service command.
  const service = subparser.add_parser('service', { description: 'Run service queries.' })
  service.add_argument('type', { nargs: '?', help: 'Type of the service to call if any.' })
  service.add_argument('args', { nargs: '*', help: 'Arguments as a space separated key=value pairs.' })
  service.set_defaults({ func: executeService })

  // Prepare and execute.
  const commandArgs = parser.parse_args(args.length ? args : ['-h'])

  const db = await connect(commandArgs.db)
  BaseModel.setDb(db)
  await initI18N()

  if (!commandArgs.func) {
    console.log(colors.red('Command is required.'))
    return
  }

  return await commandArgs.func(commandArgs)
}

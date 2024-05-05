import { ArgumentParser } from 'argparse'
import { BaseModel } from './models/BaseModel'
import { connect } from './connect'
import { UserModel } from './models/UserModel'
import { RuntimeOptions } from './types/RuntimeOptions'
import { FlowPlanModel } from './models/FlowPlanModel'
import { OutputItemModel } from './models/OutputItemModel'
import { TransactionLine } from './types/API/Transaction'
import { AccountCode } from './types/AccountCode'
import { Timestring } from '@tasenor/common'
import colors from 'colors/safe'
import Decimal from 'decimal.js'
import { sprintf } from 'sprintf-js'
import { Stock } from './lib/Stock'
import { Analyzer } from './lib/analyzer/Analyzer'

/**
 * Get the flow plan.
 */
async function flowPlan(args, options: RuntimeOptions): Promise<FlowPlanModel> {
  const user = await UserModel.find(args.user)
  if (!user) {
    throw new Error(`User '${args.user}' not found.`)
  }

  const plan = await user.findFlowPlan(args.flow)
  if (!plan) {
    throw new Error(`Flow plan '${args.flow}' not found.`)
  }

  options.userId = user.id

  return plan
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
  await plan.run(options)
}

/**
 * Display output.
 * @param args
 */
async function executeOutput(args) {
  const stock = new Stock({})
  const analyzer = new Analyzer(stock)

  const options: RuntimeOptions = {
    userId: 0,
    tracking: args.track || null,
    auth: args.auth || null,
  }
  const plan = await flowPlan(args, options)
  const outputItems = await OutputItemModel.findForFlowPlan(plan.id)

  // Sort the transactions by their accounts.
  const accounts: Record<AccountCode, [Timestring, TransactionLine][]> = {}
  OutputItemModel.transactions(outputItems).forEach(tx => {
    analyzer.apply(tx)
    tx.lines.forEach(line => {
      const account = args.details ? line.account : line.account.replace(/^(FEE|STOCK|LOSS|PROFIT)_.*/, '$1')
      accounts[account] = accounts[account] || []
      accounts[account].push([tx.time, line])
    })
  })

  // Initialize balances.
  const balance: Record<AccountCode, Decimal> = {}
  Object.keys(accounts).forEach(account => {
    balance[account] = new Decimal(0)
  })

  // Display report.
  console.log()
  Object.keys(accounts).forEach(account => {
    console.log(colors.blue(account))
    console.log(colors.blue(sprintf('%.2f', balance[account].mul(100).round().div(100)).padStart(88)))
    accounts[account].forEach(([time, line]) => {
      const { text, amount, extras } = line
      const value = new Decimal(amount)
      balance[account] = balance[account].plus(value)
      const debit = value.gte(0) ? sprintf('%.2f', value.mul(100).round().div(100)) : ''
      const credit = !value.gte(0) ? sprintf('%.2f', value.mul(100).round().div(100)) : ''
      const total = sprintf('%.2f', balance[account].mul(100).round().div(100))
      let extrasText = ''
      if (Object.keys(extras).length) {
        if ('asset' in extras && 'assetChange' in extras) {
          extrasText = `${extras.assetChange > 0 ? '+' : ''}${extras.assetChange} ${extras.asset}`
        } else {
          throw new Error(`Extras ${JSON.stringify(extras)} not yet supported.`)
        }
      }
      if (args.time) {
        console.log('  ', colors.gray(time))
      }
      console.log(
        '  ',
        text.padEnd(40, ' ').substring(0, 40),
        colors.green(debit.padStart(14)),
        colors.red(credit.padStart(14)),
        colors.magenta(total.padStart(14)),
        ' ',
        colors.cyan(extrasText)
      )
    })
    console.log(colors.blue(sprintf('%.2f', balance[account].mul(100).round().div(100)).padStart(88)))

    console.log()
  })

  if (args.stock) {
    console.log(colors.blue('STOCK SUMMARY'))
    Object.values(stock.toJSON() as Record<string, Array<object>>).forEach(account => {
      Object.keys(account).forEach(ticker => {
        const amount = account[ticker].amount
        const value = account[ticker].value
        const avg = amount ? value / amount : 0
        console.log(
          '  ',
          colors.cyan(ticker.padEnd(6)),
          colors.magenta(sprintf('%.2f', avg).padEnd(8)),
          colors.yellow(`${amount}`)
        )
      })
    })
    console.log()
  }
}

export async function execute(...args: string[]): Promise<void> {
  const parser: ArgumentParser = new ArgumentParser({
    description: 'Tasenor Data Exchange command line tool'
  })

  parser.add_argument('--track', { help: 'Store all data fetched to the given directory for easy replication.', required: false })
  parser.add_argument('--auth', { help: 'Authorization code given by the 3rd party.', required: false })
  parser.add_argument('--db', { help: 'Database URL.', default: 'postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex' })
  parser.add_argument('--user', { help: 'Email of the TaDeX user.' })

  const subparser = parser.add_subparsers()

  const run = subparser.add_parser('run', { description: 'Execute one or more steps on flow plan.' })
  run.add_argument('flow', { help: 'Name of the flow' })
  run.add_argument('count', { help: 'Number of iteration or "all".', nargs: '?', default: '1' })
  run.set_defaults({ func: executeRun })

  const output = subparser.add_parser('output', { description: 'Display output for a specific flow plan.' })
  output.add_argument('flow', { help: 'Name of the flow' })
  output.add_argument('--time', { help: 'Show also timestamps.', required: false, action: 'store_true' })
  output.add_argument('--stock', { help: 'Show stock summary in the end.', required: false, action: 'store_true' })
  output.add_argument('--details', { help: 'Show each stock, expense etc in their own account.', required: false, action: 'store_true' })
  output.set_defaults({ func: executeOutput })

  const commandArgs = parser.parse_args(args)

  const db = await connect(commandArgs.db)
  BaseModel.setDb(db)

  await commandArgs.func(commandArgs)
}

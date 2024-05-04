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
    tx.lines.forEach(line => {
      // TODO: Combine accounts like LOSS_ASSET
      accounts[line.account] = accounts[line.account] || []
      accounts[line.account].push([tx.time, line])
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
    console.log(colors.green(account))
    console.log('  ', balance[account])
    accounts[account].forEach(([time, line]) => {
      const { text, amount, extras } = line
      const value = new Decimal(amount)
      balance[account] = balance[account].plus(value)
      // TODO: Debit, credit, balance
      // TODO: Rounding of display values.
      console.log('  ', value, text)
      if (Object.keys(extras).length) {
        console.log('  ', extras)
      }
    })
    console.log('  ', balance[account])
    // TODO: Totals and stock.
    console.log()
  })
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
  output.set_defaults({ func: executeOutput })

  const commandArgs = parser.parse_args(args)

  const db = await connect(commandArgs.db)
  BaseModel.setDb(db)

  await commandArgs.func(commandArgs)
}

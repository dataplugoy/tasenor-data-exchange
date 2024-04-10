import { ArgumentParser } from 'argparse'
import { BaseModel } from '../models/BaseModel'
import { connect } from '../connect'
import { UserModel } from '../models/UserModel'
import { RuntimeOptions } from '../types/RuntimeOptions'

/**
 * Execute one step of the named flow.
 * @param name Title of the flow to execute.
 */
async function run(email: string, name: string, options: RuntimeOptions) {
  const user = await UserModel.find(email)
  if (!user) {
    throw new Error(`User '${email}' not found.`)
  }

  const plan = await user.findFlowPlan(name)
  if (!plan) {
    throw new Error(`Flow plan '${name}' not found.`)
  }

  await plan.run(options)
}

/**
 * Main entry point to the CLI.
 * @param args Command arguments.
 */
export async function execute(...args: string[]): Promise<void> {
  const commands = {
    run
  }
  const parser: ArgumentParser = new ArgumentParser({
    description: 'Tasenor Data Exchange command line tool'
  })

  parser.add_argument('--track', { help: 'Store all data fetched to the given directory for easy replication.', required: false })
  parser.add_argument('--auth', { help: 'Authorization code given by the 3rd party.', required: false })
  parser.add_argument('--db', { help: 'Database URL.', default: 'postgres://dev:02u3QD2e3wxssfdr3sxds@localhost:7300/tadex' })
  parser.add_argument('--user', { help: 'Email of the TaDeX user.' })
  parser.add_argument('command', { help: 'Command to execute', choices: Object.keys(commands) })
  parser.add_argument('name', { help: 'Name of the flow' })

  const commandArgs = parser.parse_args(args)

  const db = await connect(commandArgs.db)
  BaseModel.setDb(db)

  const options: RuntimeOptions = {
    tracking: commandArgs.track || null,
    auth: commandArgs.auth || null,
  }

  await commands[commandArgs.command](commandArgs.user || '', commandArgs.name || '', options)
}

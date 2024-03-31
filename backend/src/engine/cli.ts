import { ArgumentParser } from 'argparse'

/**
 * Execute one step of the named flow.
 * @param name Title of the flow to execute.
 */
function run(name: string) {

}

/**
 * Main entry point to the CLI.
 * @param args Command arguments.
 */
export function execute(...args: string[]) {
  const commands = {
    run
  }
  const parser: ArgumentParser = new ArgumentParser({
    description: 'Tasenor Data Exchange command line tool'
  })

  parser.add_argument('command', { help: 'Command to execute', choices: Object.keys(commands) })
  parser.add_argument('name', { help: 'Name of the flow' })


  const commandArgs = parser.parse_args(args)
  commands[commandArgs.command](commandArgs.name)
}

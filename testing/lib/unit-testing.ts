import { BaseModel } from '../../backend/src/models/BaseModel'
import { connect } from '../../backend/src/connect'
import { cwd } from 'process'
import path from 'path'

/**
 * Set up the dtabase for testing with DB models.
 */
export async function beforeModelTesting(): Promise<void> {

  const { spawnSync } = require( 'child_process' )
  const databaseDir = path.join(cwd(), '..', 'database')
  const run = spawnSync('pnpm', [ '-C', databaseDir, 'load' ])
  if (run.stderr.toString().trim() !== '') {
    throw new Error(`Database initialization failed: ${run.stderr.toString().trim()}`)
  }

  BaseModel.setDb(await connect())
}

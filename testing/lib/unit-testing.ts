import fs from 'fs'
import { BaseModel } from '../../backend/src/models/BaseModel'
import { connect } from '../../backend/src/connect'
import { cwd } from 'process'
import path from 'path'
import { BatchModel } from '../../backend/src/models/BatchModel'

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

/**
 * Construct a batch model from test data.
 * @param filePath
 */
export function createBatchFrom(filePath: string): BatchModel {
  const data = fs.readFileSync(path.join(__dirname, '..', 'unit', 'data', filePath))
  return new BatchModel({
    id: 0,
    created: new Date(),
    updated: new Date(),
    completed: null,
    number: 1,
    state: 'DATA_FETCHED',
    data,
    lastStamp: null,
    initialStock: {},
    endStock: {},
    flowPlanId: 0
  })
}
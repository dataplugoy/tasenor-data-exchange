#!/usr/bin/env -S npx tsx
import cli from '../backend/src/cli'

await cli.execute(...process.argv.slice(2))

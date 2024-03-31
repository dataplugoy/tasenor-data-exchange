#!/usr/bin/env -S npx tsx
import cli from '../backend/src/engine/cli'
cli.execute(...process.argv.slice(2))

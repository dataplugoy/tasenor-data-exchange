#!/usr/bin/env -S npx tsx
/**
 * Utility to copy package.json version field to another file.
 */
import fs from 'fs'

function copy(path1, path2) {
  const pck1 = JSON.parse(fs.readFileSync(path1).toString('utf-8'))
  if (!pck1.version) {
    throw new Error(`A file ${path1} does not define 'version'.`)
  }
  const pck2 = JSON.parse(fs.readFileSync(path2).toString('utf-8'))
  delete pck2.version
  fs.writeFileSync(path2, JSON.stringify({version: pck1.version, ...pck2}, null, 2) + '\n')
  console.log(`Copied version ${pck1.version} to ${path2}.`)
}

if (process.argv.length < 4) {
  console.log(`Usage: <src-path-to-package.json> <dst-path-to-package.json>`)
  process.exit(1)
}

copy(process.argv[2], process.argv[3])

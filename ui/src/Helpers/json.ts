/**
 * Format data as indented JSON, breaking string values after each `\n` escape.
 *
 * The `\n` is kept at the end of the line and continuation lines are aligned with the start of the string.
 */
export function jsonLines(data: unknown): string {
  return JSON.stringify(data, null, 2).split('\n').map(line => {
    const parts = line.split(/(?<=(?:^|[^\\])(?:\\\\)*\\n)(?!"?,?$)/)
    if (parts.length === 1) {
      return line
    }
    const start = line.match(/^\s*(?:"(?:[^"\\]|\\.)*": )?"/)
    const indent = ' '.repeat(start ? start[0].length : 0)
    return parts.join(`\n${indent}`)
  }).join('\n')
}

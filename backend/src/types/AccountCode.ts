import Opaque from 'ts-opaque'

/**
 * An abstract account code to be used before delivering to the actually configured destination.
 */
export type AccountCode = Opaque<string, 'AccountCode'>

/**
 * Check if the code is a direct account number given by a rule, which needs no configuration.
 */
export function isAccountNumber(code: string): boolean {
  return /^\d+$/.test(code)
}

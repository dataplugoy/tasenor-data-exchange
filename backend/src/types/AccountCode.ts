import Opaque from 'ts-opaque'

/**
 * An abstract account code to be used before delivering to the actually configured destination.
 */
export type AccountCode = Opaque<string, 'AccountCode'>

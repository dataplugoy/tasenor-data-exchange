import Opaque from 'ts-opaque'

/**
 * An abstract account code to be used before delivering to the actually configured destination.
 *
 * ASSET_<ticker>
 * CURRENCY_<currency>
 * PROFIT_<ticker>
 * LOSS_<ticker>
 */
export type AccountCode = Opaque<string, 'AccountCode'>

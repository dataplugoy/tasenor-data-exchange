import { beforeAll, describe, expect, it, test } from 'vitest'
import { Analyzer } from '../../backend/src/lib/analyzer/Analyzer'
import { InputType } from '../../backend/src/types/UnifiedInput'
import { Asset, Timestring } from '@tasenor/common'

describe('Analyzer', () => {
  it('buy', async () => {

    const stock = {'ETH': {'value': '5000', 'amount': '5.5'}}
    const item = {'type': 'buy' as InputType, 'value': 15000, 'assetIn': 'ETH' as Asset, 'assetAmountIn': 5}

    const analyzer = Analyzer.run('2000-01-01T00:00:00Z' as Timestring, stock, item)
  })
})

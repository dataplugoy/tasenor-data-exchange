import { ServiceType } from '@prisma/client'
import { Service } from './Service'

export class TasenorService extends Service {

  getCababilities(): ServiceType[] {
    return ['CURRENCY_RATES', 'CRYPTO_RATES']
  }
}

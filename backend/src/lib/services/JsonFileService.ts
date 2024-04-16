import { ServiceType } from '@prisma/client'
import { Service } from './Service'

export class JsonFileService extends Service {

  getCababilities(): ServiceType[] {
    return ['CURRENCY_RATES', 'CRYPTO_RATES']
  }
}

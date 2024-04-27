import { AlertException } from '../exceptions/AlertException'
import { BaseModel } from './BaseModel'
import prisma, { AlertMethod } from '@prisma/client'

export class AlertModel extends BaseModel<prisma.Alert> {

  static table = 'alert'
  static construct = AlertModel

  static async interactive(err: AlertException): Promise<AlertModel> {
    const data = {
      userId: err.userId,
      type: err.type,
      method: 'INTERACTIVE' as AlertMethod,
      url: err.url,
      payload: err.payload,
      delivered: new Date()
    }
    return AlertModel.create<prisma.Alert, AlertModel>(data)
  }
}

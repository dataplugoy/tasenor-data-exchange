import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'

export class InputItemModel extends BaseModel<prisma.InputItem> {

  static table = 'inputItem'
  static construct = InputItemModel

  static async save(data: Partial<prisma.InputItem>): Promise<InputItemModel> {
    return InputItemModel.create<prisma.InputItem, InputItemModel>(data)
  }

}

import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'

export class UserModel extends BaseModel<prisma.User> {

  static table: string = 'user'

  /**
   * Find a user.
   * @param email
   * @returns An user instance if found or `null` otherwie.
   */
  static async find(email: string): Promise<UserModel | null> {
    const data = await this.db.findUnique({ where: { email } })
    return data ? new UserModel(data) : null
  }
}

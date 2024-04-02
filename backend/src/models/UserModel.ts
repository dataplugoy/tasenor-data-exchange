import { BaseModel } from './BaseModel'
import prisma from '@prisma/client'

export class UserModel extends BaseModel<prisma.User> {

  static table: string = 'user'
  static construct = UserModel

  /**
   * Find a user.
   * @param email
   * @returns An user instance if found or `null` otherwie.
   */
  static async find(email: string): Promise<UserModel | null> {
    return this.findUnique<prisma.User, UserModel>({ email })
  }
}

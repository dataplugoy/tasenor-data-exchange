import { PrismaClient } from '@prisma/client'
import { Constructor, error } from '@tasenor/common'

export interface MinimalModel {
  id: number
}

/**
 * Base class for all data models used.
 */
export class BaseModel<T extends MinimalModel> {

  /// Name of the table.
  protected static table: string
  /// Constructor function for the model.
  protected static construct: Constructor<any>
  /// A reference to the Prisma client shared by models.
  protected static prismaClient: PrismaClient

  /// A data loaded for this database row if any.
  public data: T

  constructor(data: T) {
    this.data = data
  }

  /**
   * Get the numeric ID of the model instance.
   */
  get id(): number {
    return this.data.id
  }

  /**
   * Get the name of this type.
   */
  get typeName(): string {
    return this.constructor.name.replace(/Model$/, '')
  }

  /**
   * Get the model specific (mostly) unique name for the model instance.
   */
  get name(): string {
    throw new Error(`A model ${this.typeName} does not implement name().`)
  }

  /**
   * Construct an informative string presentation mainly for logging purposes.
   * @returns
   */
  toString(): string {
    return `${this.typeName} #${this.id}`
  }

  /**
   * Get the Prisma client.
   */
  get client(): PrismaClient {
    return BaseModel.prismaClient
  }

  /**
   * Set the shared Prisma client reference.
   * @param db
   */
  static setDb(db: PrismaClient) {
    BaseModel.prismaClient = db
  }

  /**
   * Instantiate a model with the given initial data from Prisma model.
   * @param data
   * @returns
   */
  static instantiate<T extends MinimalModel, C extends BaseModel<T>>(data: T): C {
    const Ctor = this.construct as Constructor<C>
    if (!Ctor) error('Unable to instantiate bare BaseModel without constructor.')
    return new Ctor(data)
  }

  /**
   * Get the Prisma model for this data model.
   */
  static get db() {
    if (!BaseModel.prismaClient) {
      throw new Error('Cannot use BaseModel.db before it is initialized with BaseModel.setDb().')
    }
    if (!BaseModel.prismaClient[this.table]) {
      throw new Error(`Cannot find table '${this.table}' (it must be one of the ${Object.keys(this.prismaClient).filter(k => k.substring(0, 1) !== '_')}).`)
    }
    return BaseModel.prismaClient[this.table]
  }

  /**
   * Create new instance of the model.
   * @param data Initial values.
   * @returns New instance.
   */
  static async create<T extends MinimalModel, C extends BaseModel<T>>(data: Partial<T>): Promise<C> {
    const item = await this.db.create({ data })
    return this.instantiate<T, C>(item)
  }

  /**
   * Update some fields of the model in DB.
   * @param data Fields to update.
   */
  static async update<T extends MinimalModel, C extends BaseModel<T>>(item: C, data: Partial<T>) {
    await this.db.update({ data, where: { id: item.id } })
    Object.assign(item.data, data)
  }

  /**
   * Find a model if it exist according to given fields and create it if not found.
   * @param where Fields to search for.
   * @param data Additional data to use if not found.
   * @returns
   */
  static async findOrCreate<T extends MinimalModel, C extends BaseModel<T>>(where: Partial<T>, data: Partial<T> = {}): Promise<C> {
    let item = await this.db.findUnique({ where })
    if (!item) {
      item = await this.db.create({ data: { ...where, ...data } })
    }
    return this.instantiate<T, C>(item)
  }

  /**
   * Find an unique instance from database.
   * @param condition Fields to search.
   * @returns An entry instance or `null` if not found.
   */
  static async findUnique<T extends MinimalModel, C extends BaseModel<T>>(condition: Partial<T>): Promise<C | null> {
    const item = await this.db.findUnique({ where: condition })
    if (!item) {
      return null
    }
    return this.instantiate<T, C>(item)
  }

  /**
   * Find an unique instance from database.
   * @param condition Fields to search.
   * @returns An entry instance or `null` if not found.
   */
  static async findMany<T extends MinimalModel, C extends BaseModel<T>>(condition: Partial<T>, order = [{ id: 'asc' }]): Promise<C[]> {
    const items = await this.db.findMany({ where: condition, orderBy: order })
    return items.map(item => this.instantiate<T, C>(item))
  }
}

/**
 * Delivered output cannot be removed from the output destination.
 */
export class RollbackException extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'RollbackException'
  }
}

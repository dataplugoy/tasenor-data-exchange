/**
 * Convert binary data received as JSON from the backend into a Buffer.
 *
 * Depending on the runtime, binary fields may be serialized as Node's Buffer JSON
 * `{ type: 'Buffer', data: [...] }`, as a plain array, as a Uint8Array JSON
 * `{ "0": 12, "1": 34, ... }`, as a string or be missing entirely.
 * @param data
 * @returns
 */
export function toBuffer(data: unknown): Buffer {
  if (data === null || data === undefined) {
    return Buffer.alloc(0)
  }
  if (typeof data === 'string' || data instanceof Array || data instanceof Uint8Array) {
    return Buffer.from(data as string)
  }
  if (typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (obj.data instanceof Array) {
      return Buffer.from(obj.data)
    }
    return Buffer.from(Object.values(obj) as number[])
  }
  return Buffer.alloc(0)
}

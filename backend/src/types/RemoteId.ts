import Opaque from 'ts-opaque'

export type RemoteId = Opaque<string | number | Record<string, unknown>, 'RemoteId'>

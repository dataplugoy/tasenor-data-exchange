export interface Config {
  PORT: number
  SITE_URL: string
  SECRET: string
}

const config: Config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 7302,
  // TODO: This will be redirect url for authentication.
  SITE_URL: 'https://bookkeeper.stg.tasenor.com/',
  // TODO: Development only. Ensure that not used in production.
  SECRET: 'd15799aef0bb277867d33b0c14a5b297e670dd6b2cf25a51f97927ae79146de9'
}

export default config

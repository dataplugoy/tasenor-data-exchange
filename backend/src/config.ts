export interface Config {
  PORT: number
  SITE_URL: string
}

const config: Config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 7302,
  // TODO: This will be redirect url for authentication.
  SITE_URL: 'https://bookkeeper.stg.tasenor.com/',
}

export default config

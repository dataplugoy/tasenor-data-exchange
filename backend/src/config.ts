export interface Config {
  PORT: number
}

const config: Config = {
  PORT: process.env.PORT ? parseInt(process.env.PORT) : 7302
}

export default config

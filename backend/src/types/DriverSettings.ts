export type TestMockDriverSettings = {
  url: string
}

export type NoActionDriverSettings = {
}

export type EnableBankingDriverSettings = {
  sessionInDays: number
  bankName: string
  country: string
  psuType: 'personal' | 'business'
  iban: string
}

export type ManualUploadDriverSettings = {
}

export type NordnetDriverSettings = {
}

export type SPankkiDriverSettings = {
}

export type TasenorDriverSettings = {
  host: string
  user: string
  password: string
  database: string
}

export type ProcountorDriverSettings = {
  apiKey: string
  autoApprove: boolean
}

export type DriverSettings =
  | TestMockDriverSettings
  | NoActionDriverSettings
  | EnableBankingDriverSettings
  | ManualUploadDriverSettings
  | NordnetDriverSettings
  | SPankkiDriverSettings
  | TasenorDriverSettings
  | ProcountorDriverSettings

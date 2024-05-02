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

export type DriverSettings = TestMockDriverSettings | NoActionDriverSettings | EnableBankingDriverSettings | ManualUploadDriverSettings | NordnetDriverSettings

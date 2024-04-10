export type TestMockDriverSettings = {
  url: string
}

export type EnableBankingDriverSettings = {
  sessionInDays: number
  bankName: string
  country: string
  psuType: 'personal' | 'business'
  iban: string
}

export type DriverSettings = TestMockDriverSettings | EnableBankingDriverSettings

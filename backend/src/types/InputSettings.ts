export type TestMockInputSettings = {
  url: string
}

export type EnableBankingInputSettings = {
  sessionInDays: number
  bankName: string
  country: string
  psuType: 'personal' | 'business'
  iban: string
}

export type InputSettings = TestMockInputSettings | EnableBankingInputSettings

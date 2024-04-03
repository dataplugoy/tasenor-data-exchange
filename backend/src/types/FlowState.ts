import { Timestring } from '@tasenor/common'

export type TestMockFlowState = {
}

export type EnableBankingFlowState = {
  sessionId: string
  validUntil: Timestring
  accountId: string
}

export type FlowState = TestMockFlowState | EnableBankingFlowState

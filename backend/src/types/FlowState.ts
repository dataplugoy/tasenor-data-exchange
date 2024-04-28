import { Timestring } from '@tasenor/common'

export type TestMockFlowState = {
}

export type NoActionFlowState = {
}

export type EnableBankingFlowState = {
  sessionId: string
  validUntil: Timestring
  accountId: string
}

export type ManualUploadFlowState = {
}

export type FlowState = TestMockFlowState | NoActionFlowState | EnableBankingFlowState | ManualUploadFlowState

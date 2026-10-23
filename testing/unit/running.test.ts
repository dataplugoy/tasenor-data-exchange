import { describe, expect, test, vi } from 'vitest'
import { notRunning, runningFlowPlans } from '../../backend/src/lib/running'

function response(flowPlanId: number) {
  const res = {
    locals: { flowPlan: { id: flowPlanId } },
    status: vi.fn(() => res),
    send: vi.fn(() => res),
  }
  return res
}

describe('Running flow plans', () => {

  test('batches of a running flow plan cannot be changed', () => {
    runningFlowPlans.add(1)
    const res = response(1)
    const next = vi.fn()
    notRunning()({}, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(409)
    runningFlowPlans.delete(1)
  })

  test('batches of other flow plans can be changed', () => {
    runningFlowPlans.add(1)
    const next = vi.fn()
    notRunning()({}, response(2), next)
    expect(next).toHaveBeenCalled()
    runningFlowPlans.delete(1)
  })
})

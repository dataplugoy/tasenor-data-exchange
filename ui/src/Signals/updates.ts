import { Signal, effect, signal } from '@preact/signals'

const batchUpdates: Signal<number> = signal<number>(0)

/**
 * Signal triggered when the latest batch has been updated.
 */
export function signalBatchUpdate() {
  batchUpdates.value++
}

/**
 * Run the function when the latest batch has been updated.
 * @param fn
 */
export function whenBatchUpdates(fn: () => void) {
  effect(() => {
    const _dummy = batchUpdates.value
    fn()
  })
}

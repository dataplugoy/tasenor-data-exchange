import { Signal, effect, signal } from '@preact/signals'

const batchUpdates: Signal<number> = signal<number>(0)
const uploadUpdates: Signal<number> = signal<number>(0)
const runUpdates: Signal<number> = signal<number>(0)

/**
 * Signal triggered when the latest batch has been updated.
 */
export function signalBatchUpdate() {
  batchUpdates.value++
}

/**
 * Signal triggered on regular intervals when uploading is running.
 */
export function signalUploadUpdate() {
  batchUpdates.value++
}

/**
 * Signal triggered on regular intervals when execcuting a run.
 */
export function signalRunUpdate() {
  runUpdates.value++
}

/**
 * Run the function when the latest batch has been updated.
 * @param fn
 */
export function whenBatchUpdates(fn: () => void) {
  effect(() => {
    // eslint-disable-next-line
    const dummy = batchUpdates.value
    fn()
  })
}

/**
 * Run the function when uploading is running.
 * @param fn
 */
export function whenUploadUpdates(fn: () => void) {
  effect(() => {
    // eslint-disable-next-line
    const dummy = uploadUpdates.value
    fn()
  })
}

/**
 * Run the function when execuring a run.
 * @param fn
 */
export function whenRunUpdates(fn: () => void) {
  effect(() => {
    // eslint-disable-next-line
    const dummy = runUpdates.value
    fn()
  })
}

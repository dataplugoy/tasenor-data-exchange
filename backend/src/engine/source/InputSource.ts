/**
 * Base class for different input sources supported.
 */
export class InputSource {

  settings: Record<string, unknown>

  constructor(settings: Record<string, unknown>) {
    this.settings = settings
  }

  /**
   * Handler for actual data fetching.
   * @returns New data found.
   */
  async fetchData(): Promise<string> {
    return 'TODO: Data simulation.'
  }
}

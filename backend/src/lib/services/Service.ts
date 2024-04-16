import { ServiceType } from "@prisma/client"
import { ServiceSettings } from "../../types/ServiceSettings"

export class Service {

  private settings: ServiceSettings

  constructor(settings: ServiceSettings) {
    this.settings = settings
  }

  /**
   * List of services implemented.
   */
  getCababilities(): ServiceType[] {
    return []
  }
}

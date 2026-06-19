import { FrankfurterAPI } from "./frankfurter_api";
import type { FxRate } from "../types/fx";

export class APIController {
  private frankfurterAPI = new FrankfurterAPI();

  constructor() {
    this.init();
  }

  init() {}

  async search(
    base: string,
    target: string,
    from?: string,
    to?: string,
  ): Promise<FxRate | undefined> {
    if (!from && !to) {
      try {
        const data = await this.frankfurterAPI.fetchFxRates(base, target);
        return data;
      } catch (error) {
        console.error("Error fetching FX data:", error);
        return;
      }
    } else {
      return;
    }
  }
}

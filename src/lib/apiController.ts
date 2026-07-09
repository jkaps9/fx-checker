import { FrankfurterAPI } from "./frankfurter_api";
import type { FxRate } from "../types/fx";

export class APIController {
  private frankfurterAPI = new FrankfurterAPI();
  base: string;
  target: string;
  rate: number;
  currentData: FxRate[];

  constructor() {
    this.base = "";
    this.target = "";
    this.rate = 1;
  }

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

  async searchHistorical(
    base: string,
    target: string,
    from: string,
    to: string,
  ): Promise<FxRate[] | undefined> {
    if (base === this.base && target === this.target){ 
alert("returning current data");
return this.currentData;
}
    try {
      const data = await this.frankfurterAPI.fetchHistoricalRates(
        base,
        target,
        from,
        to,
      );
      const lastIndex = data.length - 1;
      this.base = data[lastIndex].base;
      this.target = data[lastIndex].quote;
      this.rate = data[lastIndex].rate;
      this.currentData = data;
      return data;
    } catch (error) {
      console.error("Error fetching time series FX data:", error);
      return;
    }
  }

  async searchAll(
    base: string,
    quotes: string[],
  ): Promise<FxRate[] | undefined> {
    try {
      const data = await this.frankfurterAPI.fetchAllRates(base, quotes);
      return data;
    } catch (error) {
      console.error("Error fetching all rates:", error);
      return;
    }
  }
}

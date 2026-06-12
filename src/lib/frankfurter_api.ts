import type { FxRate } from "../types/fx";

export class FrankfurterAPI {
  private static readonly baseURL = "https://api.frankfurter.dev/v2";

  constructor() {}

  async fetchFxRates(
    baseCurrency: string,
    targetCurrency: string,
  ): Promise<FxRate> {
    let url =
      FrankfurterAPI.baseURL + `/rate/${baseCurrency}/${targetCurrency}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const data = (await response.json()) as FxRate[];
    return data;
  }
}

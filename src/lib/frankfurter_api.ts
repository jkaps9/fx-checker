import type { FxRate } from "../types/fx";

export class FrankfurterAPI {
  private static readonly baseURL = "https://api.frankfurter.dev/v2";

  constructor() {}

  async fetchFxRates(
    baseCurrency: string,
    quoteCurrency: string,
  ): Promise<FxRate> {
    let url =
      FrankfurterAPI.baseURL +
      `/rates?base=${baseCurrency}&quotes=${quoteCurrency}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const data = (await response.json()) as FxRate[];
    return data[0];
  }
}

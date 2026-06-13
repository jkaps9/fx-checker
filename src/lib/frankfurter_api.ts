import type { FxRate } from "../types/fx";

export class FrankfurterAPI {
  private static readonly baseURL = "https://api.frankfurter.dev/v2";

  constructor() {}

  async fetchFxRates(base: string, target: string): Promise<FxRate> {
    let url = `${FrankfurterAPI.baseURL}/rate/${base}/${target}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const data = (await response.json()) as FxRate[];
    return data;
  }

  async convert(base: string, quote: string, amount: number): Promise<string> {
    let url = `${FrankfurterAPI.baseURL}/rate/${base}/${quote}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    return await response
      .json()
      .then((data) => (amount * data.rate).toFixed(2));
  }
}

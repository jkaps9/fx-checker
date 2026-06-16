import type { FxRate } from "../types/fx";

export class FrankfurterAPI {
  private static readonly baseURL = "https://api.frankfurter.dev/v2";

  constructor() {}

  async fetchAllRates(base: string, quotes: string[]): Promise<FxRate[]> {
    // TODO: add date range for 1 day (e.g. today and yesterday to get open and close)
    const quoteStr = quotes.join(",");
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const url = `${FrankfurterAPI.baseURL}/rates?base=${base}&quotes=${quoteStr}&from=${yesterday.toISOString().split("T")[0]}&to=${today.toISOString().split("T")[0]}`;
    console.log(url);

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = (await response.json()) as FxRate[];
    if (!result || result.length === 0)
      throw new Error("No rate data returned.");
    return result;
  }

  async fetchFxRates(base: string, target: string): Promise<FxRate> {
    let url = `${FrankfurterAPI.baseURL}/rate/${base}/${target}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const data = (await response.json()) as FxRate;
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

  async fetchHistoricalRates(
    base: string,
    target: string,
    startDate: string,
    endDate: string,
  ): Promise<FxRate[]> {
    const url = `${FrankfurterAPI.baseURL}/rates?base=${base}&quotes=${target}&from=${startDate}&to=${endDate}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = (await response.json()) as FxRate[];
    if (!result || result.length === 0)
      throw new Error("No rate data returned.");
    return result;
  }
}

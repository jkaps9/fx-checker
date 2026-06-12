export class FrankfurterAPI {
  private static readonly baseURL = "https://api.frankfurter.dev/v2";

  constructor() {}

  async fetchRates(
    baseCurrency?: string,
    quoteCurrencies?: string[],
  ): Promise<FxRate> {
    let url = FrankfurterAPI.baseURL + "/rates?";
    if (baseCurrency) url += `base=${baseCurrency}`;
    if (quoteCurrencies) {
      url += "quotes=";
      quoteCurrencies.map((currency, index) => {
        url += index === quoteCurrencies.length ? currency : `${currency},`;
      });
    }

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const data = (await response.json()) as FxRate;
    return data;
  }
}

export type FxRate = {
  date: string;
  base: string;
  quote: string;
  rate: number;
};

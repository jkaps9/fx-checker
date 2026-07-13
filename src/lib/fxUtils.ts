import type { FxRate, RateSummary } from "../types/fx";

export function summarizeRates(rawRates: FxRate[]): RateSummary[] {
  const grouped = rawRates.reduce(
    (accumulator, currentValue) => {
      if (!accumulator[currentValue.quote])
        accumulator[currentValue.quote] = [];
      accumulator[currentValue.quote].push(currentValue);
      return accumulator;
    },
    {} as Record<string, FxRate[]>,
  );

  const summaries: RateSummary[] = Object.entries(grouped).map(
    ([quote, rates]) => {
      rates.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      const openRecord = rates[0];
      const closeRecord = rates[rates.length - 1];

      const open = openRecord.rate;
      const close = closeRecord.rate;

      const changeAmount = close - open;
      const changePercent = (changeAmount / open) * 100;

      return {
        quote,
        open,
        close,
        changeAmount: Number(changeAmount.toFixed(4)),
        changePercent: Number(changePercent.toFixed(2)),
      };
    },
  );

  return summaries;
}

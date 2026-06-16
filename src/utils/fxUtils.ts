import type { FxRate, RateSummary } from "../types/fx";

export function summarizeRates(rawRates: FxRate[]): RateSummary[] {
  const grouped = rawRates.reduce(
    (acc, curr) => {
      if (!acc[curr.quote]) acc[curr.quote] = [];
      acc[curr.quote].push(curr);
      return acc;
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

      let trend: "up" | "down" | "flat" = "flat";
      if (changeAmount > 0) trend = "up";
      if (changeAmount < 0) trend = "down";

      return {
        quote,
        open,
        close,
        changeAmount: Number(changeAmount.toFixed(4)), // Keeps the UI clean
        changePercent: Number(changePercent.toFixed(2)),
        trend,
      };
    },
  );

  return summaries;
}

export interface FxRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export interface RateSummary {
  base: string;
  quote: string;
  open: number;
  close: number;
  changePercent: number;
  trend: "up" | "down" | "flat";
}

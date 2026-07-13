export interface FxRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export interface RateSummary {
  quote: string;
  open: number;
  close: number;
  changeAmount: number;
  changePercent: number;
}

export function convertAmount(amount: number, rate: number) {
  const result = amount * rate;
  return result.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

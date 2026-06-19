import { APIController } from "./apiController";
import { convertAmount } from "@utils/fxMath";

const displayController = (function () {
  const form = document.getElementById("fx-input") as HTMLFormElement;
  const apiController = new APIController();
  const baseAmount = document.getElementById("base-amount") as HTMLInputElement;
  const outputAmount = document.getElementById(
    "output-amount",
  ) as HTMLOutputElement;
  const results = document.getElementById("output") as HTMLParagraphElement;

  const initizalize = () => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
    });

    form.addEventListener("input", () => {
      const formData = new FormData(form);
      const base = formData.get("base")?.toString();
      const target = formData.get("target")?.toString();

      if (!base || !target || base === target) return;
      updateBaseConversion("Fetching rates...");
      apiController.search(base, target).then((data) => {
        if (data) {
          updateBaseConversion(
            `1 ${data.base} = ${data.rate.toFixed(4)} ${data.quote}`,
          );
          const baseAmt = baseAmount.valueAsNumber;
          if (baseAmt) updateTargetAmount(baseAmt, data.rate);
        } else {
          updateBaseConversion("Error fetching rates. Please try again.");
        }
      });
    });
  };

  const updateBaseConversion = (str: string) => {
    results.textContent = str;
  };

  const updateTargetAmount = (amount: number, rate: number) => {
    const result = convertAmount(amount, rate);
    outputAmount.value = result.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  return { initizalize };
})();
export default displayController;

import { APIController } from "./apiController";
import { convertAmount } from "@utils/fxMath";
import storageManager from "./storageManager";

const displayController = (function () {
  const form = document.getElementById("fx-input") as HTMLFormElement;
  const apiController = new APIController();
  const baseAmount = document.getElementById("base-amount") as HTMLInputElement;
  const outputAmount = document.getElementById(
    "output-amount",
  ) as HTMLOutputElement;
  const results = document.getElementById("output") as HTMLParagraphElement;
  const favoriteButton = document.getElementById(
    "favorite-button",
  ) as HTMLButtonElement;
  const currencySwapBtn = document.getElementById(
    "currency-swap",
  ) as HTMLButtonElement;

  const initizalize = () => {
    const formData = new FormData(form);
    const base: string = formData.get("base")?.toString() ?? "";
    const target: string = formData.get("target")?.toString() ?? "";
    updateFavoriteButtonState(base, target);

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
    });

    form.addEventListener("input", () => {
      const formData = new FormData(form);
      const base: string = formData.get("base")?.toString() ?? "";
      const target: string = formData.get("target")?.toString() ?? "";
      if (!base || !target || base === target) return;
      updateBaseConversion("Fetching rates...");
      updateFavoriteButtonState(base, target);
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

    currencySwapBtn.addEventListener("click", () => {
      const formData = new FormData(form);
      const base: string = formData.get("base")?.toString() ?? "";
      const target: string = formData.get("target")?.toString() ?? "";
      swapCurrencies(base, target);
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

  const updateFavoriteButtonState = (base: string, target: string) => {
    if (base && target && base !== "" && target !== "") {
      if (storageManager.hasFavorite(base, target)) {
        favoriteButton.classList.add("active");
      } else {
        favoriteButton.classList.remove("active");
      }
    }
  };

  const swapCurrencies = (base: string, target: string) => {
    console.log(`swapping ${base} and ${target}`);
    const selectBase = document.getElementById(
      "base-currency",
    ) as HTMLSelectElement;
    const selectTarget = document.getElementById(
      "target-currency",
    ) as HTMLSelectElement;

    selectBase.value = target;
    selectTarget.value = base;

    const targetVal = Number(outputAmount.value.replace(",", ""));

    baseAmount.valueAsNumber = targetVal;
  };

  return { initizalize };
})();
export default displayController;

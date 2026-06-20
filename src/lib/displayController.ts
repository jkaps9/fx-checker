import { APIController } from "./apiController";
import { convertAmount } from "@utils/fxMath";
import { updateElementClasses } from "@utils/generalUtils";
import storageManager from "./storageManager";

const displayController = (function () {
  const apiController = new APIController();

  // form elements
  const form = document.getElementById("fx-input") as HTMLFormElement;
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

  // historical elements
  const openAmountPara = document.getElementById(
    "open-amount",
  ) as HTMLParagraphElement;
  const closeAmountPara = document.getElementById(
    "close-amount",
  ) as HTMLParagraphElement;
  const changeAmountPara = document.getElementById(
    "change-amount",
  ) as HTMLParagraphElement;
  const changePercentagePara = document.getElementById(
    "change-percentage",
  ) as HTMLParagraphElement;
  const dateRangeButtons = document.querySelectorAll(
    ".date-range-buttons > button",
  );
  const rateList = document.getElementById("rate-list") as HTMLElement;

  let dateRange = "1M";
  const dateOffsets = new Map();
  dateOffsets.set("1D", 1);
  dateOffsets.set("1W", 7);
  dateOffsets.set("1M", 30);
  dateOffsets.set("3M", 90);
  dateOffsets.set("1Y", 365);
  dateOffsets.set("5Y", 1825); // 365 * 5 = 1,825

  const initizalize = () => {
    const formData = new FormData(form);
    const base: string = formData.get("base")?.toString() ?? "";
    const target: string = formData.get("target")?.toString() ?? "";
    updateFavoriteButtonState(base, target);
    getApiData();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
    });

    form.addEventListener("input", () => {
      const formData = new FormData(form);
      const base: string = formData.get("base")?.toString() ?? "";
      const target: string = formData.get("target")?.toString() ?? "";
      if (!base || !target || base === target) return;
      getApiData();
    });

    currencySwapBtn.addEventListener("click", () => {
      const formData = new FormData(form);
      const base: string = formData.get("base")?.toString() ?? "";
      const target: string = formData.get("target")?.toString() ?? "";
      swapCurrencies(base, target);
      getApiData();
    });

    dateRangeButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        if (btn.textContent !== dateRange) {
          updateElementClasses(dateRangeButtons, btn, "active");
          dateRange = btn.textContent;
          getApiData();
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

  const getApiData = () => {
    const formData = new FormData(form);
    const base: string = formData.get("base")?.toString() ?? "";
    const target: string = formData.get("target")?.toString() ?? "";
    if (!base || !target || base === target) return;
    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - dateOffsets.get(dateRange));

    updateBaseConversion("Fetching rates...");
    updateFavoriteButtonState(base, target);
    apiController
      .searchHistorical(
        base,
        target,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      )
      .then((data) => {
        if (data) {
          const lastIndex = data.length - 1;
          updateBaseConversion(
            `1 ${data[lastIndex].base} = ${data[lastIndex].rate.toFixed(4)} ${data[lastIndex].quote}`,
          );
          const baseAmt = baseAmount.valueAsNumber;
          if (baseAmt) updateTargetAmount(baseAmt, data[lastIndex].rate);

          const listItems = data.map((day) => {
            const item = document.createElement("li");
            item.textContent = `${day.date}: 1 ${day.base} = ${day.rate.toFixed(4)} ${day.quote}`;
            return item;
          });

          const open = data[0].rate;
          const close = data[data.length - 1].rate;
          const change = close - open;
          const changePercentage = (change / open) * 100;
          openAmountPara.textContent = `${open.toFixed(4)}`;
          closeAmountPara.textContent = `${close.toFixed(4)}`;
          changeAmountPara.textContent = `${change.toFixed(4)}`;
          changeAmountPara.className = `${change > 0 ? "positive" : "negative"}`;
          changePercentagePara.textContent = `${change > 0 ? "+" : ""}${changePercentage.toFixed(2)}%`;
          changePercentagePara.className = `${change > 0 ? "positive" : "negative"}`;

          rateList.replaceChildren();
          listItems.forEach((item) => rateList.appendChild(item));
        } else {
          updateBaseConversion("Error fetching rates. Please try again.");
        }
      });
  };

  return { initizalize };
})();
export default displayController;

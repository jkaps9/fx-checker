import { APIController } from "./apiController";
import { convertAmount } from "@utils/fxMath";
import { updateElementClasses } from "@utils/generalUtils";
import type { RateSummary } from "../types/fx";
import { summarizeRates } from "@utils/fxUtils";
import currencies from "@data/currencies.json" with { type: "json" };
import storageManager from "./storageManager";
import { ChartController } from "./chartController";

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
  const logConversionButton = document.getElementById(
    "log-conversion",
  ) as HTMLButtonElement;

  // tab buttons
  const tabButtons = document.querySelectorAll("button.tab");
  const tabSections = document.querySelectorAll(
    "#history, #compare, #favorites, #log",
  );

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
  const historicalChart = document.getElementById(
    "historyChart",
  ) as HTMLCanvasElement;

  const chartController = new ChartController(historicalChart);

  // compare elements
  const comparisonList = document.getElementById(
    "comparison__list",
  ) as HTMLElement;
  const compareAmount = document.getElementById(
    "compare-amount",
  ) as HTMLElement;

  // favorite elements
  const favoritesList = document.querySelector(
    ".favorites__list",
  ) as HTMLElement;
  const numFavorites = document.getElementById("num-favorites") as HTMLElement;

  // log elements
  const logList = document.querySelector(".log__list") as HTMLElement;
  const numLogged = document.getElementById("num-logged") as HTMLElement;

  // TODO: include ticker list script here
  let dateRange = "1M";
  const dateOffsets = new Map();
  dateOffsets.set("1D", 1);
  dateOffsets.set("1W", 7);
  dateOffsets.set("1M", 30);
  dateOffsets.set("3M", 90);
  dateOffsets.set("1Y", 365);
  dateOffsets.set("5Y", 1825); // 365 * 5 = 1,825

  let currentSection = "compare";

  const initizalize = () => {
    const formData = new FormData(form);
    const base: string = formData.get("base")?.toString() ?? "";
    const target: string = formData.get("target")?.toString() ?? "";
    updateFavoriteButtonState(base, target);
    getApiData();
    getComparisons();

    updateFavorites();
    updateConversionLog();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
    });

    form.addEventListener("input", () => {
      const formData = new FormData(form);
      const base: string = formData.get("base")?.toString() ?? "";
      const target: string = formData.get("target")?.toString() ?? "";
      if (!base || !target || base === target) return;
      getApiData();
      getComparisons();
      updateCompareAmountText(base);
    });

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        updateElementClasses(tabButtons, btn, "active");
        currentSection = btn.getAttribute("data-tab") ?? "";
        updateActiveSection();
      });
    });

    currencySwapBtn.addEventListener("click", () => {
      const formData = new FormData(form);
      const base: string = formData.get("base")?.toString() ?? "";
      const target: string = formData.get("target")?.toString() ?? "";
      swapCurrencies(base, target);
      getApiData();
      updateCompareAmountText(target);
    });

    favoriteButton.addEventListener("click", () => {
      const formData = new FormData(form);
      const base: string = formData.get("base")?.toString() ?? "";
      const target: string = formData.get("target")?.toString() ?? "";
      if (base && target) {
        if (storageManager.hasFavorite(base, target)) {
          favoriteButton.classList.remove("active");
          storageManager.removeFavorite(base, target);
        } else {
          favoriteButton.classList.add("active");
          storageManager.addFavorite(base, target);
        }

        updateFavorites();
      }
    });

    logConversionButton.addEventListener("click", () => {
      const formData = new FormData(form);
      const now = new Date().toISOString();
      const base: string = formData.get("base")?.toString() ?? "";
      const target: string = formData.get("target")?.toString() ?? "";
      const sendAmount = baseAmount.valueAsNumber;
      const receiveAmount = Number(outputAmount.value.replaceAll(",", ""));
      if (base && target && sendAmount && receiveAmount) {
        if (
          !storageManager.hasLog(now, base, target, sendAmount, receiveAmount)
        ) {
          logConversionButton.classList.add("active");
          storageManager.addLog(now, base, target, sendAmount, receiveAmount);
        } else {
          logConversionButton.classList.remove("active");
          storageManager.addLog(now, base, target, sendAmount, receiveAmount);
        }

        updateConversionLog();
      } else {
        // TODO: update the UX here
        alert("invalid log value");
        console.log(
          `base: ${base}; target: ${target}; sendAmount: ${sendAmount}; receiveAmount: ${receiveAmount}`,
        );
      }
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
    if (amount !== 0) outputAmount.classList.add("accent-text");
    else {
      outputAmount.classList.remove("accent-text");
      outputAmount.value = "0";
    }
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
          if (!baseAmt) updateTargetAmount(0, 1);

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

          // rateList.replaceChildren();
          chartController;
          listItems.forEach((item) => {
            // rateList.appendChild(item);
          });
        } else {
          updateBaseConversion("Error fetching rates. Please try again.");
        }
      });
  };

  const getComparisons = () => {
    const formData = new FormData(form);
    const base = formData.get("base")?.toString();
    const quotes = ["GBP", "JPY", "CHF", "CAD", "AUD", "INR", "CNY", "BDT"];
    const compareCard = document.getElementById("compare-card") as HTMLElement;
    const comparePairAmount = document.getElementById(
      "compare-pairs",
    ) as HTMLElement;

    if (!base) return;

    const baseAmt = baseAmount.value === "" ? 0 : baseAmount.valueAsNumber;

    if (baseAmt === 0) {
      compareCard.classList.add("visually-hidden");
      return;
    }

    apiController.searchAll(base, quotes).then((data) => {
      if (data) {
        const dailySummaries = summarizeRates(data);
        const listItems = dailySummaries.map((n) => {
          return createComparisonListItem(n);
        });
        compareCard.classList.remove("visually-hidden");
        comparisonList.replaceChildren();
        comparePairAmount.textContent = `${dailySummaries.length}`;
        listItems.forEach((item) => comparisonList.appendChild(item));
      }
    });
  };

  const createComparisonListItem = (rateSummary: RateSummary): HTMLElement => {
    const item = document.createElement("li");
    item.classList.add("comparison__item");
    item.classList.add("card--inner");
    const leftSide = document.createElement("div");
    leftSide.classList.add("left-side");
    const flag = document.createElement("img");
    flag.src = `/images/flags/${rateSummary.quote.slice(0, 2).toLowerCase()}.webp`;
    flag.alt = `${rateSummary.quote.slice(0, 2).toLowerCase()} flag`;
    flag.classList.add("flag");
    const currencyInfo = document.createElement("div");
    const currency = document.createElement("p");
    currency.textContent = rateSummary.quote;
    const currencyName = document.createElement("p");
    currencyName.textContent = getCurrencyName(rateSummary.quote);

    leftSide.appendChild(flag);
    currencyInfo.appendChild(currency);
    currencyInfo.appendChild(currencyName);
    leftSide.appendChild(currencyInfo);

    const rightSide = document.createElement("div");
    const rateInfo = document.createElement("div");
    const convertedAmount = document.createElement("p");

    const baseAmt = baseAmount.value === "" ? 0 : baseAmount.valueAsNumber;
    const result = convertAmount(baseAmt, rateSummary.close);
    convertedAmount.textContent = result.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const rate = document.createElement("p");
    rate.textContent = `@ ${rateSummary.close}`;
    const favoriteButton = document.createElement("button");

    rateInfo.appendChild(convertedAmount);
    rateInfo.appendChild(rate);
    rightSide.appendChild(rateInfo);
    rightSide.appendChild(favoriteButton);

    item.appendChild(leftSide);
    item.appendChild(rightSide);

    return item;
  };

  const getCurrencyName = (currencyCode: string) => {
    const currency = currencies.find((c) => c.iso_code === currencyCode);
    return currency ? currency.name : "";
  };

  const updateCompareAmountText = (base: string) => {
    const amount =
      baseAmount.value === ""
        ? "0"
        : baseAmount.valueAsNumber.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          });

    compareAmount.textContent = `${amount} FROM ${base}`;
  };

  const updateActiveSection = () => {
    const activeElement = document.getElementById(currentSection);
    if (activeElement) {
      updateElementClasses(tabSections, activeElement, "active");
    }
  };

  const updateFavoriteCount = (amount: number) => {
    const favoriteCounter = document.getElementById(
      "favorite-counter",
    ) as HTMLElement;
    favoriteCounter.textContent = `${amount}`;
  };

  const updateLogCount = (amount: number) => {
    const logCounter = document.getElementById("log-counter") as HTMLElement;
    logCounter.textContent = `${amount}`;
  };

  const updateFavorites = () => {
    const favoritesArr = storageManager.getFavorites();
    if (favoritesArr) {
      numFavorites.textContent = `${favoritesArr.length}`;
      favoritesList.replaceChildren();
      updateFavoriteCount(favoritesArr.length);
      const favoritesCard = document.getElementById(
        "favorites-card",
      ) as HTMLElement;
      if (favoritesArr.length > 0) {
        favoritesCard.classList.remove("visually-hidden");
        favoritesList.replaceChildren();
        favoritesArr.map((favorite) => {
          const listItem = createFavoriteListItem(favorite);
          favoritesList.appendChild(listItem);
        });
      } else {
        favoritesCard.classList.add("visually-hidden");
      }
    }
  };

  const updateConversionLog = () => {
    const conversionArr = storageManager.getLog();
    if (conversionArr) {
      numLogged.textContent = `${conversionArr.length}`;
      logList.replaceChildren();
      updateLogCount(conversionArr.length);
      const conversionsCard = document.getElementById(
        "log-card",
      ) as HTMLElement;
      if (conversionArr.length > 0) {
        conversionsCard.classList.remove("visually-hidden");
        conversionArr.map((conversion) => {
          const listItem = createLogListItem(conversion);
          logList.appendChild(listItem);
        });
      } else {
        conversionsCard.classList.add("visually-hidden");
      }
    }
  };

  const createFavoriteListItem = (favorite: any) => {
    const listItem = document.createElement("li");
    listItem.classList.add("card--inner");
    listItem.classList.add("favorites__item");
    const currencyPair = document.createElement("div");
    currencyPair.classList.add("favorites-item__currency-pair");
    currencyPair.innerHTML = `<p>${favorite.base}</p><span>-></span><p>${favorite.target}</p>`;
    listItem.appendChild(currencyPair);

    const rightSide = document.createElement("div");
    rightSide.classList.add("favorites-item__right-side");
    const rightContent = document.createElement("div");
    rightContent.classList.add("right-side__content");
    rightSide.appendChild(rightContent);

    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - dateOffsets.get(dateRange));

    apiController
      .searchHistorical(
        favorite.base,
        favorite.target,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      )
      .then((data) => {
        if (data) {
          const open = data[0].rate;
          const close = data[data.length - 1].rate;
          const change = close - open;
          const changePercentage = (change / open) * 100;
          const decimals =
            close >= 1000 ? 1 : close >= 100 ? 2 : close >= 10 ? 3 : 4;
          rightContent.innerHTML = `<p>${close.toFixed(decimals)}</p>
      <p class="percent-change ${changePercentage > 0 ? "positive" : changePercentage < 0 ? "negative" : ""}">
        <span>${changePercentage > 0 ? "▲" : changePercentage < 0 ? "▼" : "-"}</span>
         ${changePercentage > 0 ? "+" : ""}${changePercentage.toFixed(2)}%</p>`;
        }
      });

    const favButton = document.createElement("button");
    // TODO: add star svg
    favButton.textContent = "s";
    favButton.classList.add("btn");
    favButton.addEventListener("click", () => {
      favoritesList.removeChild(listItem);
      storageManager.removeFavorite(favorite.base, favorite.target);
      const arr = storageManager.getFavorites();
      numFavorites.textContent = `${arr.length}`;
      updateFavoriteCount(arr.length);
      // TODO: figure out how to change class on input forms favorite button if the active pair is removed from favorites list
    });
    rightSide.appendChild(favButton);
    listItem.appendChild(rightSide);

    return listItem;
  };

  const createLogListItem = (conversion: any) => {
    const listItem = document.createElement("li");
    listItem.classList.add("card--inner");
    listItem.classList.add("log__item");
    const leftSide = document.createElement("div");
    leftSide.classList.add("log-item__left-side");
    const timeDiff = document.createElement("p");
    const currentTime = new Date();
    const logDate = new Date(conversion.dateTimeLogged);
    const diffInMs = currentTime.getTime() - logDate.getTime();
    const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
    timeDiff.textContent = `${logDate.toISOString().split("T")[0]}`;
    leftSide.appendChild(timeDiff);
    const currencyPair = document.createElement("div");
    currencyPair.classList.add("log-item__currency-pair");
    currencyPair.innerHTML = `<p>${conversion.base}</p><span>-></span><p>${conversion.target}</p>`;
    leftSide.appendChild(currencyPair);
    listItem.appendChild(leftSide);

    const rightSide = document.createElement("div");
    rightSide.classList.add("log-item__right-side");
    const rightContent = document.createElement("div");
    rightContent.classList.add("right-side__content");
    rightContent.innerHTML = `<p>${conversion.sendAmount}</p><p class="accent-text">${conversion.receiveAmount}</p>`;
    const deleteLogButton = document.createElement("button");
    deleteLogButton.classList.add("btn");
    deleteLogButton.textContent = "D";
    deleteLogButton.addEventListener("click", () => {
      storageManager.removeLog(
        conversion.dateTimeLogged,
        conversion.base,
        conversion.target,
        conversion.sendAmount,
        conversion.receiveAmount,
      );
      logList.removeChild(listItem);
    });
    rightSide.appendChild(rightContent);
    rightSide.appendChild(deleteLogButton);
    listItem.appendChild(rightSide);

    return listItem;
  };

  return { initizalize };
})();
export default displayController;

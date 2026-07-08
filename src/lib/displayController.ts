import { APIController } from "./apiController";
import { convertAmount } from "@utils/fxMath";
import { updateElementClasses } from "@utils/generalUtils";
import type { RateSummary } from "../types/fx";
import { summarizeRates } from "@utils/fxUtils";
import currencies from "@data/currencies.json" with { type: "json" };
import storageManager from "./storageManager";
import { ChartController } from "./chartController";
import starSVG from "../icons/icon-star.svg?raw";
import filledStarSVG from "../icons/icon-star-filled.svg?raw";
import deleteSVG from "../icons/icon-delete.svg?raw";
import filledDeleteSVG from "../icons/icon-delete-filled.svg?raw";

const displayController = (function () {
  const apiController = new APIController();

  // form elements
  const form = document.getElementById("fx-input") as HTMLFormElement;
  const baseSelect = document.getElementById(
    "base-currency",
  ) as HTMLInputElement;
  const targetSelect = document.getElementById(
    "target-currency",
  ) as HTMLInputElement;

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

  const customSelects =
    document.querySelectorAll<HTMLElement>(".custom-select");
  const baseCustomSelect = document.getElementById(
    "select-base-currency",
  ) as HTMLElement;
  const targetCustomSelect = document.getElementById(
    "select-target-currency",
  ) as HTMLElement;

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
  const compareCard = document.getElementById("compare-card") as HTMLElement;
  const comparePairAmount = document.getElementById(
    "compare-pairs",
  ) as HTMLElement;

  // favorite elements
  const favoritesList = document.querySelector(
    ".favorites__list",
  ) as HTMLElement;
  const numFavorites = document.getElementById("num-favorites") as HTMLElement;
  const favoriteCounter = document.getElementById(
    "favorite-counter",
  ) as HTMLElement;

  // log elements
  const logList = document.querySelector(".log__list") as HTMLElement;
  const numLogged = document.getElementById("num-logged") as HTMLElement;
  const logCounter = document.getElementById("log-counter") as HTMLElement;
  const clearLogBtn = document.getElementById("clear-log") as HTMLButtonElement;

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

  const initialize = () => {
    const formData = getFormValues();
    updateFavoriteButtonState(formData.base, formData.target);
    getApiData();
    getComparisons();

    updateFavorites();
    updateConversionLog();

    baseAmount.addEventListener("input", (e) => {
      const target = e.target as HTMLInputElement;
      let val = target.value.replace(/[^0-9.]/g, "");
      const parts = val.split(".");
      if (parts.length > 2) {
        val = parts[0] + "." + parts.slice(1).join("");
      }

      if (parts[0]) {
        parts[0] = Number(parts[0]).toLocaleString("en-US");
      }

      target.value = parts.join(".");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
    });

    form.addEventListener("input", () => {
      const formData = getFormValues();
      if (
        !formData.base ||
        !formData.target ||
        formData.base === formData.target
      )
        return;
      getApiData();
      getComparisons();
      updateCompareAmountText(formData.base);
    });

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        updateElementClasses(tabButtons, btn, "active");
        currentSection = btn.getAttribute("data-tab") ?? "";
        updateActiveSection();
      });
    });

    currencySwapBtn.addEventListener("click", () => {
      const formData = getFormValues();
      swapCurrencies(formData.base, formData.target);
      getApiData();
      updateCompareAmountText(formData.target);
    });

    favoriteButton.addEventListener("click", () => {
      const formData = getFormValues();
      if (formData.base && formData.target) {
        if (storageManager.hasFavorite(formData.base, formData.target)) {
          storageManager.removeFavorite(formData.base, formData.target);
        } else {
          storageManager.addFavorite(formData.base, formData.target);
        }

        updateFavoriteButtonState(formData.base, formData.target);
        updateFavorites();
      }
    });

    logConversionButton.addEventListener("click", () => {
      const now = new Date().toISOString();
      const formData = getFormValues();

      const sendAmount = Number(baseAmount.value.replace(/[^0-9.]/g, ""));
      const receiveAmount = Number(outputAmount.value.replaceAll(",", ""));
      if (formData.base && formData.target && sendAmount && receiveAmount) {
        if (!storageManager.hasLog(now)) {
          storageManager.addLog(
            now,
            formData.base,
            formData.target,
            sendAmount,
            receiveAmount,
          );
          logConversionButton.classList.add("active");
          setTimeout(() => {
            logConversionButton.classList.remove("active");
          }, 2000);
        }
        updateConversionLog();
      } else {
        // TODO: update the UX here
        alert("invalid log value");
        console.log(
          `base: ${formData.base}; target: ${formData.target}; sendAmount: ${sendAmount}; receiveAmount: ${receiveAmount}`,
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

    clearLogBtn.addEventListener("click", () => {
      storageManager.clearLog();
      updateConversionLog();
    });

    customSelects.forEach((customSelect) => {
      const hiddenInput = customSelect.querySelector(
        'input[type="hidden"]',
      ) as HTMLInputElement;
      const selectButton = customSelect.querySelector(
        ".select-button",
      ) as HTMLButtonElement;
      const dropDownMenu = customSelect.querySelector(
        ".dropdown-menu",
      ) as HTMLElement;
      const searchInput = dropDownMenu.querySelector(
        ".input-search",
      ) as HTMLInputElement;
      const currencyOptions = dropDownMenu.querySelectorAll(".currency-option");
      const selectedContent = customSelect.querySelector(
        ".selected-content",
      ) as HTMLElement;

      document.addEventListener("click", (e) => {
        if (
          !customSelect.contains(e.target as Node) &&
          !dropDownMenu.classList.contains("visually-hidden")
        ) {
          toggleMenu();
        }
      });

      selectButton.addEventListener("click", () => {
        toggleMenu();
      });

      searchInput.addEventListener("input", () => {
        currencyOptions.forEach((option) => {
          const optionCode =
            option.getAttribute("data-value")?.toLowerCase() || "";
          if (optionCode.includes(searchInput.value.toLowerCase())) {
            option.classList.remove("visually-hidden");
          } else {
            option.classList.add("visually-hidden");
          }
        });
      });

      currencyOptions.forEach((option) => {
        option.addEventListener("click", () => {
          const optionCode =
            option.getAttribute("data-value")?.toUpperCase() || "";
          if (optionCode !== "") {
            updateCustomSelect(customSelect, optionCode);
            hiddenInput.value = optionCode;
            searchInput.value = "";
            currencyOptions.forEach((option) => {
              option.classList.remove("visually-hidden");
            });
            toggleMenu();
            const formData = getFormValues();
            if (
              !formData.base ||
              !formData.target ||
              formData.base === formData.target
            )
              return;
            getApiData();
            getComparisons();
            updateCompareAmountText(formData.base);
            updateFavoriteButtonState(formData.base, formData.target);
          }
        });
      });
      function toggleMenu() {
        dropDownMenu.classList.toggle("visually-hidden");
        selectButton.classList.toggle("open");
      }
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
      const buttonText = favoriteButton.querySelector(".text") as HTMLElement;
      if (storageManager.hasFavorite(base, target)) {
        favoriteButton.classList.add("active");
        buttonText.textContent = "favorited";
      } else {
        favoriteButton.classList.remove("active");
        buttonText.textContent = "favorite";
      }
    }
  };

  const swapCurrencies = (base: string, target: string) => {
    updateCurrencies(target, base);

    // swap input and output
    const targetVal = outputAmount.value;
    baseAmount.value = targetVal;
  };

  const getApiData = () => {
    const formData = getFormValues();
    if (!formData.base || !formData.target || formData.base === formData.target)
      return;
    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - dateOffsets.get(dateRange));

    updateBaseConversion("Fetching rates...");
    updateFavoriteButtonState(formData.base, formData.target);
    apiController
      .searchHistorical(
        formData.base,
        formData.target,
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0],
      )
      .then((data) => {
        if (data) {
          const lastIndex = data.length - 1;
          updateBaseConversion(
            `1 ${data[lastIndex].base} = ${data[lastIndex].rate.toFixed(4)} ${data[lastIndex].quote}`,
          );
          const baseAmt = Number(baseAmount.value.replace(/[^0-9.]/g, ""));
          if (baseAmt) updateTargetAmount(baseAmt, data[lastIndex].rate);
          if (!baseAmt) updateTargetAmount(0, 1);

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
          chartController.removeData();
          data.forEach((day) => {
            chartController.addData(`${day.date}`, day.rate);
          });
        } else {
          updateBaseConversion("Error fetching rates. Please try again.");
        }
      });
  };

  const getComparisons = () => {
    const formData = getFormValues();
    const quotes = ["GBP", "JPY", "CHF", "CAD", "AUD", "INR", "CNY", "BDT"];

    if (!formData.base) return;

    const baseAmt = Number(baseAmount.value.replace(/[^0-9.]/g, ""));

    if (baseAmt === 0) {
      compareCard.classList.add("visually-hidden");
      return;
    }

    apiController.searchAll(formData.base, quotes).then((data) => {
      if (data) {
        const dailySummaries = summarizeRates(data);
        const listItems = dailySummaries.map((n) => {
          return createComparisonListItem(n, formData.base);
        });
        compareCard.classList.remove("visually-hidden");
        comparisonList.replaceChildren();
        comparePairAmount.textContent = `${dailySummaries.length}`;
        listItems.forEach((item) => comparisonList.appendChild(item));
      }
    });
  };

  const createComparisonListItem = (
    rateSummary: RateSummary,
    base: string,
  ): HTMLElement => {
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
    currencyName.classList.add("muted-text");
    currencyName.textContent = getCurrencyName(rateSummary.quote);

    leftSide.appendChild(flag);
    currencyInfo.appendChild(currency);
    currencyInfo.appendChild(currencyName);
    leftSide.appendChild(currencyInfo);

    const rightSide = document.createElement("div");
    rightSide.classList.add("right-side");
    const rateInfo = document.createElement("div");
    const convertedAmount = document.createElement("p");

    const baseAmt = Number(baseAmount.value.replace(/[^0-9.]/g, ""));
    const result = convertAmount(baseAmt, rateSummary.close);
    convertedAmount.textContent = result.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const rate = document.createElement("p");
    rate.classList.add("muted-text");
    rate.textContent = `@ ${rateSummary.close}`;
    const favoriteButton = document.createElement("button");
    favoriteButton.classList.add("btn", "btn--favorite");
    if (storageManager.hasFavorite(base, rateSummary.quote))
      favoriteButton.classList.add("active");
    favoriteButton.innerHTML = `<div class="star">${starSVG}</div><div class="star-filled">${filledStarSVG}</div>`;
    favoriteButton.addEventListener("click", () => {
      favoriteButton.classList.toggle("active");
      if (storageManager.hasFavorite(base, rateSummary.quote)) {
        storageManager.removeFavorite(base, rateSummary.quote);
      } else {
        storageManager.addFavorite(base, rateSummary.quote);
      }
      updateFavoriteButtonState(base, rateSummary.quote);
      updateFavorites();
    });
    rateInfo.appendChild(convertedAmount);
    rateInfo.appendChild(rate);
    rightSide.appendChild(rateInfo);
    rightSide.appendChild(favoriteButton);

    item.appendChild(leftSide);
    item.appendChild(rightSide);

    item.addEventListener("click", (e) => {
      if (e.target === item) {
        updateCurrencies(base, rateSummary.quote);
      }
    });

    return item;
  };

  const updateCustomSelect = (
    customSelect: HTMLElement,
    newCurrencyCode: string,
  ) => {
    const countryFlag = customSelect.querySelector(".flag") as HTMLImageElement;
    const countryCode = newCurrencyCode.slice(0, 2).toLowerCase();
    countryFlag.src = `/images/flags/${countryCode}.webp`;
    countryFlag.alt = `${countryCode} flag`;
    const currencyCode = customSelect.querySelector(
      ".currency-code",
    ) as HTMLElement;
    currencyCode.textContent = newCurrencyCode;
    customSelect.querySelectorAll(".currency-option")?.forEach((option) => {
      option.setAttribute("data-selected", "false");
      if (option.getAttribute("data-value") === newCurrencyCode) {
        option.setAttribute("data-selected", "true");
      }
    });
  };

  const updateCurrencies = (base: string, target: string) => {
    // TODO: take in rate and update compared amount and 1 base = XX target text
    if (baseSelect.value !== base || targetSelect.value !== target) {
      updateFavoriteButtonState(base, target);
    }

    if (baseSelect.value !== base) {
      baseSelect.value = base;
      updateCustomSelect(baseCustomSelect, base);
    }

    if (targetSelect.value !== target) {
      targetSelect.value = target;
      updateCustomSelect(targetCustomSelect, target);
    }
  };

  const getCurrencyName = (currencyCode: string) => {
    const currency = currencies.find((c) => c.iso_code === currencyCode);
    return currency ? currency.name : "";
  };

  const updateCompareAmountText = (base: string) => {
    const amount = baseAmount.value === "" ? "0" : baseAmount.value;

    compareAmount.textContent = `${amount} FROM ${base}`;
  };

  const updateActiveSection = () => {
    const activeElement = document.getElementById(currentSection);
    if (activeElement) {
      updateElementClasses(tabSections, activeElement, "active");
    }
  };

  const updateFavoriteCount = (amount: number) => {
    if (favoriteCounter) favoriteCounter.textContent = `${amount}`;
  };

  const updateLogCount = () => {
    const amount = storageManager.getLog().length;
    if (logCounter) logCounter.textContent = `${amount}`;
    if (numLogged) numLogged.textContent = `${amount}`;
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
      logList.replaceChildren();
      updateLogCount();
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
    favButton.classList.add("btn", "btn--favorite", "active");
    favButton.innerHTML = `<div class="star">${starSVG}</div><div class="star-filled">${filledStarSVG}</div>`;
    favButton.classList.add("btn");
    favButton.addEventListener("click", () => {
      favoritesList.removeChild(listItem);
      storageManager.removeFavorite(favorite.base, favorite.target);
      const arr = storageManager.getFavorites();
      numFavorites.textContent = `${arr.length}`;
      updateFavoriteCount(arr.length);
      const formData = getFormValues();
      updateFavoriteButtonState(formData.base, formData.target);
      if (arr.length === 0) updateFavorites();
    });
    rightSide.appendChild(favButton);
    listItem.appendChild(rightSide);

    listItem.addEventListener("click", (e) => {
      if (e.target === listItem) {
        updateCurrencies(favorite.base, favorite.target);
      }
    });
    return listItem;
  };

  const createLogListItem = (conversion: any) => {
    const listItem = document.createElement("li");
    listItem.classList.add("card--inner");
    listItem.classList.add("log__item");
    const leftSide = document.createElement("div");
    leftSide.classList.add("logupdateLogCount-item__left-side");
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
    rightContent.innerHTML = `<p>${conversion.sendAmount.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}</p><p class="accent-text">${conversion.receiveAmount.toLocaleString(
      undefined,
      {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      },
    )}</p>`;
    const deleteLogButton = document.createElement("button");
    deleteLogButton.classList.add("btn", "btn--delete");
    deleteLogButton.style.color = "#ffffff";
    deleteLogButton.innerHTML = `<div class="icon">${deleteSVG}</div><div class="icon-filled">${filledDeleteSVG}</div>`;
    deleteLogButton.addEventListener("click", () => {
      storageManager.removeLog(conversion.dateTimeLogged);
      logList.removeChild(listItem);
      updateLogCount();
      if (storageManager.getLog().length === 0) updateConversionLog();
    });
    rightSide.appendChild(rightContent);
    rightSide.appendChild(deleteLogButton);
    listItem.appendChild(rightSide);

    return listItem;
  };

  const getFormValues = () => {
    const formData = new FormData(form);
    const base = formData.get("base")?.toString() ?? "";
    const target = formData.get("target")?.toString() ?? "";
    return { base, target };
  };

  return { initialize };
})();
export default displayController;

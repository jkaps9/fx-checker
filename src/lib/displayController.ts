import { APIController } from "./apiController";
import { convertAmount } from "@utils/fxMath";
import { updateElementClasses } from "@utils/generalUtils";
import type { RateSummary } from "../types/fx";
import { summarizeRates } from "@utils/fxUtils";
import currencies from "@data/currencies.json" with { type: "json" };
import storageManager, { type Favorite, type LogEntry } from "./storageManager";
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
  const tabList = document.querySelector(".tab-list") as HTMLElement;
  const tabDropdownButton = document.getElementById(
    "tab-dropdown",
  ) as HTMLButtonElement;
  const currentTabName = document.getElementById("current-tab") as HTMLElement;

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

  const currencyPair = document.getElementById("currency-pair") as HTMLElement;
  const conversionRate = document.getElementById(
    "conversion-rate",
  ) as HTMLElement;
  const conversionDate = document.getElementById("date-time") as HTMLElement;

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
  const favoritesCard = document.getElementById(
    "favorites-card",
  ) as HTMLElement;

  // log elements
  const logList = document.querySelector(".log__list") as HTMLElement;
  const numLogged = document.getElementById("num-logged") as HTMLElement;
  const logCounter = document.getElementById("log-counter") as HTMLElement;
  const clearLogBtn = document.getElementById("clear-log") as HTMLButtonElement;
  const conversionsCard = document.getElementById("log-card") as HTMLElement;

  // ticker
  const popularCurrencies = currencies.filter((c) => c.popular);
  const allCurrencies = currencies.map((c) => c.iso_code);
  const tickerList = document.querySelector(".ticker__list") as HTMLElement;

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
    storageManager.initialize();
    updateTicker();
    applyUrlPair();
    let formData = getFormValues();
    refreshForNewPair(formData.base, formData.target);
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

      formData = getFormValues();
      target.value = `${getCurrencySymbol(formData.base)}${parts.join(".")}`;
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

      const baseAmt = getBaseAmount();
      if (baseAmt === 0) logConversionButton.disabled = true;
      else logConversionButton.disabled = false;

      const currencySymbol = getCurrencySymbol(formData.target);
      if (baseAmt) {
        updateTargetAmount(currencySymbol, baseAmt, apiController.rate);
      } else {
        updateTargetAmount(currencySymbol, 0, 1);
      }
      getComparisons();
      updateCompareAmountText(formData.base);
    });

    tabButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        updateElementClasses(tabButtons, btn, "active");
        tabButtons.forEach((b) => {
          b.setAttribute("tabindex", "-1");
          b.setAttribute("aria-selected", "false");
        });
        btn.setAttribute("tabindex", "0");
        btn.setAttribute("aria-selected", "true");
        currentSection = btn.getAttribute("data-tab") ?? "";
        updateActiveSection();
        tabList.classList.remove("active");
        currentTabName.innerHTML = btn.innerHTML;
      });
    });

    tabDropdownButton.addEventListener("click", () => {
      tabList.classList.toggle("active");
      tabDropdownButton.classList.toggle("open");
    });

    currencySwapBtn.addEventListener("click", () => {
      const formData = getFormValues();
      swapCurrencies(formData.base, formData.target);
      refreshForNewPair(formData.target, formData.base);
    });

    favoriteButton.addEventListener("click", () => {
      const formData = getFormValues();
      if (formData.base && formData.target) {
        toggleFavorite(formData.base, formData.target);
      }
    });

    logConversionButton.addEventListener("click", () => {
      const now = new Date().toISOString();
      const formData = getFormValues();
      const sendAmount = getBaseAmount();
      const receiveAmount = Number(outputAmount.value.replace(/[^0-9.]/g, ""));
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
        alert("invalid log value - check console");
        console.error(
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
      const currencyOptions = Array.from(
        dropDownMenu.querySelectorAll<HTMLElement>(".currency-option"),
      );
      const selectedContent = customSelect.querySelector(
        ".selected-content",
      ) as HTMLElement;

      let activeIndex = -1;

      // Helper functions
      function visibleOptions() {
        return currencyOptions.filter((option) => !option.hidden);
      }

      function setActiveDescendant(index: number) {
        const options = visibleOptions();
        options.forEach((option) => option.classList.remove("highlighted"));
        activeIndex = index;
        if (index >= 0 && options[index]) {
          options[index].classList.add("highlighted");
          searchInput.setAttribute("aria-activedescendant", options[index].id);
          options[index].scrollIntoView({ block: "nearest" });
        } else {
          searchInput.removeAttribute("aria-activedescendant");
        }
      }

      function isOpen() {
        return !dropDownMenu.hidden;
      }

      function openMenu() {
        dropDownMenu.hidden = false;
        selectButton.classList.add("open");
        selectButton.setAttribute("aria-expanded", "true");
        searchInput.focus();
        const selected = visibleOptions().findIndex(
          (option) => option.getAttribute("aria-selected") === "true",
        );
        setActiveDescendant(selected);
      }

      function closeMenu(returnFocus = true) {
        dropDownMenu.hidden = true;
        selectButton.classList.remove("open");
        selectButton.setAttribute("aria-expanded", "false");
        searchInput.removeAttribute("aria-activedescendant");
        activeIndex = -1;
        if (returnFocus) selectButton.focus();
      }

      function toggleMenu() {
        isOpen() ? closeMenu(false) : openMenu();
      }

      function selectOption(option: HTMLElement) {
        const optionCode =
          option.getAttribute("data-value")?.toUpperCase() || "";
        if (optionCode === "") return;

        updateCustomSelect(customSelect, optionCode);
        hiddenInput.value = optionCode;

        searchInput.value = "";
        currencyOptions.forEach((opt) => (opt.hidden = false));
        closeMenu();

        const formData = getFormValues();
        if (
          !formData.base ||
          !formData.target ||
          formData.base === formData.target
        ) {
          return;
        }
        refreshForNewPair(formData.base, formData.target);
      }

      // Listeners

      document.addEventListener("click", (e) => {
        if (!customSelect.contains(e.target as Node) && isOpen()) {
          closeMenu(false);
        }
      });

      selectButton.addEventListener("click", () => {
        toggleMenu();
      });

      searchInput.addEventListener("input", () => {
        const query = searchInput.value.toLowerCase();

        currencyOptions.forEach((option) => {
          const optionCode =
            option.getAttribute("data-value")?.toLowerCase() || "";
          const currencyNameField = option.querySelector(
            ".currency-name",
          ) as HTMLElement;
          const optionName =
            currencyNameField?.textContent?.toLowerCase() || "";
          option.hidden = !(
            optionCode.includes(query) || optionName.includes(query)
          );
        });
        setActiveDescendant(-1);
      });

      currencyOptions.forEach((option) => {
        option.addEventListener("click", () => selectOption(option));
      });

      // Keyboard support
      selectButton.addEventListener("keydown", (e) => {
        if (isOpen()) return;
        switch (e.key) {
          case "ArrowDown":
          case "ArrowUp":
          case "Enter":
          case " ":
            e.preventDefault();
            openMenu();
            break;
        }
      });

      searchInput.addEventListener("keydown", (e) => {
        const options = visibleOptions();
        switch (e.key) {
          case "ArrowDown":
            e.preventDefault();
            setActiveDescendant(Math.min(activeIndex + 1, options.length - 1));
            break;
          case "ArrowUp":
            e.preventDefault();
            setActiveDescendant(Math.max(activeIndex - 1, 0));
            break;
          case "Home":
            e.preventDefault();
            setActiveDescendant(0);
            break;
          case "End":
            e.preventDefault();
            setActiveDescendant(options.length - 1);
            break;
          case "Enter":
            e.preventDefault();
            if (options[activeIndex]) selectOption(options[activeIndex]);
            break;
          case "Escape":
            closeMenu();
            break;
          case "Tab":
            closeMenu();
            break;
        }
      });
    });
  };

  const updateBaseConversion = (str: string) => {
    results.textContent = str;
  };

  const updateHistoryChartHeader = (
    base: string,
    target: string,
    rate: string,
  ) => {
    currencyPair.textContent = `${base}/${target}`;
    conversionRate.textContent = `${rate}`;
    const date = new Date();
    const month = date
      .toLocaleString("en-US", { month: "short" })
      .toUpperCase();
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    const tZone =
      String(date.toLocaleString("en-us", { timeZoneName: "short" }))
        .trim()
        .split(/\s+/)
        .at(-1) ?? "";

    conversionDate.textContent = `${month} ${day} ${hours}:${minutes} ${tZone}`;
  };

  const updateTargetAmount = (symbol: string, amount: number, rate: number) => {
    const result = convertAmount(amount, rate) || 0;
    outputAmount.value = `${symbol}${formatAmount(result)}`;

    if (result !== 0) outputAmount.classList.add("accent-text");
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

  const getRate = () => {
    const formData = getFormValues();
    if (!formData.base || !formData.target) return 0;
    if (formData.base === formData.target) return 1;

    updateBaseConversion("Fetching rates...");
    updateFavoriteButtonState(formData.base, formData.target);

    apiController.search(formData.base, formData.target).then((data) => {
      if (data) {
        updateBaseConversion(
          `1 ${data.base} = ${data.rate.toFixed(4)} ${data.quote}`,
        );
        updateHistoryChartHeader(data.base, data.quote, data.rate.toFixed(4));
        const currencySymbol = getCurrencySymbol(data.quote);
        const baseAmt = getBaseAmount();
        if (baseAmt) updateTargetAmount(currencySymbol, baseAmt, data.rate);
        if (!baseAmt) updateTargetAmount(currencySymbol, 0, 1);
      } else {
        updateBaseConversion("Error fetching rates. Please try again.");
      }
    });
  };

  const getApiData = () => {
    const formData = getFormValues();
    if (!formData.base || !formData.target || formData.base === formData.target)
      return;
    const endDate = new Date();
    const startDate = new Date();

    startDate.setDate(startDate.getDate() - dateOffsets.get(dateRange));

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

          const open = data[0].rate;
          const close = data[lastIndex].rate;
          const change = close - open;
          const changePercentage = (change / open) * 100;
          openAmountPara.textContent = `${open.toFixed(4)}`;
          closeAmountPara.textContent = `${close.toFixed(4)}`;
          changeAmountPara.textContent = `${change.toFixed(4)}`;
          const trendDisplay = getTrendDisplay(change);
          changeAmountPara.className = trendDisplay.className;

          changePercentagePara.textContent = `${trendDisplay.icon} ${change > 0 ? "+" : ""}${changePercentage.toFixed(2)}%`;
          changePercentagePara.className = trendDisplay.className;
          chartController.removeData();
          data.forEach((day) => {
            chartController.addData(`${day.date}`, day.rate);
          });
        }
      });
  };

  const getComparisons = () => {
    const formData = getFormValues();
    const quotes = ["GBP", "JPY", "CHF", "CAD", "AUD", "INR", "CNY", "BDT"];

    if (!formData.base) return;

    const baseAmt = getBaseAmount();

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
    flag.src = getFlagPath(rateSummary.quote);
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

    const baseAmt = getBaseAmount();
    const result = convertAmount(baseAmt, rateSummary.close);

    convertedAmount.textContent =
      getCurrencySymbol(rateSummary.quote) + formatAmount(result);
    const rate = document.createElement("p");
    rate.classList.add("muted-text");
    rate.textContent = `@ ${rateSummary.close}`;
    const favoriteButton = document.createElement("button");
    favoriteButton.classList.add("btn", "btn--favorite");
    if (storageManager.hasFavorite(base, rateSummary.quote))
      favoriteButton.classList.add("active");
    favoriteButton.ariaLabel = "toggle favorite";
    favoriteButton.innerHTML = `<div class="star">${starSVG}</div><div class="star-filled">${filledStarSVG}</div>`;
    favoriteButton.addEventListener("click", (e) => {
      e.stopPropagation();
      favoriteButton.classList.toggle("active");
      toggleFavorite(base, rateSummary.quote);
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
    countryFlag.src = getFlagPath(newCurrencyCode);
    countryFlag.alt = "";

    const currencyCode = customSelect.querySelector(
      ".currency-code",
    ) as HTMLElement;
    currencyCode.textContent = newCurrencyCode;

    const selectButton = customSelect.querySelector(
      ".select-button",
    ) as HTMLButtonElement;
    const hiddenInput = customSelect.querySelector(
      'input[type="hidden"]',
    ) as HTMLInputElement;
    const label = hiddenInput.name === "base" ? "Base" : "Target";
    selectButton.setAttribute(
      "aria-label",
      `${label} currency, currently ${newCurrencyCode}`,
    );

    customSelect.querySelectorAll(".currency-option")?.forEach((option) => {
      const isSelected = option.getAttribute("data-value") === newCurrencyCode;
      option.setAttribute("aria-selected", String(isSelected));
    });
  };

  const updateCurrencies = (base: string, target: string) => {
    const validCurrencyCodes = new Set(currencies.map((c) => c.iso_code));

    if (
      !validCurrencyCodes.has(base.toUpperCase()) ||
      !validCurrencyCodes.has(target.toUpperCase())
    ) {
      return;
    }

    if (baseSelect.value !== base || targetSelect.value !== target) {
      updateFavoriteButtonState(base, target);
      const url = new URL(window.location.href);
      url.searchParams.set("base", base);
      url.searchParams.set("target", target);
      history.replaceState(null, "", url);
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
      updateFavoriteCount(favoritesArr.length);

      if (favoritesArr.length > 0) {
        favoritesCard.classList.remove("visually-hidden");
        favoritesList.replaceChildren();
        favoritesArr.forEach((favorite) => {
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
      if (conversionArr.length > 0) {
        conversionsCard.classList.remove("visually-hidden");
        conversionArr.sort((a, b) => {
          const dateA = new Date(a.dateTimeLogged).getTime();
          const dateB = new Date(b.dateTimeLogged).getTime();
          return dateB - dateA;
        });
        conversionArr.forEach((conversion) => {
          const listItem = createLogListItem(conversion);
          logList.appendChild(listItem);
        });
      } else {
        conversionsCard.classList.add("visually-hidden");
      }
    }
  };

  const createFavoriteListItem = (favorite: Favorite) => {
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
          const trendDisplay = getTrendDisplay(change);
          rightContent.innerHTML = `<p>${close.toFixed(decimals)}</p>
      <p class="percent-change ${trendDisplay.className}">
        <span>${trendDisplay.icon}</span>
         ${changePercentage > 0 ? "+" : ""}${changePercentage.toFixed(2)}%</p>`;
        }
      });

    const favButton = document.createElement("button");
    favButton.classList.add("btn", "btn--favorite", "active");
    favButton.ariaLabel = "unfavorite currency pair";
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

  const createLogListItem = (conversion: LogEntry) => {
    const listItem = document.createElement("li");
    listItem.classList.add("card--inner");
    listItem.classList.add("log__item");

    const timeDiff = document.createElement("p");
    timeDiff.classList.add("log-item__time-diff", "muted-text");
    const currentTime = new Date();
    const logDate = new Date(conversion.dateTimeLogged);
    timeDiff.textContent = `${calculateTimeDiff(logDate, currentTime)}`;
    listItem.appendChild(timeDiff);
    const currencyPair = document.createElement("div");
    currencyPair.classList.add("log-item__currency-pair");
    currencyPair.innerHTML = `<p>${conversion.base}</p><span>-></span><p>${conversion.target}</p>`;
    listItem.appendChild(currencyPair);

    const rightContent = document.createElement("div");
    rightContent.classList.add("log-item__amounts");
    rightContent.innerHTML = `<p class="muted-text">${formatAmount(conversion.sendAmount)}</p><p class="accent-text">${formatAmount(conversion.receiveAmount)}</p>`;
    const deleteLogButton = document.createElement("button");
    deleteLogButton.classList.add("btn", "btn--delete");
    deleteLogButton.ariaLabel = "delete log item";
    deleteLogButton.innerHTML = `<div class="icon">${deleteSVG}</div><div class="icon-filled">${filledDeleteSVG}</div>`;
    deleteLogButton.addEventListener("click", (e) => {
      e.stopPropagation();
      storageManager.removeLog(conversion.dateTimeLogged);
      logList.removeChild(listItem);
      updateLogCount();
      if (storageManager.getLog().length === 0) updateConversionLog();
    });

    listItem.appendChild(rightContent);
    listItem.appendChild(deleteLogButton);

    return listItem;
  };

  const getFormValues = () => {
    const formData = new FormData(form);
    const base = formData.get("base")?.toString() ?? "";
    const target = formData.get("target")?.toString() ?? "";
    return { base, target };
  };

  const calculateTimeDiff = (startDate: Date, endDate: Date) => {
    const diffInMs = endDate.getTime() - startDate.getTime();
    if (diffInMs < 60000) {
      return "<1M";
    } else if (diffInMs < 3600000) {
      const minutes = Math.floor(diffInMs / 60000);
      return `${minutes}M`;
    } else if (diffInMs < 86400000) {
      const minutes = Math.floor(diffInMs / 60000);
      const hours = Math.floor(minutes / 60);
      return `${hours}H`;
    } else {
      const day: number = startDate.getDate();
      const monthName: string = startDate.toLocaleDateString("en-US", {
        month: "short",
      });

      return `${day} ${monthName}`;
    }
  };

  const symbolByCode = new Map(currencies.map((c) => [c.iso_code, c.symbol]));

  const getCurrencySymbol = (isoCode: string): string => {
    const symbol = symbolByCode.get(isoCode.toUpperCase()) || "";
    return symbol;
  };

  const refreshForNewPair = (base: string, target: string) => {
    getRate();
    getApiData();
    getComparisons();
    updateCompareAmountText(base);
    updateFavoriteButtonState(base, target);
  };

  const formatAmount = (amount: number): string =>
    amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

  const toggleFavorite = (base: string, target: string): boolean => {
    const isFavorite = storageManager.hasFavorite(base, target);
    if (isFavorite) storageManager.removeFavorite(base, target);
    else storageManager.addFavorite(base, target);

    updateFavoriteButtonState(base, target);
    updateFavorites();

    return !isFavorite;
  };

  const getBaseAmount = (): number =>
    Number(baseAmount.value.replace(/[^0-9.]/g, ""));

  const getFlagPath = (currencyCode: string): string =>
    `/fx-checker/images/flags/${currencyCode.slice(0, 2).toLowerCase()}.webp`;

  const getTrendDisplay = (value: number) => {
    const className = `${value > 0 ? "positive" : value < 0 ? "negative" : ""}`;
    const icon = value > 0 ? "▲" : value < 0 ? "▼" : "";
    return {
      className,
      icon,
    };
  };

  const updateTicker = () => {
    popularCurrencies.forEach((currency) => {
      apiController
        .fetchTickerRates(currency.iso_code, allCurrencies)
        .then((data) => {
          if (data) {
            const dailySummaries = summarizeRates(data);
            const listItems = dailySummaries.map((n) => {
              const item = document.createElement("li");

              const currencyPair = document.createElement("span");
              currencyPair.className = "currency-pair muted-text";
              currencyPair.textContent = `${currency.iso_code}/${n.quote}`;

              const currencyRate = document.createElement("span");
              currencyRate.className = "rate";
              currencyRate.textContent = `${n.close}`;

              const trendDisplay = getTrendDisplay(n.changeAmount);
              const trend = document.createElement("span");
              trend.className = trendDisplay.className;
              trend.textContent = trendDisplay.icon;

              const percentChange = document.createElement("span");
              percentChange.className = trendDisplay.className;
              percentChange.textContent = `${n.changePercent > 0 ? "+" : ""}${n.changePercent}%`;

              item.appendChild(currencyPair);
              item.appendChild(currencyRate);
              item.appendChild(trend);
              item.appendChild(percentChange);
              return item;
            });

            listItems.forEach((item) => tickerList.appendChild(item));
          }
        });
    });
  };

  const applyUrlPair = () => {
    const parameters = new URLSearchParams(window.location.search);
    const base = parameters.get("base")?.toUpperCase();
    const target = parameters.get("target")?.toUpperCase();
    if (base && target && base !== target) {
      updateCurrencies(base, target);
    }
  };

  return { initialize };
})();
export default displayController;

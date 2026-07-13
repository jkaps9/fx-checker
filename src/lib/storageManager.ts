const storageManager = (function () {
  let favorites: string[] = [];
  let conversionLog: {
    dateTimeLogged: string;
    base: string;
    target: string;
    sendAmount: number;
    receiveAmount: number;
  }[] = [];

  const isStorageAvailable = () => {
    let storage;
    try {
      storage = window["localStorage"];
      const x = "__storage_test__";
      storage.setItem(x, x);
      storage.removeItem(x);
      return true;
    } catch (e) {
      return (
        e instanceof DOMException &&
        e.name === "QuotaExceededError" &&
        // acknowledge QuotaExceededError only if there's something already stored
        storage &&
        storage.length !== 0
      );
    }
  };

  const addFavorite = (base: string, target: string) => {
    if (isStorageAvailable()) {
      const item = `${base}/${target}`;
      if (favorites.indexOf(item) === -1) {
        favorites.push(item);
        localStorage.setItem("favorites", JSON.stringify([...favorites]));
      }
    }
  };

  const removeFavorite = (base: string, target: string) => {
    if (isStorageAvailable()) {
      const item = `${base}/${target}`;
      const index = favorites.indexOf(item);
      if (index !== -1) {
        favorites.splice(index, 1);
        localStorage.setItem("favorites", JSON.stringify(favorites));
      }
    }
  };

  const hasFavorite = (base: string, target: string) => {
    if (isStorageAvailable()) {
      const item = `${base}/${target}`;
      return favorites.indexOf(item) !== -1;
    } else {
      return false;
    }
  };

  const getFavorites = () => {
    const arr = [...favorites];
    return arr.map((value) => {
      return {
        base: value.split("/")[0],
        target: value.split("/")[1],
      };
    });
  };

  const addLog = (
    dateTimeLogged: string,
    base: string,
    target: string,
    sendAmount: number,
    receiveAmount: number,
  ) => {
    if (isStorageAvailable()) {
      const item = {
        dateTimeLogged: dateTimeLogged,
        base: base,
        target: target,
        sendAmount: sendAmount,
        receiveAmount: receiveAmount,
      };
      conversionLog.push(item);
      localStorage.setItem("conversionLog", JSON.stringify(conversionLog));
    }
  };

  const removeLog = (dateTimeLogged: string) => {
    if (isStorageAvailable()) {
      const index = conversionLog.findIndex(
        (logItem) => logItem.dateTimeLogged === dateTimeLogged,
      );
      if (index !== -1) {
        conversionLog.splice(index, 1);
        localStorage.setItem("conversionLog", JSON.stringify(conversionLog));
      } else {
        console.error("log item not found");
      }
    }
  };

  const clearLog = () => {
    conversionLog = [];
    localStorage.setItem("conversionLog", JSON.stringify(conversionLog));
  };

  const hasLog = (dateTimeLogged: string) => {
    const index = conversionLog.findIndex(
      (logItem) => logItem.dateTimeLogged === dateTimeLogged,
    );

    return index !== -1;
  };

  const getLog = () => {
    const arr = [...conversionLog];
    return arr;
  };

  const initialize = () => {
    if (isStorageAvailable()) {
      const storedFavorites = localStorage.getItem("favorites");
      if (storedFavorites) {
        favorites = JSON.parse(storedFavorites);
      }

      const storedLog = localStorage.getItem("conversionLog");
      if (storedLog) {
        conversionLog = JSON.parse(storedLog);
      }
    }
  };

  return {
    addFavorite,
    removeFavorite,
    getFavorites,
    hasFavorite,
    addLog,
    removeLog,
    clearLog,
    hasLog,
    getLog,
    initialize,
  };
})();

export default storageManager;

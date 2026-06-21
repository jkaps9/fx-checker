const storageManager = (function () {
  const favorites = new Set<string>();
  const conversionLog: {
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
      if (!favorites.has(item)) {
        favorites.add(item);
        localStorage.setItem("favorites", JSON.stringify(favorites));
      }
    }
  };

  const removeFavorite = (base: string, target: string) => {
    if (isStorageAvailable()) {
      const item = `${base}/${target}`;
      if (favorites.has(item)) {
        favorites.delete(item);
        localStorage.setItem("favorites", JSON.stringify(favorites));
      }
    }
  };

  const hasFavorite = (base: string, target: string) => {
    if (isStorageAvailable()) {
      const item = `${base}/${target}`;
      return favorites.has(item);
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

  return { addFavorite, removeFavorite, getFavorites, hasFavorite };
})();

export default storageManager;

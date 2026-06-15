import fs from "node:fs/promises";
import path from "node:path";

const flags = [
  "ae",
  "ar",
  "au",
  "bd",
  "bg",
  "bh",
  "br",
  "ca",
  "ch",
  "cl",
  "cn",
  "co",
  "cy",
  "cz",
  "dk",
  "eg",
  "eu",
  "gb",
  "hk",
  "hm",
  "hn",
  "hr",
  "ht",
  "hu",
  "id",
  "in",
  "is",
  "jo",
  "jp",
  "ke",
  "kr",
  "kw",
  "lb",
  "lc",
  "lk",
  "ma",
  "mx",
  "my",
  "ng",
  "no",
  "np",
  "nz",
  "om",
  "pe",
  "ph",
  "pk",
  "pl",
  "qa",
  "ro",
  "ru",
  "sa",
  "se",
  "sg",
  "th",
  "tr",
  "tw",
  "ua",
  "us",
  "vn",
  "za",
];

async function fetchCurrencies() {
  const url = "https://api.frankfurter.dev/v2/currencies";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    const resultsWithFlags = result.filter((r) =>
      flags.includes(r.iso_code.slice(0, 2).toLowerCase()),
    );
    const directory = path.join(process.cwd(), "src", "data");
    //   create directory if it does not exist
    await fs.mkdir(directory, { recursive: true });
    const filePath = path.join(directory, "currencies.json");
    await fs.writeFile(filePath, JSON.stringify(resultsWithFlags, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

fetchCurrencies();

async function listFlags() {
  const directory = path.join(
    process.cwd(),
    "src",
    "assets",
    "images",
    "flags",
  );
  try {
    const files = await fs.readdir(directory);
    console.log(files.map((n) => n.replace(".webp", "")));
  } catch (err) {
    console.error(err);
  }
}

// listFlags();

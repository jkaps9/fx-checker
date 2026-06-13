import fs from "node:fs/promises";
import path from "node:path";

async function fetchCurrencies() {
  const url = "https://api.frankfurter.dev/v2/currencies";
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Response status: ${response.status}`);
    }

    const result = await response.json();
    const directory = path.join(process.cwd(), "src", "data");
    //   create directory if it does not exist
    await fs.mkdir(directory, { recursive: true });
    const filePath = path.join(directory, "currencies.json");
    await fs.writeFile(filePath, JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

fetchCurrencies();

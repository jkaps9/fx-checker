import { APIController } from "./apiController";

const displayController = (function () {
  const form = document.getElementById("fx-input") as HTMLFormElement;
  const apiController = new APIController();
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
    });
  };

  const updateBaseConversion = (str: string) => {
    results.textContent = str;
  };

  return { initizalize };
})();
export default displayController;

const displayController = (function () {
  const form = document.getElementById("fx-input") as HTMLFormElement;

  const initizalize = () => {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
    });

    form.addEventListener("input", () => {
      const formData = new FormData(form);
      const base = formData.get("base")?.toString();
      const target = formData.get("target")?.toString();

      if (!base || !target || base === target) return;
      alert("hello");
    });
  };

  return { initizalize };
})();
export default displayController;

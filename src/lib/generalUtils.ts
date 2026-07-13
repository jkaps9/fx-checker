export function updateElementClasses(
  elementList: NodeListOf<Element>,
  activeElement: Element,
  className: string,
) {
  elementList.forEach((btn) => btn.classList.remove(className));
  activeElement.classList.add(className);
}

export function getCountryName(countryCode: string) {
  const countryNames = new Intl.DisplayNames(["en"], { type: "region" });

  try {
    return countryNames.of(countryCode.toUpperCase()) ?? "";
  } catch {
    return "";
  }
}

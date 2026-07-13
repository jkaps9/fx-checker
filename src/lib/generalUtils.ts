export function updateElementClasses(
  elementList: NodeListOf<Element>,
  activeElement: Element,
  className: string,
) {
  elementList.forEach((btn) => btn.classList.remove(className));
  activeElement.classList.add(className);
}

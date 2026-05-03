export function debounce<T extends (...args: never[]) => void>(
  fn: T,
  delay: number
): T & { cancel(): void } {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...(args as never[])), delay);
  };

  debounced.cancel = () => clearTimeout(timer);

  return debounced as unknown as T & { cancel(): void };
}

export function createObserver(
  target: Element,
  callback: () => void,
  delay: number
): MutationObserver {
  const debouncedCallback = debounce(callback, delay);

  const observer = new MutationObserver(debouncedCallback);
  observer.observe(target, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: false,
  });

  return observer;
}

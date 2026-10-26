import type { KeyboardEvent } from "react";

export function handleScrollableMenuKeyDown(event: KeyboardEvent<HTMLDivElement>) {
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  const options = Array.from(event.currentTarget.querySelectorAll<HTMLButtonElement>('button[role="option"]'));
  if (!options.length) return;
  const currentIndex = options.findIndex((option) => option === document.activeElement);
  const nextIndex = event.key === "ArrowDown"
    ? Math.min(currentIndex + 1, options.length - 1)
    : Math.max(currentIndex > -1 ? currentIndex - 1 : options.length - 1, 0);
  event.preventDefault();
  options[nextIndex].focus();
  options[nextIndex].scrollIntoView({ block: "nearest" });
}

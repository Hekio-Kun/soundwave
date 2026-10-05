import { useEffect } from "react";

// Global counter to handle multiple nested or sequential modals cleanly
let activeModalsCount = 0;

interface ScrollContainerRecord {
  element: HTMLElement;
  originalOverflow: string;
  originalOverscroll: string;
}

const lockedContainers: ScrollContainerRecord[] = [];

/**
 * Custom hook to lock background scrolling when a modal or dialog is open.
 * Strictly adheres to SoundWave Frontend Rule 4.7.
 *
 * It locks:
 * 1. `document.body` and `document.documentElement`
 * 2. `.ops-shell-content` (Staff & Admin Operations Dashboard)
 * 3. `.app-scroll-region` (Client Music Streaming App Shell)
 * 4. Adds CSS class `modal-open` for immediate style-based scroll disabling
 */
export function useModalScrollLock(isOpen: boolean) {
  useEffect(() => {
    if (!isOpen) return;

    activeModalsCount++;

    if (activeModalsCount === 1) {
      // Add global class to html and body
      document.documentElement.classList.add("modal-open");
      document.body.classList.add("modal-open");

      // Query all known scroll containers in SoundWave
      const containersToLock: HTMLElement[] = [
        document.documentElement,
        document.body,
        ...Array.from(document.querySelectorAll<HTMLElement>(".ops-shell-content")),
        ...Array.from(document.querySelectorAll<HTMLElement>(".app-scroll-region")),
        ...Array.from(document.querySelectorAll<HTMLElement>(".ops-shell-main")),
      ];

      containersToLock.forEach((el) => {
        lockedContainers.push({
          element: el,
          originalOverflow: el.style.overflow,
          originalOverscroll: el.style.overscrollBehavior,
        });
        el.style.overflow = "hidden";
        el.style.overscrollBehavior = "none";
      });
    }

    return () => {
      activeModalsCount = Math.max(0, activeModalsCount - 1);

      if (activeModalsCount === 0) {
        document.documentElement.classList.remove("modal-open");
        document.body.classList.remove("modal-open");

        while (lockedContainers.length > 0) {
          const item = lockedContainers.pop();
          if (item?.element) {
            item.element.style.overflow = item.originalOverflow;
            item.element.style.overscrollBehavior = item.originalOverscroll;
          }
        }
      }
    };
  }, [isOpen]);
}

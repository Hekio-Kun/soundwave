import { useLayoutEffect } from "react";

const REVEAL_SELECTOR = [
  ".sw-section",
  ".sw-track-card",
  ".sw-album-card",
  ".sw-creator-card",
  ".sw-release-row",
  ".sw-genre-grid > button",
  ".track-content-grid > *",
  ".track-context-column > *",
  ".library-page > *",
  ".genres-page > *",
  ".search-page > *",
  ".studio-page > *",
  ".album-details-page > *",
  ".creator-profile-page > *",
  ".ops-card",
  ".ops-stat-card",
  ".ops-review-row",
  ".auth-v2-card > *",
].join(",");

/** Kích hoạt hiệu ứng xuất hiện khi nội dung đi vào vùng nhìn thấy. */
export function useMotionReveal(routeKey: string) {
  useLayoutEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(REVEAL_SELECTOR));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    elements.forEach((element, index) => {
      element.classList.add("motion-reveal");
      element.style.setProperty("--motion-delay", `${(index % 6) * 42}ms`);
      element.style.setProperty("--motion-shift", index % 2 === 0 ? "10px" : "14px");
    });

    if (reduceMotion || !("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-motion-visible"));
      return;
    }

    const scrollRoot = document.getElementById("app-scroll-region");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-motion-visible");
          observer.unobserve(entry.target);
        });
      },
      {
        root: scrollRoot,
        rootMargin: "0px 0px -7% 0px",
        threshold: 0.08,
      },
    );

    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [routeKey]);
}

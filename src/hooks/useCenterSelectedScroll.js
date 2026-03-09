import { useLayoutEffect, useRef } from "react";

export function useCenterSelectedScroll({
  barWidth,
  containerWidth,
  contentWidth,
  gap,
  leftPad,
  scrollable,
  selectedIndex,
}) {
  const scrollRef = useRef(null);

  useLayoutEffect(() => {
    if (!scrollable || selectedIndex < 0 || !scrollRef.current) return undefined;

    const container = scrollRef.current;
    const itemCenter = leftPad + selectedIndex * (barWidth + gap) + barWidth / 2;
    const maxScroll = Math.max(0, container.scrollWidth - container.clientWidth);
    const targetLeft = Math.max(0, Math.min(maxScroll, itemCenter - container.clientWidth / 2));
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let animationFrame = 0;
    let timeoutId = 0;

    const run = () => {
      if (prefersReducedMotion) {
        container.scrollLeft = targetLeft;
        return;
      }

      const startLeft = container.scrollLeft;
      const distance = targetLeft - startLeft;
      if (Math.abs(distance) < 2) {
        container.scrollLeft = targetLeft;
        return;
      }

      const start = performance.now();
      const duration = 320;

      const step = (now) => {
        const elapsed = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - elapsed, 3);
        container.scrollLeft = startLeft + distance * eased;
        if (elapsed < 1) {
          animationFrame = requestAnimationFrame(step);
        }
      };

      animationFrame = requestAnimationFrame(step);
    };

    animationFrame = requestAnimationFrame(run);
    timeoutId = window.setTimeout(run, 80);

    return () => {
      cancelAnimationFrame(animationFrame);
      window.clearTimeout(timeoutId);
    };
  }, [barWidth, containerWidth, contentWidth, gap, leftPad, scrollable, selectedIndex]);

  return scrollRef;
}

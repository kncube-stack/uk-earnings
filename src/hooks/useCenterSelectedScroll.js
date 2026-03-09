import { useLayoutEffect, useRef } from "react";

export function useCenterSelectedScroll({
  barWidth,
  containerWidth,
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

    const frame = requestAnimationFrame(() => {
      container.scrollTo({
        left: targetLeft,
        behavior: prefersReducedMotion ? "auto" : "smooth",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [barWidth, containerWidth, gap, leftPad, scrollable, selectedIndex]);

  return scrollRef;
}

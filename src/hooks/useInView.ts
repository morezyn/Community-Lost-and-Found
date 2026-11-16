"use client";

import { useEffect, useState, type RefObject } from "react";

interface UseInViewOptions {
  threshold?: number | number[];
  rootMargin?: string;
  once?: boolean;
}

export function useInView<T extends Element>(
  ref: RefObject<T | null>,
  { threshold = 0.15, rootMargin = "0px 0px -40px 0px", once = true }: UseInViewOptions = {},
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (once && inView) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin, once, inView]);

  return inView;
}

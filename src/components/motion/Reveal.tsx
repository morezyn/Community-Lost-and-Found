"use client";

import {
  Children,
  cloneElement,
  createElement,
  isValidElement,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";

interface RevealProps {
  children: ReactNode;
  delay?: number; // ms (use for stagger)
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span";
}

export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const [mounted, setMounted] = useState(false);
  const [shown, setShown] = useState(true); // visible on server/first paint to avoid hydration mismatch

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const el = ref.current;
    if (!el) return;

    // Skip animation entirely if the user prefers reduced motion
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(true);
      return;
    }

    // Start hidden, then reveal when in view (animate once).
    setShown(false);

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [mounted]);

  const style: CSSProperties = { transitionDelay: `${delay}ms` };

  return createElement(
    as,
    {
      ref,
      style,
      className: cn(
        // Only apply reveal transition behavior after mount to avoid hiding SSR content.
        mounted && "transition-all duration-reveal ease-out-soft will-change-transform",
        mounted && !shown ? "opacity-0 translate-y-6" : "opacity-100 translate-y-0",
        className,
      ),
    },
    children,
  );
}

interface StaggerGroupProps {
  children: ReactNode;
  /** Base delay in ms before the first item. */
  baseDelay?: number;
  /** Delay step between items in ms (capped total stagger in Reveal usage via caller). */
  step?: number;
  className?: string;
}

/**
 * Convenience helper that clones direct Reveal children and assigns staggered delays.
 * Non-Reveal children are passed through unchanged.
 */
export function StaggerGroup({
  children,
  baseDelay = 0,
  step = 70,
  className,
}: StaggerGroupProps) {
  let revealIndex = 0;
  const content = Children.map(children, (child) => {
    if (isValidElement(child) && child.type === Reveal) {
      const element = child as ReactElement<{ delay?: number }>;
      const existingDelay = element.props.delay ?? 0;
      const delay = Math.min(baseDelay + revealIndex * step, baseDelay + 500) + existingDelay;
      revealIndex += 1;
      return cloneElement(element, { delay });
    }
    return child;
  });

  if (className) {
    return <div className={className}>{content}</div>;
  }
  return <>{content}</>;
}

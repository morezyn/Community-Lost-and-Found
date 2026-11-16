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
import { useMotionEnabled } from "@/hooks/useMotionEnabled";

interface RevealProps {
  children: ReactNode;
  delay?: number; // ms (use for stagger)
  className?: string;
  as?: "div" | "section" | "li" | "article" | "span";
}

type RevealState = "visible" | "hidden" | "shown";

/**
 * Scroll reveal (ANIMATIONS.md 5.2 / 6.1).
 *
 * Starts visible so SSR, no-JS, mobile, and reduced-motion users always see the
 * content. Only after mount, and only when motion is enabled, does it hide and
 * wait for the element to enter the viewport. It animates once and never
 * replays when scrolling back up.
 */
export function Reveal({
  children,
  delay = 0,
  className = "",
  as = "div",
}: RevealProps) {
  const ref = useRef<HTMLElement | null>(null);
  const motionEnabled = useMotionEnabled();
  const [state, setState] = useState<RevealState>("visible");

  useEffect(() => {
    if (!motionEnabled) {
      setState("visible");
      return;
    }

    const el = ref.current;
    if (!el) return;

    setState("hidden");
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("shown");
          observer.disconnect(); // animate once only
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [motionEnabled]);

  const style: CSSProperties = motionEnabled ? { transitionDelay: `${delay}ms` } : {};

  return createElement(
    as,
    {
      ref,
      style,
      className: cn(
        "lg:transition-[opacity,transform] lg:duration-reveal lg:ease-out-soft",
        motionEnabled && state === "hidden"
          ? "opacity-0 lg:translate-y-6 will-change-transform"
          : "opacity-100 lg:translate-y-0",
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

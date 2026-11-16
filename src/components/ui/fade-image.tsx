"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Plain <img> with a desktop-only fade-in once the file has loaded
 * (ANIMATIONS.md 5.5). The parent reserves space with an aspect ratio, so the
 * fade never causes layout shift. Mobile shows the image immediately.
 */
export function FadeImage({
  className,
  onLoad,
  onError,
  alt,
  ...props
}: React.ComponentProps<"img">) {
  const ref = React.useRef<HTMLImageElement>(null);
  const [loaded, setLoaded] = React.useState(false);
  const [fadeReady, setFadeReady] = React.useState(false);

  React.useEffect(() => {
    // Cached images can finish before React attaches its load listener.
    if (ref.current?.complete) {
      setLoaded(true);
      return;
    }
    setFadeReady(true);
  }, [props.src]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      ref={ref}
      {...props}
      alt={alt}
      onLoad={(event) => {
        setLoaded(true);
        onLoad?.(event);
      }}
      onError={(event) => {
        // Keep the browser's broken-image state visible instead of hiding it.
        setLoaded(true);
        onError?.(event);
      }}
      className={cn(
        "bg-surface lg:transition-opacity lg:duration-slow lg:ease-out-soft",
        fadeReady && !loaded ? "lg:opacity-0" : "lg:opacity-100",
        className,
      )}
    />
  );
}

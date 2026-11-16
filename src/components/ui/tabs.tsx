"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

import { cn } from "@/lib/utils";

function Tabs(props: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

function TabsList({
  className,
  children,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const listRef = React.useRef<HTMLDivElement>(null);
  const [indicator, setIndicator] = React.useState({ left: 0, width: 0, visible: false });

  React.useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const measure = () => {
      const active = list.querySelector<HTMLElement>('[data-state="active"]');
      if (!active) {
        setIndicator((previous) => (previous.visible ? { ...previous, visible: false } : previous));
        return;
      }
      const listRect = list.getBoundingClientRect();
      const activeRect = active.getBoundingClientRect();
      setIndicator({
        left: activeRect.left - listRect.left + list.scrollLeft,
        width: activeRect.width,
        visible: true,
      });
    };

    measure();

    // Radix flips `data-state` on the triggers, so observe attribute changes
    // instead of requiring callers to pass `value` down to this component.
    const observer = new MutationObserver(measure);
    observer.observe(list, {
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });

    // Keep the pill aligned when the list resizes (responsive/flex-wrap).
    const resize = new ResizeObserver(measure);
    resize.observe(list);

    return () => {
      observer.disconnect();
      resize.disconnect();
    };
  }, []);

  return (
    <TabsPrimitive.List
      ref={listRef}
      data-slot="tabs-list"
      className={cn(
        "relative inline-flex h-auto w-fit max-w-full items-center justify-start gap-1 overflow-x-auto rounded-full bg-surface p-1 text-ink-soft no-scrollbar",
        className,
      )}
      {...props}
    >
      {/* Sliding active pill (ANIMATIONS.md 7.5). Position is measured after mount. */}
      <span
        aria-hidden="true"
        data-slot="tabs-indicator"
        className="pointer-events-none absolute inset-y-1 left-0 rounded-full bg-card shadow-sm ring-1 ring-border/60 lg:transition-[transform,width,opacity] lg:duration-base lg:ease-in-out-soft"
        style={{
          width: indicator.width,
          transform: `translateX(${indicator.left}px)`,
          opacity: indicator.visible ? 1 : 0,
        }}
      />
      {children}
    </TabsPrimitive.List>
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "relative inline-flex flex-none items-center justify-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium whitespace-nowrap lg:transition-colors lg:duration-fast lg:ease-out-soft",
        "text-ink-soft hover:text-ink",
        "focus-visible:ring-2 focus-visible:ring-accent-brand focus-visible:ring-offset-2 focus-visible:ring-offset-surface focus-visible:outline-none",
        "data-[state=active]:text-ink",
        "disabled:pointer-events-none disabled:opacity-50",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none lg:data-[state=active]:animate-fade-in", className)}
      {...props}
    />
  );
}

export { Tabs, TabsList, TabsTrigger, TabsContent };

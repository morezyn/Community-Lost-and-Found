"use client";

import * as React from "react";

export interface PresenceEntry<T> {
  item: T;
  /** True while the item is animating out after being removed from the source list. */
  exiting: boolean;
}

/**
 * Keeps removed list items around for a short exit animation.
 *
 * Real-time lists (comments, moderation queues) are replaced wholesale by
 * snapshots, so a removed item would otherwise disappear instantly. This hook
 * diffs by `id`, marks removals as `exiting`, and drops them after `exitMs`.
 * Items are always rendered in source order; exiting items trail at the end of
 * their previous position is not preserved, which is fine for collapsing rows.
 */
export function useListPresence<T extends { id: string }>(
  items: T[],
  exitMs = 250,
): Array<PresenceEntry<T>> {
  const [entries, setEntries] = React.useState<Array<PresenceEntry<T>>>(() =>
    items.map((item) => ({ item, exiting: false })),
  );
  const previousIdsRef = React.useRef<Set<string>>(new Set(items.map((item) => item.id)));
  const timersRef = React.useRef(new Map<string, ReturnType<typeof setTimeout>>());

  React.useEffect(() => {
    const incomingIds = new Set(items.map((item) => item.id));
    const removedIds = Array.from(previousIdsRef.current).filter(
      (id) => !incomingIds.has(id),
    );
    previousIdsRef.current = incomingIds;

    setEntries((current) => {
      const currentById = new Map(current.map((entry) => [entry.item.id, entry]));
      const next: Array<PresenceEntry<T>> = items.map((item) => ({
        item,
        exiting: false,
      }));

      for (const id of removedIds) {
        const existing = currentById.get(id);
        if (existing && !next.some((entry) => entry.item.id === id)) {
          next.push({ item: existing.item, exiting: true });
        }
      }

      // Keep entries that are already animating out and have not timed out yet.
      for (const entry of current) {
        if (
          entry.exiting &&
          !incomingIds.has(entry.item.id) &&
          !next.some((candidate) => candidate.item.id === entry.item.id)
        ) {
          next.push(entry);
        }
      }

      return next;
    });

    // Cancel pending exits for items that reappeared (e.g. a restored comment).
    for (const [id, timeout] of timersRef.current) {
      if (incomingIds.has(id)) {
        clearTimeout(timeout);
        timersRef.current.delete(id);
      }
    }

    for (const id of removedIds) {
      if (timersRef.current.has(id)) continue;
      const timeout = setTimeout(() => {
        setEntries((current) =>
          current.filter((entry) => !(entry.item.id === id && entry.exiting)),
        );
        timersRef.current.delete(id);
      }, exitMs);
      timersRef.current.set(id, timeout);
    }
  }, [items, exitMs]);

  React.useEffect(() => {
    const timers = timersRef.current;
    return () => {
      timers.forEach((timeout) => clearTimeout(timeout));
      timers.clear();
    };
  }, []);

  return entries;
}

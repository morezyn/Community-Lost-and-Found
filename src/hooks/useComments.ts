"use client";

import * as React from "react";

import { subscribeToComments } from "@/lib/firebase/comments";
import { describeFirebaseError } from "@/lib/firebase/errors";
import type { Comment } from "@/types";

interface UseCommentsOptions {
  includeHidden?: boolean;
}

/** Real-time comment thread with automatic unsubscribe on unmount. */
export function useComments(reportId: string, options: UseCommentsOptions = {}) {
  const [comments, setComments] = React.useState<Comment[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const { includeHidden = false } = options;

  React.useEffect(() => {
    if (!reportId) return;
    setLoading(true);
    setError(null);

    const unsubscribe = subscribeToComments(
      reportId,
      (next) => {
        setComments(next);
        setLoading(false);
      },
      { includeHidden },
      (cause) => {
        setError(describeFirebaseError(cause, "Could not load comments"));
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, [reportId, includeHidden]);

  return { comments, loading, error };
}

"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    console.error("Route error:", error);
  }, [error]);

  return (
    <div style={{ padding: 24 }}>
      <h2>Something went wrong</h2>
      <pre style={{ whiteSpace: "pre-wrap" }}>{error.message}</pre>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}

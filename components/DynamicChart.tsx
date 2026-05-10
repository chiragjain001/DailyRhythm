"use client";

import dynamic from "next/dynamic";
import { Card } from "@/components/ui/card";

// Dynamically import the chart components to reduce bundle size
const CalendarChart = dynamic(() => import("./calendar-chart").then(mod => ({ default: mod.CalendarChart })), {
  ssr: false,
  loading: () => (
    <Card className="rounded-3xl p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-56 bg-gray-200 rounded"></div>
        <div className="h-2 bg-gray-200 rounded mt-3"></div>
      </div>
    </Card>
  )
});

const CompletionChart = dynamic(() => import("./completion-chart").then(mod => ({ default: mod.CompletionChart })), {
  ssr: false,
  loading: () => (
    <Card className="rounded-3xl p-6">
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
        <div className="h-60 bg-gray-200 rounded"></div>
      </div>
    </Card>
  )
});

export { CalendarChart, CompletionChart };

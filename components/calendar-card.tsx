"use client"

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from "recharts"

const data = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  value: Math.round(5 + i + Math.random() * 5),
}))

export function CalendarCard() {
  return (
    <Card className="rounded-3xl border-none bg-white shadow-sm">
      <CardHeader className="px-5 pb-1 pt-4 md:px-6">
        <CardTitle className="text-base font-semibold">Weekly Completion Rate</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-0 pt-2 md:px-6">
        <ChartContainer
          className="h-[240px] w-full"
          config={{
            value: { label: "Tasks", color: "hsl(var(--chart-2))" },
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ left: 8, right: 8, top: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="mm-green" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#CDEB6C" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#CDEB6C" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area dataKey="value" stroke="#9CD43C" fill="url(#mm-green)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}

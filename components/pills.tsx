"use client"

export function Pills() {
  const items = ["Activity", "Planning", "Deep Work", "Break"]
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((p) => (
        <span
          key={p}
          className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-neutral-600 shadow-sm"
        >
          {p}
        </span>
      ))}
    </div>
  )
}

"use client";

import { ChevronRight } from "lucide-react";

export type BarListItem = {
  key: string;
  label: string;
  value: number;
  meta?: string;
};

export function BarList({
  title,
  items,
  onSelect,
  valueFormatter,
}: {
  title: string;
  items: BarListItem[];
  onSelect?: (item: BarListItem) => void;
  valueFormatter?: (n: number) => string;
}) {
  const max = Math.max(1, ...items.map((i) => i.value || 0));
  const fmt = valueFormatter || ((n: number) => `${Math.round(n)}`);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="text-lg font-semibold text-gray-900">{title}</div>
        <div className="text-xs text-gray-500">Top {items.length}</div>
      </div>

      <div className="space-y-2">
        {items.map((i) => {
          const pct = Math.max(0, Math.min(100, (i.value / max) * 100));
          const clickable = !!onSelect;
          return (
            <button
              key={i.key}
              type="button"
              className={
                "w-full text-left rounded-xl border bg-white px-3 py-2 hover:bg-gray-50 transition " +
                (clickable ? "cursor-pointer" : "cursor-default")
              }
              onClick={() => onSelect?.(i)}
              disabled={!clickable}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-gray-900 truncate">{i.label}</div>
                  {i.meta ? <div className="text-xs text-gray-500 mt-0.5">{i.meta}</div> : null}
                  <div className="mt-2 h-2 rounded-full bg-gray-100 overflow-hidden">
                    <div className="h-full bg-blue-600 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-sm font-semibold text-gray-900">{fmt(i.value)}</div>
                  {clickable ? <ChevronRight className="h-4 w-4 text-gray-400" /> : null}
                </div>
              </div>
            </button>
          );
        })}

        {items.length === 0 && (
          <div className="text-sm text-gray-600">Chưa có dữ liệu trong khoảng thời gian này.</div>
        )}
      </div>
    </div>
  );
}



"use client";

import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

export function ArrayField({
  label,
  values,
  onChange,
  placeholder = "",
  disabled = false,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [draft, setDraft] = useState("");

  const add = () => {
    const v = draft.trim();
    if (!v) return;
    onChange([...values, v]);
    setDraft("");
  };

  const remove = (idx: number) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold text-gray-700">
        {label}
      </label>
      <div className="flex gap-2">
        <input
          className="input flex-1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
        />
        <button
          type="button"
          className="btn btn-primary"
          onClick={add}
          disabled={disabled}
        >
          <Plus className="h-4 w-4" />
          Thêm
        </button>
      </div>
      {values.length > 0 && (
        <div className="space-y-2">
          {values.map((v, idx) => (
            <div
              key={`${v}-${idx}`}
              className="flex items-center justify-between gap-2 p-3 bg-gray-50 border rounded-xl"
            >
              <div className="text-sm text-gray-800 whitespace-pre-wrap">
                {v}
              </div>
              <button
                type="button"
                className="btn btn-ghost text-red-600 hover:bg-red-50"
                onClick={() => remove(idx)}
                disabled={disabled}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}



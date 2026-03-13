"use client";

import React, { KeyboardEvent, useMemo, useState } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

type Props = {
  value: string[];
  onChange: (value: string[]) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

const normalize = (s: string) => s.trim().toLowerCase();

export default function UsernameTagInput({
  value,
  onChange,
  label,
  placeholder = "Add username and press Enter…",
  disabled,
  className,
}: Props) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const normalized = useMemo(() => value.map(normalize).filter(Boolean), [value]);

  const addOne = (raw: string) => {
    const u = normalize(raw);
    if (!u) return;
    if (normalized.includes(u)) {
      setError("Already added.");
      return;
    }
    setError("");
    onChange([...normalized, u]);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (e.key === "Enter" || e.key === "Tab") {
      if (draft.trim()) {
        e.preventDefault();
        addOne(draft);
        setDraft("");
      }
    } else if (e.key === "Backspace" && !draft && normalized.length > 0) {
      e.preventDefault();
      onChange(normalized.slice(0, -1));
      setError("");
    }
  };

  return (
    <div className={clsx("flex flex-col gap-2", className)}>
      {label ? <div className="text-xs text-white/70">{label}</div> : null}

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-app-border bg-app-panel2 p-3">
        {normalized.map((u) => (
          <span
            key={u}
            className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold"
          >
            <span className="max-w-[220px] truncate">{u}</span>
            {!disabled ? (
              <button
                type="button"
                onClick={() => onChange(normalized.filter((x) => x !== u))}
                className="text-white/70 hover:text-white"
                aria-label={`Remove ${u}`}
              >
                <X size={16} />
              </button>
            ) : null}
          </span>
        ))}

        <input
          value={draft}
          onChange={(e) => {
            setDraft(e.target.value);
            setError("");
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="min-w-[220px] flex-1 bg-transparent text-sm outline-none placeholder:text-white/40"
        />
      </div>

      {error ? <div className="text-xs text-red-300">{error}</div> : null}
    </div>
  );
}



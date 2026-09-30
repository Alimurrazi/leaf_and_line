"use client";

import { useState } from "react";

const fieldClass = "min-h-11 w-full rounded-control border border-[#cbc7c0] bg-surface px-3 py-2.5 text-sm";
const SYNOPSIS_GUIDE = 400;

/** Synopsis with a live character count (a guide, not a hard limit). */
export function SynopsisField({ defaultValue }: { defaultValue?: string }) {
  const [length, setLength] = useState(defaultValue?.length ?? 0);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="synopsis" className="text-[13px] font-semibold">Synopsis</label>
      <textarea id="synopsis" name="synopsis" rows={3} defaultValue={defaultValue} onChange={(e) => setLength(e.target.value.length)} aria-describedby="synopsis-hint" className={fieldClass} />
      <span id="synopsis-hint" className={`text-xs ${length > SYNOPSIS_GUIDE ? "text-warn" : "text-muted"}`}>
        Two or three sentences for the book page and library search · {length} / {SYNOPSIS_GUIDE} characters
      </span>
    </div>
  );
}

const split = (value: string) => value.split(",").map((g) => g.trim()).filter(Boolean);

/** Comma-separated genres, with the catalog's existing genres as one-click suggestions (keeps spelling consistent). */
export function GenreField({ defaultValue, known }: { defaultValue?: string; known: string[] }) {
  const [value, setValue] = useState(defaultValue ?? "");
  const chosen = split(value).map((g) => g.toLowerCase());
  const suggestions = known.filter((g) => !chosen.includes(g.toLowerCase()));
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor="genres" className="text-[13px] font-semibold">Genres</label>
      <input id="genres" name="genres" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Fantasy, Historical" aria-describedby="genres-hint" className={fieldClass} />
      <span id="genres-hint" className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        Separate with commas.
        {suggestions.length > 0 && " Add:"}
        {suggestions.map((genre) => (
          <button key={genre} type="button" onClick={() => setValue([...split(value), genre].join(", "))}
            className="rounded bg-chip px-2 py-1 font-semibold text-chip-text hover:bg-border">
            + {genre}
          </button>
        ))}
      </span>
    </div>
  );
}

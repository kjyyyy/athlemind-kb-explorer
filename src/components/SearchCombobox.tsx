"use client";

import { KeyboardEvent, useEffect, useId, useRef, useState } from "react";

const DEBOUNCE_MS = 180;

export type ComboItem<T> = {
  key: string;
  label: string;
  meta?: string;
  group?: string;
  value: T;
};

type Props<T> = {
  fetchItems: (query: string, signal: AbortSignal) => Promise<ComboItem<T>[]>;
  onPick: (item: ComboItem<T>) => void;
  /** Enter with no matching suggestion; omit to ignore free text. */
  onSubmitText?: (text: string) => void;
  placeholder: string;
  ariaLabel: string;
  emptyQueryNote?: string;
  noun: string;
  title?: string;
};

export function SearchCombobox<T>({
  fetchItems,
  onPick,
  onSubmitText,
  placeholder,
  ariaLabel,
  emptyQueryNote,
  noun,
  title,
}: Props<T>) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<ComboItem<T>[]>([]);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const listId = useId();
  const wrapRef = useRef<HTMLDivElement>(null);
  const fetchRef = useRef(fetchItems);
  fetchRef.current = fetchItems;

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(() => {
      fetchRef
        .current(query.trim(), ctrl.signal)
        .then((next) => {
          setItems(next);
          setActive(0);
        })
        .catch(() => {})
        .finally(() => {
          if (!ctrl.signal.aborted) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => {
      window.clearTimeout(t);
      ctrl.abort();
    };
  }, [open, query]);

  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  function pick(item: ComboItem<T>) {
    setQuery("");
    setOpen(false);
    onPick(item);
  }

  function onKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (open && !loading && items[active]) {
        pick(items[active]);
      } else if (onSubmitText && query.trim()) {
        onSubmitText(query.trim());
        setQuery("");
        setOpen(false);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const q = query.trim();

  return (
    <div className="paper-picker" ref={wrapRef}>
      <input
        className="graph-search"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        title={title}
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-label={ariaLabel}
      />
      {open && (
        <ul className="paper-picker-list" id={listId} role="listbox">
          {!q && emptyQueryNote && <li className="paper-picker-note">{emptyQueryNote}</li>}
          {loading && items.length === 0 && <li className="paper-picker-note">Searching…</li>}
          {!loading && items.length === 0 && (
            <li className="paper-picker-note">
              {q ? `No ${noun} match “${q}”.` : `No ${noun} available yet.`}
            </li>
          )}
          {items.map((item, i) => (
            <ComboRow
              key={item.key}
              item={item}
              showGroup={Boolean(item.group) && item.group !== items[i - 1]?.group}
              active={i === active}
              onHover={() => setActive(i)}
              onPick={() => pick(item)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function ComboRow<T>({
  item,
  showGroup,
  active,
  onHover,
  onPick,
}: {
  item: ComboItem<T>;
  showGroup: boolean;
  active: boolean;
  onHover: () => void;
  onPick: () => void;
}) {
  return (
    <>
      {showGroup && (
        <li className="paper-picker-group" role="presentation">
          {item.group}
        </li>
      )}
      <li
        role="option"
        aria-selected={active}
        className={`paper-picker-item${active ? " is-active" : ""}`}
        onMouseEnter={onHover}
        onMouseDown={(e) => {
          e.preventDefault();
          onPick();
        }}
      >
        <span className="paper-picker-title">{item.label}</span>
        {item.meta && <span className="paper-picker-meta">{item.meta}</span>}
      </li>
    </>
  );
}

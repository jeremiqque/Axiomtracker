import { useState, useRef, useEffect, useCallback } from "react";
import { FiChevronDown, FiCheck, FiSearch } from "react-icons/fi";

export interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  searchable?: boolean;
  className?: string;
}

export default function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  disabled = false,
  loading = false,
  searchable = false,
  className = "",
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

  const wrapperRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = options.find(o => o.value === value);
  const label = selected?.label ?? "";

  const filtered = query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  const closeDropdown = useCallback(() => {
    setOpen(false);
    setQuery("");
  }, []);

  // Recalculate fixed position from the trigger button
  const recalcPosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    // Flip upward if not enough space below
    const spaceBelow = window.innerHeight - rect.bottom;
    const dropdownH = Math.min(filtered.length * 36 + (searchable ? 48 : 8), 220);
    const showAbove = spaceBelow < dropdownH + 8 && rect.top > dropdownH + 8;
    setDropdownStyle({
      position: "fixed",
      top: showAbove ? rect.top - dropdownH - 4 : rect.bottom + 4,
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
    });
  }, [filtered.length, searchable]);

  const handleToggle = () => {
    if (disabled || loading) return;
    if (!open) recalcPosition();
    setOpen(p => !p);
  };

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        wrapperRef.current && !wrapperRef.current.contains(target) &&
        dropdownRef.current && !dropdownRef.current.contains(target)
      ) {
        closeDropdown();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, closeDropdown]);

  // Close + recalc on scroll/resize (position becomes stale)
  useEffect(() => {
    if (!open) return;
    const onScroll = () => closeDropdown();
    const onResize = () => { if (open) recalcPosition(); };
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, closeDropdown, recalcPosition]);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeDropdown();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [closeDropdown]);

  // Focus search input when opened
  useEffect(() => {
    if (open && searchable) {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open, searchable]);

  const handleSelect = (val: string) => {
    onChange(val);
    closeDropdown();
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {/* Trigger */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        onClick={handleToggle}
        className={`
          w-full flex items-center justify-between gap-2
          px-3 py-2.5 text-sm rounded-lg border transition-all duration-150
          ${disabled || loading
            ? "bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed"
            : open
              ? "bg-white border-gray-900 ring-2 ring-gray-900/10 text-gray-900"
              : "bg-white border-gray-200 text-gray-700 hover:border-gray-400 hover:bg-gray-50 cursor-pointer"
          }
        `}
      >
        <span className={`truncate ${!label ? "text-gray-400" : ""}`}>
          {loading ? "Loading…" : label || placeholder}
        </span>
        <FiChevronDown
          size={14}
          className={`shrink-0 text-gray-400 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown — rendered with position:fixed to escape any overflow container */}
      {open && (
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
        >
          {/* Search */}
          {searchable && (
            <div className="px-2 pt-2 pb-1">
              <div className="flex items-center gap-2 px-2.5 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <FiSearch size={12} className="text-gray-400 shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Search…"
                  className="flex-1 text-xs bg-transparent outline-none text-gray-700 placeholder-gray-400"
                />
              </div>
            </div>
          )}

          {/* Options */}
          <div className="dropdown-list max-h-52 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-2.5 text-xs text-gray-400 text-center">No results</p>
            ) : (
              filtered.map(opt => {
                const isSelected = opt.value === value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelect(opt.value)}
                    className={`
                      w-full flex items-center justify-between gap-2
                      px-3 py-2 text-sm text-left transition-colors
                      ${isSelected
                        ? "bg-gray-950 text-white"
                        : "text-gray-700 hover:bg-gray-50"
                      }
                    `}
                  >
                    <span className="truncate">{opt.label}</span>
                    {isSelected && <FiCheck size={13} className="shrink-0 text-white" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

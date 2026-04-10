import { useState, useRef, useEffect } from "react";
import { FiCalendar, FiChevronLeft, FiChevronRight } from "react-icons/fi";

interface DatePickerProps {
  value: string;           // ISO date string YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  label?: string;
}

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];
const DAYS = ["Su","Mo","Tu","We","Th","Fr","Sa"];

function parseISO(value: string): Date | null {
  if (!value) return null;
  const d = new Date(value + "T00:00:00");
  return isNaN(d.getTime()) ? null : d;
}

function toISO(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatDisplay(value: string): string {
  const d = parseISO(value);
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function DatePicker({ value, onChange, placeholder = "Select date", disabled }: DatePickerProps) {
  const [open, setOpen] = useState(false);
  const today = new Date();

  const selected = parseISO(value);
  const [viewYear, setViewYear] = useState(selected?.getFullYear() ?? today.getFullYear());
  const [viewMonth, setViewMonth] = useState(selected?.getMonth() ?? today.getMonth());

  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Sync view when value changes externally
  useEffect(() => {
    const d = parseISO(value);
    if (d) { setViewYear(d.getFullYear()); setViewMonth(d.getMonth()); }
  }, [value]);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay   = getFirstDayOfMonth(viewYear, viewMonth);
  const daysInPrev = getDaysInMonth(viewYear, viewMonth === 0 ? 11 : viewMonth - 1);

  const cells: { day: number; month: "prev" | "cur" | "next" }[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, month: "prev" });
  for (let i = 1; i <= daysInMonth; i++)
    cells.push({ day: i, month: "cur" });
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++)
    cells.push({ day: i, month: "next" });

  const isSelected = (day: number, mo: "prev" | "cur" | "next") => {
    if (!selected || mo !== "cur") return false;
    return selected.getFullYear() === viewYear &&
           selected.getMonth() === viewMonth &&
           selected.getDate() === day;
  };

  const isToday = (day: number, mo: "prev" | "cur" | "next") => {
    if (mo !== "cur") return false;
    return today.getFullYear() === viewYear &&
           today.getMonth() === viewMonth &&
           today.getDate() === day;
  };

  const selectDay = (day: number, mo: "prev" | "cur" | "next") => {
    let y = viewYear, m = viewMonth;
    if (mo === "prev") { m--; if (m < 0) { m = 11; y--; } }
    if (mo === "next") { m++; if (m > 11) { m = 0; y++; } }
    onChange(toISO(new Date(y, m, day)));
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {/* Trigger */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen(o => !o)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm border rounded-lg bg-white transition-colors
          ${open ? "border-gray-900 ring-2 ring-gray-900/10" : "border-gray-200 hover:border-gray-400"}
          ${disabled ? "opacity-50 cursor-not-allowed bg-gray-50" : "cursor-pointer"}
        `}
      >
        <span className={value ? "text-gray-900" : "text-gray-400"}>
          {value ? formatDisplay(value) : placeholder}
        </span>
        <FiCalendar size={14} className="text-gray-400 shrink-0 ml-2" />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full mt-2 left-0 z-[9999] bg-white border border-gray-100 rounded-2xl shadow-xl p-4 w-72 select-none">

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              <FiChevronLeft size={15} />
            </button>

            <span className="text-sm font-semibold text-gray-900">
              {MONTHS[viewMonth]} {viewYear}
            </span>

            <button
              type="button"
              onClick={nextMonth}
              className="w-7 h-7 rounded-lg hover:bg-gray-100 grid place-items-center text-gray-500 hover:text-gray-900 transition-colors"
            >
              <FiChevronRight size={15} />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map(d => (
              <span key={d} className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wide py-1">
                {d}
              </span>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7 gap-y-0.5">
            {cells.map((cell, i) => {
              const sel = isSelected(cell.day, cell.month);
              const tod = isToday(cell.day, cell.month);
              const other = cell.month !== "cur";
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => selectDay(cell.day, cell.month)}
                  className={`
                    relative mx-auto w-8 h-8 rounded-lg text-xs font-medium transition-all flex items-center justify-center
                    ${sel
                      ? "bg-gray-900 text-white font-semibold shadow-sm"
                      : tod
                        ? "text-gray-900 font-semibold ring-2 ring-gray-900/20 hover:bg-gray-900 hover:text-white"
                        : other
                          ? "text-gray-300 hover:text-gray-500 hover:bg-gray-50"
                          : "text-gray-700 hover:bg-gray-100"
                    }
                  `}
                >
                  {cell.day}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="text-xs text-gray-400 hover:text-gray-700 transition-colors font-medium"
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => { onChange(toISO(today)); setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setOpen(false); }}
              className="text-xs font-semibold text-gray-900 hover:text-gray-600 transition-colors"
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

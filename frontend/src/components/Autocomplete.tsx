import React, { useMemo, useState } from 'react';
import { Check } from 'lucide-react';
import { isSimilar, normalizeText } from '../utils/materials';

export interface Suggestion {
  value: string;
  hint?: string;
  // Kichik raqam — yuqoriroq ko'rsatiladi (masalan: "shu material uchun" brendlar)
  priority?: number;
}

type Ranked = Suggestion & { rank: number; similar: boolean; exact: boolean };

const rankSuggestions = (value: string, suggestions: Suggestion[]): Ranked[] => {
  const q = normalizeText(value);
  const out: Ranked[] = [];
  for (const s of suggestions) {
    const v = normalizeText(s.value);
    const base = (s.priority ?? 0) * 10;
    if (!q) out.push({ ...s, rank: base, similar: false, exact: false });
    else if (v === q) out.push({ ...s, rank: base, similar: false, exact: true });
    else if (v.startsWith(q)) out.push({ ...s, rank: base + 1, similar: false, exact: false });
    else if (v.includes(q)) out.push({ ...s, rank: base + 2, similar: false, exact: false });
    else if (isSimilar(q, v)) out.push({ ...s, rank: base + 3, similar: true, exact: false });
  }
  return out.sort((a, b) => a.rank - b.rank || a.value.localeCompare(b.value)).slice(0, 30);
};

interface AutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  suggestions: Suggestion[];
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export const Autocomplete: React.FC<AutocompleteProps> = ({
  value, onChange, suggestions, placeholder, required, className,
}) => {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const items = useMemo(() => rankSuggestions(value, suggestions), [value, suggestions]);

  const select = (v: string) => {
    onChange(v);
    setOpen(false);
    setActive(-1);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!open || items.length === 0) {
      if (e.key === 'ArrowDown') setOpen(true);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(i + 1, items.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && active >= 0) {
      e.preventDefault();
      select(items[active].value);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        required={required}
        placeholder={placeholder}
        value={value}
        autoComplete="off"
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onKeyDown={onKeyDown}
        className={className ?? 'w-full h-9 px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:border-[#ff7a16]'}
      />
      {open && items.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full max-h-52 overflow-y-auto bg-white border border-gray-200 rounded-lg shadow-lg py-1">
          {items.map((s, i) => (
            <li
              key={`${s.value}-${i}`}
              // onMouseDown — input blur bo'lishidan oldin tanlash uchun
              onMouseDown={(e) => { e.preventDefault(); select(s.value); }}
              onMouseEnter={() => setActive(i)}
              className={`px-3 py-1.5 text-xs cursor-pointer flex items-center justify-between gap-2 ${i === active ? 'bg-orange-50' : ''}`}
            >
              <span className="flex items-center gap-1.5 min-w-0">
                {s.exact && <Check className="w-3 h-3 text-green-600 flex-shrink-0" />}
                <span className="truncate font-medium text-gray-800">{s.value}</span>
                {s.similar && (
                  <span className="text-[9px] px-1 rounded bg-yellow-50 text-yellow-700 border border-yellow-200">o'xshash</span>
                )}
              </span>
              {s.hint && <span className="text-[10px] text-gray-400 flex-shrink-0">{s.hint}</span>}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

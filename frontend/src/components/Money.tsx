import type { Currency } from '../types';
import { formatUsd, formatUzs, toUsd, toUzs, useCbuRate } from '../utils/money';

interface CurrencyToggleProps {
  value: Currency;
  onChange: (c: Currency) => void;
  className?: string;
}

export const CurrencyToggle = ({ value, onChange, className = '' }: CurrencyToggleProps) => (
  <div className={`grid grid-cols-2 gap-1 bg-gray-100 p-1 rounded-lg ${className}`}>
    <button
      type="button"
      onClick={() => onChange('UZS')}
      className={`min-h-8 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${value === 'UZS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
    >
      🇺🇿 So'm
    </button>
    <button
      type="button"
      onClick={() => onChange('USD')}
      className={`min-h-8 py-1 text-xs font-semibold rounded-md transition-all whitespace-nowrap ${value === 'USD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
    >
      💵 USD
    </button>
  </div>
);

interface MoneyInputProps {
  label: string;
  value: number | '';
  onChange: (v: number | '') => void;
  currency: Currency;
  onCurrencyChange: (c: Currency) => void;
  required?: boolean;
  placeholder?: string;
  min?: number;
  /** Valyuta tanlashni yashirish (masalan, mavjud yozuv valyutasi qat'iy bo'lsa) */
  lockCurrency?: boolean;
  hint?: string;
}

/** Summa kiritish: so'm/USD tanlash + joriy CBU kursi bo'yicha avtomatik konvertatsiya ko'rinishi */
export const MoneyInput = ({
  label,
  value,
  onChange,
  currency,
  onCurrencyChange,
  required,
  placeholder,
  min,
  lockCurrency,
  hint,
}: MoneyInputProps) => {
  const rate = useCbuRate();
  const amount = Number(value) || 0;
  const converted = currency === 'USD' ? toUzs(amount, 'USD', rate) : toUsd(amount, 'UZS', rate);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-1">
        <label className="block text-xs font-semibold">
          {label} ({currency === 'USD' ? '$' : "so'm"}){required ? ' *' : ''}
        </label>
        {!lockCurrency && <CurrencyToggle value={currency} onChange={onCurrencyChange} className="w-full sm:w-36" />}
      </div>
      <input
        type="number"
        required={required}
        min={min ?? (currency === 'USD' ? 0.01 : 1)}
        step="any"
        placeholder={placeholder ?? (currency === 'USD' ? '100' : '1 000 000')}
        value={value}
        onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))}
        className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
      />
      <div className="flex flex-col sm:flex-row sm:justify-between gap-0.5 text-[10px] text-gray-500 mt-0.5">
        <span>CBU kursi: {rate > 0 ? `1$ = ${rate.toLocaleString('ru-RU')} so'm` : 'yuklanmoqda...'}</span>
        {amount > 0 && rate > 0 && (
          <span className="font-semibold text-emerald-700 break-words">
            ≈ {currency === 'USD' ? formatUzs(converted) : formatUsd(converted)}
          </span>
        )}
      </div>
      {hint && <p className="text-[10px] text-gray-400 mt-0.5">{hint}</p>}
    </div>
  );
};

interface UsdWithUzsProps {
  /** Asosiy (USD) summa. Agar faqat so'm ma'lum bo'lsa, `uzs` bering — USD kurs orqali hisoblanadi. */
  usd?: number | null;
  uzs?: number | null;
  className?: string;
  uzsClassName?: string;
  /** Bitta qatorda (jadvallar uchun ixcham) */
  inline?: boolean;
}

/** Natija ko'rsatish: katta USD, ostida kichik so'm */
export const UsdWithUzs = ({ usd, uzs, className = '', uzsClassName = '', inline }: UsdWithUzsProps) => {
  const rate = useCbuRate();
  const usdVal = usd ?? (uzs != null ? toUsd(uzs, 'UZS', rate) : 0);
  const uzsVal = uzs ?? (usd != null ? toUzs(usd, 'USD', rate) : 0);
  const showUzs = uzs != null || rate > 0;

  if (inline) {
    return (
      <span className={`break-words ${className}`}>
        {formatUsd(usdVal)}
        {showUzs && <span className={`ml-1 text-[10px] font-normal text-gray-400 break-words ${uzsClassName}`}>({formatUzs(uzsVal)})</span>}
      </span>
    );
  }
  return (
    <span className={`inline-flex min-w-0 flex-col leading-tight break-words ${className}`}>
      <span className="break-words">{formatUsd(usdVal)}</span>
      {showUzs && <span className={`text-[10px] font-normal text-gray-400 break-words ${uzsClassName}`}>{formatUzs(uzsVal)}</span>}
    </span>
  );
};

import React, { useEffect, useState } from 'react';
import { CalendarDays, Loader2, TrendingDown, TrendingUp, X } from 'lucide-react';
import { currencyApi, CurrencyRateHistoryPoint } from '../api/services';
import { useTheme } from '../context/ThemeContext';

const PERIODS = [
  { days: 30, label: '1 oy' },
  { days: 90, label: '3 oy' },
  { days: 180, label: '6 oy' },
  { days: 365, label: '1 yil' },
];

const formatRate = (rate: number) => rate.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const formatDate = (date: string) => new Date(`${date}T00:00:00`).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', year: 'numeric' });

export const CurrencyHistoryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { resolved } = useTheme();
  const [days, setDays] = useState(365);
  const [points, setPoints] = useState<CurrencyRateHistoryPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hoveredPoint, setHoveredPoint] = useState<CurrencyRateHistoryPoint | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    currencyApi.getHistory(days).then((history) => {
      if (active) setPoints(history);
    }).catch(() => {
      if (active) setError("Tarixiy kurslarni yuklab bo'lmadi. Iltimos, qayta urinib ko'ring.");
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [days, retryCount]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [onClose]);

  const currentRate = points[points.length - 1]?.rate ?? 0;
  const firstRate = points[0]?.rate ?? 0;
  const change = currentRate - firstRate;
  const changePercent = firstRate > 0 ? (change / firstRate) * 100 : 0;
  const width = 760;
  const height = 280;
  const left = 68;
  const right = 18;
  const top = 18;
  const bottom = 34;
  const chartWidth = width - left - right;
  const chartHeight = height - top - bottom;
  const minRate = points.length ? Math.min(...points.map(point => point.rate)) : 0;
  const maxRate = points.length ? Math.max(...points.map(point => point.rate)) : 0;
  const range = Math.max(maxRate - minRate, 1);
  const chartPoints = points.map((point, index) => ({
    ...point,
    x: left + (points.length <= 1 ? chartWidth / 2 : (index / (points.length - 1)) * chartWidth),
    y: top + ((maxRate - point.rate) / range) * chartHeight,
  }));
  const line = chartPoints.map(point => `${point.x},${point.y}`).join(' ');
  const firstDate = points[0]?.date;
  const lastDate = points[points.length - 1]?.date;
  const selectedPeriod = PERIODS.find(period => period.days === days)?.label ?? '';
  const ChangeIcon = change >= 0 ? TrendingUp : TrendingDown;

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-0 backdrop-blur-[2px] sm:items-center sm:p-4"
      onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="currency-history-title"
        className="w-full max-w-4xl overflow-hidden rounded-t-2xl border border-[#e4e7ec] bg-white shadow-2xl sm:rounded-2xl"
      >
        <div className="flex items-start justify-between border-b border-[#e4e7ec] px-4 py-4 sm:px-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-700">
                <CalendarDays className="h-4 w-4" />
              </span>
              <h2 id="currency-history-title" className="text-base font-bold text-gray-800">USD kursi tarixi</h2>
            </div>
            <p className="mt-1 pl-10 text-xs text-gray-500">O'zbekiston Markaziy banki (CBU) ma'lumotlari</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[calc(100dvh-72px)] overflow-y-auto p-4 sm:p-6">
          <div className="mb-5 flex flex-wrap gap-2" aria-label="Kurs davri">
            {PERIODS.map(period => (
              <button
                key={period.days}
                type="button"
                onClick={() => {
                  if (days !== period.days) {
                    setDays(period.days);
                    setLoading(true);
                    setError('');
                    setHoveredPoint(null);
                  }
                }}
                aria-pressed={days === period.days}
                className={`rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                  days === period.days
                    ? 'border-[#ff7a16] bg-orange-50 text-[#c85a08]'
                    : 'border-[#e4e7ec] bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {period.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center gap-2 text-sm text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
              Kurslar yuklanmoqda...
            </div>
          ) : error ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setLoading(true);
                  setRetryCount(count => count + 1);
                }}
                className="ml-3 font-semibold underline underline-offset-2"
              >
                Qayta urinish
              </button>
            </div>
          ) : points.length === 0 ? (
            <div className="rounded-xl border border-[#e4e7ec] bg-gray-50 p-8 text-center text-sm text-gray-500">Bu davr uchun kurs ma'lumoti topilmadi.</div>
          ) : (
            <>
              <div className="mb-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-[#e4e7ec] bg-gray-50/70 p-3.5">
                  <div className="text-[11px] font-medium text-gray-500">{selectedPeriod} oldin</div>
                  <div className="mt-1 text-lg font-bold text-gray-800">{formatRate(firstRate)} <span className="text-xs font-medium text-gray-500">so'm</span></div>
                  {firstDate && <div className="mt-0.5 text-[10px] text-gray-400">{formatDate(firstDate)}</div>}
                </div>
                <div className="rounded-xl border border-[#e4e7ec] bg-gray-50/70 p-3.5">
                  <div className="text-[11px] font-medium text-gray-500">Joriy kurs</div>
                  <div className="mt-1 text-lg font-bold text-gray-800">{formatRate(currentRate)} <span className="text-xs font-medium text-gray-500">so'm</span></div>
                  {lastDate && <div className="mt-0.5 text-[10px] text-gray-400">{formatDate(lastDate)}</div>}
                </div>
                <div className="rounded-xl border border-[#e4e7ec] bg-gray-50/70 p-3.5">
                  <div className="text-[11px] font-medium text-gray-500">Davr o'zgarishi</div>
                  <div className={`mt-1 flex items-center gap-1 text-lg font-bold ${change >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                    <ChangeIcon className="h-4 w-4" />
                    {change >= 0 ? '+' : ''}{formatRate(change)} <span className="text-xs font-medium">so'm</span>
                  </div>
                  <div className="mt-0.5 text-[10px] text-gray-400">{changePercent >= 0 ? '+' : ''}{changePercent.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}%</div>
                </div>
              </div>

              <div className="rounded-xl border border-[#e4e7ec] bg-white p-2 sm:p-4">
                <div className="mb-1 flex items-center justify-between px-2 pt-1">
                  <span className="text-xs font-semibold text-gray-700">1 USD qiymati</span>
                  <span className="text-[10px] text-gray-400">{points.length} ta kurs nuqtasi</span>
                </div>
                <div className="relative">
                  <svg
                    viewBox={`0 0 ${width} ${height}`}
                    role="img"
                    aria-label={`${selectedPeriod} davomida USD ning so'mga nisbatan kurs grafigi`}
                    className="h-56 w-full sm:h-72"
                  >
                    {[0, 1, 2, 3].map(tick => {
                      const y = top + chartHeight * tick / 3;
                      const rate = maxRate - range * tick / 3;
                      return (
                        <g key={tick}>
                          <line x1={left} x2={width - right} y1={y} y2={y} stroke={resolved === 'dark' ? '#303745' : '#e9edf2'} strokeDasharray="4 5" />
                          <text x={left - 8} y={y + 4} textAnchor="end" fill={resolved === 'dark' ? '#737b8a' : '#9ca3af'} fontSize="10">{formatRate(rate)}</text>
                        </g>
                      );
                    })}
                    {line && <polyline points={line} fill="none" stroke="#ff7a16" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
                    {chartPoints.map(point => (
                      <circle
                        key={point.date}
                        cx={point.x}
                        cy={point.y}
                        r={hoveredPoint?.date === point.date ? 6 : 3}
                        fill={hoveredPoint?.date === point.date ? '#fff' : '#ff7a16'}
                        stroke="#ff7a16"
                        strokeWidth="2"
                        tabIndex={0}
                        aria-label={`${formatDate(point.date)}: ${formatRate(point.rate)} so'm`}
                        onMouseEnter={() => setHoveredPoint(point)}
                        onMouseLeave={() => setHoveredPoint(null)}
                        onFocus={() => setHoveredPoint(point)}
                        onBlur={() => setHoveredPoint(null)}
                      >
                        <title>{`${formatDate(point.date)}: ${formatRate(point.rate)} so'm`}</title>
                      </circle>
                    ))}
                    {firstDate && lastDate && <>
                      <text x={left} y={height - 8} textAnchor="start" fill={resolved === 'dark' ? '#737b8a' : '#9ca3af'} fontSize="10">{formatDate(firstDate)}</text>
                      <text x={width - right} y={height - 8} textAnchor="end" fill={resolved === 'dark' ? '#737b8a' : '#9ca3af'} fontSize="10">{formatDate(lastDate)}</text>
                    </>}
                  </svg>
                  {hoveredPoint && (
                    <div className="pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-lg border border-[#e4e7ec] bg-white px-3 py-2 text-center shadow-lg">
                      <div className="text-[10px] text-gray-500">{formatDate(hoveredPoint.date)}</div>
                      <div className="text-xs font-bold text-gray-800">{formatRate(hoveredPoint.rate)} so'm</div>
                    </div>
                  )}
                </div>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-gray-400">Uzoq davrlar grafikni ixcham saqlash uchun haftalik nuqtalarda ko'rsatiladi. Dam olish va bayram kunlarida oxirgi amal qilgan kurs saqlanadi.</p>
            </>
          )}
        </div>
      </section>
    </div>
  );
};

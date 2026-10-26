import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, Building2, CalendarRange, Loader2 } from 'lucide-react';
import { projectsApi, reportsApi } from '../api/services';
import { Project } from '../types';

const ANNUAL_SHEETS = [
  { name: 'Xulosa', desc: "Tushum, xarajat, yalpi va sof foyda, marja, o'tgan yil bilan solishtirish" },
  { name: 'Oylik', desc: "12 oy: tushum, material, ish haqi, ofis, sof va kumulyativ foyda" },
  { name: 'Loyihalar', desc: "Har bir loyiha rentabelligi, qarz, byudjet ishlatilishi" },
  { name: 'Kategoriyalar', desc: "Xarajat turlari bo'yicha taqsimot va ulushlar" },
  { name: 'Mijozlar', desc: "Mijoz bo'yicha daromad, to'lov va qarzdorlik" },
  { name: 'Ustalar', desc: "Usta bo'yicha kelishilgan, to'langan va qoldiq" },
  { name: 'Materiallar', desc: "Material va yetkazib beruvchilar tahlili, o'rtacha narx" },
  { name: 'Ofis', desc: "Ofis xarajatlari kategoriya × oy matritsasi" },
];

const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const ReportsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [downloading, setDownloading] = useState(false);
  const [rangeFrom, setRangeFrom] = useState(() => toInputDate(new Date(currentYear, 0, 1)));
  const [rangeTo, setRangeTo] = useState(() => toInputDate(new Date()));
  const [downloadingRange, setDownloadingRange] = useState(false);
  const rangeInvalid = !rangeFrom || !rangeTo || rangeFrom > rangeTo;

  useEffect(() => {
    projectsApi.getAll().then(setProjects);
  }, []);

  const downloadAnnual = async () => {
    setDownloading(true);
    try {
      await reportsApi.downloadAnnualExcel(year);
    } finally {
      setDownloading(false);
    }
  };

  const downloadRange = async () => {
    if (rangeInvalid) return;
    setDownloadingRange(true);
    try {
      await reportsApi.downloadRangeExcel(rangeFrom, rangeTo);
    } finally {
      setDownloadingRange(false);
    }
  };

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#171b25]">Hisobotlar (Excel Eksport)</h2>
          <p className="text-xs text-[#7b8190] mt-0.5 break-words">Loyihalaringizni batafsil 9 varaqli Excel hisobotlariga aylantiring (PDF §16)</p>
        </div>
        <button
          onClick={() => reportsApi.downloadAllProjectsExcel()}
          className="bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs min-h-[34px] px-3.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all w-full sm:w-auto"
        >
          <Download className="w-4 h-4" />
          <span className="text-center">Barcha loyihalarni Excelga yuklash</span>
        </button>
      </div>

      <div className="bg-gradient-to-br from-[#1e293b] to-[#334155] rounded-xl p-4 sm:p-6 shadow-sm text-white">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-xl min-w-0">
            <div className="flex items-center gap-2 mb-2 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center">
                <CalendarRange className="w-5 h-5 text-[#ffb070]" />
              </div>
              <h3 className="font-bold text-base break-words">Yillik to'liq moliyaviy hisobot</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Ofis va barcha loyihalarning butun yil bo'yicha kirim-chiqimi bitta Excel faylda. Barcha tahlil
              jadvallari Excel ichidagi formulalar bilan hisoblanadi — faylda yil yoki dollar kursini
              o'zgartirsangiz, hammasi avtomatik qayta hisoblanadi.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="h-9 px-3 rounded-lg text-xs font-semibold text-[#171b25] bg-white outline-none w-full sm:w-auto"
            >
              {Array.from({ length: 6 }, (_, i) => currentYear - i).map((y) => (
                <option key={y} value={y}>{y}-yil</option>
              ))}
            </select>
            <button
              onClick={downloadAnnual}
              disabled={downloading}
              className="min-h-9 px-4 bg-[#ff7a16] hover:bg-[#e86807] disabled:opacity-60 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
            >
              {downloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{downloading ? 'Tayyorlanmoqda...' : 'Yillik hisobotni yuklash'}</span>
            </button>
          </div>
        </div>

        <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-xl min-w-0">
            <div className="text-sm font-bold">Tanlangan davr bo'yicha hisobot</div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
              Xuddi shu varaqlar, lekin istalgan sanadan istalgan sanagacha. Excelda boshlanish/tugash sanalarini
              o'zgartirsangiz ham formulalar qayta hisoblanadi; oldingi teng davr bilan solishtiriladi.
            </p>
          </div>
          <div className="flex flex-wrap items-end gap-2 w-full sm:w-auto">
            <label className="flex flex-col gap-1 text-[10px] font-semibold text-slate-300 w-full sm:w-auto">
              Boshlanish
              <input
                type="date"
                value={rangeFrom}
                max={rangeTo || undefined}
                onChange={(e) => setRangeFrom(e.target.value)}
                className="h-9 px-2.5 rounded-lg text-xs font-semibold text-[#171b25] bg-white outline-none w-full sm:w-auto"
              />
            </label>
            <label className="flex flex-col gap-1 text-[10px] font-semibold text-slate-300 w-full sm:w-auto">
              Tugash
              <input
                type="date"
                value={rangeTo}
                min={rangeFrom || undefined}
                onChange={(e) => setRangeTo(e.target.value)}
                className="h-9 px-2.5 rounded-lg text-xs font-semibold text-[#171b25] bg-white outline-none w-full sm:w-auto"
              />
            </label>
            <button
              onClick={downloadRange}
              disabled={downloadingRange || rangeInvalid}
              className="min-h-9 px-4 bg-[#ff7a16] hover:bg-[#e86807] disabled:opacity-60 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors w-full sm:w-auto"
            >
              {downloadingRange ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
              <span>{downloadingRange ? 'Tayyorlanmoqda...' : 'Davr hisobotini yuklash'}</span>
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 mt-5">
          {ANNUAL_SHEETS.map((s) => (
            <div key={s.name} className="bg-white/5 border border-white/10 rounded-lg p-2.5">
              <div className="text-[11px] font-bold text-[#ffb070]">{s.name}</div>
              <div className="text-[10px] text-slate-300 mt-0.5 leading-snug break-words">{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
          <div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-gray-900">Barcha Loyihalar Konsolidatsiyasi</h3>
            <p className="text-xs text-[#7b8190] mt-1 leading-relaxed">
              Barcha loyihalar, mijozlar, shartnoma, olingan summa, qoldiq qarz, xarajatlar va sof foydani bitta umumiy Excel faylida oling.
            </p>
          </div>
          <button
            onClick={() => reportsApi.downloadAllProjectsExcel()}
            className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-[#e4e7ec] rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Excel yaratish & Yuklash</span>
          </button>
        </div>

        {projects.map((p) => (
          <div key={p.id} className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 truncate min-w-0">{p.name}</h3>
              <p className="text-xs text-[#7b8190] mt-1 leading-relaxed">
                Ushbu loyiha bo'yicha to'liq <b>9 varaqli</b> hisobot: to'lovlar, xarajatlar, materiallar, usta haqlari, qo'shimcha ishlar va sof foyda tahlili.
              </p>
            </div>
            <button
              onClick={() => reportsApi.downloadProjectExcel(p.id)}
              className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>9 Varaqli Excel Yuklash</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

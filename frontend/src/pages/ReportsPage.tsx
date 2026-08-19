import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, Building2, DollarSign, Package, Users } from 'lucide-react';
import { projectsApi, reportsApi } from '../api/services';
import { Project } from '../types';

export const ReportsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    projectsApi.getAll().then(setProjects);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#171b25]">Hisobotlar (Excel Eksport)</h2>
          <p className="text-xs text-[#7b8190] mt-0.5">Loyihalaringizni batafsil 9 varaqli Excel hisobotlariga aylantiring (PDF §16)</p>
        </div>
        <button
          onClick={() => reportsApi.downloadAllProjectsExcel()}
          className="bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs h-[34px] px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Barcha loyihalarni Excelga yuklash</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {/* Report 1 */}
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

        {/* Individual Project 9-Sheet Reports */}
        {projects.map((p) => (
          <div key={p.id} className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
            <div>
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
                <Building2 className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-sm text-gray-900 truncate">{p.name}</h3>
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

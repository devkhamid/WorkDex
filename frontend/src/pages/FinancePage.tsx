import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Building2, Wallet, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from 'lucide-react';
import { dashboardApi, projectsApi, reportsApi } from '../api/services';
import { DashboardStats, Project } from '../types';

export const FinancePage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    dashboardApi.getStats().then(setStats);
    projectsApi.getAll().then(setProjects);
  }, []);

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-[#171b25]">Moliya & Kompaniya Balansi</h2>
          <p className="text-xs text-[#7b8190] mt-0.5">Kompaniyaning umumiy moliyaviy ko'rinishi va loyiha xarajatlari tahlili</p>
        </div>
        <button
          onClick={() => reportsApi.downloadAllProjectsExcel()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs h-[36px] px-4 rounded-lg flex items-center gap-1.5 shadow-xs transition-all"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Barcha moliyaviy hisobotni Excelda yuklash</span>
        </button>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ff7a16]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1">Loyiha Daromadi (Shartnoma)</small>
            <b className="text-2xl font-extrabold text-[#171b25] block mt-1">${stats?.totalContractValue.toLocaleString() ?? 0}</b>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Olingan tushum: ${stats?.totalRevenueReceived.toLocaleString() ?? 0}</span>
          </div>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#3b82f6]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1">Kutilayotgan Qoldiq Tushum</small>
            <b className="text-2xl font-extrabold text-[#3b82f6] block mt-1">${stats?.totalPendingReceivables.toLocaleString() ?? 0}</b>
          </div>
          <div className="text-[11px] font-medium text-gray-500 mt-2">
            <span>Mijozlar tomonidan to'lanishi kutilmoqda</span>
          </div>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ef5350]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1">Jami Loyiha Xarajatlari</small>
            <b className="text-2xl font-extrabold text-[#ef5350] block mt-1">${stats?.totalExpenses.toLocaleString() ?? 0}</b>
          </div>
          <div className="text-[11px] font-medium text-red-600 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Material, usta, transport va boshqalar</span>
          </div>
        </div>

        {(() => {
          const netBal = stats?.netBalance ?? ((stats?.totalRevenueReceived ?? 0) - (stats?.totalExpenses ?? 0));
          const isNegative = netBal < 0;
          return (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div className={`absolute left-0 top-4 w-1.5 h-8 rounded-r ${isNegative ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <div>
                <small className="block text-[11px] font-bold text-[#697180] mb-1 uppercase tracking-wider">Net Balans (Qo'ldagi summa)</small>
                <b className={`text-2xl font-extrabold block mt-1 ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isNegative ? `-$${Math.abs(netBal).toLocaleString()}` : `$${netBal.toLocaleString()}`}
                </b>
              </div>
              <div className="text-[11px] font-medium text-gray-500 mt-2 flex items-center justify-between">
                <span>Tushum − Xarajatlar</span>
                {stats?.totalNetProfit !== undefined && (
                  <span className="text-[10px] text-purple-600 font-semibold" title="Kutilayotgan sof foyda">
                    Kutilayotgan: ${stats.totalNetProfit.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Kompaniya Moliya Xulosasi */}
        <div className="lg:col-span-8 bg-white border border-[#e4e7ec] rounded-xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-bold text-xs text-[#171b25]">Kompaniya Moliya Xulosasi</h3>
            <div className="text-[10px] text-[#9399a4]">Barcha faol loyihalar va operatsion tushumlar</div>
          </div>

          <div className="divide-y divide-gray-100 text-xs space-y-1">
            <div className="py-3 flex justify-between items-center">
              <span className="font-semibold text-gray-700">Loyiha tushumlari (Mijoz to'lovlari)</span>
              <b className="text-emerald-600 font-bold text-sm">+${stats?.totalRevenueReceived.toLocaleString() ?? 0}</b>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="font-semibold text-gray-700">Loyiha xarajatlari (Material, usta, xizmatlar)</span>
              <b className="text-red-600 font-bold text-sm">-${stats?.totalExpenses.toLocaleString() ?? 0}</b>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="font-semibold text-gray-700">Kutilayotgan qarzdorliklar tushumi</span>
              <b className="text-blue-600 font-bold text-sm">+${stats?.totalPendingReceivables.toLocaleString() ?? 0}</b>
            </div>
            <div className="p-3.5 flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl mt-3">
              <div>
                <span className="font-bold text-gray-900 text-xs uppercase tracking-wide block">NET BALANS (QO'LDAGI REAL SUMMA):</span>
                <span className="text-[10px] text-gray-500 font-medium">Loyiha tushumlari − Jami xarajatlar</span>
              </div>
              {(() => {
                const nb = stats?.netBalance ?? ((stats?.totalRevenueReceived ?? 0) - (stats?.totalExpenses ?? 0));
                const isNeg = nb < 0;
                return (
                  <b className={`font-extrabold text-base ${isNeg ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {isNeg ? `-$${Math.abs(nb).toLocaleString()}` : `+$${nb.toLocaleString()}`}
                  </b>
                );
              })()}
            </div>
            <div className="p-4 flex justify-between items-center bg-emerald-50/60 border border-emerald-200 rounded-xl mt-2">
              <div>
                <span className="font-bold text-emerald-950 text-xs uppercase tracking-wide block">KUTILAYOTGAN YAKUNIY SOF FOYDA:</span>
                <span className="text-[10px] text-emerald-700 font-medium">Barcha shartnoma qarzlari to'liq yopilgandan so'ng</span>
              </div>
              <b className="text-emerald-700 font-extrabold text-lg">${stats?.totalNetProfit.toLocaleString() ?? 0}</b>
            </div>
          </div>
        </div>

        {/* Right: Kutilayotgan To'lovlar */}
        <div className="lg:col-span-4 bg-white border border-[#e4e7ec] rounded-xl p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-bold text-xs text-[#171b25]">Loyiha Majburiyatlari</h3>
            <div className="text-[10px] text-[#9399a4]">Loyiha va operatsion qoldiq to'lovlar</div>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            <div className="py-3 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Ustalar haqi to'lovlari</span>
              <b className="text-gray-900 font-semibold">$0</b>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Material xaridlari qoldig'i</span>
              <b className="text-gray-900 font-semibold">$0</b>
            </div>
            <div className="py-3 flex justify-between items-center">
              <span className="text-gray-600 font-medium">Transport & Logistika</span>
              <b className="text-gray-900 font-semibold">$0</b>
            </div>
          </div>
        </div>
      </div>

      {/* Projects Financial Table */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#e4e7ec] bg-white flex justify-between items-center">
          <h3 className="font-bold text-xs text-[#171b25]">Loyihalar Kesimida Moliyaviy Holat</h3>
          <span className="text-xs text-gray-500 font-medium">{projects.length} ta loyiha</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase">LOYIHA NOMI</th>
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase">MIJOZ</th>
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase">SHARTNOMA</th>
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase">REJALI BYUDJET</th>
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase">HOLATI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef0f3]">
              {projects.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-3.5 px-5 font-bold text-[#171b25]">{p.name}</td>
                  <td className="py-3.5 px-5 text-gray-700">{p.customerName || '-'}</td>
                  <td className="py-3.5 px-5 font-semibold text-gray-900">
                    {p.currency?.toUpperCase() === 'UZS' && p.contractAmountUzs
                      ? <span>{p.contractAmountUzs.toLocaleString()} so'm<span className="block text-[10px] text-gray-400 font-normal">≈ ${p.contractAmount.toLocaleString()}</span></span>
                      : `$${p.contractAmount.toLocaleString()}`}
                  </td>
                  <td className="py-3.5 px-5 text-gray-600">${p.budget.toLocaleString()}</td>
                  <td className="py-3.5 px-5">
                    <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 rounded-full text-[10px] font-bold">
                      {p.statusName}
                    </span>
                  </td>
                </tr>
              ))}
              {projects.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-xs text-gray-400">
                    Hozircha loyihalar mavjud emas
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

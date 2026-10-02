import React, { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Building2, Wallet, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from 'lucide-react';
import { dashboardApi, projectsApi, reportsApi } from '../api/services';
import { DashboardStats, Project } from '../types';
import { UsdWithUzs } from '../components/Money';

export const FinancePage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    dashboardApi.getStats().then(setStats);
    projectsApi.getAll().then(setProjects);
  }, []);

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#171b25]">Moliya &amp; Kompaniya Balansi</h2>
          <p className="text-xs text-[#7b8190] mt-0.5 break-words">Kompaniyaning umumiy moliyaviy ko'rinishi va loyiha xarajatlari tahlili</p>
        </div>
        <button
          onClick={() => reportsApi.downloadAllProjectsExcel()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs min-h-[36px] px-4 rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-all w-full sm:w-auto"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span className="text-center">Barcha moliyaviy hisobotni Excelda yuklash</span>
        </button>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Loyiha Daromadi (Shartnoma) */}
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ff7a16]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1">Loyiha Daromadi (Shartnoma)</small>
            <b className="text-xl sm:text-2xl font-extrabold text-[#171b25] block mt-1 break-words">${(stats?.totalContractValue ?? 0).toLocaleString()}</b>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              ≈ {(stats?.totalContractValueUzs ?? 0).toLocaleString()} so'm
            </span>
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span className="break-words">Olingan: ${(stats?.totalRevenueReceived ?? 0).toLocaleString()} (≈ {(stats?.totalRevenueReceivedUzs ?? 0).toLocaleString()} so'm)</span>
          </div>
        </div>

        {/* Kutilayotgan Qoldiq Tushum */}
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#3b82f6]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1">Kutilayotgan Qoldiq Tushum</small>
            <b className="text-xl sm:text-2xl font-extrabold text-[#3b82f6] block mt-1 break-words">${(stats?.totalPendingReceivables ?? 0).toLocaleString()}</b>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              ≈ {(stats?.totalPendingReceivablesUzs ?? 0).toLocaleString()} so'm
            </span>
          </div>
          <div className="text-[11px] font-medium text-gray-500 mt-2">
            <span>Mijozlar tomonidan to'lanishi kutilmoqda</span>
          </div>
        </div>

        {/* Jami Loyiha Xarajatlari */}
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ef5350]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1">Jami Loyiha Xarajatlari</small>
            <b className="text-xl sm:text-2xl font-extrabold text-[#ef5350] block mt-1 break-words">${(stats?.totalExpenses ?? 0).toLocaleString()}</b>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              ≈ {(stats?.totalExpensesUzs ?? 0).toLocaleString()} so'm
            </span>
          </div>
          <div className="text-[11px] font-medium text-red-600 mt-2 flex items-center gap-1">
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Material, usta, transport va boshqalar</span>
          </div>
        </div>

        {/* Net Balans */}
        {(() => {
          const netBal = stats?.netBalance ?? ((stats?.totalRevenueReceived ?? 0) - (stats?.totalExpenses ?? 0));
          const netBalUzs = stats?.netBalanceUzs ?? ((stats?.totalRevenueReceivedUzs ?? 0) - (stats?.totalExpensesUzs ?? 0));
          const isNegative = netBal < 0;
          return (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between min-h-[110px]">
              <div className={`absolute left-0 top-4 w-1.5 h-8 rounded-r ${isNegative ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <div>
                <small className="block text-[11px] font-bold text-[#697180] mb-1 uppercase tracking-wider">Net Balans (Qo'ldagi summa)</small>
                <b className={`text-xl sm:text-2xl font-extrabold block mt-1 break-words ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isNegative ? `-$${Math.abs(netBal).toLocaleString()}` : `$${netBal.toLocaleString()}`}
                </b>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  ≈ {isNegative ? `-${Math.abs(netBalUzs).toLocaleString()} so'm` : `${netBalUzs.toLocaleString()} so'm`}
                </span>
              </div>
              <div className="text-[11px] font-medium text-gray-500 mt-2 flex flex-wrap items-center justify-between gap-1">
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
        <div className="lg:col-span-8 bg-white border border-[#e4e7ec] rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-bold text-xs text-[#171b25]">Kompaniya Moliya Xulosasi</h3>
            <div className="text-[10px] text-[#9399a4]">Barcha faol loyihalar va operatsion tushumlar</div>
          </div>

          <div className="divide-y divide-gray-100 text-xs space-y-1">
            <div className="py-3 flex justify-between items-center gap-3">
              <span className="font-semibold text-gray-700 min-w-0">Loyiha tushumlari (Mijoz to'lovlari)</span>
              <div className="text-right shrink-0 max-w-[55%]">
                <b className="text-emerald-600 font-bold text-sm">+${(stats?.totalRevenueReceived ?? 0).toLocaleString()}</b>
                <span className="text-[10px] text-gray-400 block font-normal">≈ +{(stats?.totalRevenueReceivedUzs ?? 0).toLocaleString()} so'm</span>
              </div>
            </div>
            <div className="py-3 flex justify-between items-center gap-3">
              <span className="font-semibold text-gray-700 min-w-0">Loyiha xarajatlari (Material, usta, xizmatlar)</span>
              <div className="text-right shrink-0 max-w-[55%]">
                <b className="text-red-600 font-bold text-sm">-${(stats?.totalExpenses ?? 0).toLocaleString()}</b>
                <span className="text-[10px] text-gray-400 block font-normal">≈ -{(stats?.totalExpensesUzs ?? 0).toLocaleString()} so'm</span>
              </div>
            </div>
            <div className="py-3 flex justify-between items-center gap-3">
              <span className="font-semibold text-gray-700 min-w-0">Kutilayotgan qarzdorliklar tushumi</span>
              <div className="text-right shrink-0 max-w-[55%]">
                <b className="text-blue-600 font-bold text-sm">+${(stats?.totalPendingReceivables ?? 0).toLocaleString()}</b>
                <span className="text-[10px] text-gray-400 block font-normal">≈ +{(stats?.totalPendingReceivablesUzs ?? 0).toLocaleString()} so'm</span>
              </div>
            </div>
            <div className="p-3.5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-gray-50 border border-gray-200 rounded-xl mt-3">
              <div className="min-w-0">
                <span className="font-bold text-gray-900 text-xs uppercase tracking-wide block">NET BALANS (QO'LDAGI REAL SUMMA):</span>
                <span className="text-[10px] text-gray-500 font-medium">Loyiha tushumlari − Jami xarajatlar</span>
              </div>
              {(() => {
                const nb = stats?.netBalance ?? ((stats?.totalRevenueReceived ?? 0) - (stats?.totalExpenses ?? 0));
                const nbUzs = stats?.netBalanceUzs ?? ((stats?.totalRevenueReceivedUzs ?? 0) - (stats?.totalExpensesUzs ?? 0));
                const isNeg = nb < 0;
                return (
                  <div className="text-left sm:text-right">
                    <b className={`font-extrabold text-base ${isNeg ? 'text-rose-600' : 'text-emerald-600'}`}>
                      {isNeg ? `-$${Math.abs(nb).toLocaleString()}` : `+$${nb.toLocaleString()}`}
                    </b>
                    <span className="text-[10px] text-gray-400 block font-medium">
                      ≈ {nbUzs < 0 ? `-${Math.abs(nbUzs).toLocaleString()} so'm` : `+${nbUzs.toLocaleString()} so'm`}
                    </span>
                  </div>
                );
              })()}
            </div>
            <div className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-emerald-50/60 border border-emerald-200 rounded-xl mt-2">
              <div className="min-w-0">
                <span className="font-bold text-emerald-950 text-xs uppercase tracking-wide block">KUTILAYOTGAN YAKUNIY SOF FOYDA:</span>
                <span className="text-[10px] text-emerald-700 font-medium">Barcha shartnoma qarzlari to'liq yopilgandan so'ng</span>
              </div>
              <div className="text-left sm:text-right">
                <b className="text-emerald-700 font-extrabold text-base sm:text-lg break-words">${(stats?.totalNetProfit ?? 0).toLocaleString()}</b>
                <span className="text-[10px] text-emerald-600 block font-medium">
                  ≈ {(stats?.totalNetProfitUzs ?? 0).toLocaleString()} so'm
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Kutilayotgan To'lovlar */}
        <div className="lg:col-span-4 bg-white border border-[#e4e7ec] rounded-xl p-4 sm:p-6 shadow-xs space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="font-bold text-xs text-[#171b25]">Loyiha Majburiyatlari</h3>
            <div className="text-[10px] text-[#9399a4]">Loyiha va operatsion qoldiq to'lovlar</div>
          </div>

          <div className="divide-y divide-gray-100 text-xs">
            <div className="py-3 flex justify-between items-center gap-3">
              <span className="text-gray-600 font-medium min-w-0">Ustalar haqi to'lovlari</span>
              <UsdWithUzs className="text-gray-900 font-semibold items-end" usd={0} uzs={0} />
            </div>
            <div className="py-3 flex justify-between items-center gap-3">
              <span className="text-gray-600 font-medium min-w-0">Material xaridlari qoldig'i</span>
              <UsdWithUzs className="text-gray-900 font-semibold items-end" usd={0} uzs={0} />
            </div>
            <div className="py-3 flex justify-between items-center gap-3">
              <span className="text-gray-600 font-medium min-w-0">Transport &amp; Logistika</span>
              <UsdWithUzs className="text-gray-900 font-semibold items-end" usd={0} uzs={0} />
            </div>
          </div>
        </div>
      </div>

      {/* Projects Financial Table */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#e4e7ec] bg-white flex justify-between items-center gap-3">
          <h3 className="font-bold text-xs text-[#171b25]">Loyihalar Kesimida Moliyaviy Holat</h3>
          <span className="text-xs text-gray-500 font-medium">{projects.length} ta loyiha</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
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
                    <UsdWithUzs usd={p.contractAmount} uzs={p.contractAmountUzs} />
                  </td>
                  <td className="py-3.5 px-5 text-gray-600"><UsdWithUzs usd={p.budget} /></td>
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

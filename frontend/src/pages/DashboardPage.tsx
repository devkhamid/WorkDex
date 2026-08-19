import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  ArrowRight
} from 'lucide-react';
import { dashboardApi, projectsApi, reportsApi } from '../api/services';
import { DashboardStats, Project, ProjectStatus } from '../types';

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, projectsData] = await Promise.all([
        dashboardApi.getStats(),
        projectsApi.getAll()
      ]);
      setStats(statsData);
      setProjects(projectsData);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.customerName && p.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.projectType && p.projectType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusPill = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.InProgress:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f8ee] text-[#159452]">Faol</span>;
      case ProjectStatus.OnHold:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fff1df] text-[#c96b08]">Kechikkan</span>;
      case ProjectStatus.Planning:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f0eaff] text-[#7650d7]">Rejalashtirish</span>;
      case ProjectStatus.Completed:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#edf5ff] text-[#2563c7]">Yakunlangan</span>;
      default:
        return null;
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-[#21bd68]';
    if (percent >= 50) return 'bg-[#ff7a16]';
    return 'bg-[#3b82f6]';
  };

  const formatMoney = (amount: number, currency = '$') => {
    return `${currency}${amount.toLocaleString()}`;
  };

  return (
    <div className="p-6 space-y-5">
      {/* 4 KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Faol Loyihalar */}
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ff7a16]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Faol Loyihalar</small>
            <strong className="text-2xl font-bold tracking-tight text-[#171b25]">
              {stats?.activeProjects ?? projects.length} <span className="text-xs font-semibold text-gray-400">/ {stats?.totalProjects ?? projects.length}</span>
            </strong>
          </div>
          <div className="text-[11px] font-semibold mt-2 text-[#21bd68] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats?.completedProjects ?? 0} ta yakunlangan</span>
          </div>
        </div>

        {/* KPI 2: Jami Shartnoma / Daromad */}
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#3b82f6]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Olingan Tushum</small>
            <strong className="text-2xl font-bold tracking-tight text-[#171b25]">
              {formatMoney(stats?.totalRevenueReceived ?? 0)}
            </strong>
          </div>
          <div className="text-[11px] font-medium mt-2 text-[#3b82f6] flex items-center gap-1">
            <span>Qoldiq tushum: {formatMoney(stats?.totalPendingReceivables ?? 0)}</span>
          </div>
        </div>

        {/* KPI 3: Jami Xarajatlar */}
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ef5350]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Jami Xarajatlar</small>
            <strong className="text-2xl font-bold tracking-tight text-[#171b25]">
              {formatMoney(stats?.totalExpenses ?? 0)}
            </strong>
          </div>
          <div className="text-[11px] font-medium mt-2 text-[#ef5350] flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Byudjet ishlatilishi: {stats?.averageBudgetUtilizationPercent ?? 0}%</span>
          </div>
        </div>

        {/* KPI 4: Sof Foyda */}
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#8b5cf6]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Kutilayotgan Sof Foyda</small>
            <strong className="text-2xl font-bold tracking-tight text-[#171b25]">
              {formatMoney(stats?.totalNetProfit ?? 0)}
            </strong>
          </div>
          <div className="text-[11px] font-semibold mt-2 text-[#21bd68] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Xavf ostida: {stats?.atRiskProjectsCount ?? 0} ta loyiha</span>
          </div>
        </div>
      </div>

      {/* Dashboard Grid (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Loyiha rivojlanish xulosasi */}
        <div className="lg:col-span-7 bg-white border border-[#e4e7ec] rounded-xl shadow-xs p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-[#f0f2f5]">
              <div>
                <h3 className="font-bold text-xs text-[#171b25]">Loyiha rivojlanish xulosasi</h3>
                <div className="text-[10px] text-[#9399a4]">Obyektlarning oylik bajarilish darajasi</div>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-[#727987]">
                <span className="flex items-center gap-1.5">
                  <i className="w-2.5 h-2.5 rounded-xs bg-[#ff7a16] inline-block" /> Bajarilgan
                </span>
                <span className="flex items-center gap-1.5">
                  <i className="w-2.5 h-2.5 rounded-xs bg-[#bdd9f7] inline-block" /> Rejalashtirilgan
                </span>
              </div>
            </div>

            {/* Custom Bar Chart */}
            <div className="pt-6 pb-2 px-2 h-52 flex items-end justify-between border-b border-[#e8ebef]">
              {[
                { m: 'Yan', d: 54, r: 72 },
                { m: 'Fev', d: 62, r: 78 },
                { m: 'Mar', d: 71, r: 85 },
                { m: 'Apr', d: 45, r: 82 },
                { m: 'May', d: 30, r: 74 },
                { m: 'Iyun', d: 15, r: 62 },
              ].map((item, idx) => (
                <div key={idx} className="flex flex-col items-center gap-1.5 flex-1">
                  <div className="flex items-end gap-1.5 h-36">
                    <div
                      style={{ height: `${item.d}%` }}
                      className="w-4 bg-[#ff7a16] rounded-t-sm transition-all hover:brightness-95"
                      title={`Bajarilgan: ${item.d}%`}
                    />
                    <div
                      style={{ height: `${item.r}%` }}
                      className="w-4 bg-[#bdd9f7] rounded-t-sm transition-all hover:brightness-95"
                      title={`Rejalashtirilgan: ${item.r}%`}
                    />
                  </div>
                  <span className="text-[10px] text-gray-400 font-medium">{item.m}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Loyiha holati */}
        <div className="lg:col-span-5 bg-white border border-[#e4e7ec] rounded-xl shadow-xs p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="pb-3 border-b border-[#f0f2f5]">
              <h3 className="font-bold text-xs text-[#171b25]">Loyiha holati</h3>
              <div className="text-[10px] text-[#9399a4]">Obyektlarning joriy bajarilish foizlari</div>
            </div>

            <div className="py-2 space-y-3.5">
              {projects.slice(0, 4).map((p) => (
                <div key={p.id} className="cursor-pointer hover:bg-gray-50/70 p-2 rounded-lg transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5 text-[#171b25] truncate">
                      <span className="w-2 h-2 rounded-full bg-[#21bd68]" />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="text-[#21bd68] font-bold">{p.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-[#edf0f3] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(p.progressPercent, 4)}%` }}
                      className={`h-full rounded-full ${getProgressColor(p.progressPercent)} transition-all`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-[#9a9faa] mt-1.5">
                    <span>{p.location || 'Toshkent'}</span>
                    <span className="font-medium text-gray-600">{p.statusName}</span>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400">Faol loyihalar mavjud emas</div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/projects')}
            className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-[#e4e7ec] rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1 transition-colors mt-2"
          >
            <span>Barcha loyihalarni ko‘rish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Table Card */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3.5 border-b border-[#e4e7ec] bg-white">
          <input
            type="text"
            placeholder="⌕ Loyiha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-[34px] border border-[#e4e7ec] rounded-lg px-3 text-xs outline-none focus:border-[#ff7a16] min-w-[200px]"
          />
          <button className="h-[34px] border border-[#e4e7ec] bg-white hover:bg-gray-50 px-3 rounded-lg text-xs text-gray-700 flex items-center gap-1.5 transition-colors font-medium">
            <Filter className="w-3 h-3 text-gray-500" />
            <span>Filtr</span>
          </button>
          <button
            onClick={() => reportsApi.downloadAllProjectsExcel()}
            className="h-[34px] border border-[#e4e7ec] bg-white hover:bg-gray-50 px-3 rounded-lg text-xs text-gray-700 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Download className="w-3 h-3 text-gray-500" />
            <span>Eksport (Excel)</span>
          </button>
          <div className="ml-auto text-[11px] text-[#969ca7] font-semibold">
            {filteredProjects.length} ta loyiha
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">LOYIHA NOMI</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">HOLAT</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">RIVOJLANISH</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">SHARTNOMA / BYUDJET</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">MUDDAT</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">MIJOZ</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider text-right">AMAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef0f3]">
              {filteredProjects.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="hover:bg-[#fafbfc] cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-xs text-[#171b25]">{p.name}</div>
                    <div className="text-[10px] text-[#999faa] mt-0.5">{p.projectType || 'Loyiha'} · {p.location || 'Toshkent'}</div>
                  </td>
                  <td className="py-3.5 px-5">
                    {getStatusPill(p.status)}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs w-8">{p.progressPercent}%</span>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(p.progressPercent, 4)}%` }}
                          className={`h-full ${getProgressColor(p.progressPercent)}`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <span className="font-bold text-gray-900">${p.contractAmount.toLocaleString()}</span>
                    <span className="text-gray-400 font-normal"> / ${p.budget.toLocaleString()}</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-600 text-xs">
                    {new Date(p.startDate).toLocaleDateString('uz-UZ')} {p.endDate ? `— ${new Date(p.endDate).toLocaleDateString('uz-UZ')}` : ''}
                  </td>
                  <td className="py-3.5 px-5 text-gray-700 font-medium">
                    {p.customerName || '-'}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${p.id}`);
                      }}
                      className="px-3 py-1 text-[11px] font-bold text-[#ff7a16] hover:bg-orange-50 rounded-lg border border-orange-200 transition-colors"
                    >
                      Ochish →
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                    Hech qanday loyiha topilmadi
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

import React, { useEffect, useState } from 'react';
import { DollarSign, TrendingUp, TrendingDown, Building2 } from 'lucide-react';
import { dashboardApi, projectsApi } from '../api/services';
import { DashboardStats, Project } from '../types';

export const FinancePage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    dashboardApi.getStats().then(setStats);
    projectsApi.getAll().then(setProjects);
  }, []);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#171b25]">Moliya & Balans</h2>
        <p className="text-xs text-[#7b8190] mt-0.5">Barcha loyihalar bo'yicha kirim, chiqim va kutilayotgan sof foyda</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase">JAMI SHARTNOMALAR</small>
          <b className="text-2xl font-extrabold text-[#171b25] block mt-1">${stats?.totalContractValue.toLocaleString() ?? 0}</b>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase">OLINGAN TUSHUM (KIRIM)</small>
          <b className="text-2xl font-extrabold text-emerald-600 block mt-1">${stats?.totalRevenueReceived.toLocaleString() ?? 0}</b>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase">JAMI XARAJATLAR (CHIQIM)</small>
          <b className="text-2xl font-extrabold text-red-600 block mt-1">${stats?.totalExpenses.toLocaleString() ?? 0}</b>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase">SOF FOYDA</small>
          <b className="text-2xl font-extrabold text-purple-600 block mt-1">${stats?.totalNetProfit.toLocaleString() ?? 0}</b>
        </div>
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
        <h3 className="font-bold text-xs text-[#171b25] mb-3">Loyihalar Moliyaviy Taqsimoti</h3>
        <div className="divide-y divide-gray-100 text-xs">
          {projects.map((p) => (
            <div key={p.id} className="py-3 flex items-center justify-between">
              <div>
                <div className="font-semibold text-gray-900">{p.name}</div>
                <div className="text-[10px] text-gray-400">Mijoz: {p.customerName}</div>
              </div>
              <div className="text-right">
                <div className="font-bold text-gray-800">${p.contractAmount.toLocaleString()}</div>
                <div className="text-[10px] text-gray-500">Byudjet: ${p.budget.toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

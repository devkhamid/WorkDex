import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Filter, Building2, MapPin, Calendar, ArrowRight } from 'lucide-react';
import { projectsApi } from '../api/services';
import { Project, ProjectStatus } from '../types';

interface ProjectsPageProps {
  onOpenNewProject: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onOpenNewProject }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    projectsApi.getAll().then((data) => {
      setProjects(data);
    }).finally(() => setLoading(false));
  }, []);

  const filtered = projects.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.customerName && p.customerName.toLowerCase().includes(search.toLowerCase())) ||
      (p.projectType && p.projectType.toLowerCase().includes(search.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusPill = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.InProgress:
        return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f8ee] text-[#159452]">Faol</span>;
      case ProjectStatus.OnHold:
        return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#fff1df] text-[#c96b08]">Kechikkan</span>;
      case ProjectStatus.Planning:
        return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#f0eaff] text-[#7650d7]">Rejalashtirish</span>;
      case ProjectStatus.Completed:
        return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#edf5ff] text-[#2563c7]">Yakunlangan</span>;
      default:
        return null;
    }
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 80) return 'bg-[#21bd68]';
    if (percent >= 50) return 'bg-[#ff7a16]';
    return 'bg-[#3b82f6]';
  };

  return (
    <div className="p-6 space-y-4">
      {/* Page Title & Action */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#171b25]">Loyihalar</h2>
          <p className="text-xs text-[#7b8190] mt-0.5">Barcha ta’mirlash va qurilish loyihalaringizni bir joydan boshqaring.</p>
        </div>
        <button
          onClick={onOpenNewProject}
          className="bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs h-[34px] px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi loyiha</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex flex-wrap items-center gap-3 shadow-xs">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="⌕ Loyiha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-8 pl-8 pr-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="h-8 px-2.5 border border-[#e4e7ec] rounded-lg text-xs text-gray-700 bg-white outline-none focus:border-[#ff7a16]"
        >
          <option value="all">Barcha holatlar</option>
          <option value={ProjectStatus.InProgress}>Faol (InProgress)</option>
          <option value={ProjectStatus.Planning}>Rejalashtirish (Planning)</option>
          <option value={ProjectStatus.OnHold}>Kechikkan / To'xtatilgan (OnHold)</option>
          <option value={ProjectStatus.Completed}>Yakunlangan (Completed)</option>
        </select>

        <span className="text-xs text-[#969ca7] font-medium ml-auto">
          {filtered.length} ta loyiha
        </span>
      </div>

      {/* Projects Grid matching prototype */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/projects/${p.id}`)}
            className="bg-white border border-[#e4e7ec] hover:border-[#ff7a16]/40 rounded-xl p-4.5 shadow-sm hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                {getStatusPill(p.status)}
                <span className="text-gray-400 font-bold text-sm">⋯</span>
              </div>

              <h3 className="font-bold text-sm text-[#171b25] mt-3 mb-1 truncate">{p.name}</h3>
              <p className="text-xs text-[#7b8190] mb-3 truncate">
                {p.customerName || 'Mijoz'} · {p.location || 'Toshkent'}
              </p>

              {/* Progress bar */}
              <div className="h-1.5 bg-[#edf0f3] rounded-full overflow-hidden mb-1">
                <div
                  style={{ width: `${Math.max(p.progressPercent, 4)}%` }}
                  className={`h-full rounded-full ${getProgressColor(p.progressPercent)} transition-all`}
                />
              </div>
              <div className="flex justify-between text-[10px] text-[#7c838e] mb-3">
                <span className="font-semibold">{p.progressPercent}% tamamlandi</span>
                <span>{p.projectType || 'Ta\'mir'}</span>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50/70 rounded-lg border border-gray-100 mb-3.5">
                <div>
                  <small className="block text-[9px] text-[#9a9faa]">Shartnoma</small>
                  <b className="text-xs text-[#171b25]">${p.contractAmount.toLocaleString()}</b>
                </div>
                <div>
                  <small className="block text-[9px] text-[#9a9faa]">Rejali Byudjet</small>
                  <b className="text-xs text-[#171b25]">${p.budget.toLocaleString()}</b>
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/projects/${p.id}`);
              }}
              className="w-full py-1.5 bg-white hover:bg-gray-50 border border-[#e4e7ec] rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1 transition-colors"
            >
              <span>Loyihani ochish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 bg-white border border-[#e4e7ec] rounded-xl">
          <Building2 className="w-8 h-8 text-gray-300 mx-auto mb-2" />
          <div className="text-sm font-semibold text-gray-700">Hech qanday loyiha topilmadi</div>
          <p className="text-xs text-gray-400 mt-1">Yangi loyiha yaratish uchun "+ Yangi loyiha" tugmasini bosing</p>
        </div>
      )}
    </div>
  );
};

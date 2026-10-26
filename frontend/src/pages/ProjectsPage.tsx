import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, ArrowRight, Pencil } from 'lucide-react';
import { projectsApi } from '../api/services';
import { Project, ProjectStatus, UserRole } from '../types';
import { UsdWithUzs } from '../components/Money';
import { RenameProjectModal } from '../components/RenameProjectModal';
import { useAuth } from '../context/AuthContext';

interface ProjectsPageProps {
  onOpenNewProject: () => void;
}

export const ProjectsPage: React.FC<ProjectsPageProps> = ({ onOpenNewProject }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<number | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [renaming, setRenaming] = useState<Project | null>(null);
  const { user } = useAuth();
  const canRename = user?.role === UserRole.SuperAdmin || user?.role === UserRole.Admin || user?.role === UserRole.ProjectManager;

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
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#e6f8ee] text-[#159452]">Faol</span>;
      case ProjectStatus.OnHold:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#fff1df] text-[#c96b08]">Kechikkan</span>;
      case ProjectStatus.Planning:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f0eaff] text-[#7650d7]">Rejalashtirish</span>;
      case ProjectStatus.Completed:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#edf5ff] text-[#2563c7]">Yakunlangan</span>;
      case ProjectStatus.Cancelled:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#f4f5f7] text-[#697180]">Bekor qilingan</span>;
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
    <div className="p-4 sm:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-bold text-[#171b25]">Loyihalar</h2>
        <p className="text-xs text-[#7b8190] mt-0.5 break-words">Barcha ta’mirlash va qurilish loyihalaringizni bir joydan boshqaring.</p>
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex flex-wrap items-center gap-3 shadow-xs">
        <div className="relative flex-1 min-w-full sm:min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
          <input
            type="text"
            placeholder="⌕ Loyiha, mijoz yoki manzil bo'yicha qidirish..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-9 pl-9 pr-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          className="h-9 w-full sm:w-auto px-3 border border-[#e4e7ec] rounded-lg text-xs text-gray-700 bg-white outline-none focus:border-[#ff7a16]"
        >
          <option value="all">Barcha holatlar</option>
          <option value={ProjectStatus.InProgress}>Faol (InProgress)</option>
          <option value={ProjectStatus.Planning}>Rejalashtirish (Planning)</option>
          <option value={ProjectStatus.OnHold}>Kechikkan / Muzlatilgan (OnHold)</option>
          <option value={ProjectStatus.Completed}>Yakunlangan (Completed)</option>
          <option value={ProjectStatus.Cancelled}>Bekor qilingan (Cancelled)</option>
        </select>

        <span className="text-xs text-[#969ca7] font-semibold sm:ml-auto">
          {filtered.length} ta loyiha
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((p) => (
          <div
            key={p.id}
            onClick={() => navigate(`/projects/${p.id}`)}
            className="bg-white border border-[#e4e7ec] hover:border-[#ff7a16]/50 rounded-xl p-5 shadow-xs hover:shadow-md cursor-pointer transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                {getStatusPill(p.status)}
                {canRename && (
                  <button
                    type="button"
                    title="Nomini o'zgartirish"
                    aria-label="Nomini o'zgartirish"
                    onClick={(e) => {
                      e.stopPropagation();
                      setRenaming(p);
                    }}
                    className="ml-auto p-1.5 -m-1.5 rounded-md text-gray-400 hover:text-[#ff7a16] hover:bg-orange-50 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="font-bold text-sm text-[#171b25] mt-3 mb-1 truncate">{p.name}</h3>
              <p className="text-xs text-[#7b8190] mb-3.5 truncate">
                {p.customerName || 'Mijoz'} · {p.location || 'Toshkent'}
              </p>

              <div className="space-y-1 mb-3.5">
                <div className="h-2 bg-[#edf0f3] rounded-full overflow-hidden">
                  <div
                    style={{ width: `${Math.max(p.progressPercent, 2)}%` }}
                    className={`h-full rounded-full ${getProgressColor(p.progressPercent)} transition-all`}
                  />
                </div>
                <div className="flex justify-between text-[11px] text-[#7c838e]">
                  <span className="font-bold text-gray-700">{p.progressPercent}% tamamlandi</span>
                  <span>{p.projectType || 'Ta\'mir'}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-3 bg-gray-50/80 rounded-lg border border-gray-100 mb-4">
                <div>
                  <small className="block text-[10px] font-semibold text-[#9a9faa]">Shartnoma</small>
                  <UsdWithUzs className="text-sm font-bold text-[#171b25] break-words" usd={p.contractAmount} uzs={p.contractAmountUzs} />
                </div>
                <div>
                  <small className="block text-[10px] font-semibold text-[#9a9faa]">Rejali Byudjet</small>
                  <UsdWithUzs className="text-sm font-bold text-[#171b25] break-words" usd={p.budget} />
                </div>
              </div>
            </div>

            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/projects/${p.id}`);
              }}
              className="w-full py-2 bg-white hover:bg-orange-50 border border-[#e4e7ec] hover:border-orange-200 rounded-lg text-xs font-bold text-gray-800 hover:text-[#ff7a16] flex items-center justify-center gap-1.5 transition-colors"
            >
              <span>Loyihani ochish</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && !loading && (
        <div className="text-center py-16 bg-white border border-[#e4e7ec] rounded-xl">
          <Building2 className="w-10 h-10 text-gray-300 mx-auto mb-2" />
          <div className="text-sm font-bold text-gray-700">Hech qanday loyiha topilmadi</div>
          <p className="text-xs text-gray-400 mt-1">Yangi loyiha yaratish uchun tepada "+ Yangi loyiha" tugmasini bosing</p>
        </div>
      )}

      <RenameProjectModal
        project={renaming}
        onClose={() => setRenaming(null)}
        onRenamed={(updated) => setProjects((prev) => prev.map((x) => (x.id === updated.id ? { ...x, name: updated.name } : x)))}
      />
    </div>
  );
};

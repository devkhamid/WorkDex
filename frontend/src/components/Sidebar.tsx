import React, { useEffect, useState } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  Package,
  HardHat,
  DollarSign,
  CheckSquare,
  FileSpreadsheet,
  ExternalLink,
  LogOut,
  Search,
  Grid,
  ShieldCheck
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectsApi } from '../api/services';
import { Project, ProjectStatus } from '../types';

interface SidebarProps {
  onOpenNewProject: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ onOpenNewProject }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);

  useEffect(() => {
    projectsApi.getAll().then((data) => {
      setActiveProjects(data.slice(0, 5));
    }).catch(() => {});
  }, []);

  const navItems = [
    { to: '/', label: 'Boshqaruv paneli', icon: LayoutDashboard },
    { to: '/superadmin', label: 'Adminlar & Kompaniyalar', icon: ShieldCheck },
    { to: '/projects', label: 'Loyihalar', icon: Building2 },
    { to: '/customers', label: 'Mijozlar', icon: Users },
    { to: '/materials', label: 'Materiallar', icon: Package },
    { to: '/workers', label: 'Ustalar & Ish haqi', icon: HardHat },
    { to: '/finance', label: 'Moliya', icon: DollarSign },
    { to: '/tasks', label: 'Vazifalar', icon: CheckSquare },
    { to: '/reports', label: 'Hisobotlar (Excel)', icon: FileSpreadsheet },
  ];

  const getStatusDot = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Planning: return 'bg-[#8b5cf6]';
      case ProjectStatus.InProgress: return 'bg-[#21bd68]';
      case ProjectStatus.OnHold: return 'bg-[#ff7a16]';
      case ProjectStatus.Completed: return 'bg-[#3b82f6]';
      default: return 'bg-gray-400';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <aside className="w-56 bg-white border-r border-[#e4e7ec] flex flex-col flex-shrink-0 min-h-screen">
      {/* Brand */}
      <div className="h-[76px] flex items-center gap-2.5 px-4 font-bold text-sm text-[#171b25]">
        <div className="w-7 h-7 rounded-lg bg-[#ff7a16] text-white flex items-center justify-center font-extrabold text-sm shadow-sm">
          W
        </div>
        <span className="font-extrabold text-base tracking-tight">WorkDex</span>
        <Grid className="w-4 h-4 ml-auto text-gray-400" />
      </div>

      {/* Search */}
      <div className="mx-3.5 mb-4 flex items-center border border-[#e4e7ec] rounded-lg h-9 px-2.5 text-gray-400 gap-2 text-xs bg-gray-50/50">
        <Search className="w-3.5 h-3.5" />
        <span className="text-gray-400">Tezkor qidiruv...</span>
        <span className="ml-auto text-[10px] bg-white px-1.5 py-0.5 rounded border border-gray-200 text-gray-400 font-mono">⌘K</span>
      </div>

      {/* Main Navigation */}
      <nav className="px-2.5 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isItemActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);

          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={() =>
                `w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2.5 transition-colors ${
                  isItemActive
                    ? 'bg-[#eef5ff] text-[#2563c7] font-semibold'
                    : 'text-[#626a78] hover:bg-gray-50 hover:text-[#171b25]'
                }`
              }
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}

        {/* Section Label: AKTIF PROJELER */}
        <div className="pt-5 pb-2 px-3 text-[10px] font-bold text-[#a0a5af] tracking-wider uppercase">
          FAOL LOYIHALAR
        </div>

        {/* Active Projects List */}
        <div className="space-y-0.5">
          {activeProjects.map((p) => (
            <button
              key={p.id}
              onClick={() => navigate(`/projects/${p.id}`)}
              className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-[#626a78] hover:bg-gray-100 hover:text-[#171b25] flex items-center gap-2 truncate transition-colors"
            >
              <span className={`w-2 h-2 rounded-full flex-shrink-0 ${getStatusDot(p.status)}`} />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
          {activeProjects.length === 0 && (
            <div className="px-3 py-1 text-[11px] text-gray-400 italic">Loyihalar mavjud emas</div>
          )}
        </div>
      </nav>

      {/* User Footer */}
      <div className="mt-auto border-t border-[#e4e7ec] p-3 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-full bg-[#ff7a16] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
          {getInitials(user?.fullName)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-xs text-[#171b25] truncate">{user?.fullName || 'Foydalanuvchi'}</div>
          <div className="text-[10px] text-[#ff7a16] font-medium truncate">{user?.companyName || user?.roleName || 'Admin'}</div>
        </div>
        <button
          onClick={logout}
          title="Tizimdan chiqish"
          className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};

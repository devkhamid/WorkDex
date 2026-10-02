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
  LogOut,
  Search,
  Grid,
  ShieldCheck,
  Briefcase,
  FileText,
  Settings,
  UserCog,
  X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { projectsApi } from '../api/services';
import { Project, ProjectStatus, UserRole } from '../types';

interface SidebarProps {
  onOpenNewProject: () => void;
  // Mobil (lg dan kichik) ekranda chap tomondan chiquvchi menyu holati
  mobileOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen = false, onClose }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeProjects, setActiveProjects] = useState<Project[]>([]);

  useEffect(() => {
    onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const isSuperAdmin = user?.role === UserRole.SuperAdmin;

  useEffect(() => {
    // Bu ro'yxat SuperAdmin uchun ko'rsatilmaydi (pastdagi `!isSuperAdmin`
    // sharti), shuning uchun keraksiz so'rovni ham yubormaymiz.
    if (isSuperAdmin) {
      setActiveProjects([]);
      return;
    }

    projectsApi.getAll().then((data) => {
      // Sarlavha "FAOL LOYIHALAR" bo'lgani uchun yakunlangan va bekor
      // qilingan loyihalar bu ro'yxatga tushmaydi.
      const active = data.filter(p =>
        p.status === ProjectStatus.Planning ||
        p.status === ProjectStatus.InProgress ||
        p.status === ProjectStatus.OnHold
      );
      setActiveProjects(active.slice(0, 5));
    }).catch(() => {});
  }, [isSuperAdmin]);

  const navItems = isSuperAdmin
    ? [
        { to: '/superadmin', label: 'Adminlar & Kompaniyalar', icon: ShieldCheck },
        { to: '/settings', label: 'Sozlamalar', icon: Settings },
      ]
    : [
        { to: '/', label: 'Boshqaruv paneli', icon: LayoutDashboard },
        { to: '/projects', label: 'Loyihalar', icon: Building2 },
        { to: '/customers', label: 'Mijozlar', icon: Users },
        { to: '/materials', label: 'Materiallar', icon: Package },
        { to: '/workers', label: 'Ustalar & Ish haqi', icon: HardHat },
        ...(user?.role === UserRole.Admin ? [{ to: '/team', label: 'Xodimlar', icon: UserCog }] : []),
        { to: '/finance', label: 'Moliya', icon: DollarSign },
        { to: '/tasks', label: 'Vazifalar', icon: CheckSquare },
        { to: '/reports', label: 'Hisobotlar (Excel)', icon: FileSpreadsheet },
        { to: '/agreements', label: 'Shartnomalar', icon: FileText },
        { to: '/office', label: 'Mening Ofisim', icon: Briefcase },
        { to: '/settings', label: 'Sozlamalar', icon: Settings },
      ];

  const getStatusDot = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.Planning: return 'bg-[#8b5cf6]';
      case ProjectStatus.InProgress: return 'bg-[#21bd68]';
      case ProjectStatus.OnHold: return 'bg-[#ff7a16]';
      case ProjectStatus.Completed: return 'bg-[#3b82f6]';
      case ProjectStatus.Cancelled: return 'bg-[#9aa1ad]';
      default: return 'bg-gray-400';
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  return (
    <>
    {mobileOpen && (
      <div className="no-print fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={onClose} aria-hidden="true" />
    )}
    <aside
      className={`no-print fixed inset-y-0 left-0 z-50 w-[260px] max-w-[85vw] transform transition-transform duration-200 lg:static lg:z-auto lg:w-[230px] lg:translate-x-0 border-r border-[#e4e7ec] bg-white flex flex-col justify-between flex-shrink-0 lg:min-h-screen overflow-y-auto ${
        mobileOpen ? 'translate-x-0 shadow-xl' : '-translate-x-full'
      }`}
    >
      {/* Brand Header */}
      <div>
        <div className="h-[56px] lg:h-[66px] flex items-center justify-between px-5 border-b border-[#e4e7ec]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#ff7a16] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              W
            </div>
            <span className="font-extrabold text-sm text-[#171b25] tracking-tight">WorkDex</span>
          </div>
          <button className="hidden lg:block text-gray-400 hover:text-gray-600 transition-colors">
            <Grid className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="lg:hidden p-1.5 -mr-1.5 text-gray-500 hover:text-gray-800" aria-label="Menyuni yopish">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Search Input */}
        <div className="p-3">
          <div className="flex items-center gap-2 bg-[#f4f5f7] rounded-lg px-3 h-8 text-[#7a8190]">
            <Search className="w-3.5 h-3.5" />
            <input
              type="text"
              placeholder="Tezkor qidiruv..."
              className="bg-transparent text-xs w-full outline-none placeholder:text-gray-400"
            />
            <span className="text-[10px] text-gray-400 bg-white px-1.5 py-0.5 rounded border border-gray-200">⌘K</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="px-3 space-y-0.5">
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

          {/* Section Label: FAOL LOYIHALAR (Only for regular Company Admins) */}
          {!isSuperAdmin && (
            <>
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
            </>
          )}
        </nav>
      </div>

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
    </>
  );
};

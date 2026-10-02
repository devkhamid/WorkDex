import React from 'react';
import { Calendar, Bell, Plus, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface HeaderProps {
  title: string;
  onOpenNewProject: () => void;
  onOpenMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenNewProject, onOpenMenu }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SuperAdmin;

  return (
    <header className="no-print sticky top-0 z-30 lg:static h-[56px] lg:h-[66px] bg-white border-b border-[#e4e7ec] flex items-center px-3 sm:px-6 gap-2 sm:gap-3">
      <button
        onClick={onOpenMenu}
        className="lg:hidden -ml-1 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        aria-label="Menyuni ochish"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Breadcrumb */}
      <div className="text-xs text-[#a0a5af] flex items-center gap-1.5 min-w-0">
        <span className="hidden sm:inline">WorkDex</span>
        <span className="hidden sm:inline">›</span>
        <strong className="text-[#242936] font-semibold truncate text-sm sm:text-xs">{title}</strong>
      </div>

      <div className="flex-1" />

      {/* Date filter pill */}
      <button className="hidden md:flex border border-[#e4e7ec] bg-white hover:bg-[#f7f8fa] rounded-lg h-[34px] px-3 text-xs text-[#4f5663] items-center gap-2 transition-colors">
        <Calendar className="w-3.5 h-3.5 text-gray-500" />
        <span>1 Avgust — 31 Avgust 2026</span>
      </button>

      {/* Notification button */}
      <button className="flex-shrink-0 border border-[#e4e7ec] bg-white hover:bg-[#f7f8fa] rounded-lg h-[34px] w-[36px] flex items-center justify-center text-gray-600 relative transition-colors">
        <Bell className="w-4 h-4 text-gray-600" />
        <span className="absolute w-2 h-2 bg-[#ef5350] rounded-full right-2 top-2 ring-2 ring-white" />
      </button>

      {/* New Project Primary Button (Only for Company Admins / Managers, not SuperAdmin) */}
      {!isSuperAdmin && (
        <button
          onClick={onOpenNewProject}
          aria-label="Yangi loyiha"
          className="flex-shrink-0 bg-[#ff7a16] hover:bg-[#e86807] border border-[#ff7a16] text-white font-semibold text-xs h-[34px] px-2.5 sm:px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Yangi loyiha</span>
        </button>
      )}
    </header>
  );
};

import React from 'react';
import { Calendar, Bell, Plus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

interface HeaderProps {
  title: string;
  onOpenNewProject: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenNewProject }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SuperAdmin;

  return (
    <header className="h-[66px] bg-white border-b border-[#e4e7ec] flex items-center px-6 gap-3">
      {/* Breadcrumb */}
      <div className="text-xs text-[#a0a5af] flex items-center gap-1.5">
        <span>WorkDex</span>
        <span>›</span>
        <strong className="text-[#242936] font-semibold">{title}</strong>
      </div>

      <div className="flex-1" />

      {/* Date filter pill */}
      <button className="border border-[#e4e7ec] bg-white hover:bg-[#f7f8fa] rounded-lg h-[34px] px-3 text-xs text-[#4f5663] flex items-center gap-2 transition-colors">
        <Calendar className="w-3.5 h-3.5 text-gray-500" />
        <span>1 Avgust — 31 Avgust 2026</span>
      </button>

      {/* Notification button */}
      <button className="border border-[#e4e7ec] bg-white hover:bg-[#f7f8fa] rounded-lg h-[34px] w-[36px] flex items-center justify-center text-gray-600 relative transition-colors">
        <Bell className="w-4 h-4 text-gray-600" />
        <span className="absolute w-2 h-2 bg-[#ef5350] rounded-full right-2 top-2 ring-2 ring-white" />
      </button>

      {/* New Project Primary Button (Only for Company Admins / Managers, not SuperAdmin) */}
      {!isSuperAdmin && (
        <button
          onClick={onOpenNewProject}
          className="bg-[#ff7a16] hover:bg-[#e86807] border border-[#ff7a16] text-white font-semibold text-xs h-[34px] px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi loyiha</span>
        </button>
      )}
    </header>
  );
};

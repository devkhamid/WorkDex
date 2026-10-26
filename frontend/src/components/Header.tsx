import React from 'react';
import { Calendar, Plus, Menu } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { NotificationBell } from './NotificationBell';
import { useCbuRate } from '../utils/money';
import { CurrencyHistoryModal } from './CurrencyHistoryModal';

interface HeaderProps {
  title: string;
  onOpenNewProject: () => void;
  onOpenMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ title, onOpenNewProject, onOpenMenu }) => {
  const { user } = useAuth();
  const isSuperAdmin = user?.role === UserRole.SuperAdmin;
  const cbuRate = useCbuRate();
  const [isCurrencyHistoryOpen, setIsCurrencyHistoryOpen] = React.useState(false);

  return (
    <header className="no-print sticky top-0 z-30 lg:static h-[56px] lg:h-[66px] bg-white border-b border-[#e4e7ec] flex items-center px-3 sm:px-6 gap-2 sm:gap-3">
      <button
        onClick={onOpenMenu}
        className="lg:hidden -ml-1 p-2 rounded-lg text-gray-600 hover:bg-gray-100"
        aria-label="Menyuni ochish"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="text-xs text-[#a0a5af] flex items-center gap-1.5 min-w-0">
        <span className="hidden sm:inline">WorkDex</span>
        <span className="hidden sm:inline">›</span>
        <strong className="text-[#242936] font-semibold truncate text-sm sm:text-xs">{title}</strong>
      </div>

      <div className="flex-1" />

      {cbuRate > 0 && (
        <button
          type="button"
          onClick={() => setIsCurrencyHistoryOpen(true)}
          title="USD kursi tarixini ko'rish"
          aria-label={`CBU joriy kursi: 1 AQSH dollari ${cbuRate.toLocaleString('ru-RU')} so'm. Tarixni ko'rish`}
          className="flex flex-shrink-0 border border-[#e4e7ec] bg-white hover:bg-[#f7f8fa] rounded-lg h-[34px] px-2 sm:px-2.5 text-xs text-[#4f5663] items-center gap-1.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
        >
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 rounded px-1 py-0.5">CBU</span>
          <span className="hidden whitespace-nowrap sm:inline">
            1$ = <b className="font-semibold text-[#171b25]">{cbuRate.toLocaleString('ru-RU', { maximumFractionDigits: 2 })}</b> so'm
          </span>
        </button>
      )}

      <button className="hidden md:flex border border-[#e4e7ec] bg-white hover:bg-[#f7f8fa] rounded-lg h-[34px] px-3 text-xs text-[#4f5663] items-center gap-2 transition-colors">
        <Calendar className="w-3.5 h-3.5 text-gray-500" />
        <span>1 Avgust — 31 Avgust 2026</span>
      </button>

      {!isSuperAdmin && <NotificationBell />}

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
      {isCurrencyHistoryOpen && <CurrencyHistoryModal onClose={() => setIsCurrencyHistoryOpen(false)} />}
    </header>
  );
};

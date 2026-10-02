import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Plus, Pencil, Trash2, CheckCheck, Loader2 } from 'lucide-react';
import { notificationsApi, AppNotification } from '../api/services';

const POLL_MS = 30_000;

const timeAgo = (iso: string) => {
  const diff = Math.max(0, Date.now() - new Date(iso).getTime());
  const min = Math.floor(diff / 60_000);
  if (min < 1) return 'hozirgina';
  if (min < 60) return `${min} daqiqa oldin`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} soat oldin`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'kecha';
  if (d < 7) return `${d} kun oldin`;
  return new Date(iso).toLocaleDateString('ru-RU');
};

const ACTION_STYLE: Record<number, { icon: React.ElementType; cls: string }> = {
  1: { icon: Plus, cls: 'bg-emerald-50 text-emerald-600' },
  2: { icon: Pencil, cls: 'bg-blue-50 text-blue-600' },
  3: { icon: Trash2, cls: 'bg-red-50 text-red-600' },
};

export const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    try {
      const data = await notificationsApi.getAll(30);
      setItems(data.items);
      setUnread(data.unreadCount);
      return data;
    } catch {
      /* tarmoq xatosida eski ro'yxat qoladi */
      return null;
    }
  }, []);

  useEffect(() => {
    const first = window.setTimeout(load, 0);
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') load();
    }, POLL_MS);
    const onFocus = () => load();
    window.addEventListener('focus', onFocus);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
    };
  }, [load]);

  const close = useCallback(() => {
    setOpen(false);
    setItems(prev => prev.map(i => (i.isUnread ? { ...i, isUnread: false } : i)));
  }, []);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, close]);

  const toggle = async () => {
    if (open) {
      close();
      return;
    }
    setOpen(true);
    setLoading(true);
    const data = await load();
    setLoading(false);
    // Ochilganda hammasi o'qilgan hisoblanadi; ro'yxatdagi "yangi" belgilari
    // menyu yopilguncha ko'rinib turadi.
    if (data && data.unreadCount > 0) {
      notificationsApi.markAllRead().then(() => setUnread(0)).catch(() => {});
    }
  };

  const openItem = (n: AppNotification) => {
    close();
    if (n.projectId) navigate(`/projects/${n.projectId}`);
  };

  return (
    <div ref={rootRef} className="relative flex-shrink-0">
      <button
        onClick={toggle}
        aria-label="Bildirishnomalar"
        aria-expanded={open}
        className="border border-[#e4e7ec] bg-white hover:bg-[#f7f8fa] rounded-lg h-[34px] w-[36px] flex items-center justify-center text-gray-600 relative transition-colors"
      >
        <Bell className="w-4 h-4 text-gray-600" />
        {unread > 0 && (
          <span className="absolute -right-1.5 -top-1.5 min-w-[18px] h-[18px] px-1 bg-[#ef5350] text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-[60px] sm:absolute sm:left-auto sm:right-0 sm:top-[42px] sm:w-[380px] z-50 bg-white border border-[#e4e7ec] rounded-xl shadow-dropdown overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e4e7ec]">
            <div>
              <h3 className="text-sm font-bold text-[#171b25]">Bildirishnomalar</h3>
              <p className="text-[11px] text-gray-500">Kompaniyangizdagi so'nggi o'zgarishlar</p>
            </div>
            {loading ? (
              <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4 text-gray-400" aria-hidden />
            )}
          </div>

          <div className="max-h-[min(70vh,460px)] overflow-y-auto custom-scrollbar divide-y divide-gray-100">
            {items.length === 0 && !loading && (
              <div className="px-4 py-10 text-center text-xs text-gray-500">Hozircha bildirishnoma yo'q</div>
            )}
            {items.map(n => {
              const style = ACTION_STYLE[n.action] ?? ACTION_STYLE[2];
              const Icon = style.icon;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => openItem(n)}
                  className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 transition-colors ${
                    n.isUnread ? 'bg-orange-50/40' : ''
                  } ${n.projectId ? 'cursor-pointer' : 'cursor-default'}`}
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${style.cls}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-xs text-[#171b25] leading-snug break-words">
                      <b className="font-semibold">{n.isOwn ? 'Siz' : n.actorName}</b>
                      <span className="text-gray-400"> · </span>
                      {n.message}
                    </span>
                    <span className="block text-[11px] text-gray-400 mt-0.5">{timeAgo(n.createdAt)}</span>
                  </span>
                  {n.isUnread && <span className="flex-shrink-0 mt-1.5 w-2 h-2 rounded-full bg-[#ff7a16]" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

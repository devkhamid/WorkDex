import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Plus,
  Power,
  Search,
  Trash2,
  UserPlus,
  Users,
  X
} from 'lucide-react';
import { projectsApi, usersApi, StaffMember, StaffTask } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { Project, ProjectStatus, UserRole } from '../types';

const ROLE_OPTIONS: { value: UserRole; label: string; short: string; cls: string }[] = [
  { value: UserRole.Admin, label: "Admin — Yordamchi admin / Direktor o'rinbosari", short: 'Admin', cls: 'bg-purple-50 text-purple-700' },
  { value: UserRole.ProjectManager, label: 'Prorab / Loyiha menejeri', short: 'Prorab / Menejer', cls: 'bg-blue-50 text-blue-700' },
  { value: UserRole.FieldWorker, label: 'Saha xodimi', short: 'Saha xodimi', cls: 'bg-emerald-50 text-emerald-700' },
  { value: UserRole.Finance, label: 'Moliyachi / Buxgalter', short: 'Moliyachi', cls: 'bg-orange-50 text-orange-700' }
];

const roleInfo = (role: UserRole) => ROLE_OPTIONS.find(r => r.value === role) ?? { short: String(role), cls: 'bg-gray-100 text-gray-600' };

const initials = (name: string) =>
  name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase() || '?';

const todayIso = () => new Date().toISOString().slice(0, 10);
const isOverdue = (t: StaffTask) => !t.isCompleted && !!t.dueDate && t.dueDate.slice(0, 10) < todayIso();
const fmtDate = (d?: string) => (d ? new Date(d).toLocaleDateString('uz-UZ', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '');
const errMsg = (err: any) => err?.response?.data?.message || 'Xatolik yuz berdi';

const inputCls = 'w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16] bg-white';

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
    <div
      className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-bold text-sm text-[#171b25]">{title}</h3>
        <button onClick={onClose} className="min-h-8 min-w-8 p-1.5 hover:bg-gray-100 rounded-lg inline-flex items-center justify-center">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ---- Xodim qo'shish / tahrirlash ----
const StaffFormModal: React.FC<{
  member?: StaffMember;
  onClose: () => void;
  onSaved: (id?: string) => void;
}> = ({ member, onClose, onSaved }) => {
  const [firstName, setFirstName] = useState(member?.firstName ?? '');
  const [lastName, setLastName] = useState(member?.lastName ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [phone, setPhone] = useState(member?.phoneNumber ?? '');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>(member?.role ?? UserRole.ProjectManager);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      if (member) {
        await usersApi.update(member.id, {
          firstName,
          lastName,
          email: email.trim() || undefined,
          phoneNumber: phone.trim() || undefined,
          role
        });
        onSaved(member.id);
      } else {
        const res = await usersApi.createAdmin({
          firstName,
          lastName,
          email: email.trim(),
          phoneNumber: phone.trim() || undefined,
          password,
          role
        });
        onSaved(res.userId);
      }
    } catch (err) {
      setError(errMsg(err));
      setSaving(false);
    }
  };

  return (
    <Modal title={member ? 'Xodimni tahrirlash' : "Yangi xodim qo'shish"} onClose={onClose}>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Ism *</label>
            <input required value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Familiya *</label>
            <input required value={lastName} onChange={(e) => setLastName(e.target.value)} className={inputCls} />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Email (login) *</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Telefon</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+998901234567" className={inputCls} />
        </div>
        {!member && (
          <div>
            <label className="block text-xs font-semibold mb-1">Parol * (kamida 6 belgi)</label>
            <input type="text" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold mb-1">Lavozim (rol) *</label>
          <select
            value={role}
            disabled={member?.isCompanyOwner}
            onChange={(e) => setRole(Number(e.target.value) as UserRole)}
            className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-400`}
          >
            {ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          {member?.isCompanyOwner && (
            <p className="text-[10px] text-gray-400 mt-1">Kompaniya asosiy adminining rolini o'zgartirib bo'lmaydi.</p>
          )}
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 border rounded-lg text-xs">Bekor qilish</button>
          <button type="submit" disabled={saving} className="px-3 py-2 bg-[#ff7a16] hover:bg-[#e86807] text-white rounded-lg text-xs font-semibold disabled:opacity-60">
            {saving ? 'Saqlanmoqda...' : 'Saqlash'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

// ---- Parolni yangilash ----
const PasswordModal: React.FC<{ member: StaffMember; onClose: () => void }> = ({ member, onClose }) => {
  const [password, setPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await usersApi.resetPassword(member.id, password);
      setDone(true);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal title={`Parolni yangilash — ${member.fullName}`} onClose={onClose}>
      {done ? (
        <div className="space-y-4">
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
            Parol yangilandi. Yangi parolni xodimga yetkazing.
          </div>
          <div className="flex justify-end">
            <button onClick={onClose} className="px-3 py-2 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Yopish</button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-3">
          {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{error}</div>}
          <div>
            <label className="block text-xs font-semibold mb-1">Yangi parol * (kamida 6 belgi)</label>
            <input type="text" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} />
          </div>
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-3 py-2 border rounded-lg text-xs">Bekor qilish</button>
            <button type="submit" disabled={saving} className="px-3 py-2 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold disabled:opacity-60">
              {saving ? 'Saqlanmoqda...' : 'Yangilash'}
            </button>
          </div>
        </form>
      )}
    </Modal>
  );
};

// ---- Vazifa berish / tahrirlash ----
const TaskFormModal: React.FC<{
  task?: StaffTask;
  assigneeId: string;
  staff: StaffMember[];
  projects: Project[];
  onClose: () => void;
  onSaved: () => void;
}> = ({ task, assigneeId, staff, projects, onClose, onSaved }) => {
  const [projectId, setProjectId] = useState(task?.projectId ?? projects[0]?.id ?? '');
  const [title, setTitle] = useState(task?.title ?? '');
  const [description, setDescription] = useState(task?.description ?? '');
  const [assignedTo, setAssignedTo] = useState(task?.assignedToUserId ?? assigneeId);
  const [dueDate, setDueDate] = useState(task?.dueDate ? task.dueDate.slice(0, 10) : '');
  const [weight, setWeight] = useState(task?.weight ?? 1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId) {
      setError('Loyihani tanlang');
      return;
    }
    setError('');
    setSaving(true);
    const due = dueDate ? new Date(dueDate).toISOString() : null;
    try {
      if (task) {
        await projectsApi.updateTask(task.projectId, task.id, {
          title,
          description: description.trim() || null,
          stageId: task.stageId ?? null,
          assignedToUserId: assignedTo || null,
          weight,
          isCompleted: task.isCompleted,
          dueDate: due
        });
      } else {
        await projectsApi.createTask(projectId, {
          title,
          description: description.trim() || undefined,
          assignedToUserId: assignedTo || undefined,
          weight,
          dueDate: due ?? undefined
        });
      }
      onSaved();
    } catch (err) {
      setError(errMsg(err));
      setSaving(false);
    }
  };

  const activeStaff = staff.filter(s => s.isActive || s.id === assignedTo);

  return (
    <Modal title={task ? 'Vazifani tahrirlash' : 'Vazifa berish'} onClose={onClose}>
      {error && <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">{error}</div>}
      <form onSubmit={submit} className="space-y-3">
        <div>
          <label className="block text-xs font-semibold mb-1">Loyiha *</label>
          <select
            required
            value={projectId}
            disabled={!!task}
            onChange={(e) => setProjectId(e.target.value)}
            className={`${inputCls} disabled:bg-gray-50 disabled:text-gray-500`}
          >
            {task && !projects.some(p => p.id === task.projectId) && <option value={task.projectId}>{task.projectName}</option>}
            {projects.length === 0 && !task && <option value="">Loyihalar mavjud emas</option>}
            {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Vazifa nomi *</label>
          <input required maxLength={300} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Kafel terish" className={inputCls} />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Izoh</label>
          <textarea
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16] bg-white resize-y"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Mas'ul xodim</label>
          <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className={inputCls}>
            <option value="">— Biriktirilmagan —</option>
            {activeStaff.map(s => <option key={s.id} value={s.id}>{s.fullName} · {roleInfo(s.role).short}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold mb-1">Muddat</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1">Og'irlik (ball)</label>
            <input type="number" min={1} max={20} required value={weight} onChange={(e) => setWeight(Number(e.target.value))} className={inputCls} />
          </div>
        </div>
        <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-3 py-2 border rounded-lg text-xs">Bekor qilish</button>
          <button type="submit" disabled={saving} className="px-3 py-2 bg-[#ff7a16] hover:bg-[#e86807] text-white rounded-lg text-xs font-semibold disabled:opacity-60">
            {saving ? 'Saqlanmoqda...' : task ? 'Saqlash' : 'Vazifa berish'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

type TaskFilter = 'open' | 'done' | 'all';

export const TeamPage: React.FC = () => {
  const { user: me } = useAuth();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [staffVersion, setStaffVersion] = useState(0);
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tasks, setTasks] = useState<StaffTask[]>([]);
  const [tasksLoading, setTasksLoading] = useState(false);
  const [tasksVersion, setTasksVersion] = useState(0);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('open');
  const [projects, setProjects] = useState<Project[]>([]);

  const [staffForm, setStaffForm] = useState<{ member?: StaffMember } | null>(null);
  const [passwordFor, setPasswordFor] = useState<StaffMember | null>(null);
  const [taskForm, setTaskForm] = useState<{ task?: StaffTask } | null>(null);

  useEffect(() => {
    let alive = true;
    usersApi.getTeam()
      .then(data => { if (alive) setStaff(data); })
      .catch(err => console.error(err))
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [staffVersion]);

  useEffect(() => {
    let alive = true;
    projectsApi.getAll()
      .then(data => {
        if (!alive) return;
        const order = (p: Project) => (p.status === ProjectStatus.Completed || p.status === ProjectStatus.Cancelled ? 1 : 0);
        setProjects([...data].sort((a, b) => order(a) - order(b) || a.name.localeCompare(b.name)));
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    let alive = true;
    const t = window.setTimeout(() => { if (alive) setTasksLoading(true); }, 0);
    usersApi.getUserTasks(selectedId)
      .then(data => { if (alive) setTasks(data); })
      .catch(err => { if (alive) { setTasks([]); alert(errMsg(err)); } })
      .finally(() => { if (alive) setTasksLoading(false); });
    return () => { alive = false; window.clearTimeout(t); };
  }, [selectedId, tasksVersion]);

  const selected = staff.find(s => s.id === selectedId) ?? null;

  const filteredStaff = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return staff;
    return staff.filter(s =>
      s.fullName.toLowerCase().includes(q) ||
      s.email.toLowerCase().includes(q) ||
      (s.phoneNumber ?? '').toLowerCase().includes(q) ||
      roleInfo(s.role).short.toLowerCase().includes(q)
    );
  }, [staff, search]);

  const visibleTasks = tasks.filter(t => taskFilter === 'all' || (taskFilter === 'open' ? !t.isCompleted : t.isCompleted));
  const openCount = tasks.filter(t => !t.isCompleted).length;
  const doneCount = tasks.length - openCount;

  const refreshAll = () => {
    setStaffVersion(v => v + 1);
    setTasksVersion(v => v + 1);
  };

  const selectMember = (id: string) => {
    if (id === selectedId) return;
    setTasks([]);
    setTaskFilter('open');
    setSelectedId(id);
  };

  const canModify = (m: StaffMember) => !m.isCompanyOwner || m.id === me?.id;

  const handleToggleActive = async (m: StaffMember) => {
    const verb = m.isActive ? "to'xtatilsinmi" : 'faollashtirilsinmi';
    if (!window.confirm(`${m.fullName} hisobi ${verb}?${m.isActive ? ' Xodim tizimga kira olmaydi.' : ''}`)) return;
    try {
      await usersApi.toggleActive(m.id);
      setStaffVersion(v => v + 1);
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleToggleTask = async (t: StaffTask) => {
    try {
      await projectsApi.toggleTaskComplete(t.projectId, t.id);
      refreshAll();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const handleDeleteTask = async (t: StaffTask) => {
    if (!window.confirm(`"${t.title}" vazifasi o'chirilsinmi?`)) return;
    try {
      await projectsApi.deleteTask(t.projectId, t.id);
      refreshAll();
    } catch (err) {
      alert(errMsg(err));
    }
  };

  const activeCount = staff.filter(s => s.isActive).length;
  const totalOpen = staff.reduce((s, m) => s + m.openTaskCount, 0);
  const totalOverdue = staff.reduce((s, m) => s + m.overdueTaskCount, 0);

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#171b25]">Xodimlar</h2>
          <p className="text-xs text-[#7b8190] mt-0.5 break-words">Kompaniya xodimlari, ularning lavozimi va biriktirilgan vazifalari</p>
        </div>
        <button
          onClick={() => setStaffForm({})}
          className="bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs h-[34px] px-3.5 rounded-lg flex items-center justify-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
        >
          <UserPlus className="w-4 h-4" />
          <span>Yangi xodim</span>
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 shadow-xs">
          <div className="text-[10px] text-gray-500 font-semibold uppercase">Faol xodimlar</div>
          <div className="text-lg font-bold text-gray-900 mt-0.5">{activeCount}<span className="text-xs text-gray-400 font-medium"> / {staff.length}</span></div>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 shadow-xs">
          <div className="text-[10px] text-gray-500 font-semibold uppercase">Ochiq vazifalar</div>
          <div className="text-lg font-bold text-[#ff7a16] mt-0.5">{totalOpen}</div>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 shadow-xs">
          <div className="text-[10px] text-gray-500 font-semibold uppercase">Muddati o'tgan</div>
          <div className={`text-lg font-bold mt-0.5 ${totalOverdue > 0 ? 'text-red-600' : 'text-gray-900'}`}>{totalOverdue}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
        {/* Xodimlar ro'yxati */}
        <div className={`lg:col-span-5 space-y-3 ${selected ? 'hidden lg:block' : ''}`}>
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex items-center gap-2 shadow-xs min-w-0">
            <Search className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
            <input
              type="text"
              placeholder="Ism, email, telefon yoki lavozim..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 text-xs outline-none bg-transparent"
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">{filteredStaff.length} ta</span>
          </div>

          <div className="bg-white border border-[#e4e7ec] rounded-xl overflow-hidden shadow-xs divide-y divide-gray-100">
            {loading && <div className="py-8 text-center text-xs text-gray-400">Yuklanmoqda...</div>}
            {!loading && filteredStaff.map(m => {
              const ri = roleInfo(m.role);
              const active = m.id === selectedId;
              return (
                <button
                  key={m.id}
                  onClick={() => selectMember(m.id)}
                  className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors ${active ? 'bg-orange-50/60' : 'hover:bg-gray-50'}`}
                >
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${m.isActive ? 'bg-[#ff7a16] text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {initials(m.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-bold text-xs truncate ${m.isActive ? 'text-gray-900' : 'text-gray-400 line-through'}`}>{m.fullName}</span>
                      {m.id === me?.id && <span className="text-[9px] font-bold text-gray-400 flex-shrink-0">(Siz)</span>}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${ri.cls}`}>{ri.short}</span>
                      {!m.isActive && <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-gray-100 text-gray-500">To'xtatilgan</span>}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className="text-[10px] font-bold text-[#ff7a16] whitespace-nowrap">{m.openTaskCount} ochiq</span>
                    {m.overdueTaskCount > 0 && (
                      <span className="text-[10px] font-bold text-red-600 whitespace-nowrap">{m.overdueTaskCount} kechikkan</span>
                    )}
                  </div>
                </button>
              );
            })}
            {!loading && filteredStaff.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">Xodimlar topilmadi</div>
            )}
          </div>
        </div>

        {/* Tanlangan xodim */}
        <div className={`lg:col-span-7 ${selected ? '' : 'hidden lg:block'}`}>
          {!selected ? (
            <div className="bg-white border border-dashed border-[#e4e7ec] rounded-xl p-10 text-center">
              <Users className="w-9 h-9 text-gray-300 mx-auto mb-2" />
              <div className="text-xs font-semibold text-gray-500">Xodimni tanlang</div>
              <p className="text-[11px] text-gray-400 mt-1">Ma'lumotlari va vazifalarini ko'rish hamda tahrirlash uchun</p>
            </div>
          ) : (
            <div className="space-y-3.5">
              <button
                onClick={() => setSelectedId(null)}
                className="lg:hidden inline-flex items-center gap-1.5 text-xs font-semibold text-gray-600 min-h-8"
              >
                <ArrowLeft className="w-4 h-4" /> Xodimlar ro'yxati
              </button>

              <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-4">
                <div className="flex items-start gap-3">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 ${selected.isActive ? 'bg-[#ff7a16] text-white' : 'bg-gray-200 text-gray-500'}`}>
                    {initials(selected.fullName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-sm text-gray-900 break-words">{selected.fullName}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${roleInfo(selected.role).cls}`}>{roleInfo(selected.role).short}</span>
                      {selected.isCompanyOwner && <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600">Kompaniya egasi</span>}
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${selected.isActive ? 'bg-[#e6f8ee] text-[#159452]' : 'bg-gray-100 text-gray-500'}`}>
                        {selected.isActive ? 'Faol' : "To'xtatilgan"}
                      </span>
                    </div>
                    <div className="mt-2 space-y-1 text-[11px] text-gray-500">
                      <div className="flex items-center gap-1.5 min-w-0"><Mail className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{selected.email}</span></div>
                      {selected.phoneNumber && (
                        <div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 flex-shrink-0" /><a href={`tel:${selected.phoneNumber}`} className="hover:underline">{selected.phoneNumber}</a></div>
                      )}
                      <div className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5 flex-shrink-0" />Qo'shilgan: {fmtDate(selected.createdAt)}</div>
                    </div>
                  </div>
                </div>

                {canModify(selected) && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setStaffForm({ member: selected })}
                      className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
                    >
                      <Pencil className="w-3.5 h-3.5" /> Tahrirlash
                    </button>
                    <button
                      onClick={() => setPasswordFor(selected)}
                      className="h-8 px-3 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 hover:bg-gray-50 inline-flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" /> Parol
                    </button>
                    {selected.id !== me?.id && (
                      <button
                        onClick={() => handleToggleActive(selected)}
                        className={`h-8 px-3 border rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 ${selected.isActive ? 'border-red-200 text-red-600 hover:bg-red-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'}`}
                      >
                        <Power className="w-3.5 h-3.5" /> {selected.isActive ? "To'xtatish" : 'Faollashtirish'}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
                <div className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-100">
                  <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5 self-start">
                    {([['open', `Ochiq (${openCount})`], ['done', `Bajarilgan (${doneCount})`], ['all', 'Hammasi']] as [TaskFilter, string][]).map(([key, label]) => (
                      <button
                        key={key}
                        onClick={() => setTaskFilter(key)}
                        className={`px-2.5 h-7 rounded-md text-[11px] font-semibold transition-colors ${taskFilter === key ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setTaskForm({})}
                    disabled={!selected.isActive}
                    title={selected.isActive ? undefined : "To'xtatilgan xodimga vazifa berib bo'lmaydi"}
                    className="h-8 px-3 bg-[#ff7a16] hover:bg-[#e86807] text-white rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" /> Vazifa berish
                  </button>
                </div>

                <div className="divide-y divide-gray-100">
                  {tasksLoading && <div className="py-8 text-center text-xs text-gray-400">Yuklanmoqda...</div>}
                  {!tasksLoading && visibleTasks.map(t => {
                    const overdue = isOverdue(t);
                    return (
                      <div key={t.id} className="p-3.5 flex items-start gap-3 hover:bg-gray-50">
                        <button
                          onClick={() => handleToggleTask(t)}
                          title={t.isCompleted ? 'Ochiq deb belgilash' : 'Bajarildi deb belgilash'}
                          className="mt-0.5 flex-shrink-0 min-h-6 min-w-6 inline-flex items-center justify-center"
                        >
                          {t.isCompleted
                            ? <CheckCircle2 className="w-5 h-5 text-[#21bd68]" />
                            : <Circle className="w-5 h-5 text-gray-300 hover:text-[#ff7a16]" />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className={`text-xs font-semibold break-words ${t.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{t.title}</div>
                          {t.description && <div className="text-[11px] text-gray-500 mt-0.5 break-words whitespace-pre-line">{t.description}</div>}
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 mt-1.5 text-[10px] text-gray-500">
                            <Link to={`/projects/${t.projectId}`} className="font-semibold text-[#ff7a16] hover:underline truncate max-w-[180px]">{t.projectName}</Link>
                            {t.stageName && <span>· {t.stageName}</span>}
                            {t.dueDate && (
                              <span className={`inline-flex items-center gap-1 ${overdue ? 'text-red-600 font-bold' : ''}`}>
                                <Calendar className="w-3 h-3" />{fmtDate(t.dueDate)}{overdue && ' · kechikkan'}
                              </span>
                            )}
                            {t.isCompleted && t.completedAt && <span className="text-[#159452]">Bajarildi: {fmtDate(t.completedAt)}</span>}
                            <span>{t.weight} ball</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-0.5 flex-shrink-0">
                          <button onClick={() => setTaskForm({ task: t })} title="Tahrirlash" className="min-h-8 min-w-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDeleteTask(t)} title="O'chirish" className="min-h-8 min-w-8 inline-flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {!tasksLoading && visibleTasks.length === 0 && (
                    <div className="py-8 text-center text-xs text-gray-400">
                      {taskFilter === 'done' ? "Bajarilgan vazifalar yo'q" : taskFilter === 'open' ? "Ochiq vazifalar yo'q" : "Vazifalar yo'q"}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {staffForm && (
        <StaffFormModal
          member={staffForm.member}
          onClose={() => setStaffForm(null)}
          onSaved={(id) => {
            setStaffForm(null);
            setStaffVersion(v => v + 1);
            if (id) selectMember(id);
          }}
        />
      )}
      {passwordFor && <PasswordModal member={passwordFor} onClose={() => setPasswordFor(null)} />}
      {taskForm && selected && (
        <TaskFormModal
          task={taskForm.task}
          assigneeId={selected.id}
          staff={staff}
          projects={projects}
          onClose={() => setTaskForm(null)}
          onSaved={() => {
            setTaskForm(null);
            refreshAll();
          }}
        />
      )}
    </div>
  );
};

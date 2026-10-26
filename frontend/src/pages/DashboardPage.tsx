import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Download,
  Filter,
  ArrowRight,
  UserPlus,
  X,
  Lock,
  Mail,
  Phone,
  User
} from 'lucide-react';
import { dashboardApi, projectsApi, reportsApi, usersApi } from '../api/services';
import { DashboardStats, Project, ProjectStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';
import { UsdWithUzs } from '../components/Money';
import { formatUsd } from '../utils/money';

const AddUserModal: React.FC<{ onClose: () => void; onSuccess: () => void }> = ({ onClose, onSuccess }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(2);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await usersApi.createAdmin({
        firstName,
        lastName,
        email,
        phoneNumber: phone || undefined,
        password,
        role
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 bg-[#fff3e8] rounded-lg flex items-center justify-center">
              <UserPlus className="w-4 h-4 text-[#ff7a16]" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-[#171b25]">Yangi Xodim Qo'shish</h2>
              <p className="text-[10px] text-gray-400 break-words">Kompaniyangizga yangi a'zo qo'shing</p>
            </div>
          </div>
          <button onClick={onClose} className="min-h-8 min-w-8 p-1.5 hover:bg-gray-100 rounded-lg transition-colors inline-flex items-center justify-center">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Ism *</label>
              <div className="relative">
                <User className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
                <input
                  type="text" required placeholder="Ali"
                  value={firstName} onChange={(e) => setFirstName(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Familiya *</label>
              <input
                type="text" required placeholder="Valiyev"
                value={lastName} onChange={(e) => setLastName(e.target.value)}
                className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="email" required placeholder="ali@kompaniya.uz"
                value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Telefon raqam</label>
            <div className="relative">
              <Phone className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text" placeholder="+998901234567"
                value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Parol *</label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 absolute left-3 top-2.5 text-gray-400" />
              <input
                type="password" required placeholder="Kamida 6 ta belgi"
                value={password} onChange={(e) => setPassword(e.target.value)}
                className="w-full h-9 pl-9 pr-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Lavozim (Rol) *</label>
            <select
              value={role} onChange={(e) => setRole(Number(e.target.value))}
              className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs bg-white outline-none focus:border-[#ff7a16]"
            >
              <option value={1}>Admin — Yordamchi admin / Direktor o'rinbosari</option>
              <option value={2}>ProjectManager — Prorab / Menejer</option>
              <option value={3}>FieldWorker — Saha xodimi</option>
              <option value={4}>Finance — Moliyachi / Buxgalter</option>
            </select>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <button
              type="button" onClick={onClose}
              className="flex-1 h-9 border border-[#e4e7ec] bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-lg transition-colors"
            >
              Bekor qilish
            </button>
            <button
              type="submit" disabled={loading}
              className="flex-1 h-9 bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{loading ? "Qo'shilmoqda..." : "Xodim Qo'shish"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);

  const canAddUser = user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsData, projectsData] = await Promise.all([
        dashboardApi.getStats(),
        projectsApi.getAll()
      ]);
      setStats(statsData);
      setProjects(projectsData);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredProjects = projects.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.customerName && p.customerName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.projectType && p.projectType.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getStatusPill = (status: ProjectStatus) => {
    switch (status) {
      case ProjectStatus.InProgress:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f8ee] text-[#159452]">Faol</span>;
      case ProjectStatus.OnHold:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fff1df] text-[#c96b08]">Kechikkan</span>;
      case ProjectStatus.Planning:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f0eaff] text-[#7650d7]">Rejalashtirish</span>;
      case ProjectStatus.Completed:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#edf5ff] text-[#2563c7]">Yakunlangan</span>;
      case ProjectStatus.Cancelled:
        return <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#f4f5f7] text-[#697180]">Bekor qilingan</span>;
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
    <div className="p-4 sm:p-6 space-y-5">
      {isAddUserModalOpen && (
        <AddUserModal
          onClose={() => setIsAddUserModalOpen(false)}
          onSuccess={() => {}}
        />
      )}

      {canAddUser && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-[#171b25]">Boshqaruv paneli</h2>
            <p className="text-[11px] text-gray-400 break-words">Kompaniyangiz loyihalari va ko'rsatkichlari</p>
          </div>
          <button
            onClick={() => setIsAddUserModalOpen(true)}
            className="min-h-9 px-4 bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors w-full sm:w-auto"
          >
            <UserPlus className="w-4 h-4" />
            <span>Xodim qo'shish</span>
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ff7a16]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Faol Loyihalar</small>
            <strong className="text-xl sm:text-2xl font-bold tracking-tight text-[#171b25] break-words">
              {stats?.activeProjects ?? projects.length} <span className="text-xs font-semibold text-gray-400">/ {stats?.totalProjects ?? projects.length}</span>
            </strong>
          </div>
          <div className="text-[11px] font-semibold mt-2 text-[#21bd68] flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{stats?.completedProjects ?? 0} ta yakunlangan</span>
          </div>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#3b82f6]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Olingan Tushum</small>
            <strong className="text-xl sm:text-2xl font-bold tracking-tight text-[#171b25] break-words">
              ${(stats?.totalRevenueReceived ?? 0).toLocaleString()}
            </strong>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              ≈ {(stats?.totalRevenueReceivedUzs ?? 0).toLocaleString()} so'm
            </span>
          </div>
          <div className="text-[11px] font-medium mt-2 text-[#3b82f6] flex items-center gap-1">
            <span className="break-words">Qoldiq: ${(stats?.totalPendingReceivables ?? 0).toLocaleString()} (≈ {(stats?.totalPendingReceivablesUzs ?? 0).toLocaleString()} so'm)</span>
          </div>
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ef5350]" />
          <div>
            <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Jami Xarajatlar</small>
            <strong className="text-xl sm:text-2xl font-bold tracking-tight text-[#171b25] break-words">
              ${(stats?.totalExpenses ?? 0).toLocaleString()}
            </strong>
            <span className="text-[11px] text-gray-400 block mt-0.5">
              ≈ {(stats?.totalExpensesUzs ?? 0).toLocaleString()} so'm
            </span>
          </div>
          <div className="text-[11px] font-medium mt-2 text-[#ef5350] flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Byudjet ishlatilishi: {stats?.averageBudgetUtilizationPercent ?? 0}%</span>
          </div>
        </div>

        {(() => {
          const netBal = stats?.netBalance ?? ((stats?.totalRevenueReceived ?? 0) - (stats?.totalExpenses ?? 0));
          const netBalUzs = stats?.netBalanceUzs ?? ((stats?.totalRevenueReceivedUzs ?? 0) - (stats?.totalExpensesUzs ?? 0));
          const isNegative = netBal < 0;
          return (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden flex flex-col justify-between">
              <div className={`absolute left-0 top-4 w-1.5 h-8 rounded-r ${isNegative ? 'bg-rose-500' : 'bg-emerald-500'}`} />
              <div>
                <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
                  <small className="block text-[11px] font-bold text-[#697180] uppercase tracking-wider">Net Balans (Qo'ldagi summa)</small>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${isNegative ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
                    {isNegative ? 'Kamomad' : 'Kassa ijobiy'}
                  </span>
                </div>
                <strong className={`text-xl sm:text-2xl font-extrabold tracking-tight block break-words ${isNegative ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {isNegative ? `-$${Math.abs(netBal).toLocaleString()}` : `$${netBal.toLocaleString()}`}
                </strong>
                <span className="text-[11px] text-gray-400 block mt-0.5">
                  ≈ {isNegative ? `-${Math.abs(netBalUzs).toLocaleString()} so'm` : `${netBalUzs.toLocaleString()} so'm`}
                </span>
              </div>
              <div className="text-[11px] font-medium mt-2 text-gray-500 flex flex-wrap items-center justify-between gap-1">
                <span>Tushum − Xarajatlar</span>
                {stats?.totalNetProfit !== undefined && (
                  <span className="text-[10px] text-purple-600 font-semibold" title="Kutilayotgan sof foyda">
                    Kutilayotgan: ${stats.totalNetProfit.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {(() => {
          const statusMeta = [
            { status: ProjectStatus.InProgress, label: 'Faol', color: '#21bd68' },
            { status: ProjectStatus.Planning, label: 'Rejalashtirish', color: '#7650d7' },
            { status: ProjectStatus.OnHold, label: 'Kechikkan', color: '#ff7a16' },
            { status: ProjectStatus.Completed, label: 'Yakunlangan', color: '#3b82f6' },
            { status: ProjectStatus.Cancelled, label: 'Bekor qilingan', color: '#a0a6b1' },
          ].map(s => ({ ...s, count: projects.filter(p => p.status === s.status).length }));
          const total = projects.length;

          const expectedPercent = (p: Project): number | null => {
            if (!p.startDate || !p.endDate) return null;
            const start = new Date(p.startDate).getTime();
            const end = new Date(p.endDate).getTime();
            if (!(end > start)) return null;
            return Math.round(Math.min(100, Math.max(0, ((Date.now() - start) / (end - start)) * 100)));
          };

          const order = [ProjectStatus.InProgress, ProjectStatus.OnHold, ProjectStatus.Planning, ProjectStatus.Completed];
          const chartProjects = projects
            .filter(p => p.status !== ProjectStatus.Cancelled)
            .sort((a, b) => order.indexOf(a.status) - order.indexOf(b.status))
            .slice(0, 8)
            .map(p => {
              const expected = expectedPercent(p);
              const behind = expected !== null && p.status !== ProjectStatus.Completed && expected - p.progressPercent > 10;
              return { p, expected, behind };
            });
          const behindCount = chartProjects.filter(c => c.behind).length;

          return (
            <div className="lg:col-span-7 bg-white border border-[#e4e7ec] rounded-xl shadow-xs p-4 sm:p-5 flex flex-col">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-[#f0f2f5]">
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-[#171b25]">Loyihalar holati</h3>
                  <div className="text-[10px] text-[#9399a4]">Bajarilgan va muddat bo'yicha kutilgan foiz</div>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[10px] text-[#727987]">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <i className="w-2.5 h-2.5 rounded-xs bg-[#ff7a16] inline-block" /> Bajarilgan
                  </span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <i className="w-2.5 h-2.5 rounded-xs bg-[#bdd9f7] inline-block" /> Kutilgan
                  </span>
                </div>
              </div>

              <div className="pt-4">
                <div className="flex h-2.5 rounded-full overflow-hidden bg-[#edf0f3]">
                  {total > 0 && statusMeta.filter(s => s.count > 0).map(s => (
                    <div
                      key={s.status}
                      style={{ width: `${(s.count / total) * 100}%`, backgroundColor: s.color }}
                      title={`${s.label}: ${s.count}`}
                    />
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2.5">
                  {statusMeta.map(s => (
                    <span key={s.status} className="flex items-center gap-1.5 text-[10px] text-[#727987]">
                      <i className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: s.color }} />
                      {s.label}: <strong className="text-[#171b25]">{s.count}</strong>
                    </span>
                  ))}
                  {behindCount > 0 && (
                    <span className="text-[10px] font-semibold text-rose-600">⚠ {behindCount} ta loyiha muddatdan orqada</span>
                  )}
                </div>
              </div>

              {chartProjects.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-xs text-gray-400 py-12">
                  Hali loyihalar mavjud emas
                </div>
              ) : (
                <div className="pt-5 px-1 flex-1 min-h-[180px] sm:min-h-[220px] flex items-end justify-around gap-2 border-b border-[#e8ebef] overflow-x-auto scrollbar-none">
                  {chartProjects.map(({ p, expected, behind }) => (
                    <div
                      key={p.id}
                      className="flex flex-col items-center gap-1.5 flex-1 min-w-[42px] cursor-pointer group"
                      onClick={() => navigate(`/projects/${p.id}`)}
                      title={`${p.name}\nBajarilgan: ${p.progressPercent}%${expected !== null ? `\nKutilgan: ${expected}%` : ''}\nHolat: ${p.statusName}`}
                    >
                      <span className={`text-[10px] font-bold ${behind ? 'text-rose-600' : 'text-[#171b25]'}`}>
                        {p.progressPercent}%
                      </span>
                      <div className="flex items-end gap-1 h-24 sm:h-32">
                        <div
                          style={{ height: `${Math.max(p.progressPercent, 2)}%` }}
                          className={`w-4 rounded-t-sm transition-all group-hover:brightness-95 ${behind ? 'bg-rose-500' : 'bg-[#ff7a16]'}`}
                        />
                        <div
                          style={{ height: `${Math.max(expected ?? 0, 2)}%` }}
                          className={`w-4 rounded-t-sm transition-all group-hover:brightness-95 ${expected === null ? 'bg-[#edf0f3]' : 'bg-[#bdd9f7]'}`}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-medium truncate w-full text-center group-hover:text-[#ff7a16]">
                        {p.name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        <div className="lg:col-span-5 bg-white border border-[#e4e7ec] rounded-xl shadow-xs p-4 sm:p-5 flex flex-col justify-between space-y-3">
          <div>
            <div className="pb-3 border-b border-[#f0f2f5]">
              <h3 className="font-bold text-xs text-[#171b25]">Loyiha holati</h3>
              <div className="text-[10px] text-[#9399a4]">Obyektlarning joriy bajarilish foizlari</div>
            </div>

            <div className="py-2 space-y-3.5">
              {projects.slice(0, 4).map((p) => (
                <div key={p.id} className="cursor-pointer hover:bg-gray-50/70 p-2 rounded-lg transition-colors" onClick={() => navigate(`/projects/${p.id}`)}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="flex items-center gap-1.5 text-[#171b25] truncate min-w-0">
                      <span className="w-2 h-2 rounded-full bg-[#21bd68]" />
                      <span className="truncate">{p.name}</span>
                    </span>
                    <span className="text-[#21bd68] font-bold">{p.progressPercent}%</span>
                  </div>
                  <div className="h-1.5 bg-[#edf0f3] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(p.progressPercent, 4)}%` }}
                      className={`h-full rounded-full ${getProgressColor(p.progressPercent)} transition-all`}
                    />
                  </div>
                  <div className="flex justify-between gap-2 text-[10px] text-[#9a9faa] mt-1.5">
                    <span className="truncate min-w-0">{p.location || 'Toshkent'}</span>
                    <span className="font-medium text-gray-600 truncate">{p.statusName}</span>
                  </div>
                </div>
              ))}
              {projects.length === 0 && (
                <div className="text-center py-8 text-xs text-gray-400">Faol loyihalar mavjud emas</div>
              )}
            </div>
          </div>

          <button
            onClick={() => navigate('/projects')}
            className="w-full py-2 bg-gray-50 hover:bg-gray-100 border border-[#e4e7ec] rounded-lg text-xs font-semibold text-gray-700 flex items-center justify-center gap-1 transition-colors mt-2"
          >
            <span>Barcha loyihalarni ko'rish</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 px-4 sm:px-5 py-3.5 border-b border-[#e4e7ec] bg-white">
          <input
            type="text"
            placeholder="⌕ Loyiha qidirish..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-[34px] border border-[#e4e7ec] rounded-lg px-3 text-xs outline-none focus:border-[#ff7a16] w-full sm:w-auto sm:min-w-[200px]"
          />
          <button className="h-[34px] border border-[#e4e7ec] bg-white hover:bg-gray-50 px-3 rounded-lg text-xs text-gray-700 flex items-center gap-1.5 transition-colors font-medium">
            <Filter className="w-3 h-3 text-gray-500" />
            <span>Filtr</span>
          </button>
          <button
            onClick={() => reportsApi.downloadAllProjectsExcel()}
            className="h-[34px] border border-[#e4e7ec] bg-white hover:bg-gray-50 px-3 rounded-lg text-xs text-gray-700 flex items-center gap-1.5 transition-colors font-medium"
          >
            <Download className="w-3 h-3 text-gray-500" />
            <span>Eksport (Excel)</span>
          </button>
          <div className="w-full sm:w-auto sm:ml-auto text-[11px] text-[#969ca7] font-semibold">
            {filteredProjects.length} ta loyiha
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">LOYIHA NOMI</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">HOLAT</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">RIVOJLANISH</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">SHARTNOMA / BYUDJET</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">MUDDAT</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">MIJOZ</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider text-right">AMAL</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef0f3]">
              {filteredProjects.map((p) => (
                <tr
                  key={p.id}
                  onClick={() => navigate(`/projects/${p.id}`)}
                  className="hover:bg-[#fafbfc] cursor-pointer transition-colors"
                >
                  <td className="py-3.5 px-5">
                    <div className="font-bold text-xs text-[#171b25]">{p.name}</div>
                    <div className="text-[10px] text-[#999faa] mt-0.5">{p.projectType || 'Loyiha'} · {p.location || 'Toshkent'}</div>
                  </td>
                  <td className="py-3.5 px-5">
                    {getStatusPill(p.status)}
                  </td>
                  <td className="py-3.5 px-5">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs w-8">{p.progressPercent}%</span>
                      <div className="w-20 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${Math.max(p.progressPercent, 4)}%` }}
                          className={`h-full ${getProgressColor(p.progressPercent)}`}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-5">
                    <UsdWithUzs className="font-bold text-gray-900" usd={p.contractAmount} uzs={p.contractAmountUzs} />
                    <span className="block text-[10px] text-gray-400 font-normal">Byudjet: {formatUsd(p.budget)}</span>
                  </td>
                  <td className="py-3.5 px-5 text-gray-600 text-xs">
                    {new Date(p.startDate).toLocaleDateString('uz-UZ')} {p.endDate ? `— ${new Date(p.endDate).toLocaleDateString('uz-UZ')}` : ''}
                  </td>
                  <td className="py-3.5 px-5 text-gray-700 font-medium">
                    {p.customerName || '-'}
                  </td>
                  <td className="py-3.5 px-5 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/projects/${p.id}`);
                      }}
                      className="min-h-8 px-3 py-1 text-[11px] font-bold text-[#ff7a16] hover:bg-orange-50 rounded-lg border border-orange-200 transition-colors"
                    >
                      Ochish →
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProjects.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-xs text-gray-400">
                    Hech qanday loyiha topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

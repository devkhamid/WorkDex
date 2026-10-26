import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Printer, Trash2, ChevronRight, Search } from 'lucide-react';
import { agreementsApi } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types';

export const AgreementsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agreements, setAgreements] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin;

  useEffect(() => {
    loadAgreements();
  }, []);

  const loadAgreements = async () => {
    try {
      setLoading(true);
      const data = await agreementsApi.getAll();
      setAgreements(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bu shartnomani o'chirmoqchimisiz?")) return;
    try {
      await agreementsApi.delete(id);
      setAgreements(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      alert("O'chirishda xatolik");
    }
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('uz-UZ').format(amount) + ' UZS';
  };

  const getStatusBadge = (statusCode: number) => {
    if (statusCode === 3)
      return (
        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
          Loyihaga aylandi
        </span>
      );
    if (statusCode === 2)
      return (
        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
          Faol
        </span>
      );
    return (
      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-medium">
        Qoralama
      </span>
    );
  };

  const filteredAgreements = agreements.filter(a => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      a.projectName?.toLowerCase().includes(q) ||
      a.customerFullName?.toLowerCase().includes(q) ||
      a.companyName?.toLowerCase().includes(q) ||
      String(a.contractNumber).includes(q)
    );
  });

  return (
    <div className="flex-1 overflow-auto bg-[#f8f9fb] p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-bold text-[#171b25]">Shartnomalar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{agreements.length} ta shartnoma</p>
        </div>
        <button
          onClick={() => navigate('/agreements/new')}
          className="flex items-center justify-center gap-2 bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] transition-colors"
        >
          <Plus className="w-4 h-4" />
          Yangi shartnoma
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex gap-1 border-b border-gray-200 overflow-x-auto scrollbar-none max-w-full">
          <button className="px-4 py-2 text-sm font-semibold text-[#7c3aed] border-b-2 border-[#7c3aed] whitespace-nowrap flex-shrink-0">
            Kutilayotgan shartnomalar
          </button>
        </div>
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Qidirish..."
            className="text-xs bg-transparent outline-none w-full text-gray-700"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filteredAgreements.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-40" />
          <p className="font-medium">
            {search ? "Qidiruv bo'yicha shartnoma topilmadi" : "Hali shartnoma yo'q"}
          </p>
          <p className="text-sm mt-1">
            {search ? "Boshqa so'z bilan qidiring" : "Birinchi shartnomani yarating"}
          </p>
          {!search && (
            <button
              onClick={() => navigate('/agreements/new')}
              className="mt-4 bg-[#7c3aed] text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9]"
            >
              + Yangi shartnoma
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAgreements.map(agreement => (
            <div key={agreement.id} className="bg-[#1a1d27] rounded-xl p-4 sm:p-5 flex flex-col gap-3 min-w-0">
              <div className="flex items-start justify-between gap-3 min-w-0">
                <div>
                  <div className="text-white font-semibold text-sm leading-tight break-words">
                    {agreement.projectName}
                  </div>
                  {agreement.clientType === 2 ? (
                    <div className="text-[#a0a5b5] text-xs mt-1 break-words">
                      {agreement.companyName || agreement.customerFullName}
                      {agreement.directorName && agreement.companyName ? ` (${agreement.directorName})` : ''}
                    </div>
                  ) : (
                    agreement.customerFullName && (
                      <div className="text-[#a0a5b5] text-xs mt-1 break-words">{agreement.customerFullName}</div>
                    )
                  )}
                </div>
                <span
                  className={`text-[11px] px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                    agreement.clientType === 2
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  }`}
                >
                  {agreement.clientType === 2 ? '🏢 Yuridik shaxs' : '👤 Jismoniy shaxs'}
                </span>
              </div>

              <div className="text-[#7c3aed] font-bold text-base break-words">
                {formatAmount(agreement.totalAmountUZS)}
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs text-[#a0a5b5]">
                <span>№ {agreement.contractNumber}</span>
                <span>
                  {agreement.day}/{String(agreement.month).padStart(2, '0')} {agreement.year}
                </span>
                {getStatusBadge(agreement.statusCode)}
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-1">
                {agreement.statusCode !== 3 && isAdmin ? (
                  <button
                    onClick={() => navigate(`/agreements/${agreement.id}/finalize`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-[#7c3aed] text-white py-2 rounded-lg text-xs font-semibold hover:bg-[#6d28d9] transition-colors"
                  >
                    🚀 Loyihani yakunlash
                  </button>
                ) : agreement.statusCode === 3 && agreement.projectId ? (
                  <button
                    onClick={() => navigate(`/projects/${agreement.projectId}`)}
                    className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-green-700 transition-colors"
                  >
                    <ChevronRight className="w-3 h-3" /> Loyihani ko'rish
                  </button>
                ) : null}

                <button
                  onClick={() => navigate(`/agreements/${agreement.id}/edit`)}
                  className="w-8 h-8 flex items-center justify-center bg-[#ffffff15] rounded-lg text-[#a0a5b5] hover:text-white transition-colors"
                  title="Tahrirlash"
                >
                  <FileText className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => navigate(`/agreements/${agreement.id}/preview`)}
                  className="w-8 h-8 flex items-center justify-center bg-[#ffffff15] rounded-lg text-[#a0a5b5] hover:text-white transition-colors"
                  title="Ko'rish / Chop etish"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>

                {isAdmin && (
                  <button
                    onClick={() => handleDelete(agreement.id)}
                    className="w-8 h-8 flex items-center justify-center bg-[#ffffff15] rounded-lg text-[#a0a5b5] hover:text-red-400 transition-colors"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

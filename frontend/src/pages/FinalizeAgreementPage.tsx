import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, Users, Rocket } from 'lucide-react';
import { agreementsApi } from '../api/services';

export const FinalizeAgreementPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [exchangeRate, setExchangeRate] = useState('');
  const [deadline, setDeadline] = useState('');
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const a = await agreementsApi.getById(id!);
      setAgreement(a);
      // Load users for manager selection
      const { apiClient } = await import('../api/client');
      const usersRes = await apiClient.get('/users');
      setManagers(
        usersRes.data.filter(
          (u: any) => u.roleName === 'ProjectManager' || u.roleName === 'Admin'
        )
      );
    } catch (err) {
      alert('Shartnoma topilmadi');
      navigate('/agreements');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    if (!exchangeRate || parseFloat(exchangeRate) <= 0) {
      alert('Valyuta kursini kiriting');
      return;
    }
    try {
      setSaving(true);
      await agreementsApi.finalize(id!, {
        exchangeRate: parseFloat(exchangeRate),
        deadline: deadline ? new Date(deadline).toISOString() : null,
        managerIds: selectedManagers,
      });
      alert('Loyiha muvaffaqiyatli yaratildi!');
      navigate('/agreements');
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const totalUSD =
    agreement && exchangeRate
      ? Math.round(agreement.totalAmountUZS / parseFloat(exchangeRate))
      : 0;

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);

  return (
    <div className="flex-1 overflow-auto bg-[#f8f9fb] flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/agreements')}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div>
            <h2 className="font-bold text-[#171b25]">Loyihani sozlashni yakunlash</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Menejerlarni tayinlash va muddatni belgilash orqali loyihani sozlashni yakunlang.
            </p>
          </div>
        </div>

        {/* Agreement info */}
        {agreement && (
          <div className="bg-purple-50 rounded-lg p-3 mb-4">
            <div className="text-xs font-semibold text-purple-700">{agreement.projectName}</div>
            <div className="text-xs text-purple-500 mt-0.5">
              {agreement.customerFullName} • {fmt(agreement.totalAmountUZS)} UZS
            </div>
          </div>
        )}

        {/* Deadline */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
            <Calendar className="w-3.5 h-3.5" /> Muddatni tanlang
          </label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7c3aed]"
          />
        </div>

        {/* Exchange rate */}
        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Valyuta kursi (UZS → USD)
          </label>
          <input
            type="number"
            value={exchangeRate}
            onChange={e => setExchangeRate(e.target.value)}
            placeholder="Kursni kiriting (masalan: 12850)"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7c3aed]"
          />
          {exchangeRate && agreement && (
            <div className="text-xs text-gray-500 mt-1">
              Joriy shartnoma: {fmt(totalUSD)} USD
            </div>
          )}
        </div>

        {/* Managers */}
        <div className="mb-5">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
            <Users className="w-3.5 h-3.5" /> Menejerlarni tayinlash
          </label>
          <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
            {managers.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center">Menejerlar topilmadi</div>
            ) : (
              managers.map(m => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={selectedManagers.includes(m.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedManagers(prev => [...prev, m.id]);
                      } else {
                        setSelectedManagers(prev => prev.filter(mid => mid !== m.id));
                      }
                    }}
                    className="w-3.5 h-3.5"
                  />
                  <div>
                    <div className="text-xs font-medium text-gray-700">{m.fullName}</div>
                    <div className="text-[10px] text-gray-400">{m.roleName}</div>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Bir nechta menejer tanlash mumkin</div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/agreements')}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleFinalize}
            disabled={saving}
            className="flex-1 flex items-center justify-center gap-2 bg-[#7c3aed] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            {saving ? 'Yaratilmoqda...' : 'Loyiha yaratish'}
          </button>
        </div>
      </div>
    </div>
  );
};

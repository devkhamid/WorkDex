import React, { useEffect, useState } from 'react';
import { Plus, Trash2, X, DollarSign, Zap, Wifi, Building } from 'lucide-react';
import { officeExpensesApi } from '../api/services';
import { Currency, Expense, ExpenseCategory, ExpenseFrequency } from '../types';
import { MoneyInput, UsdWithUzs } from '../components/Money';

const categoryLabels: Record<number, string> = {
  1: 'Mehnat xarajatlari',
  2: 'Material xarajatlari',
  3: 'Transport',
  4: 'Yoqilg\'i',
  5: 'Subpudratchi',
  6: 'Qo\'shimcha',
  7: 'Boshqa',
  8: 'Tozalash ishlari',
  9: 'Yuklarni tashish',
  10: 'Qo\'shimcha ishlar',
  11: 'Elektr (svet)',
  12: 'Internet',
  13: 'Ofis ijarasi',
  14: 'Ofis jihozlari',
  15: 'Suv to\'lovi',
  16: 'Gaz to\'lovi',
  17: 'Umumiy kommunal xarajatlar'
};

const frequencyLabels: Record<number, string> = {
  1: 'Bir martalik',
  2: 'Kunlik',
  3: 'Oylik'
};

export const OfficeExpensesPage: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [category, setCategory] = useState(11);
  const [frequency, setFrequency] = useState(3);
  const [amount, setAmount] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('UZS');
  const [description, setDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      const data = await officeExpensesApi.getAll();
      setExpenses(data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    setSubmitting(true);
    try {
      await officeExpensesApi.create({
        category,
        frequency,
        amount: Number(amount),
        currency,
        description: description.trim(),
        expenseDate: new Date(expenseDate).toISOString(),
        notes: notes.trim() || undefined
      });
      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      setNotes('');
      loadExpenses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Bu xarajatni o'chirishni tasdiqlaysizmi?")) return;
    try {
      await officeExpensesApi.delete(id);
      loadExpenses();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const sumOf = (list: Expense[]) => ({
    uzs: list.reduce((sum, e) => sum + e.amount, 0),
    usd: list.reduce((sum, e) => sum + (e.amountUsd ?? 0), 0),
  });
  const totalAmount = sumOf(expenses);
  const monthlyAmount = sumOf(expenses.filter(e => (e.frequency || 1) === 3));
  const dailyAmount = sumOf(expenses.filter(e => (e.frequency || 1) === 2));

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2,'0')}.${String(d.getMonth()+1).padStart(2,'0')}.${d.getFullYear()}`;
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#171b25]">Mening Ofisim</h2>
          <p className="text-xs text-gray-400 break-words">Elektr, internet, ijara va boshqa ofis xarajatlarini boshqaring</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="min-h-9 px-4 bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Xarajat qo'shish</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ef5350]" />
          <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Jami Ofis Xarajatlari</small>
          <UsdWithUzs className="text-xl sm:text-2xl font-bold text-[#171b25]" uzsClassName="text-xs" usd={totalAmount.usd} uzs={totalAmount.uzs} />
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ff7a16]" />
          <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Oylik Xarajatlar</small>
          <UsdWithUzs className="text-xl sm:text-2xl font-bold text-[#171b25]" uzsClassName="text-xs" usd={monthlyAmount.usd} uzs={monthlyAmount.uzs} />
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#3b82f6]" />
          <small className="block text-[11px] font-medium text-[#697180] mb-1.5">Kunlik Xarajatlar</small>
          <UsdWithUzs className="text-xl sm:text-2xl font-bold text-[#171b25]" uzsClassName="text-xs" usd={dailyAmount.usd} uzs={dailyAmount.uzs} />
        </div>
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#e4e7ec] flex items-center justify-between gap-3">
          <span className="text-xs font-bold text-[#171b25]">Ofis Xarajatlari Jadvali</span>
          <span className="text-[11px] text-[#969ca7] font-semibold">{expenses.length} ta yozuv</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Kategoriya</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Chastotasi</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Summa</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Izoh</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Sana</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Kim kiritgan</th>
                <th className="py-3.5 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef0f3]">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-[#fafbfc] transition-colors">
                  <td className="py-3 px-5 font-semibold text-[#171b25]">{categoryLabels[exp.category] || exp.categoryName}</td>
                  <td className="py-3 px-5">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      (exp.frequency || 1) === 3 ? 'bg-orange-100 text-orange-700' :
                      (exp.frequency || 1) === 2 ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {frequencyLabels[exp.frequency || 1] || 'Bir martalik'}
                    </span>
                  </td>
                  <td className="py-3 px-5 font-bold text-[#171b25]"><UsdWithUzs usd={exp.amountUsd} uzs={exp.amount} /></td>
                  <td className="py-3 px-5 text-gray-600 max-w-[200px] truncate">{exp.description}</td>
                  <td className="py-3 px-5 text-gray-500">{formatDate(exp.expenseDate)}</td>
                  <td className="py-3 px-5 text-gray-600">{exp.createdByName}</td>
                  <td className="py-3 px-5 text-right">
                    <button
                      onClick={() => handleDelete(exp.id)}
                      className="min-h-8 min-w-8 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-xs text-gray-400">
                    Hali ofis xarajatlari kiritilmagan
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-8 h-8 bg-[#fff3e8] rounded-lg flex items-center justify-center">
                  <DollarSign className="w-4 h-4 text-[#ff7a16]" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-[#171b25]">Ofis Xarajati Qo'shish</h2>
                  <p className="text-[10px] text-gray-400 break-words">Elektr, internet, ijara va boshqalar</p>
                </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="min-h-8 min-w-8 p-1.5 hover:bg-gray-100 rounded-lg inline-flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Kategoriya *</label>
                <select value={category} onChange={e => setCategory(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs bg-white outline-none focus:border-[#ff7a16]">
                  <option value={11}>⚡ Elektr (svet)</option>
                  <option value={15}>💧 Suv to'lovi</option>
                  <option value={16}>🔥 Gaz to'lovi</option>
                  <option value={17}>🏢 Umumiy kommunal to'lovlar</option>
                  <option value={12}>🌐 Internet</option>
                  <option value={13}>🏢 Ofis ijarasi</option>
                  <option value={14}>📦 Ofis jihozlari</option>
                  <option value={3}>🚛 Transport</option>
                  <option value={4}>⛽ Yoqilg'i</option>
                  <option value={8}>🧹 Tozalash ishlari</option>
                  <option value={7}>📋 Boshqa</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Chastotasi *</label>
                <select value={frequency} onChange={e => setFrequency(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs bg-white outline-none focus:border-[#ff7a16]">
                  <option value={1}>Bir martalik</option>
                  <option value={2}>Kunlik</option>
                  <option value={3}>Oylik</option>
                </select>
              </div>

              <MoneyInput
                label="Summa"
                required
                value={amount}
                onChange={setAmount}
                currency={currency}
                onCurrencyChange={setCurrency}
              />

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Izoh *</label>
                <input type="text" required placeholder="Masalan: Avgust oyi uchun elektr to'lovi"
                  value={description} onChange={e => setDescription(e.target.value)}
                  className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Sana *</label>
                <input type="date" required value={expenseDate} onChange={e => setExpenseDate(e.target.value)}
                  className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Qo'shimcha izoh</label>
                <textarea placeholder="Ixtiyoriy..."
                  value={notes} onChange={e => setNotes(e.target.value)}
                  className="w-full h-16 px-3 py-2 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16] resize-none" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-9 border border-[#e4e7ec] bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-lg transition-colors">
                  Bekor qilish
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-9 bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50">
                  <Plus className="w-3.5 h-3.5" />
                  <span>{submitting ? "Qo'shilmoqda..." : "Qo'shish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

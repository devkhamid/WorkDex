import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, Trash2, X, Pencil, ChevronLeft, ChevronRight, CheckCircle2, Circle,
  Zap, Wifi, Building2, Droplets, Flame, Home, Package, Sparkles, Truck, Fuel, MoreHorizontal, Search,
  TrendingUp, TrendingDown, Repeat, Server, Globe, AlertTriangle,
} from 'lucide-react';
import { officeExpensesApi } from '../api/services';
import { Currency, Expense } from '../types';
import { MoneyInput, UsdWithUzs } from '../components/Money';

type CategoryMeta = { label: string; icon: React.ElementType; color: string; bg: string };

const CATEGORY_META: Record<number, CategoryMeta> = {
  13: { label: 'Ofis ijarasi', icon: Building2, color: '#7c3aed', bg: '#f3e8ff' },
  11: { label: 'Elektr (svet)', icon: Zap, color: '#ca8a04', bg: '#fef9c3' },
  12: { label: 'Internet / WiFi', icon: Wifi, color: '#2563eb', bg: '#dbeafe' },
  15: { label: "Suv", icon: Droplets, color: '#0891b2', bg: '#cffafe' },
  16: { label: 'Gaz', icon: Flame, color: '#ea580c', bg: '#ffedd5' },
  17: { label: 'Kommunal (umumiy)', icon: Home, color: '#059669', bg: '#d1fae5' },
  14: { label: 'Ofis jihozlari', icon: Package, color: '#db2777', bg: '#fce7f3' },
  8: { label: 'Tozalash', icon: Sparkles, color: '#0d9488', bg: '#ccfbf1' },
  3: { label: 'Transport', icon: Truck, color: '#475569', bg: '#e2e8f0' },
  4: { label: "Yoqilg'i", icon: Fuel, color: '#b45309', bg: '#fef3c7' },
  18: { label: 'Server / hosting', icon: Server, color: '#4f46e5', bg: '#e0e7ff' },
  19: { label: 'Domen', icon: Globe, color: '#0284c7', bg: '#e0f2fe' },
  7: { label: 'Boshqa', icon: MoreHorizontal, color: '#6b7280', bg: '#f3f4f6' },
};

/** Har oy to'lanadigan asosiy ofis to'lovlari — "shu oy to'landimi?" ro'yxati uchun */
const RECURRING_CATEGORIES = [13, 11, 12, 15, 16, 17];
/** Nomi bilan alohida kuzatiladigan xizmatlar: bir nechta server / domen bo'lishi mumkin */
const SERVICE_CATEGORIES = [18, 19];
const isService = (cat: number) => SERVICE_CATEGORIES.includes(cat);
const defaultFrequency = (cat: number) =>
  RECURRING_CATEGORIES.includes(cat) || cat === 18 ? 3 : cat === 19 ? 4 : 1;
const isPeriodic = (cat: number) => RECURRING_CATEGORIES.includes(cat) || isService(cat);
const serviceKeyOf = (category: number, name?: string | null) =>
  `${category}|${(name || '').trim().toLowerCase()}`;
const DAY_MS = 86400000;
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, d.getDate());
/** Boshqa (vaqti-vaqti bilan bo'ladigan) xarajatlar */
const OTHER_CATEGORIES = [14, 8, 3, 4, 7];

const MONTHS = ['Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'];

const metaOf = (category: number): CategoryMeta =>
  CATEGORY_META[category] || { label: 'Boshqa', icon: MoreHorizontal, color: '#6b7280', bg: '#f3f4f6' };

type MonthKey = { y: number; m: number }; // m: 0-11

const monthOf = (dateStr: string): MonthKey => {
  const d = new Date(dateStr);
  return { y: d.getFullYear(), m: d.getMonth() };
};
const sameMonth = (a: MonthKey, b: MonthKey) => a.y === b.y && a.m === b.m;
const shiftMonth = (k: MonthKey, delta: number): MonthKey => {
  const d = new Date(k.y, k.m + delta, 1);
  return { y: d.getFullYear(), m: d.getMonth() };
};
const monthLabel = (k: MonthKey) => `${MONTHS[k.m]} ${k.y}`;
const toInputDate = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const sumOf = (list: Expense[]) => ({
  uzs: list.reduce((s, e) => s + e.amount, 0),
  usd: list.reduce((s, e) => s + (e.amountUsd ?? 0), 0),
});

type FormState = {
  id?: string;
  category: number;
  frequency: number;
  amount: number | '';
  currency: Currency;
  description: string;
  expenseDate: string;
  notes: string;
  serviceName: string;
};

export const OfficeExpensesPage: React.FC = () => {
  const now = new Date();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  /** null = barcha oylar (standart), aks holda tanlangan oy bo'yicha filtr */
  const [month, setMonth] = useState<MonthKey | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [form, setForm] = useState<FormState | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { loadExpenses(); }, []);

  const loadExpenses = async () => {
    setLoading(true);
    try {
      setExpenses(await officeExpensesApi.getAll());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const currentMonth: MonthKey = { y: now.getFullYear(), m: now.getMonth() };
  /** Oylik to'lovlar ro'yxati uchun oy: filtr tanlanmagan bo'lsa — joriy oy */
  const billMonth = month ?? currentMonth;
  const isCurrentMonth = sameMonth(billMonth, currentMonth);
  const prevMonth = shiftMonth(billMonth, -1);

  const inMonth = (k: MonthKey) => expenses.filter(e => sameMonth(monthOf(e.expenseDate), k));
  const billMonthExpenses = useMemo(() => inMonth(billMonth), [expenses, billMonth.y, billMonth.m]);
  const prevMonthExpenses = useMemo(() => inMonth(prevMonth), [expenses, billMonth.y, billMonth.m]);
  /** Jadval va taqsimot uchun: barcha xarajatlar yoki tanlangan oy */
  const scopeExpenses = month ? billMonthExpenses : expenses;

  // Ma'lumot bor oylar ro'yxati (filtr uchun), eng yangisi birinchi
  const monthOptions = useMemo(() => {
    const keys = new Map<string, MonthKey>();
    [currentMonth, ...expenses.map(e => monthOf(e.expenseDate))].forEach(k => keys.set(`${k.y}-${k.m}`, k));
    return [...keys.values()].sort((a, b) => b.y - a.y || b.m - a.m);
  }, [expenses]);

  const scopeTotal = sumOf(scopeExpenses);
  const billMonthTotal = sumOf(billMonthExpenses);
  const prevTotal = sumOf(prevMonthExpenses);
  const changePct = prevTotal.uzs > 0 ? ((billMonthTotal.uzs - prevTotal.uzs) / prevTotal.uzs) * 100 : null;

  // O'rtacha oylik: birinchi xarajat oyidan joriy oygacha
  const monthsSpan = useMemo(() => {
    if (expenses.length === 0) return 1;
    const first = expenses.map(e => monthOf(e.expenseDate)).sort((a, b) => a.y - b.y || a.m - b.m)[0];
    return Math.max(1, (currentMonth.y - first.y) * 12 + (currentMonth.m - first.m) + 1);
  }, [expenses]);
  const allTotal = sumOf(expenses);
  const avgMonthly = { uzs: allTotal.uzs / monthsSpan, usd: allTotal.usd / monthsSpan };

  // Har bir doimiy to'lov uchun: shu oy to'langanmi va oxirgi to'lov qancha bo'lgan
  const lastPaymentBefore = (category: number, k: MonthKey) => {
    const end = new Date(k.y, k.m + 1, 1).getTime();
    return expenses
      .filter(e => e.category === category && new Date(e.expenseDate).getTime() < end)
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())[0];
  };

  const refDate = isCurrentMonth ? now : new Date(billMonth.y, billMonth.m + 1, 0, 23, 59);
  const recurringStatus = RECURRING_CATEGORIES.map(cat => {
    const usedBefore = expenses.some(e => e.category === cat);
    const paid = billMonthExpenses.filter(e => e.category === cat);
    return { cat, paid, total: sumOf(paid), last: lastPaymentBefore(cat, prevMonth), usedBefore };
  });

  /** Server / domenlar: har biri nomi bo'yicha alohida, oxirgi to'lovdan keyingi to'lov sanasi hisoblanadi */
  const services = useMemo(() => {
    const groups = new Map<string, Expense[]>();
    expenses
      .filter(e => isService(e.category) && new Date(e.expenseDate).getTime() <= refDate.getTime())
      .forEach(e => {
        const k = serviceKeyOf(e.category, e.serviceName);
        groups.set(k, [...(groups.get(k) || []), e]);
      });
    return [...groups.values()].map(list => {
      const sorted = [...list].sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime());
      const last = sorted[0];
      const yearly = last.frequency === 4 || (last.frequency !== 3 && last.category === 19);
      const nextDue = addMonths(new Date(last.expenseDate), yearly ? 12 : 1);
      const daysLeft = Math.ceil((nextDue.getTime() - refDate.getTime()) / DAY_MS);
      const status: 'overdue' | 'soon' | 'ok' = daysLeft <= 0 ? 'overdue' : daysLeft <= (yearly ? 30 : 7) ? 'soon' : 'ok';
      return { key: serviceKeyOf(last.category, last.serviceName), category: last.category, name: last.serviceName?.trim() || '', last, yearly, nextDue, daysLeft, status };
    }).sort((a, b) => a.nextDue.getTime() - b.nextDue.getTime());
  }, [expenses, refDate.getTime()]);
  const overdueServices = services.filter(sv => sv.status === 'overdue').length;
  const soonServices = services.filter(sv => sv.status === 'soon').length;

  const serviceNameOptions = (category: number) =>
    [...new Set(expenses.filter(e => e.category === category && e.serviceName).map(e => e.serviceName!.trim()))];

  const lastServicePayment = (category: number, name: string) =>
    expenses
      .filter(e => serviceKeyOf(e.category, e.serviceName) === serviceKeyOf(category, name))
      .sort((a, b) => new Date(b.expenseDate).getTime() - new Date(a.expenseDate).getTime())[0];
  const trackedBills = recurringStatus.filter(r => r.usedBefore || r.paid.length > 0);
  const paidCount = trackedBills.filter(r => r.paid.length > 0).length;

  // Kategoriyalar bo'yicha taqsimot (shu oy)
  const breakdown = useMemo(() => {
    const map = new Map<number, { uzs: number; usd: number }>();
    scopeExpenses.forEach(e => {
      const cur = map.get(e.category) || { uzs: 0, usd: 0 };
      cur.uzs += e.amount;
      cur.usd += e.amountUsd ?? 0;
      map.set(e.category, cur);
    });
    return [...map.entries()].sort((a, b) => b[1].uzs - a[1].uzs);
  }, [scopeExpenses]);

  const tableRows = scopeExpenses
    .filter(e => categoryFilter == null || e.category === categoryFilter)
    .filter(e => {
      const q = search.trim().toLowerCase();
      if (!q) return true;
      return (
        e.description.toLowerCase().includes(q) ||
        (e.notes || '').toLowerCase().includes(q) ||
        (e.serviceName || '').toLowerCase().includes(q) ||
        metaOf(e.category).label.toLowerCase().includes(q)
      );
    });

  const defaultDateForMonth = () =>
    isCurrentMonth ? toInputDate(now) : toInputDate(new Date(billMonth.y, billMonth.m, 1));

  const openNew = (category = 13, serviceName = '') => {
    const last = isService(category)
      ? (serviceName ? lastServicePayment(category, serviceName) : undefined)
      : lastPaymentBefore(category, billMonth);
    const prefill = isPeriodic(category) && !!last;
    setForm({
      category,
      frequency: last && isService(category) ? (last.frequency || defaultFrequency(category)) : defaultFrequency(category),
      amount: prefill ? (last!.originalAmount ?? last!.amount) : '',
      currency: (prefill && last!.currency === 'USD' ? 'USD' : 'UZS') as Currency,
      description: '',
      expenseDate: defaultDateForMonth(),
      notes: '',
      serviceName,
    });
  };

  const openEdit = (exp: Expense) => {
    setForm({
      id: exp.id,
      category: exp.category,
      frequency: exp.frequency || 1,
      amount: exp.originalAmount ?? exp.amount,
      currency: (exp.currency === 'USD' ? 'USD' : 'UZS') as Currency,
      description: exp.description,
      expenseDate: toInputDate(new Date(exp.expenseDate)),
      notes: exp.notes || '',
      serviceName: exp.serviceName || '',
    });
  };

  const changeFormCategory = (category: number) => {
    if (!form) return;
    if (form.id) { setForm({ ...form, category }); return; }
    const last = isService(category) ? undefined : lastPaymentBefore(category, billMonth);
    setForm({
      ...form,
      category,
      serviceName: '',
      frequency: defaultFrequency(category),
      amount: isPeriodic(category) && last ? (last.originalAmount ?? last.amount) : (isService(category) ? '' : form.amount),
      currency: (isPeriodic(category) && last?.currency === 'USD' ? 'USD' : form.currency) as Currency,
    });
  };

  /** Mavjud server/domen nomi tanlansa — oxirgi to'lov summasi va turi avtomatik qo'yiladi */
  const changeServiceName = (serviceName: string) => {
    if (!form) return;
    const last = !form.id ? lastServicePayment(form.category, serviceName) : undefined;
    setForm(last ? {
      ...form,
      serviceName,
      frequency: last.frequency || form.frequency,
      amount: last.originalAmount ?? last.amount,
      currency: (last.currency === 'USD' ? 'USD' : 'UZS') as Currency,
    } : { ...form, serviceName });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form || !form.amount) return;
    setSubmitting(true);
    const d = new Date(form.expenseDate);
    const name = isService(form.category) ? form.serviceName.trim() : '';
    if (isService(form.category) && !name) {
      setSubmitting(false);
      alert(form.category === 19 ? 'Domen nomini kiriting' : 'Server nomini kiriting');
      return;
    }
    const autoDescription = `${metaOf(form.category).label}${name ? `: ${name}` : ''} — ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
    const payload = {
      category: form.category,
      frequency: form.frequency,
      amount: Number(form.amount),
      currency: form.currency,
      description: form.description.trim() || autoDescription,
      expenseDate: new Date(form.expenseDate).toISOString(),
      notes: form.notes.trim() || undefined,
      serviceName: name || undefined,
    };
    try {
      if (form.id) await officeExpensesApi.update(form.id, payload);
      else await officeExpensesApi.create(payload);
      setForm(null);
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

  const CategoryBadge: React.FC<{ category: number; sub?: string }> = ({ category, sub }) => {
    const meta = metaOf(category);
    const Icon = meta.icon;
    return (
      <span className="inline-flex items-center gap-2 min-w-0">
        <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
          <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block font-semibold text-[#171b25] truncate">{sub || meta.label}</span>
          {sub && <span className="block text-[10px] text-[#969ca7] truncate">{meta.label}</span>}
        </span>
      </span>
    );
  };

  return (
    <div className="p-4 sm:p-6 space-y-5">
      {/* Sarlavha + oy tanlash */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-[#171b25]">Mening Ofisim</h2>
          <p className="text-xs text-gray-400 break-words">
            Ofisning umumiy xarajatlari: ijara, svet, internet, suv, gaz, server, domen va boshqalar
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
          <div className="flex items-center bg-white border border-[#e4e7ec] rounded-lg h-9">
            {month && (
              <button onClick={() => setMonth(shiftMonth(month, -1))} className="h-9 w-8 flex items-center justify-center text-gray-500 hover:text-[#171b25]" title="Oldingi oy">
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            <select
              value={month ? `${month.y}-${month.m}` : 'all'}
              onChange={e => {
                const v = e.target.value;
                if (v === 'all') { setMonth(null); return; }
                const [y, m] = v.split('-').map(Number);
                setMonth({ y, m });
              }}
              className={`h-9 flex-1 px-2 text-xs font-bold bg-transparent outline-none cursor-pointer ${month ? 'text-[#ff7a16]' : 'text-[#171b25]'}`}
            >
              <option value="all">📅 Barcha oylar</option>
              {monthOptions.map(k => (
                <option key={`${k.y}-${k.m}`} value={`${k.y}-${k.m}`}>{monthLabel(k)}</option>
              ))}
            </select>
            {month && (
              <button
                onClick={() => setMonth(shiftMonth(month, 1))}
                disabled={isCurrentMonth}
                className="h-9 w-8 flex items-center justify-center text-gray-500 hover:text-[#171b25] disabled:opacity-30"
                title="Keyingi oy"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
          {month && (
            <button onClick={() => setMonth(null)} className="h-9 px-3 text-xs font-semibold text-[#ff7a16] hover:bg-[#fff3e8] rounded-lg inline-flex items-center justify-center gap-1">
              <X className="w-3.5 h-3.5" /> Filtrni tozalash
            </button>
          )}
          <button
            onClick={() => openNew()}
            className="h-9 px-4 bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-2 shadow-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Xarajat qo'shish</span>
          </button>
        </div>
      </div>

      {/* Umumiy ko'rsatkichlar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ef5350]" />
          <small className="block text-[11px] font-medium text-[#697180] mb-1.5">
            {month ? `${monthLabel(month)} — jami` : 'Jami ofis xarajatlari (barcha oylar)'}
          </small>
          <UsdWithUzs className="text-xl sm:text-2xl font-bold text-[#171b25]" uzsClassName="text-xs" usd={scopeTotal.usd} uzs={scopeTotal.uzs} />
          <div className="mt-2 text-[11px] text-[#969ca7]">{scopeExpenses.length} ta to'lov</div>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#ff7a16]" />
          <small className="block text-[11px] font-medium text-[#697180] mb-1.5">
            {month ? `${MONTHS[prevMonth.m]} ${prevMonth.y} — jami` : `Shu oy (${monthLabel(currentMonth)})`}
          </small>
          {month ? (
            <UsdWithUzs className="text-xl sm:text-2xl font-bold text-[#171b25]" uzsClassName="text-xs" usd={prevTotal.usd} uzs={prevTotal.uzs} />
          ) : (
            <UsdWithUzs className="text-xl sm:text-2xl font-bold text-[#171b25]" uzsClassName="text-xs" usd={billMonthTotal.usd} uzs={billMonthTotal.uzs} />
          )}
          {changePct != null && (
            <div className={`mt-2 inline-flex items-center gap-1 text-[11px] font-semibold ${changePct > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {changePct > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {month
                ? `Tanlangan oy ${changePct > 0 ? '+' : ''}${changePct.toFixed(0)}% ga ${changePct > 0 ? "ko'p" : 'kam'}`
                : `${changePct > 0 ? '+' : ''}${changePct.toFixed(0)}% ${MONTHS[prevMonth.m].toLowerCase()}ga nisbatan`}
            </div>
          )}
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs relative overflow-hidden">
          <div className="absolute left-0 top-4 w-1.5 h-8 rounded-r bg-[#3b82f6]" />
          <small className="block text-[11px] font-medium text-[#697180] mb-1.5">O'rtacha oylik xarajat</small>
          <UsdWithUzs className="text-xl sm:text-2xl font-bold text-[#171b25]" uzsClassName="text-xs" usd={avgMonthly.usd} uzs={avgMonthly.uzs} />
          <div className="mt-2 text-[11px] text-[#969ca7]">{monthsSpan} oy bo'yicha</div>
        </div>
      </div>

      {/* Doimiy oylik to'lovlar */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#e4e7ec] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Repeat className="w-4 h-4 text-[#ff7a16]" />
            <span className="text-xs font-bold text-[#171b25]">Oylik to'lovlar — {monthLabel(billMonth)}</span>
          </div>
          {trackedBills.length > 0 && (
            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${paidCount === trackedBills.length ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
              {paidCount} / {trackedBills.length} to'langan
            </span>
          )}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
          {recurringStatus.map(({ cat, paid, total, last }) => {
            const meta = metaOf(cat);
            const Icon = meta.icon;
            const isPaid = paid.length > 0;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => (isPaid && paid.length === 1 ? openEdit(paid[0]) : openNew(cat))}
                className={`text-left rounded-xl border p-3.5 flex items-center gap-3 transition-colors ${
                  isPaid ? 'border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50' : 'border-[#e4e7ec] hover:border-[#ff7a16] hover:bg-[#fffaf5]'
                }`}
              >
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                  <Icon className="w-5 h-5" style={{ color: meta.color }} />
                </span>
                <span className="flex-1 min-w-0">
                  <span className="block text-xs font-bold text-[#171b25]">{meta.label}</span>
                  {isPaid ? (
                    <UsdWithUzs inline className="text-xs font-semibold text-emerald-700" usd={total.usd} uzs={total.uzs} />
                  ) : last ? (
                    <span className="block text-[11px] text-[#969ca7] truncate">
                      Oxirgi: <UsdWithUzs inline usd={last.amountUsd} uzs={last.amount} /> · {formatDate(last.expenseDate)}
                    </span>
                  ) : (
                    <span className="block text-[11px] text-[#969ca7]">Hali kiritilmagan</span>
                  )}
                </span>
                {isPaid ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                ) : (
                  <span className="shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold text-[#ff7a16]">
                    <Circle className="w-4 h-4" /> To'lash
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="px-4 pb-4 flex flex-wrap gap-2">
          <span className="text-[11px] text-[#969ca7] self-center mr-1">Boshqa xarajat:</span>
          {OTHER_CATEGORIES.map(cat => {
            const meta = metaOf(cat);
            const Icon = meta.icon;
            return (
              <button
                key={cat}
                onClick={() => openNew(cat)}
                className="h-8 px-3 rounded-lg border border-[#e4e7ec] text-[11px] font-semibold text-gray-700 hover:border-[#ff7a16] hover:text-[#ff7a16] inline-flex items-center gap-1.5"
              >
                <Icon className="w-3.5 h-3.5" /> {meta.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Server va domenlar — har biri alohida */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#e4e7ec] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <Server className="w-4 h-4 text-[#ff7a16]" />
            <span className="text-xs font-bold text-[#171b25]">Server va domenlar</span>
            {services.length > 0 && (
              <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                overdueServices > 0 ? 'bg-red-100 text-red-700' : soonServices > 0 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {overdueServices > 0
                  ? `${overdueServices} ta muddati o'tgan`
                  : soonServices > 0
                    ? `${soonServices} ta to'lov yaqin`
                    : "Hammasi to'langan"}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button onClick={() => openNew(18)} className="h-8 px-2.5 rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-100 inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Server
            </button>
            <button onClick={() => openNew(19)} className="h-8 px-2.5 rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-100 inline-flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Domen
            </button>
          </div>
        </div>

        {services.length === 0 ? (
          <div className="p-4">
            <div className="rounded-xl border border-dashed border-[#e4e7ec] py-8 px-4 flex flex-col items-center text-center gap-2">
              <div className="flex gap-2">
                <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: metaOf(18).bg }}>
                  <Server className="w-4 h-4" style={{ color: metaOf(18).color }} />
                </span>
                <span className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: metaOf(19).bg }}>
                  <Globe className="w-4 h-4" style={{ color: metaOf(19).color }} />
                </span>
              </div>
              <p className="text-xs font-semibold text-[#171b25]">Hali server yoki domen yo'q</p>
              <p className="text-[11px] text-gray-400 max-w-sm">
                Har birini nomi bilan qo'shing — keyingi to'lov sanasi avtomatik kuzatiladi va vaqti kelganda shu yerda ko'rinadi.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
            {services.map(sv => {
              const meta = metaOf(sv.category);
              const Icon = meta.icon;
              const lastTime = new Date(sv.last.expenseDate).getTime();
              const periodMs = Math.max(1, sv.nextDue.getTime() - lastTime);
              const elapsedPct = Math.min(100, Math.max(0, ((refDate.getTime() - lastTime) / periodMs) * 100));
              const tone =
                sv.status === 'overdue'
                  ? { card: 'border-red-400 bg-white', bar: '#ef4444', text: 'text-red-600', label: `${Math.abs(sv.daysLeft)} kun kechikdi` }
                  : sv.status === 'soon'
                    ? { card: 'border-orange-300 bg-white', bar: '#f97316', text: 'text-orange-600', label: `${sv.daysLeft} kun qoldi` }
                    : { card: 'border-[#e4e7ec] bg-white', bar: '#10b981', text: 'text-emerald-600', label: `${sv.daysLeft} kun qoldi` };
              return (
                <div key={sv.key} className={`rounded-xl border p-3.5 flex flex-col gap-3 ${tone.card}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: meta.bg }}>
                      <Icon className="w-5 h-5" style={{ color: meta.color }} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-[#171b25] truncate" title={sv.name}>
                        {sv.name || <span className="text-gray-400 font-medium">Nomsiz</span>}
                      </div>
                      <div className="text-[11px] text-[#969ca7] truncate">
                        {meta.label} · {sv.yearly ? 'har yili' : 'har oy'}
                      </div>
                    </div>
                    {sv.status === 'ok'
                      ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      : <AlertTriangle className={`w-5 h-5 shrink-0 ${tone.text}`} />}
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between gap-2 mb-1.5">
                      <span className="text-[11px] text-[#969ca7]">
                        Keyingi to'lov: <b className="text-[#171b25] font-semibold">{formatDate(sv.nextDue.toISOString())}</b>
                      </span>
                      <span className={`text-[11px] font-bold whitespace-nowrap ${tone.text}`}>{tone.label}</span>
                    </div>
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${elapsedPct}%`, background: tone.bar }} />
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-[#eef0f3]">
                    <span className="text-[11px] text-[#969ca7] min-w-0 truncate">
                      Oxirgi: <UsdWithUzs inline className="text-[#171b25] font-semibold" usd={sv.last.amountUsd} uzs={sv.last.amount} />
                    </span>
                    <button
                      onClick={() => openNew(sv.category, sv.name)}
                      className={`h-7 px-3 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 shrink-0 transition-colors ${
                        sv.status === 'ok'
                          ? 'text-[#ff7a16] hover:bg-[#fff3e8]'
                          : 'bg-[#ff7a16] hover:bg-[#e86807] text-white shadow-sm'
                      }`}
                    >
                      <Plus className="w-3.5 h-3.5" /> To'lash
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Kategoriyalar bo'yicha taqsimot */}
      {breakdown.length > 0 && (
        <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs p-4 sm:p-5">
          <span className="block text-xs font-bold text-[#171b25] mb-3">Pul qayerga ketdi? — {month ? monthLabel(month) : 'barcha oylar'}</span>
          <div className="space-y-2.5">
            {breakdown.map(([cat, s]) => {
              const meta = metaOf(cat);
              const pct = scopeTotal.uzs > 0 ? (s.uzs / scopeTotal.uzs) * 100 : 0;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)}
                  className="w-full text-left group"
                  title="Jadvalni shu kategoriya bo'yicha filtrlash"
                >
                  <div className="flex items-center justify-between gap-3 text-[11px] mb-1">
                    <span className={`font-semibold ${categoryFilter === cat ? 'text-[#ff7a16]' : 'text-gray-700'}`}>{meta.label}</span>
                    <span className="text-gray-500"><UsdWithUzs inline usd={s.usd} uzs={s.uzs} /> · {pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: meta.color }} />
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Jadval */}
      <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
        <div className="px-4 sm:px-5 py-3.5 border-b border-[#e4e7ec] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-[#171b25]">{month ? `${monthLabel(month)} — to'lovlar` : "Barcha to'lovlar"}</span>
            <span className="text-[11px] text-[#969ca7] font-semibold">{tableRows.length} ta</span>
            {categoryFilter != null && (
              <button onClick={() => setCategoryFilter(null)} className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#fff3e8] text-[#ff7a16]">
                {metaOf(categoryFilter).label} <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <div className="relative w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Qidirish..."
              className="w-full h-8 pl-8 pr-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-xs">
            <thead>
              <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Nima uchun</th>
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Summa</th>
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Izoh</th>
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Sana</th>
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider">Kim kiritgan</th>
                <th className="py-3 px-5 font-bold text-[#7c838e] text-[10px] uppercase tracking-wider text-right">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eef0f3]">
              {tableRows.map(exp => (
                <tr key={exp.id} className="hover:bg-[#fafbfc] transition-colors">
                  <td className="py-3 px-5">
                    <div className="flex items-center gap-2">
                      <CategoryBadge category={exp.category} sub={exp.serviceName} />
                      {(exp.frequency || 1) === 3 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-orange-100 text-orange-700">oylik</span>
                      )}
                      {exp.frequency === 4 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-sky-100 text-sky-700">yillik</span>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-5 font-bold text-[#171b25]"><UsdWithUzs usd={exp.amountUsd} uzs={exp.amount} /></td>
                  <td className="py-3 px-5 text-gray-600 max-w-[240px]">
                    <div className="truncate">{exp.description}</div>
                    {exp.notes && <div className="truncate text-[10px] text-gray-400">{exp.notes}</div>}
                  </td>
                  <td className="py-3 px-5 text-gray-500">{formatDate(exp.expenseDate)}</td>
                  <td className="py-3 px-5 text-gray-600">{exp.createdByName}</td>
                  <td className="py-3 px-5 text-right whitespace-nowrap">
                    <button
                      onClick={() => openEdit(exp)}
                      title="Tahrirlash"
                      className="min-h-8 min-w-8 p-1.5 text-gray-400 hover:text-[#ff7a16] hover:bg-[#fff3e8] rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(exp.id)}
                      title="O'chirish"
                      className="min-h-8 min-w-8 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors inline-flex items-center justify-center"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
              {tableRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-gray-400">
                    {loading
                      ? 'Yuklanmoqda...'
                      : scopeExpenses.length === 0
                        ? (month ? `${monthLabel(month)} uchun hali xarajat kiritilmagan` : 'Hali ofis xarajatlari kiritilmagan')
                        : 'Filtr bo\'yicha hech narsa topilmadi'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Qo'shish / tahrirlash oynasi */}
      {form && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[92vh] overflow-y-auto p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-5">
              <div className="min-w-0">
                <h2 className="text-sm font-bold text-[#171b25]">{form.id ? 'Xarajatni tahrirlash' : "Ofis xarajati qo'shish"}</h2>
                <p className="text-[10px] text-gray-400 break-words">Nima uchun to'lov qilinganini tanlang</p>
              </div>
              <button onClick={() => setForm(null)} className="min-h-8 min-w-8 p-1.5 hover:bg-gray-100 rounded-lg inline-flex items-center justify-center">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">Nima uchun? *</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                  {[...RECURRING_CATEGORIES, ...SERVICE_CATEGORIES, ...OTHER_CATEGORIES].map(cat => {
                    const meta = metaOf(cat);
                    const Icon = meta.icon;
                    const active = form.category === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => changeFormCategory(cat)}
                        className={`rounded-lg border p-2 flex flex-col items-center gap-1 text-[10px] font-semibold transition-colors ${
                          active ? 'border-[#ff7a16] bg-[#fff3e8] text-[#171b25]' : 'border-[#e4e7ec] text-gray-600 hover:border-gray-300'
                        }`}
                      >
                        <span className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: meta.bg }}>
                          <Icon className="w-4 h-4" style={{ color: meta.color }} />
                        </span>
                        <span className="text-center leading-tight">{meta.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {isService(form.category) && (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">
                    {form.category === 19 ? 'Domen nomi *' : 'Server nomi *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={form.category === 19 ? 'Masalan: workdex.uz' : 'Masalan: Hetzner VPS, AWS, Beget'}
                    value={form.serviceName}
                    onChange={e => changeServiceName(e.target.value)}
                    className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                  />
                  {serviceNameOptions(form.category).length > 0 && !form.id && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {serviceNameOptions(form.category).map(n => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => changeServiceName(n)}
                          className={`h-6 px-2 rounded-md text-[10px] font-semibold border transition-colors ${
                            form.serviceName.trim().toLowerCase() === n.toLowerCase()
                              ? 'border-[#ff7a16] bg-[#fff3e8] text-[#ff7a16]'
                              : 'border-[#e4e7ec] text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <MoneyInput
                label="Summa"
                required
                value={form.amount}
                onChange={v => setForm({ ...form, amount: v })}
                currency={form.currency}
                onCurrencyChange={c => setForm({ ...form, currency: c })}
                hint={!form.id && isPeriodic(form.category) && form.amount !== '' ? "Oldingi to'lov summasi avtomatik qo'yildi — kerak bo'lsa o'zgartiring" : undefined}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">To'lov sanasi *</label>
                  <input type="date" required value={form.expenseDate} onChange={e => setForm({ ...form, expenseDate: e.target.value })}
                    className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Turi</label>
                  <div className="grid grid-cols-3 gap-1 bg-gray-100 p-1 rounded-lg h-9">
                    {[{ v: 3, l: 'Har oy' }, { v: 4, l: 'Har yil' }, { v: 1, l: 'Bir marta' }].map(o => (
                      <button key={o.v} type="button" onClick={() => setForm({ ...form, frequency: o.v })}
                        className={`text-[11px] font-semibold rounded-md ${form.frequency === o.v ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500'}`}>
                        {o.l}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Izoh</label>
                <input type="text"
                  placeholder={`Bo'sh qoldirsangiz: "${metaOf(form.category).label} — ${MONTHS[new Date(form.expenseDate).getMonth()] ?? ''} ${new Date(form.expenseDate).getFullYear() || ''}"`}
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                  className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]" />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Qo'shimcha ma'lumot</label>
                <textarea placeholder="Masalan: hisob raqami, kvitansiya raqami, provayder nomi..."
                  value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })}
                  className="w-full h-16 px-3 py-2 border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16] resize-none" />
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-1">
                <button type="button" onClick={() => setForm(null)}
                  className="flex-1 h-9 border border-[#e4e7ec] bg-white hover:bg-gray-50 text-gray-700 font-semibold text-xs rounded-lg transition-colors">
                  Bekor qilish
                </button>
                <button type="submit" disabled={submitting}
                  className="flex-1 h-9 bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50">
                  {form.id ? <Pencil className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{submitting ? 'Saqlanmoqda...' : form.id ? 'Saqlash' : "Qo'shish"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

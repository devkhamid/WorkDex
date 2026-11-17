import React, { useState } from 'react';
import { Pencil, X } from 'lucide-react';
import { projectsApi } from '../api/services';
import { Currency, Expense, ExtraWork, MaterialPurchase, Payment, WorkerPayment } from '../types';

export type EditTarget =
  | { kind: 'payment'; item: Payment }
  | { kind: 'expense'; item: Expense }
  | { kind: 'purchase'; item: MaterialPurchase }
  | { kind: 'worker'; item: WorkerPayment }
  | { kind: 'extra'; item: ExtraWork };

interface Props {
  projectId: string;
  target: EditTarget;
  expenseCategoryLabels: Record<number, string>;
  onClose: () => void;
  onSaved: () => void;
}

const TITLES: Record<EditTarget['kind'], string> = {
  payment: "Mijoz to'lovini tahrirlash",
  expense: 'Xarajatni tahrirlash',
  purchase: 'Material xaridini tahrirlash',
  worker: 'Usta ishini tahrirlash',
  extra: "Qo'shimcha ishni tahrirlash",
};

const PAYMENT_METHODS: [number, string][] = [
  [1, 'Naqd pul'],
  [2, "Bank o'tkazmasi"],
  [3, 'Plastik karta'],
  [4, 'Boshqa'],
];

const FREQUENCIES: [number, string][] = [
  [1, 'Bir martalik'],
  [2, 'Kunlik'],
  [3, 'Oylik'],
];

const toDateInput = (iso?: string | null) => (iso ? iso.slice(0, 10) : '');

const toIsoDate = (value: string, original?: string | null) =>
  original && toDateInput(original) === value ? original : `${value}T12:00:00.000Z`;

const round2 = (n: number) => Math.round(n * 100) / 100;

const initialState = (target: EditTarget): Record<string, any> => {
  switch (target.kind) {
    case 'payment': {
      const p = target.item;
      const currency: Currency = p.currency ?? 'USD';
      return {
        amount: currency === 'UZS' ? p.originalAmount ?? p.amountUzs ?? 0 : p.amount,
        currency,
        paymentMethod: p.paymentMethod,
        date: toDateInput(p.paymentDate),
        notes: p.notes ?? '',
      };
    }
    case 'expense': {
      const e = target.item;
      return {
        amount: e.originalAmount ?? e.amount,
        currency: (e.currency as Currency) ?? 'UZS',
        category: e.category,
        frequency: e.frequency ?? 1,
        description: e.description,
        date: toDateInput(e.expenseDate),
        notes: e.notes ?? '',
      };
    }
    case 'purchase': {
      const p = target.item;
      const currency: Currency = (p.currency as Currency) ?? 'UZS';
      return {
        quantity: p.quantity,
        unitPrice: currency === 'USD' ? p.originalUnitPrice ?? p.unitPrice : p.unitPrice,
        currency,
        supplier: p.supplier ?? '',
        receiptNumber: p.receiptNumber ?? '',
        date: toDateInput(p.purchaseDate),
        notes: p.notes ?? '',
      };
    }
    case 'worker': {
      const w = target.item;
      return {
        jobDescription: w.jobDescription,
        agreedAmount: w.originalAgreedAmount ?? w.agreedAmount,
        currency: (w.currency as Currency) ?? 'UZS',
        workAmountUzs: round2(w.workAmount),
        paidAmountUzs: round2(w.paidAmount),
        notes: w.notes ?? '',
      };
    }
    case 'extra': {
      const x = target.item;
      return {
        title: x.title,
        description: x.description ?? '',
        customerAmount: x.originalCustomerAmount ?? x.customerAmount,
        actualCost: x.originalActualCost ?? x.actualCost,
        currency: x.currency ?? 'USD',
        isApprovedByCustomer: x.isApprovedByCustomer,
        notes: x.notes ?? '',
      };
    }
  }
};

const inputCls = 'w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16] bg-white';
const labelCls = 'block text-xs font-semibold mb-1 text-gray-700';

export const ProjectRecordEditModal: React.FC<Props> = ({ projectId, target, expenseCategoryLabels, onClose, onSaved }) => {
  const [form, setForm] = useState<Record<string, any>>(() => initialState(target));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const set = (key: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));
  const num = (key: string) => Number(form[key]);

  const positive = (key: string, label: string) => {
    if (!(num(key) > 0)) throw new Error(`${label} 0 dan katta bo'lishi kerak.`);
    return num(key);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const notes = form.notes?.trim() || undefined;
      switch (target.kind) {
        case 'payment':
          await projectsApi.updatePayment(projectId, target.item.id, {
            amount: positive('amount', 'Summa'),
            currency: form.currency,
            paymentMethod: Number(form.paymentMethod),
            paymentDate: toIsoDate(form.date, target.item.paymentDate),
            notes,
          });
          break;
        case 'expense':
          if (!form.description.trim()) throw new Error('Tavsif kiritilmagan.');
          await projectsApi.updateExpense(projectId, target.item.id, {
            amount: positive('amount', 'Summa'),
            currency: form.currency,
            category: Number(form.category),
            frequency: Number(form.frequency),
            description: form.description.trim(),
            expenseDate: toIsoDate(form.date, target.item.expenseDate),
            notes,
          });
          break;
        case 'purchase':
          await projectsApi.updatePurchase(projectId, target.item.id, {
            quantity: positive('quantity', 'Miqdor'),
            unitPrice: positive('unitPrice', 'Narx'),
            currency: form.currency,
            supplier: form.supplier.trim() || undefined,
            receiptNumber: form.receiptNumber.trim() || undefined,
            purchaseDate: toIsoDate(form.date, target.item.purchaseDate),
            notes,
          });
          break;
        case 'worker': {
          if (!form.jobDescription.trim()) throw new Error('Ish tavsifi kiritilmagan.');
          const work = num('workAmountUzs');
          const paid = num('paidAmountUzs');
          if (!(work >= 0) || !(paid >= 0)) throw new Error("Summalar manfiy bo'lishi mumkin emas.");
          await projectsApi.updateWorkerJob(projectId, target.item.id, {
            jobDescription: form.jobDescription.trim(),
            agreedAmount: positive('agreedAmount', 'Kelishilgan summa'),
            currency: form.currency,
            workAmountUzs: work,
            paidAmountUzs: paid,
            notes,
          });
          break;
        }
        case 'extra':
          if (!form.title.trim()) throw new Error('Nomi kiritilmagan.');
          if (!(num('customerAmount') >= 0) || !(num('actualCost') >= 0)) throw new Error("Summalar manfiy bo'lishi mumkin emas.");
          await projectsApi.updateExtraWork(projectId, target.item.id, {
            title: form.title.trim(),
            description: form.description.trim() || undefined,
            customerAmount: num('customerAmount'),
            actualCost: num('actualCost'),
            currency: form.currency,
            isApprovedByCustomer: !!form.isApprovedByCustomer,
            notes,
          });
          break;
      }
      onSaved();
      onClose();
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const currencySelect = (
    <select value={form.currency} onChange={set('currency')} className={`${inputCls} w-24 flex-shrink-0`}>
      <option value="UZS">UZS</option>
      <option value="USD">USD</option>
    </select>
  );

  const amountField = (key: string, label: string, withCurrency = true) => (
    <div>
      <label className={labelCls}>{label}</label>
      <div className="flex gap-2">
        <input type="number" step="0.01" min="0" value={form[key]} onChange={set(key)} className={inputCls} required />
        {withCurrency && currencySelect}
      </div>
    </div>
  );

  const dateField = (label: string) => (
    <div>
      <label className={labelCls}>{label}</label>
      <input type="date" value={form.date} onChange={set('date')} className={inputCls} required />
    </div>
  );

  const notesField = (
    <div>
      <label className={labelCls}>Izoh</label>
      <textarea value={form.notes} onChange={set('notes')} rows={2} className={`${inputCls} h-auto py-2`} />
    </div>
  );

  const subtitle =
    target.kind === 'purchase' ? `${target.item.materialName}${target.item.brand ? ` [${target.item.brand}]` : ''} · ${target.item.unit}`
    : target.kind === 'worker' ? target.item.workerName
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
        <div className="flex justify-between items-start border-b pb-3 gap-2">
          <div className="min-w-0">
            <h3 className="font-bold text-sm text-[#171b25] flex items-center gap-1.5">
              <Pencil className="w-4 h-4 text-[#ff7a16]" /> {TITLES[target.kind]}
            </h3>
            {subtitle && <div className="text-[11px] text-gray-500 mt-0.5 truncate">{subtitle}</div>}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 min-w-8 min-h-8 inline-flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-3">
          {target.kind === 'payment' && (
            <>
              {amountField('amount', 'Summa')}
              <div>
                <label className={labelCls}>To'lov usuli</label>
                <select value={form.paymentMethod} onChange={set('paymentMethod')} className={inputCls}>
                  {PAYMENT_METHODS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              {dateField("To'lov sanasi")}
              {notesField}
            </>
          )}

          {target.kind === 'expense' && (
            <>
              <div>
                <label className={labelCls}>Tavsif</label>
                <input value={form.description} onChange={set('description')} className={inputCls} required maxLength={500} />
              </div>
              {amountField('amount', 'Summa')}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Kategoriya</label>
                  <select value={form.category} onChange={set('category')} className={inputCls}>
                    {Object.entries(expenseCategoryLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Davriylik</label>
                  <select value={form.frequency} onChange={set('frequency')} className={inputCls}>
                    {FREQUENCIES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </div>
              </div>
              {dateField('Sana')}
              {notesField}
            </>
          )}

          {target.kind === 'purchase' && (
            <>
              <div>
                <label className={labelCls}>Miqdor ({target.item.unit})</label>
                <input type="number" step="0.01" min="0" value={form.quantity} onChange={set('quantity')} className={inputCls} required />
              </div>
              {amountField('unitPrice', 'Birlik narxi')}
              {Number(form.quantity) > 0 && Number(form.unitPrice) > 0 && (
                <div className="text-[11px] text-gray-500">
                  Jami: <b>{(Number(form.quantity) * Number(form.unitPrice)).toLocaleString('ru-RU', { maximumFractionDigits: 2 })} {form.currency}</b>
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Do'kon / yetkazuvchi</label>
                  <input value={form.supplier} onChange={set('supplier')} className={inputCls} maxLength={200} />
                </div>
                <div>
                  <label className={labelCls}>Chek raqami</label>
                  <input value={form.receiptNumber} onChange={set('receiptNumber')} className={inputCls} maxLength={100} />
                </div>
              </div>
              {dateField('Xarid sanasi')}
              {notesField}
              <p className="text-[10px] text-gray-400">Materialni o'zgartirish kerak bo'lsa, xaridni o'chirib, qaytadan kiriting.</p>
            </>
          )}

          {target.kind === 'worker' && (
            <>
              <div>
                <label className={labelCls}>Ish tavsifi</label>
                <input value={form.jobDescription} onChange={set('jobDescription')} className={inputCls} required maxLength={500} />
              </div>
              {amountField('agreedAmount', 'Kelishilgan summa')}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {amountField('workAmountUzs', "Ishlangan haq (so'm)", false)}
                {amountField('paidAmountUzs', "To'langan (so'm)", false)}
              </div>
              {notesField}
            </>
          )}

          {target.kind === 'extra' && (
            <>
              <div>
                <label className={labelCls}>Nomi</label>
                <input value={form.title} onChange={set('title')} className={inputCls} required />
              </div>
              <div>
                <label className={labelCls}>Tavsif</label>
                <input value={form.description} onChange={set('description')} className={inputCls} />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {amountField('customerAmount', 'Mijoz narxi', false)}
                {amountField('actualCost', 'Tannarx', false)}
              </div>
              <div>
                <label className={labelCls}>Valyuta</label>
                {currencySelect}
              </div>
              <label className="flex items-center gap-2 text-xs text-gray-700">
                <input
                  type="checkbox"
                  checked={!!form.isApprovedByCustomer}
                  onChange={(e) => setForm((f) => ({ ...f, isApprovedByCustomer: e.target.checked }))}
                />
                Mijoz tomonidan tasdiqlangan
              </label>
              {notesField}
            </>
          )}

          {error && <div className="text-[11px] text-red-600 font-semibold bg-red-50 border border-red-100 rounded-lg p-2">{error}</div>}

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
            <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded-lg text-xs text-gray-600">Bekor qilish</button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold hover:bg-[#e86807] disabled:opacity-50"
            >
              {saving ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

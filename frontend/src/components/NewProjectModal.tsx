import React, { useState, useEffect } from 'react';
import { X, Building, Calendar, MapPin, UserPlus } from 'lucide-react';
import { customersApi, projectsApi } from '../api/services';
import { Currency, Customer } from '../types';
import { MoneyInput } from './Money';

interface NewProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewProjectModal: React.FC<NewProjectModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [isNewCustomer, setIsNewCustomer] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [projectType, setProjectType] = useState('');
  const [customerId, setCustomerId] = useState('');
  const [contractAmount, setContractAmount] = useState<number | ''>('');
  const [budget, setBudget] = useState<number | ''>('');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');

  // Inline New Customer State
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');

  useEffect(() => {
    if (isOpen) {
      customersApi.getAll().then((data) => {
        setCustomers(data);
        if (data.length > 0) setCustomerId(data[0].id);
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      let finalCustomerId = customerId;

      if (isNewCustomer) {
        const createdCustomer = await customersApi.create({
          fullName: newCustomerName,
          phoneNumber: newCustomerPhone,
        });
        finalCustomerId = createdCustomer.id;
      }

      await projectsApi.create({
        name,
        projectType: projectType || undefined,
        customerId: finalCustomerId,
        contractAmount: Number(contractAmount) || 0,
        budget: Number(budget) || 0,
        currency,
        startDate: new Date(startDate).toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        location: location || undefined,
        notes: notes || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      alert(err.response?.data?.message || "Loyiha yaratishda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-xs p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl shadow-2xl border border-[#e4e7ec] w-full sm:max-w-xl max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-[#e4e7ec] bg-gray-50/50">
          <div className="flex items-center gap-2 font-bold text-sm text-[#171b25] min-w-0">
            <Building className="w-4 h-4 text-[#ff7a16]" />
            <span>Yangi Loyiha Yaratish</span>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 max-h-[calc(92vh-65px)] overflow-y-auto custom-scrollbar">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Loyiha Nomi *</label>
            <input
              type="text"
              required
              placeholder="Masalan: Ahmad Yusupov — Villa ta'miri"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs focus:border-[#ff7a16] focus:ring-1 focus:ring-[#ff7a16] outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Loyiha Turi</label>
              <input
                type="text"
                placeholder="Masalan: Villa, Kvartira, Ofis"
                value={projectType}
                onChange={(e) => setProjectType(e.target.value)}
                className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs focus:border-[#ff7a16] focus:ring-1 focus:ring-[#ff7a16] outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Joylashuv / Manzil</label>
              <input
                type="text"
                placeholder="Toshkent sh., Chilonzor"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs focus:border-[#ff7a16] focus:ring-1 focus:ring-[#ff7a16] outline-none"
              />
            </div>
          </div>

          {/* Customer Selection / New Customer */}
          <div className="p-3 border border-gray-100 rounded-lg bg-gray-50/70">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
              <label className="text-xs font-semibold text-gray-700">Mijoz (Buyurtmachi) *</label>
              <button
                type="button"
                onClick={() => setIsNewCustomer(!isNewCustomer)}
                className="text-[11px] text-[#ff7a16] font-medium hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3 h-3" />
                <span>{isNewCustomer ? "Mavjud mijozlardan tanlash" : "+ Yangi mijoz qo'shish"}</span>
              </button>
            </div>

            {isNewCustomer ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  required
                  placeholder="Mijoz to'liq ismi"
                  value={newCustomerName}
                  onChange={(e) => setNewCustomerName(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
                <input
                  type="text"
                  required
                  placeholder="+998901234567"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(e.target.value)}
                  className="w-full h-8 px-2.5 bg-white border border-[#e4e7ec] rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
            ) : (
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
                className="w-full h-9 px-3 bg-white border border-[#e4e7ec] rounded-lg text-xs focus:border-[#ff7a16] outline-none"
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.fullName} ({c.phoneNumber})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Financials — summa so'm yoki USD da, bugungi CBU kursi bilan konvertatsiya qilinadi */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <MoneyInput
              label="Shartnoma Summasi"
              required
              min={0}
              value={contractAmount}
              onChange={setContractAmount}
              currency={currency}
              onCurrencyChange={setCurrency}
            />
            <MoneyInput
              label="Rejali Byudjet"
              required
              min={0}
              value={budget}
              onChange={setBudget}
              currency={currency}
              onCurrencyChange={setCurrency}
            />
          </div>

          {/* Dates in Day.Month.Year format */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Boshlanish Sanasi * <span className="text-[10px] text-gray-400 font-normal">(Kun / Oy / Yil)</span>
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs focus:border-[#ff7a16] outline-none bg-white"
              />
              <div className="text-[10px] text-gray-500 mt-1 flex justify-between gap-2">
                <span>Tanlangan: {startDate ? new Date(startDate).toLocaleDateString('uz-UZ') : '-'}</span>
                <span className="text-[#ff7a16] font-medium">Kun.Oy.Yil</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rejalashtirilgan Tugash <span className="text-[10px] text-gray-400 font-normal">(Kun / Oy / Yil)</span>
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-9 px-3 border border-[#e4e7ec] rounded-lg text-xs focus:border-[#ff7a16] outline-none bg-white"
              />
              <div className="text-[10px] text-gray-500 mt-1 flex justify-between gap-2">
                <span>Tanlangan: {endDate ? new Date(endDate).toLocaleDateString('uz-UZ') : '-'}</span>
                <span className="text-[#ff7a16] font-medium">Kun.Oy.Yil</span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Izoh / Qo'shimcha</label>
            <textarea
              rows={2}
              placeholder="Loyiha haqida qisqacha ma'lumot..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2.5 border border-[#e4e7ec] rounded-lg text-xs focus:border-[#ff7a16] outline-none resize-none"
            />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-[#e4e7ec]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#e4e7ec] text-gray-600 rounded-lg text-xs font-semibold hover:bg-gray-50"
            >
              Bekor qilish
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#ff7a16] hover:bg-[#e86807] text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? "Yaratilmoqda..." : "Loyihani Saqlash"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Plus, Users, Phone, Mail, MapPin, Search } from 'lucide-react';
import { customersApi } from '../api/services';
import { Customer } from '../types';

export const CustomersPage: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await customersApi.getAll();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await customersApi.create({
        fullName: name,
        phoneNumber: phone,
        address: address || undefined,
        notes: notes || undefined
      });
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      loadCustomers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const filtered = customers.filter(c =>
    c.fullName.toLowerCase().includes(search.toLowerCase()) ||
    c.phoneNumber.includes(search)
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#171b25]">Mijozlar</h2>
          <p className="text-xs text-[#7b8190] mt-0.5 break-words">Barcha buyurtmachi mijozlar bazasi va kontaktlari</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs h-[34px] px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi mijoz</span>
        </button>
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex items-center gap-2 shadow-xs min-w-0">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="⌕ Ism yoki telefon bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-0 text-xs outline-none"
        />
        <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} ta mijoz</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {filtered.map((c) => (
          <div key={c.id} className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-full bg-orange-100 text-[#ff7a16] flex items-center justify-center font-bold text-xs flex-shrink-0">
                {c.fullName.substring(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-xs text-gray-900 truncate">{c.fullName}</h4>
                <span className="text-[10px] text-gray-400">{new Date(c.createdAt).toLocaleDateString()} da qo'shilgan</span>
              </div>
            </div>

            <div className="space-y-1 text-xs text-gray-600 pt-2 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>{c.phoneNumber}</span>
              </div>
              {c.address && (
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-gray-400" />
                  <span>{c.address}</span>
                </div>
              )}
            </div>

            {c.notes && (
              <div className="p-2 bg-gray-50 rounded text-[11px] text-gray-500 italic">
                {c.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-[#171b25]">Yangi Mijoz Qo'shish</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">F.I.SH *</label>
                <input
                  type="text"
                  required
                  placeholder="Ahmad Yusupov"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Telefon raqam *</label>
                <input
                  type="text"
                  required
                  placeholder="+998901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Manzil</label>
                <input
                  type="text"
                  placeholder="Toshkent sh., Chilonzor"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Izoh</label>
                <textarea
                  rows={2}
                  placeholder="Mijoz haqida qisqacha ma'lumot..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16] resize-none"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { Plus, HardHat, Phone, Search } from 'lucide-react';
import { workersApi } from '../api/services';
import { Worker } from '../types';

export const WorkforcePage: React.FC = () => {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    loadWorkers();
  }, []);

  const loadWorkers = async () => {
    try {
      const data = await workersApi.getAll();
      setWorkers(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await workersApi.create({
        fullName: name,
        phoneNumber: phone,
        specialty: specialty || undefined,
        notes: notes || undefined
      });
      setIsModalOpen(false);
      setName('');
      setPhone('');
      setSpecialty('');
      setNotes('');
      loadWorkers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const filtered = workers.filter(w =>
    w.fullName.toLowerCase().includes(search.toLowerCase()) ||
    (w.specialty && w.specialty.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#171b25]">Jamoa & Ustalar</h2>
          <p className="text-xs text-[#7b8190] mt-0.5 break-words">Obyektda ishlovchi ustalar va mutaxassislar bazasi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs h-[34px] px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi usta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
        <div className="lg:col-span-8 space-y-3.5">
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex items-center gap-2 shadow-xs min-w-0">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="⌕ Usta yoki mutaxassislik qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 text-xs outline-none"
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} ta usta</span>
          </div>

          <div className="bg-white border border-[#e4e7ec] rounded-xl overflow-hidden shadow-xs divide-y divide-gray-100">
            {filtered.map((w) => (
              <div key={w.id} className="p-3.5 flex items-start sm:items-center justify-between gap-3 hover:bg-gray-50/50">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {w.fullName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-gray-900 truncate">{w.fullName}</h4>
                    <span className="text-[10px] text-gray-500">{w.specialty || 'Usta'} · {w.phoneNumber}</span>
                  </div>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f8ee] text-[#159452] flex-shrink-0">
                  Faol
                </span>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">Ustalar mavjud emas</div>
            )}
          </div>
        </div>

        <div className="lg:col-span-4 bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-4">
          <h3 className="font-bold text-xs text-[#171b25]">Jamoa Statistikasi</h3>
          <div className="divide-y divide-gray-100 text-xs">
            <div className="py-2.5 flex justify-between gap-3">
              <span className="text-gray-500">Jami ustalar:</span>
              <b className="text-gray-900">{workers.length}</b>
            </div>
            <div className="py-2.5 flex justify-between gap-3">
              <span className="text-gray-500">Mutaxassisliklar:</span>
              <b className="text-gray-900 text-right break-words">Kafelchi, Suvoqchi, Elektrik, Malyar</b>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-[#171b25]">Yangi Usta Qo'shish</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Usta Ismi *</label>
                <input
                  type="text"
                  required
                  placeholder="Hasan Usta"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Telefon *</label>
                <input
                  type="text"
                  required
                  placeholder="+998901112233"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Mutaxassisligi</label>
                <input
                  type="text"
                  placeholder="Kafelchi, Santexnik, Malyar"
                  value={specialty}
                  onChange={(e) => setSpecialty(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
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

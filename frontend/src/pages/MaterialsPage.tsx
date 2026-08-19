import React, { useEffect, useState } from 'react';
import { Plus, Package, Search } from 'lucide-react';
import { materialsApi } from '../api/services';
import { Material } from '../types';

export const MaterialsPage: React.FC = () => {
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('dona');
  const [desc, setDesc] = useState('');

  useEffect(() => {
    loadMaterials();
  }, []);

  const loadMaterials = async () => {
    try {
      const data = await materialsApi.getAll();
      setMaterials(data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await materialsApi.create({ name, unit, description: desc || undefined });
      setIsModalOpen(false);
      setName('');
      setDesc('');
      loadMaterials();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const filtered = materials.filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[#171b25]">Materiallar Katalogi</h2>
          <p className="text-xs text-[#7b8190] mt-0.5">Qurilish va ta'mirlash materiallari bazasi</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs h-[34px] px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Yangi material</span>
        </button>
      </div>

      <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex items-center gap-2 shadow-xs">
        <Search className="w-3.5 h-3.5 text-gray-400" />
        <input
          type="text"
          placeholder="⌕ Material nomi bo'yicha qidirish..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-xs outline-none"
        />
        <span className="text-xs text-gray-400">{filtered.length} ta material</span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
        {filtered.map((m) => (
          <div key={m.id} className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs">
                <Package className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-gray-900 truncate">{m.name}</h4>
                <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px] font-semibold">
                  Birlik: {m.unit}
                </span>
              </div>
            </div>
            {m.description && <p className="text-[11px] text-gray-500 mt-2">{m.description}</p>}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-[#171b25]">Katalogga Material Qo'shish</h3>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Material Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Ispan kafeli 60x60"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">O'lchov Birligi *</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                >
                  <option value="dona">dona (pcs)</option>
                  <option value="m²">m² (kvadrat metr)</option>
                  <option value="kg">kg (kilogram)</option>
                  <option value="qop">qop (bag)</option>
                  <option value="m³">m³ (kub metr)</option>
                  <option value="metr">metr (m)</option>
                  <option value="litr">litr (L)</option>
                  <option value="komplekt">komplekt (set)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tavsif</label>
                <input
                  type="text"
                  placeholder="Vanna va oshxona uchun"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

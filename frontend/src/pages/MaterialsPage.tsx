import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Package, Search, BarChart3, ChevronDown, ChevronRight, GitMerge, AlertTriangle, X } from 'lucide-react';
import { materialsApi } from '../api/services';
import { Material, MaterialUsage, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { MaterialPicker } from '../components/MaterialPicker';
import { findCatalogMaterial, findDuplicateCandidates, normalizeText } from '../utils/materials';
import { UsdWithUzs } from '../components/Money';
import { formatUzs } from '../utils/money';

type Tab = 'catalog' | 'usage';

const fmtQty = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });

export const MaterialsPage: React.FC = () => {
  const { user } = useAuth();
  const canReport = user?.role !== UserRole.FieldWorker;

  const [tab, setTab] = useState<Tab>('catalog');
  const [materials, setMaterials] = useState<Material[]>([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [unit, setUnit] = useState('dona');
  const [desc, setDesc] = useState('');

  const [usage, setUsage] = useState<MaterialUsage[]>([]);
  const [usageLoading, setUsageLoading] = useState(false);
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [uSearch, setUSearch] = useState('');
  const [uBrand, setUBrand] = useState('');
  const [uProject, setUProject] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const canMerge = user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin;
  const [mergeSource, setMergeSource] = useState<Material | null>(null);
  const [mergeTargetId, setMergeTargetId] = useState('');
  const [merging, setMerging] = useState(false);

  useEffect(() => {
    loadMaterials();
  }, []);

  useEffect(() => {
    if (tab !== 'usage' || !canReport) return;
    setUsageLoading(true);
    materialsApi.getUsage(from, to)
      .then(setUsage)
      .catch((err) => console.error(err))
      .finally(() => setUsageLoading(false));
  }, [tab, from, to, canReport]);

  const loadMaterials = async () => {
    try {
      const data = await materialsApi.getAll();
      setMaterials(data);
    } catch (err) {
      console.error(err);
    }
  };

  const duplicate = findCatalogMaterial(materials, name, brand);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicate) return;
    try {
      await materialsApi.create({ name: name.trim(), brand: brand.trim() || undefined, unit, description: desc || undefined });
      setIsModalOpen(false);
      setName('');
      setBrand('');
      setUnit('dona');
      setDesc('');
      loadMaterials();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const filtered = materials.filter(m =>
    normalizeText(m.name).includes(normalizeText(search)) ||
    (m.brand && normalizeText(m.brand).includes(normalizeText(search)))
  );

  const dupMap = useMemo(() => {
    const map = new Map<string, Material[]>();
    materials.forEach((m) => map.set(m.id, findDuplicateCandidates(materials, m)));
    return map;
  }, [materials]);

  const openMerge = (m: Material) => {
    setMergeSource(m);
    setMergeTargetId(dupMap.get(m.id)?.find((d) => d.unit === m.unit)?.id ?? '');
  };

  const mergeTargets = useMemo(() => {
    if (!mergeSource) return [];
    const similar = new Set((dupMap.get(mergeSource.id) ?? []).map((d) => d.id));
    return materials
      .filter((m) => m.id !== mergeSource.id)
      .sort((a, b) => Number(similar.has(b.id)) - Number(similar.has(a.id)) || a.name.localeCompare(b.name))
      .map((m) => ({ ...m, similar: similar.has(m.id) }));
  }, [mergeSource, materials, dupMap]);

  const mergeTarget = materials.find((m) => m.id === mergeTargetId);
  const unitMismatch = !!mergeSource && !!mergeTarget && normalizeText(mergeSource.unit) !== normalizeText(mergeTarget.unit);

  const handleMerge = async () => {
    if (!mergeSource || !mergeTarget || unitMismatch) return;
    setMerging(true);
    try {
      await materialsApi.merge(mergeSource.id, mergeTarget.id);
      setMergeSource(null);
      setMergeTargetId('');
      await loadMaterials();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    } finally {
      setMerging(false);
    }
  };

  const label = (m: Material) => `${m.name}${m.brand ? ` [${m.brand}]` : ''} · ${m.unit}`;

  const brandOptions = useMemo(
    () => [...new Set(usage.map((u) => u.brand).filter(Boolean) as string[])].sort((a, b) => a.localeCompare(b)),
    [usage],
  );
  const projectOptions = useMemo(() => {
    const m = new Map<string, string>();
    usage.forEach((u) => m.set(u.projectId, u.projectName));
    return [...m.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [usage]);

  const usageFiltered = useMemo(() => {
    const q = normalizeText(uSearch);
    return usage.filter((u) =>
      (!q || normalizeText(u.materialName).includes(q) || normalizeText(u.brand).includes(q) || normalizeText(u.projectName).includes(q)) &&
      (!uBrand || u.brand === uBrand) &&
      (!uProject || u.projectId === uProject),
    );
  }, [usage, uSearch, uBrand, uProject]);

  const groups = useMemo(() => {
    const map = new Map<string, { key: string; name: string; brand?: string; unit: string; qty: number; cost: number; usd: number; count: number; rows: MaterialUsage[] }>();
    for (const u of usageFiltered) {
      const key = `${u.materialId}|${u.brand ?? ''}|${u.unit}`;
      const g = map.get(key) ?? { key, name: u.materialName, brand: u.brand, unit: u.unit, qty: 0, cost: 0, usd: 0, count: 0, rows: [] };
      g.qty += u.totalQuantity;
      g.cost += u.totalCost;
      g.usd += u.totalCostUsd;
      g.count += u.purchaseCount;
      g.rows.push(u);
      map.set(key, g);
    }
    return [...map.values()].sort((a, b) => b.cost - a.cost);
  }, [usageFiltered]);

  const totals = useMemo(() => ({
    cost: usageFiltered.reduce((s, u) => s + u.totalCost, 0),
    usd: usageFiltered.reduce((s, u) => s + u.totalCostUsd, 0),
    projects: new Set(usageFiltered.map((u) => u.projectId)).size,
  }), [usageFiltered]);

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });

  const tabBtn = (t: Tab, label: string, Icon: React.ElementType) => (
    <button
      onClick={() => setTab(t)}
      className={`flex items-center gap-1.5 px-3 h-[30px] rounded-md text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${tab === t ? 'bg-white text-[#171b25] shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );

  return (
    <div className="p-4 sm:p-6 space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-xl font-bold text-[#171b25]">Materiallar</h2>
          <p className="text-xs text-[#7b8190] mt-0.5 break-words">Katalog va qaysi loyihada qaysi brenddagi materialdan qancha ishlatilgani</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {canReport && (
            <div className="bg-gray-100 p-0.5 rounded-lg flex overflow-x-auto scrollbar-none max-w-full">
              {tabBtn('catalog', 'Katalog', Package)}
              {tabBtn('usage', 'Sarf hisoboti', BarChart3)}
            </div>
          )}
          {canReport && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-[#ff7a16] hover:bg-[#e86807] text-white font-semibold text-xs h-[34px] px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi material</span>
            </button>
          )}
        </div>
      </div>

      {tab === 'catalog' && (
        <>
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 flex items-center gap-2 shadow-xs min-w-0">
            <Search className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Material nomi yoki brendi bo'yicha qidirish..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 min-w-0 text-xs outline-none"
            />
            <span className="text-xs text-gray-400 whitespace-nowrap">{filtered.length} ta material</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filtered.map((m) => (
              <div key={m.id} className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 truncate">{m.name}</h4>
                    <div className="flex items-center gap-1.5 mt-1">
                      {m.brand && (
                        <span className="px-1.5 py-0.5 bg-orange-50 text-[#ff7a16] border border-orange-100 rounded text-[9px] font-bold">
                          {m.brand}
                        </span>
                      )}
                      <span className="px-1.5 py-0.5 bg-gray-100 text-gray-700 rounded text-[9px] font-semibold">
                        Birlik: {m.unit}
                      </span>
                    </div>
                  </div>
                </div>
                {m.description && <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-50">{m.description}</p>}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-gray-50">
                  <span className="text-[10px] text-gray-400">{m.purchaseCount ?? 0} ta xarid</span>
                  {(dupMap.get(m.id)?.length ?? 0) > 0 && (
                    <span className="flex items-center gap-1 text-[10px] font-semibold text-amber-600 whitespace-nowrap" title="Nomi/brendi o'xshash material bor">
                      <AlertTriangle className="w-3 h-3" /> O'xshash bor
                    </span>
                  )}
                  {canMerge && materials.length > 1 && (
                    <button
                      onClick={() => openMerge(m)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-blue-600 hover:text-blue-800 min-h-8 whitespace-nowrap"
                    >
                      <GitMerge className="w-3 h-3" /> Birlashtirish
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <div className="col-span-full py-12 text-center text-xs text-gray-400">
                Materiallar topilmadi. "+ Yangi material" tugmasi orqali yangi mahsulot qo'shing.
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'usage' && canReport && (
        <>
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 shadow-xs flex flex-wrap gap-2">
            <div className="flex items-center gap-2 border border-gray-200 rounded-lg px-2.5 h-9 w-full sm:w-56 min-w-0">
              <Search className="w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                placeholder="Material, brend, loyiha..."
                value={uSearch}
                onChange={(e) => setUSearch(e.target.value)}
                className="flex-1 min-w-0 text-xs outline-none"
              />
            </div>
            <select value={uBrand} onChange={(e) => setUBrand(e.target.value)} className="h-9 px-2 border border-gray-200 rounded-lg text-xs bg-white outline-none w-full sm:w-auto">
              <option value="">Barcha brendlar</option>
              {brandOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            <select value={uProject} onChange={(e) => setUProject(e.target.value)} className="h-9 px-2 border border-gray-200 rounded-lg text-xs bg-white outline-none w-full sm:w-auto">
              <option value="">Barcha loyihalar</option>
              {projectOptions.map(([id, n]) => <option key={id} value={id}>{n}</option>)}
            </select>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} title="Dan" className="h-9 px-2 border border-gray-200 rounded-lg text-xs outline-none w-full sm:w-auto" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} title="Gacha" className="h-9 px-2 border border-gray-200 rounded-lg text-xs outline-none w-full sm:w-auto" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Jami material xarajati</div>
              <UsdWithUzs className="text-base sm:text-lg font-bold text-[#ff7a16] mt-1 break-words" usd={totals.usd} uzs={totals.cost} />
            </div>
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Material × brend</div>
              <div className="text-lg font-bold text-[#171b25] mt-1">{groups.length}</div>
            </div>
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
              <div className="text-[10px] font-bold text-gray-500 uppercase">Loyihalar</div>
              <div className="text-lg font-bold text-[#171b25] mt-1">{totals.projects}</div>
            </div>
          </div>

          <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">MATERIAL / LOYIHA</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">BREND</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px] text-right">MIQDOR</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px] text-right">O'RTACHA NARX</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px] text-right">XARIDLAR</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px] text-right">JAMI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {groups.map((g) => {
                  const open = expanded.has(g.key);
                  return (
                    <React.Fragment key={g.key}>
                      <tr className="hover:bg-gray-50/50 cursor-pointer" onClick={() => toggle(g.key)}>
                        <td className="py-2.5 px-3 font-bold text-gray-900">
                          <span className="inline-flex items-center gap-1">
                            {open ? <ChevronDown className="w-3.5 h-3.5 text-gray-400" /> : <ChevronRight className="w-3.5 h-3.5 text-gray-400" />}
                            {g.name}
                            <span className="text-[10px] font-normal text-gray-400 ml-1">({g.rows.length} ta loyiha)</span>
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          {g.brand ? (
                            <span className="px-1.5 py-0.5 bg-orange-50 text-[#ff7a16] border border-orange-100 rounded text-[9px] font-bold">{g.brand}</span>
                          ) : <span className="text-gray-400">-</span>}
                        </td>
                        <td className="py-2.5 px-3 text-right font-semibold">{fmtQty(g.qty)} {g.unit}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{g.qty > 0 ? formatUzs(g.cost / g.qty) : '-'}</td>
                        <td className="py-2.5 px-3 text-right text-gray-600">{g.count}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-[#ff7a16]">
                          <UsdWithUzs className="items-end" usd={g.usd} uzs={g.cost} />
                        </td>
                      </tr>
                      {open && g.rows.map((r) => (
                        <tr key={`${g.key}-${r.projectId}`} className="bg-gray-50/40">
                          <td className="py-2 px-3 pl-9 text-gray-700">{r.projectName}</td>
                          <td className="py-2 px-3 text-[10px] text-gray-400">
                            oxirgi: {new Date(r.lastPurchaseDate).toLocaleDateString('ru-RU')}
                          </td>
                          <td className="py-2 px-3 text-right">{fmtQty(r.totalQuantity)} {r.unit}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{formatUzs(r.averageUnitPrice)}</td>
                          <td className="py-2 px-3 text-right text-gray-600">{r.purchaseCount}</td>
                          <td className="py-2 px-3 text-right font-semibold text-gray-800">
                            <UsdWithUzs className="items-end" usd={r.totalCostUsd} uzs={r.totalCost} />
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                })}
                {groups.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-xs text-gray-400">
                      {usageLoading ? 'Yuklanmoqda...' : "Tanlangan filtr bo'yicha material xaridlari topilmadi"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-[#171b25]">Katalogga Material Qo'shish</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3">
              <MaterialPicker
                materials={materials}
                name={name}
                brand={brand}
                unit={unit}
                onNameChange={setName}
                onBrandChange={setBrand}
                onUnitChange={setUnit}
              />
              {duplicate && (
                <div className="text-[11px] text-red-600 font-semibold">Bu material katalogda allaqachon bor — qayta qo'shish shart emas.</div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1">Tavsif (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Vanna va oshxona uchun"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs text-gray-600">Bekor qilish</button>
                <button
                  type="submit"
                  disabled={!!duplicate}
                  className="px-4 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold hover:bg-[#e86807] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mergeSource && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-[#171b25] flex items-center gap-1.5"><GitMerge className="w-4 h-4" /> Materiallarni birlashtirish</h3>
              <button onClick={() => setMergeSource(null)} className="text-gray-400 hover:text-gray-600 min-w-8 min-h-8 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>
            <div className="text-xs space-y-1">
              <div className="text-gray-500">Noto'g'ri / takroriy material (o'chiriladi):</div>
              <div className="font-semibold text-red-600">{label(mergeSource)} — {mergeSource.purchaseCount ?? 0} ta xarid</div>
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1">Qaysi materialga qo'shilsin (to'g'ri yozilgani)</label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="w-full h-9 px-2 border border-gray-300 rounded-lg text-xs outline-none"
              >
                <option value="">— Tanlang —</option>
                {mergeTargets.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.similar ? '★ ' : ''}{label(m)} ({m.purchaseCount ?? 0} ta xarid)
                  </option>
                ))}
              </select>
              <p className="text-[10px] text-gray-400 mt-1">★ — nomi/brendi o'xshash materiallar</p>
            </div>
            {unitMismatch && (
              <div className="text-[11px] text-red-600 font-semibold">O'lchov birliklari har xil — birlashtirib bo'lmaydi.</div>
            )}
            {mergeTarget && !unitMismatch && (
              <div className="text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
                "{label(mergeSource)}" dagi barcha xaridlar "{label(mergeTarget)}" ga o'tkaziladi va u katalogdan o'chiriladi. Bu amalni qaytarib bo'lmaydi.
              </div>
            )}
            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setMergeSource(null)} className="px-3 py-1.5 border rounded-lg text-xs text-gray-600">Bekor qilish</button>
              <button
                onClick={handleMerge}
                disabled={!mergeTarget || unitMismatch || merging}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {merging ? 'Birlashtirilmoqda...' : 'Birlashtirish'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

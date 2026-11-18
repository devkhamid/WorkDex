import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Package, Search, BarChart3, ChevronDown, ChevronRight, GitMerge, AlertTriangle, X, FileSpreadsheet, Download, Upload, CheckCircle2, Pencil, Tag, Trash2 } from 'lucide-react';
import { materialsApi } from '../api/services';
import { Material, MaterialImportResult, MaterialUsage, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';
import { MaterialPicker } from '../components/MaterialPicker';
import { MATERIAL_CATEGORIES, UNCATEGORIZED, findCatalogMaterial, findDuplicateCandidates, normalizeText } from '../utils/materials';
import { UsdWithUzs } from '../components/Money';
import { formatUzs } from '../utils/money';

type Tab = 'catalog' | 'usage';

const matchesCategory = (c: string | undefined, filter: string) =>
  !filter || (filter === UNCATEGORIZED ? !c : c === filter);

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
  const [category, setCategory] = useState('');
  const [editing, setEditing] = useState<Material | null>(null);
  const [catFilter, setCatFilter] = useState('');
  const [uCategory, setUCategory] = useState('');
  const canEdit = user?.role === UserRole.Admin || user?.role === UserRole.ProjectManager || user?.role === UserRole.Finance;

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

  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<MaterialImportResult | null>(null);
  const [importError, setImportError] = useState('');
  const [templateLoading, setTemplateLoading] = useState(false);

  const canBulkDelete = user?.role === UserRole.Admin || user?.role === UserRole.SuperAdmin;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [bulkMessage, setBulkMessage] = useState<{ ok: string; skipped: string[] } | null>(null);

  const openImport = () => {
    setImportFile(null);
    setImportResult(null);
    setImportError('');
    setImportOpen(true);
  };

  const handleTemplateDownload = async () => {
    setTemplateLoading(true);
    try {
      await materialsApi.downloadImportTemplate();
    } catch {
      setImportError("Shablonni yuklab olishda xatolik yuz berdi");
    } finally {
      setTemplateLoading(false);
    }
  };

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

  const handleImport = async () => {
    if (!importFile) return;
    setImporting(true);
    setImportError('');
    try {
      const result = await materialsApi.importExcel(importFile);
      setImportResult(result);
      setImportFile(null);
      if (result.created > 0) await loadMaterials();
    } catch (err: any) {
      setImportError(err.response?.data?.message || 'Faylni yuklashda xatolik yuz berdi');
    } finally {
      setImporting(false);
    }
  };

  const found = findCatalogMaterial(materials, name, brand);
  const duplicate = found && found.id !== editing?.id ? found : undefined;

  const openCreate = () => {
    setEditing(null);
    setName('');
    setBrand('');
    setUnit('dona');
    setDesc('');
    setCategory(catFilter && catFilter !== UNCATEGORIZED ? catFilter : '');
    setIsModalOpen(true);
  };

  const openEdit = (m: Material) => {
    setEditing(m);
    setName(m.name);
    setBrand(m.brand ?? '');
    setUnit(m.unit);
    setDesc(m.description ?? '');
    setCategory(m.category ?? '');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditing(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (duplicate) return;
    const payload = {
      name: name.trim(),
      brand: brand.trim() || undefined,
      unit,
      category: category || undefined,
      description: desc || undefined,
    };
    try {
      if (editing) await materialsApi.update(editing.id, payload);
      else await materialsApi.create(payload);
      closeModal();
      loadMaterials();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const categoryOptions = useMemo(() => {
    const custom = materials
      .map((m) => m.category)
      .filter((c): c is string => !!c && !MATERIAL_CATEGORIES.includes(c));
    return [...MATERIAL_CATEGORIES, ...[...new Set(custom)].sort((a, b) => a.localeCompare(b))];
  }, [materials]);

  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    materials.forEach((m) => {
      const key = m.category || UNCATEGORIZED;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    });
    return counts;
  }, [materials]);

  const filtered = materials.filter(m =>
    matchesCategory(m.category, catFilter) &&
    (normalizeText(m.name).includes(normalizeText(search)) ||
      (m.brand && normalizeText(m.brand).includes(normalizeText(search))))
  );

  // Katalog yangilanganda o'chib ketgan materiallar tanlovdan chiqariladi.
  useEffect(() => {
    setSelectedIds((prev) => {
      if (prev.size === 0) return prev;
      const alive = new Set(materials.map((m) => m.id));
      return new Set([...prev].filter((x) => alive.has(x)));
    });
  }, [materials]);

  const toggleSelected = (materialId: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(materialId)) next.delete(materialId); else next.add(materialId);
      return next;
    });

  const selectMany = (list: Material[]) =>
    setSelectedIds((prev) => new Set([...prev, ...list.map((m) => m.id)]));

  const unusedFiltered = filtered.filter((m) => (m.purchaseCount ?? 0) === 0);
  const selectedUsed = materials.filter((m) => selectedIds.has(m.id) && (m.purchaseCount ?? 0) > 0).length;

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    const deletable = selectedIds.size - selectedUsed;
    const warning = selectedUsed > 0
      ? `\n\n${selectedUsed} ta material loyiha xaridlarida ishlatilgan — ular o'chirilmaydi (avval loyihadan xaridlarni o'chiring).`
      : '';
    if (!window.confirm(`${deletable} ta material katalogdan butunlay o'chiriladi.${warning}\n\nDavom etasizmi?`)) return;
    setBulkDeleting(true);
    setBulkMessage(null);
    try {
      const result = await materialsApi.bulkDelete([...selectedIds]);
      setBulkMessage({
        ok: `${result.deleted} ta material o'chirildi.`,
        skipped: result.skipped.map((s) => `${s.name} — ${s.purchaseCount} ta xarid`),
      });
      setSelectedIds(new Set());
      await loadMaterials();
    } catch (err: any) {
      alert(err.response?.data?.message || "O'chirishda xatolik yuz berdi");
    } finally {
      setBulkDeleting(false);
    }
  };

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
      (!uProject || u.projectId === uProject) &&
      matchesCategory(u.category, uCategory),
    );
  }, [usage, uSearch, uBrand, uProject, uCategory]);

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
              onClick={openImport}
              className="bg-white hover:bg-gray-50 text-[#171b25] border border-[#e4e7ec] font-semibold text-xs h-[34px] px-3.5 rounded-lg flex items-center gap-1.5 shadow-sm transition-all whitespace-nowrap"
            >
              <FileSpreadsheet className="w-4 h-4 text-green-600" />
              <span>Excel orqali</span>
            </button>
          )}
          {canReport && (
            <button
              onClick={openCreate}
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

          <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {[
              { key: '', label: 'Barchasi', count: materials.length },
              ...categoryOptions
                .filter((c) => categoryCounts.has(c))
                .map((c) => ({ key: c, label: c, count: categoryCounts.get(c) ?? 0 })),
              ...(categoryCounts.has(UNCATEGORIZED)
                ? [{ key: UNCATEGORIZED, label: 'Kategoriyasiz', count: categoryCounts.get(UNCATEGORIZED) ?? 0 }]
                : []),
            ].map((c) => (
              <button
                key={c.key || 'all'}
                onClick={() => setCatFilter(c.key)}
                className={`flex items-center gap-1 h-8 px-3 rounded-full text-[11px] font-semibold border whitespace-nowrap flex-shrink-0 transition-colors ${
                  catFilter === c.key
                    ? 'bg-[#ff7a16] border-[#ff7a16] text-white'
                    : 'bg-white border-[#e4e7ec] text-gray-600 hover:border-gray-300'
                }`}
              >
                {c.label}
                <span className={catFilter === c.key ? 'text-white/80' : 'text-gray-400'}>{c.count}</span>
              </button>
            ))}
          </div>

          {canBulkDelete && materials.length > 0 && (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-2.5 flex flex-wrap items-center gap-2 shadow-xs">
              <button
                type="button"
                onClick={() => selectMany(filtered)}
                disabled={bulkDeleting || filtered.length === 0}
                className="h-8 px-3 border border-[#e4e7ec] rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
              >
                Ko'rinayotganlarni tanlash ({filtered.length})
              </button>
              <button
                type="button"
                onClick={() => selectMany(unusedFiltered)}
                disabled={bulkDeleting || unusedFiltered.length === 0}
                className="h-8 px-3 border border-[#e4e7ec] rounded-lg text-[11px] font-semibold text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                title="Hech bir loyihada xaridi yo'q materiallar"
              >
                Xaridsizlarni tanlash ({unusedFiltered.length})
              </button>
              {selectedIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds(new Set())}
                  disabled={bulkDeleting}
                  className="h-8 px-3 rounded-lg text-[11px] font-semibold text-gray-500 hover:text-gray-800"
                >
                  Tanlovni bekor qilish
                </button>
              )}
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selectedIds.size === 0 || bulkDeleting}
                className="h-8 px-3 ml-auto rounded-lg text-[11px] font-semibold inline-flex items-center gap-1.5 border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {bulkDeleting ? "O'chirilmoqda..." : `Tanlanganlarni o'chirish${selectedIds.size > 0 ? ` (${selectedIds.size})` : ''}`}
              </button>
            </div>
          )}

          {bulkMessage && (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-3 text-[11px] space-y-1.5 shadow-xs">
              <div className="flex items-start justify-between gap-2">
                <span className="flex items-center gap-1.5 font-semibold text-green-700">
                  <CheckCircle2 className="w-4 h-4" /> {bulkMessage.ok}
                </span>
                <button onClick={() => setBulkMessage(null)} className="text-gray-400 hover:text-gray-600" aria-label="Yopish">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              {bulkMessage.skipped.length > 0 && (
                <div className="text-amber-800 bg-amber-50 border border-amber-100 rounded-lg p-2">
                  <div className="font-semibold mb-0.5">
                    {bulkMessage.skipped.length} ta material o'chirilmadi — loyiha xaridlarida ishlatilgan. Avval loyihadan xaridlarni o'chiring:
                  </div>
                  <div className="max-h-28 overflow-y-auto">{bulkMessage.skipped.join(' · ')}</div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
            {filtered.map((m) => (
              <div
                key={m.id}
                className={`bg-white border rounded-xl p-4 shadow-xs space-y-2 ${selectedIds.has(m.id) ? 'border-red-300 ring-1 ring-red-200' : 'border-[#e4e7ec]'}`}
              >
                <div className="flex items-start gap-2.5">
                  {canBulkDelete && (
                    <input
                      type="checkbox"
                      aria-label={`${m.name} — tanlash`}
                      checked={selectedIds.has(m.id)}
                      onChange={() => toggleSelected(m.id)}
                      disabled={bulkDeleting}
                      className="w-4 h-4 mt-2 accent-[#ff7a16] cursor-pointer flex-shrink-0"
                    />
                  )}
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                    <Package className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold text-xs text-gray-900 truncate">{m.name}</h4>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {m.category && (
                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded text-[9px] font-bold inline-flex items-center gap-0.5">
                          <Tag className="w-2.5 h-2.5" />{m.category}
                        </span>
                      )}
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
                  {canEdit && (
                    <button
                      onClick={() => openEdit(m)}
                      className="flex items-center gap-1 text-[10px] font-semibold text-gray-600 hover:text-gray-900 min-h-8 whitespace-nowrap"
                    >
                      <Pencil className="w-3 h-3" /> Tahrirlash
                    </button>
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
            <select value={uCategory} onChange={(e) => setUCategory(e.target.value)} className="h-9 px-2 border border-gray-200 rounded-lg text-xs bg-white outline-none w-full sm:w-auto">
              <option value="">Barcha kategoriyalar</option>
              {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
              <option value={UNCATEGORIZED}>Kategoriyasiz</option>
            </select>
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
              <h3 className="font-bold text-sm text-[#171b25]">{editing ? 'Materialni tahrirlash' : "Katalogga Material Qo'shish"}</h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
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
                <label className="block text-xs font-semibold mb-1">Kategoriya — qaysi ish uchun</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full h-9 px-2 border border-gray-300 rounded-lg text-xs outline-none bg-white"
                >
                  <option value="">— Kategoriyasiz —</option>
                  {categoryOptions.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
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
                <button type="button" onClick={closeModal} className="px-3 py-1.5 border rounded-lg text-xs text-gray-600">Bekor qilish</button>
                <button
                  type="submit"
                  disabled={!!duplicate}
                  className="px-4 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold hover:bg-[#e86807] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editing ? 'Saqlash' : "Qo'shish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {importOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-lg max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center border-b pb-3">
              <h3 className="font-bold text-sm text-[#171b25] flex items-center gap-1.5">
                <FileSpreadsheet className="w-4 h-4 text-green-600" /> Excel orqali material qo'shish
              </h3>
              <button onClick={() => setImportOpen(false)} className="text-gray-400 hover:text-gray-600 min-w-8 min-h-8 inline-flex items-center justify-center"><X className="w-4 h-4" /></button>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#171b25]">1. Shablonni yuklab oling va to'ldiring</div>
              <p className="text-[11px] text-gray-500">
                Har bir qatorga bitta material: <b>Nomi</b>, <b>Brend</b>, <b>O'lchov birligi</b>, <b>Tavsif</b>. Katalogda bor materiallar qayta qo'shilmaydi.
              </p>
              <button
                type="button"
                onClick={handleTemplateDownload}
                disabled={templateLoading}
                className="h-9 px-3 border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {templateLoading ? 'Yuklanmoqda...' : 'Shablonni yuklab olish (.xlsx)'}
              </button>
            </div>

            <div className="space-y-2 border-t pt-3">
              <div className="text-xs font-semibold text-[#171b25]">2. To'ldirilgan faylni yuklang</div>
              <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 hover:border-[#ff7a16] rounded-lg p-4 cursor-pointer text-center transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-600 break-all">
                  {importFile ? importFile.name : 'Excel faylni tanlang (.xlsx, 5 MB gacha)'}
                </span>
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  onChange={(e) => {
                    setImportFile(e.target.files?.[0] ?? null);
                    setImportError('');
                    e.target.value = '';
                  }}
                />
              </label>
            </div>

            {importError && (
              <div className="text-[11px] text-red-600 font-semibold bg-red-50 border border-red-100 rounded-lg p-2">{importError}</div>
            )}

            {importResult && (
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  {importResult.created} ta material qo'shildi
                  <span className="font-normal text-gray-400">(jami {importResult.totalRows} qator)</span>
                </div>
                {importResult.skipped.length > 0 && (
                  <div className="text-[11px] bg-amber-50 border border-amber-100 rounded-lg p-2 space-y-0.5">
                    <div className="font-semibold text-amber-700">O'tkazib yuborildi: {importResult.skipped.length} ta</div>
                    <ul className="max-h-28 overflow-y-auto text-amber-800">
                      {importResult.skipped.map((s) => (
                        <li key={`s-${s.row}`}>{s.row}-qator{s.name ? ` · ${s.name}` : ''} — {s.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {importResult.errors.length > 0 && (
                  <div className="text-[11px] bg-red-50 border border-red-100 rounded-lg p-2 space-y-0.5">
                    <div className="font-semibold text-red-700">Xatolar: {importResult.errors.length} ta (bu qatorlar qo'shilmadi)</div>
                    <ul className="max-h-28 overflow-y-auto text-red-800">
                      {importResult.errors.map((s) => (
                        <li key={`e-${s.row}`}>{s.row}-qator{s.name ? ` · ${s.name}` : ''} — {s.message}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
              <button type="button" onClick={() => setImportOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs text-gray-600">
                {importResult ? 'Yopish' : 'Bekor qilish'}
              </button>
              <button
                onClick={handleImport}
                disabled={!importFile || importing}
                className="px-4 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold hover:bg-[#e86807] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {importing ? 'Yuklanmoqda...' : 'Import qilish'}
              </button>
            </div>
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

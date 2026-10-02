import React, { useEffect, useMemo } from 'react';
import { AlertTriangle, CheckCircle2, PackagePlus } from 'lucide-react';
import { Material } from '../types';
import { Autocomplete, Suggestion } from './Autocomplete';
import { MATERIAL_UNITS, findCatalogMaterial, isSimilar, normalizeText } from '../utils/materials';

interface MaterialPickerProps {
  materials: Material[];
  name: string;
  brand: string;
  unit: string;
  onNameChange: (v: string) => void;
  onBrandChange: (v: string) => void;
  onUnitChange: (v: string) => void;
}

export const MaterialPicker: React.FC<MaterialPickerProps> = ({
  materials, name, brand, unit, onNameChange, onBrandChange, onUnitChange,
}) => {
  const nameKey = normalizeText(name);
  const brandKey = normalizeText(brand);

  const nameSuggestions = useMemo<Suggestion[]>(() => {
    const byName = new Map<string, { value: string; brands: Set<string>; unit: string }>();
    for (const m of materials) {
      const k = normalizeText(m.name);
      const entry = byName.get(k) ?? { value: m.name, brands: new Set<string>(), unit: m.unit };
      if (m.brand) entry.brands.add(normalizeText(m.brand));
      byName.set(k, entry);
    }
    return [...byName.values()].map((e) => ({
      value: e.value,
      hint: e.brands.size > 0 ? `${e.brands.size} ta brend · ${e.unit}` : e.unit,
    }));
  }, [materials]);

  const sameName = useMemo(
    () => (nameKey ? materials.filter((m) => normalizeText(m.name) === nameKey) : []),
    [materials, nameKey],
  );

  const brandSuggestions = useMemo<Suggestion[]>(() => {
    const seen = new Map<string, Suggestion>();
    for (const m of sameName) {
      if (!m.brand) continue;
      seen.set(normalizeText(m.brand), { value: m.brand, hint: 'shu material', priority: 0 });
    }
    for (const m of materials) {
      if (!m.brand) continue;
      const k = normalizeText(m.brand);
      if (!seen.has(k)) seen.set(k, { value: m.brand, priority: 1 });
    }
    return [...seen.values()];
  }, [materials, sameName]);

  const exact = findCatalogMaterial(materials, name, brand);
  const sameNameUnit = sameName[0]?.unit;

  useEffect(() => {
    if (exact) onUnitChange(exact.unit);
    else if (sameNameUnit) onUnitChange(sameNameUnit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [exact?.id, sameNameUnit]);

  const similarNames = useMemo(() => {
    if (!nameKey || sameName.length > 0) return [];
    const out = new Map<string, string>();
    for (const m of materials) {
      const k = normalizeText(m.name);
      if (k !== nameKey && isSimilar(nameKey, k)) out.set(k, m.name);
    }
    return [...out.values()].slice(0, 3);
  }, [materials, nameKey, sameName.length]);

  const similarBrands = useMemo(() => {
    if (!brandKey) return [];
    const all = new Map<string, string>();
    for (const m of materials) if (m.brand) all.set(normalizeText(m.brand), m.brand);
    if (all.has(brandKey)) return [];
    return [...all.entries()].filter(([k]) => isSimilar(brandKey, k)).map(([, v]) => v).slice(0, 3);
  }, [materials, brandKey]);

  return (
    <div className="space-y-2">
      <div>
        <label className="block text-xs font-semibold mb-1">Material nomi *</label>
        <Autocomplete
          required
          value={name}
          onChange={onNameChange}
          suggestions={nameSuggestions}
          placeholder="Masalan: Gipsokarton (alchipan) panel"
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div className="sm:col-span-2">
          <label className="block text-xs font-semibold mb-1">Brend / Ishlab chiqaruvchi</label>
          <Autocomplete
            value={brand}
            onChange={onBrandChange}
            suggestions={brandSuggestions}
            placeholder="Knauf, Kerama Marazzi..."
          />
        </div>
        <div>
          <label className="block text-xs font-semibold mb-1">Birlik *</label>
          <select
            value={unit}
            onChange={(e) => onUnitChange(e.target.value)}
            disabled={!!exact}
            title={exact ? "Katalogdagi material birligi" : undefined}
            className="w-full h-9 px-2 border border-gray-300 rounded-lg text-xs bg-white outline-none disabled:bg-gray-50 disabled:text-gray-500"
          >
            {!MATERIAL_UNITS.includes(unit) && <option value={unit}>{unit}</option>}
            {MATERIAL_UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </div>
      </div>

      {nameKey && (
        exact ? (
          <div className="flex items-start gap-1.5 text-[11px] text-green-700 bg-green-50 border border-green-200 rounded-lg px-2.5 py-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
            <span>Katalogdagi material: <b>{exact.name}</b>{exact.brand ? <> [<b>{exact.brand}</b>]</> : null} ({exact.unit})</span>
          </div>
        ) : (
          <div className="space-y-1">
            {(similarNames.length > 0 || similarBrands.length > 0) && (
              <div className="flex items-start gap-1.5 text-[11px] text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-2.5 py-1.5">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  {similarNames.length > 0 && (
                    <div>
                      O'xshash material bor:{' '}
                      {similarNames.map((n, i) => (
                        <button key={n} type="button" onClick={() => onNameChange(n)} className="font-bold underline">
                          {n}{i < similarNames.length - 1 ? ', ' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  {similarBrands.length > 0 && (
                    <div>
                      O'xshash brend bor:{' '}
                      {similarBrands.map((b, i) => (
                        <button key={b} type="button" onClick={() => onBrandChange(b)} className="font-bold underline">
                          {b}{i < similarBrands.length - 1 ? ', ' : ''}
                        </button>
                      ))}
                    </div>
                  )}
                  <div className="text-yellow-700">Shu bo'lsa — ustiga bosib tanlang.</div>
                </div>
              </div>
            )}
            <div className="flex items-start gap-1.5 text-[11px] text-[#ff7a16] bg-orange-50 border border-orange-200 rounded-lg px-2.5 py-1.5">
              <PackagePlus className="w-3.5 h-3.5 flex-shrink-0" />
              <span>Yangi material sifatida katalogga qo'shiladi</span>
            </div>
          </div>
        )
      )}
    </div>
  );
};

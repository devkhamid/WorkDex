import { Material } from '../types';

export const MATERIAL_UNITS = ['dona', 'm²', 'kg', 'qop', 'm³', 'metr', 'litr', 'komplekt', 'list', 'rulon'];

// Katta-kichik harf, ortiqcha bo'shliq, diakritika (ı/i, ç/c, ş/s...) va apostrof turlarisiz
// solishtirish (serverdagi MaterialService.MatchKey bilan bir xil qoida)
export const normalizeText = (s: string | undefined | null) =>
  (s ?? '')
    .trim()
    .replace(/\s+/g, ' ')
    .toLowerCase()
    .replace(/\u0131/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\u2018\u2019\u02BB\u02BC`]/g, "'");

const levenshtein = (a: string, b: string) => {
  if (a === b) return 0;
  const prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let diag = prev[0];
    prev[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = prev[j];
      prev[j] = Math.min(prev[j] + 1, prev[j - 1] + 1, diag + (a[i - 1] === b[j - 1] ? 0 : 1));
      diag = tmp;
    }
  }
  return prev[b.length];
};

// Yozuv xatosi bilan o'xshash (masalan: "alchipan" ~ "alcipan")
export const isSimilar = (typed: string, candidate: string) => {
  const t = normalizeText(typed);
  const c = normalizeText(candidate);
  if (t.length < 3 || !c) return false;
  const tolerance = t.length >= 6 ? 2 : 1;
  return levenshtein(t, c) <= tolerance || levenshtein(t, c.slice(0, t.length)) <= tolerance;
};

export const findCatalogMaterial = (materials: Material[], name: string, brand: string) => {
  const n = normalizeText(name);
  const b = normalizeText(brand);
  if (!n) return undefined;
  return materials.find((m) => normalizeText(m.name) === n && normalizeText(m.brand) === b);
};

// Ehtimoliy takrorlar: nomi bir xil/o'xshash va brendi bir xil/o'xshash (yoki biri bo'sh)
export const findDuplicateCandidates = (materials: Material[], target: Material) =>
  materials.filter((m) => {
    if (m.id === target.id) return false;
    const nameMatch = isSimilar(target.name, m.name) || isSimilar(m.name, target.name);
    if (!nameMatch) return false;
    if (!m.brand || !target.brand) return true;
    return isSimilar(target.brand, m.brand) || isSimilar(m.brand, target.brand) ||
      normalizeText(target.brand) === normalizeText(m.brand);
  });

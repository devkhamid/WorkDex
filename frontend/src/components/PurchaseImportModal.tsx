import React, { useState } from 'react';
import { AlertTriangle, CheckCircle2, Download, FileSpreadsheet, Upload, X } from 'lucide-react';
import { projectsApi } from '../api/services';
import { MaterialPurchaseImportResult } from '../types';
import { formatMoney, formatUzs } from '../utils/money';
import { UsdWithUzs } from './Money';

const fmtQty = (n: number) => n.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
const fmtDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('ru-RU', { timeZone: 'UTC' });
};

interface Props {
  projectId: string;
  projectName?: string;
  onClose: () => void;
  onImported: () => void;
}

export const PurchaseImportModal: React.FC<Props> = ({ projectId, projectName, onClose, onImported }) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<MaterialPurchaseImportResult | null>(null);
  const [saved, setSaved] = useState<MaterialPurchaseImportResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [templateLoading, setTemplateLoading] = useState(false);
  const [error, setError] = useState('');

  const errorMessage = (err: any, fallback: string) => err?.response?.data?.message || fallback;

  const downloadTemplate = async () => {
    setTemplateLoading(true);
    setError('');
    try {
      await projectsApi.downloadPurchaseImportTemplate(projectId);
    } catch (err) {
      setError(errorMessage(err, 'Shablonni yuklab olishda xatolik yuz berdi'));
    } finally {
      setTemplateLoading(false);
    }
  };

  const checkFile = async (selected: File) => {
    setFile(selected);
    setPreview(null);
    setError('');
    setBusy(true);
    try {
      setPreview(await projectsApi.importPurchases(projectId, selected, true));
    } catch (err) {
      setError(errorMessage(err, 'Faylni tekshirishda xatolik yuz berdi'));
    } finally {
      setBusy(false);
    }
  };

  const confirm = async () => {
    if (!file) return;
    setBusy(true);
    setError('');
    try {
      const result = await projectsApi.importPurchases(projectId, file, false);
      if (result.errors.length > 0) {
        setPreview(result);
        return;
      }
      setSaved(result);
      onImported();
    } catch (err) {
      setError(errorMessage(err, 'Xaridlarni saqlashda xatolik yuz berdi'));
    } finally {
      setBusy(false);
    }
  };

  const reset = () => {
    setFile(null);
    setPreview(null);
    setError('');
  };

  const canConfirm = !!preview && preview.errors.length === 0 && preview.rows.length > 0 && !busy;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-3xl max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
        <div className="flex justify-between items-center border-b pb-3 gap-2">
          <h3 className="font-bold text-sm text-[#171b25] flex items-center gap-1.5 min-w-0">
            <FileSpreadsheet className="w-4 h-4 text-green-600 flex-shrink-0" />
            <span className="truncate">Excel orqali material xaridlari{projectName ? ` — ${projectName}` : ''}</span>
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 min-w-8 min-h-8 inline-flex items-center justify-center flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>

        {saved ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-green-700 bg-green-50 border border-green-100 rounded-lg p-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <span>{saved.created} ta xarid saqlandi — jami {formatUzs(saved.totalCostUzs)}</span>
            </div>
            {saved.newMaterials.length > 0 && (
              <div className="text-[11px] text-gray-600">Katalogga {saved.newMaterials.length} ta yangi material qo'shildi.</div>
            )}
            <div className="flex justify-end pt-2 border-t">
              <button onClick={onClose} className="px-4 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold hover:bg-[#e86807]">Yopish</button>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <div className="text-xs font-semibold text-[#171b25]">1. Shablonni yuklab oling va to'ldiring</div>
              <p className="text-[11px] text-gray-500">
                Shablonda kompaniya katalogi ham bor — material nomini ro'yxatdan tanlasangiz, katalogdagi material ishlatiladi.
                Majburiy ustunlar: <b>Material nomi</b>, <b>Miqdor</b>, <b>Birlik narxi</b>.
              </p>
              <button
                type="button"
                onClick={downloadTemplate}
                disabled={templateLoading}
                className="h-9 px-3 border border-green-200 bg-green-50 text-green-700 hover:bg-green-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {templateLoading ? 'Yuklanmoqda...' : 'Shablonni yuklab olish (.xlsx)'}
              </button>
            </div>

            <div className="space-y-2 border-t pt-3">
              <div className="text-xs font-semibold text-[#171b25]">2. To'ldirilgan faylni yuklang — saqlashdan oldin tekshiriladi</div>
              <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-gray-200 hover:border-[#ff7a16] rounded-lg p-4 cursor-pointer text-center transition-colors">
                <Upload className="w-5 h-5 text-gray-400" />
                <span className="text-xs text-gray-600 break-all">
                  {busy && !preview ? 'Tekshirilmoqda...' : file ? file.name : 'Excel faylni tanlang (.xlsx, 5 MB gacha)'}
                </span>
                <input
                  type="file"
                  accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                  disabled={busy}
                  onChange={(e) => {
                    const selected = e.target.files?.[0];
                    e.target.value = '';
                    if (selected) checkFile(selected);
                  }}
                />
              </label>
            </div>

            {error && (
              <div className="text-[11px] text-red-600 font-semibold bg-red-50 border border-red-100 rounded-lg p-2">{error}</div>
            )}

            {preview && (
              <div className="space-y-3 border-t pt-3">
                {preview.errors.length > 0 ? (
                  <div className="text-[11px] bg-red-50 border border-red-100 rounded-lg p-2 space-y-1">
                    <div className="font-semibold text-red-700">
                      {preview.errors.length} ta qatorda xato bor — faylni tuzatib, qayta yuklang. Hech narsa saqlanmadi.
                    </div>
                    <ul className="max-h-36 overflow-y-auto text-red-800 space-y-0.5">
                      {preview.errors.map((e) => (
                        <li key={e.row}>{e.row}-qator{e.name ? ` · ${e.name}` : ''} — {e.message}</li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="border border-[#e4e7ec] rounded-lg p-2.5">
                      <div className="text-[10px] font-bold text-gray-500 uppercase">Xaridlar</div>
                      <div className="text-base font-bold text-[#171b25]">{preview.rows.length} ta</div>
                    </div>
                    <div className="border border-[#e4e7ec] rounded-lg p-2.5 sm:col-span-2">
                      <div className="text-[10px] font-bold text-gray-500 uppercase">Jami summa</div>
                      <UsdWithUzs className="text-base font-bold text-[#ff7a16]" usd={preview.totalCostUsd} uzs={preview.totalCostUzs} />
                    </div>
                  </div>
                )}

                {preview.newMaterials.length > 0 && (
                  <div className="text-[11px] bg-amber-50 border border-amber-100 rounded-lg p-2 space-y-1">
                    <div className="font-semibold text-amber-700 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      Katalogda yo'q — {preview.newMaterials.length} ta yangi material yaratiladi. Nomi xato yozilmaganini tekshiring:
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {preview.newMaterials.map((m) => (
                        <span key={m} className="px-1.5 py-0.5 bg-white border border-amber-200 rounded text-amber-800">{m}</span>
                      ))}
                    </div>
                  </div>
                )}

                {preview.rows.length > 0 && (
                  <div className="border border-[#e4e7ec] rounded-lg overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="w-full min-w-[620px] text-left text-[11px]">
                      <thead className="sticky top-0 bg-gray-50">
                        <tr className="border-b border-[#e4e7ec]">
                          <th className="py-2 px-2 font-bold text-gray-500 text-[10px]">#</th>
                          <th className="py-2 px-2 font-bold text-gray-500 text-[10px]">MATERIAL</th>
                          <th className="py-2 px-2 font-bold text-gray-500 text-[10px] text-right">MIQDOR</th>
                          <th className="py-2 px-2 font-bold text-gray-500 text-[10px] text-right">NARX</th>
                          <th className="py-2 px-2 font-bold text-gray-500 text-[10px] text-right">JAMI</th>
                          <th className="py-2 px-2 font-bold text-gray-500 text-[10px]">SANA</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.rows.map((r) => (
                          <tr key={r.row}>
                            <td className="py-1.5 px-2 text-gray-400">{r.row}</td>
                            <td className="py-1.5 px-2 font-semibold text-gray-800">
                              {r.materialName}
                              {r.brand && <span className="ml-1 text-[#ff7a16] font-bold text-[10px]">{r.brand}</span>}
                              {r.isNewMaterial && <span className="ml-1 px-1 bg-amber-50 text-amber-700 border border-amber-100 rounded text-[9px] font-bold">yangi</span>}
                            </td>
                            <td className="py-1.5 px-2 text-right whitespace-nowrap">{fmtQty(r.quantity)} {r.unit}</td>
                            <td className="py-1.5 px-2 text-right whitespace-nowrap text-gray-600">{formatMoney(r.unitPrice, r.currency)}</td>
                            <td className="py-1.5 px-2 text-right whitespace-nowrap font-semibold">{formatUzs(r.totalCostUzs)}</td>
                            <td className="py-1.5 px-2 whitespace-nowrap text-gray-600">{fmtDate(r.purchaseDate)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {preview.rows.some((r) => r.currency === 'USD') && (
                  <p className="text-[10px] text-gray-400">USD narxlar joriy kurs bo'yicha so'mga o'giriladi: 1 USD = {formatUzs(preview.exchangeRate)}</p>
                )}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2 pt-2 border-t">
              {preview ? (
                <button type="button" onClick={reset} disabled={busy} className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 disabled:opacity-50">Boshqa fayl</button>
              ) : (
                <button type="button" onClick={onClose} className="px-3 py-1.5 border rounded-lg text-xs text-gray-600">Bekor qilish</button>
              )}
              <button
                onClick={confirm}
                disabled={!canConfirm}
                className="px-4 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold hover:bg-[#e86807] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {busy && preview ? 'Saqlanmoqda...' : preview && preview.rows.length > 0 ? `Tasdiqlash va saqlash (${preview.rows.length} ta)` : 'Tasdiqlash va saqlash'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

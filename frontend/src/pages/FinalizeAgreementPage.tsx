import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, DollarSign, Calendar, Users, Rocket, FolderPen } from 'lucide-react';
import { agreementsApi } from '../api/services';
import { UsdWithUzs } from '../components/Money';
import { useCbuRate } from '../utils/money';
import { uploadAgreementPdfToProject } from '../utils/agreementPdf';

export const FinalizeAgreementPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [agreement, setAgreement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const cbuRate = useCbuRate();
  const [deadline, setDeadline] = useState('');
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManagers, setSelectedManagers] = useState<string[]>([]);
  const [projectName, setProjectName] = useState('');
  const [nameError, setNameError] = useState('');
  const [pdfStep, setPdfStep] = useState(false);

  useEffect(() => {
    if (id) loadData();
  }, [id]);

  const loadData = async () => {
    try {
      setLoading(true);
      const a = await agreementsApi.getById(id!);
      setAgreement(a);
      const { apiClient } = await import('../api/client');
      const usersRes = await apiClient.get('/users');
      setManagers(
        usersRes.data.filter(
          (u: any) => u.roleName === 'ProjectManager' || u.roleName === 'Admin'
        )
      );
    } catch (err) {
      alert('Shartnoma topilmadi');
      navigate('/agreements');
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    const name = projectName.trim();
    if (!name) {
      setNameError('Loyiha nomini kiriting.');
      return;
    }
    let finalized: any;
    try {
      setSaving(true);
      finalized = await agreementsApi.finalize(id!, {
        projectName: name,
        deadline: deadline ? new Date(deadline).toISOString() : null,
        managerIds: selectedManagers,
      });
    } catch (err: any) {
      alert(err?.response?.data?.message || 'Xatolik yuz berdi');
      setSaving(false);
      return;
    }

    let pdfOk = false;
    if (finalized?.projectId) {
      setPdfStep(true);
      try {
        await uploadAgreementPdfToProject(finalized.projectId, finalized);
        pdfOk = true;
      } catch (err) {
        console.error('Shartnoma PDF yuklanmadi', err);
      }
    }
    setSaving(false);
    setPdfStep(false);

    alert(
      pdfOk
        ? 'Loyiha muvaffaqiyatli yaratildi! Shartnoma PDF i loyiha hujjatlariga qo\'shildi.'
        : 'Loyiha yaratildi, lekin shartnoma PDF ini qo\'shib bo\'lmadi. Uni loyihaning "Hujjatlar" bo\'limidan qo\'shishingiz mumkin.'
    );
    navigate(finalized?.projectId ? `/projects/${finalized.projectId}` : '/agreements');
  };

  if (loading)
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#7c3aed] border-t-transparent rounded-full animate-spin" />
      </div>
    );

  const fmt = (n: number) => new Intl.NumberFormat('uz-UZ').format(n);

  return (
    <div className="flex-1 overflow-auto bg-[#f8f9fb] flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => navigate('/agreements')}
            className="p-2 rounded hover:bg-gray-100 flex-shrink-0"
          >
            <ArrowLeft className="w-4 h-4 text-gray-500" />
          </button>
          <div className="min-w-0">
            <h2 className="font-bold text-[#171b25]">Loyihani sozlashni yakunlash</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Menejerlarni tayinlash va muddatni belgilash orqali loyihani sozlashni yakunlang.
            </p>
          </div>
        </div>

        {agreement && (
          <div className="bg-purple-50 rounded-lg p-3 mb-4">
            <div className="text-[10px] font-semibold uppercase tracking-wide text-purple-400">Shartnomadagi ob'ekt</div>
            <div className="text-xs font-semibold text-purple-700 break-words">{agreement.projectName}</div>
            <div className="text-xs text-purple-500 mt-0.5 break-words">
              {agreement.customerFullName} • {fmt(agreement.totalAmountUZS)} UZS
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
            <FolderPen className="w-3.5 h-3.5" /> Loyiha nomi (WorkDex uchun) <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            autoFocus
            maxLength={300}
            value={projectName}
            onChange={e => {
              setProjectName(e.target.value);
              if (nameError) setNameError('');
            }}
            placeholder="Masalan: Newport G-6-38"
            className={`w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7c3aed] ${nameError ? 'border-red-400' : 'border-gray-200'}`}
          />
          {nameError ? (
            <div className="text-[10px] text-red-600 mt-1">{nameError}</div>
          ) : (
            <div className="text-[10px] text-gray-400 mt-1">Bu nom faqat WorkDex ichida ko'rinadi, shartnoma matniga ta'sir qilmaydi.</div>
          )}
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
            <Calendar className="w-3.5 h-3.5" /> Muddatni tanlang
          </label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-[#7c3aed]"
          />
        </div>

        <div className="mb-4">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
            <DollarSign className="w-3.5 h-3.5" /> Valyuta kursi (UZS → USD)
          </label>
          <div className="w-full border border-gray-100 bg-gray-50 rounded-lg px-3 py-2 text-sm text-gray-700">
            {cbuRate > 0 ? `1 USD = ${fmt(cbuRate)} so'm (Markaziy bank)` : 'Kurs yuklanmoqda...'}
          </div>
          {cbuRate > 0 && agreement && (
            <div className="text-xs text-gray-500 mt-1 break-words">
              Shartnoma: <UsdWithUzs inline className="font-semibold text-gray-700" uzs={agreement.totalAmountUZS} />
            </div>
          )}
        </div>

        <div className="mb-5">
          <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 mb-1">
            <Users className="w-3.5 h-3.5" /> Menejerlarni tayinlash
          </label>
          <div className="border border-gray-200 rounded-lg max-h-40 overflow-y-auto">
            {managers.length === 0 ? (
              <div className="p-3 text-xs text-gray-400 text-center">Menejerlar topilmadi</div>
            ) : (
              managers.map(m => (
                <label
                  key={m.id}
                  className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer min-w-0"
                >
                  <input
                    type="checkbox"
                    checked={selectedManagers.includes(m.id)}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedManagers(prev => [...prev, m.id]);
                      } else {
                        setSelectedManagers(prev => prev.filter(mid => mid !== m.id));
                      }
                    }}
                    className="w-3.5 h-3.5"
                  />
                  <div className="min-w-0">
                    <div className="text-xs font-medium text-gray-700 truncate">{m.fullName}</div>
                    <div className="text-[10px] text-gray-400">{m.roleName}</div>
                  </div>
                </label>
              ))
            )}
          </div>
          <div className="text-[10px] text-gray-400 mt-1">Bir nechta menejer tanlash mumkin</div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => navigate('/agreements')}
            className="flex-1 border border-gray-200 text-gray-600 py-2 rounded-lg text-sm font-semibold hover:bg-gray-50"
          >
            Bekor qilish
          </button>
          <button
            onClick={handleFinalize}
            disabled={saving || !projectName.trim()}
            className="flex-1 flex items-center justify-center gap-2 bg-[#7c3aed] text-white py-2 rounded-lg text-sm font-semibold hover:bg-[#6d28d9] disabled:opacity-50"
          >
            <Rocket className="w-4 h-4" />
            {saving ? (pdfStep ? 'PDF tayyorlanmoqda...' : 'Yaratilmoqda...') : 'Loyiha yaratish'}
          </button>
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  DollarSign,
  CheckCircle2,
  Plus,
  FileSpreadsheet,
  Camera,
  FileText,
  UserPlus,
  Clock,
  HardHat,
  Upload,
  Trash2,
  Pencil
} from 'lucide-react';
import { projectsApi, reportsApi, materialsApi, workersApi, agreementsApi } from '../api/services';
import { uploadAgreementPdfToProject, isAgreementPdfDoc } from '../utils/agreementPdf';
import { MoneyInput, UsdWithUzs } from '../components/Money';
import { MaterialPicker } from '../components/MaterialPicker';
import { RenameProjectModal } from '../components/RenameProjectModal';
import { AiAnalysisPanel } from '../components/AiAnalysisPanel';
import { useAuth } from '../context/AuthContext';
import { formatUsd, formatUzs, useCbuRate } from '../utils/money';
import { apiClient, getFileUrl } from '../api/client';
import {
  Project,
  ProjectSummary,
  ProjectTask,
  Payment,
  Expense,
  MaterialPurchase,
  MaterialSummary,
  WorkerPayment,
  WorkerSummary,
  ExtraWork,
  ProjectPhoto,
  ProjectDocument,
  ProjectStage,
  Material,
  Worker,
  Currency,
  UserRole
} from '../types';

export const formatDateUz = (dateStr?: string | Date | null) => {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
};

export const expenseCategoryLabels: Record<number, string> = {
  1: 'Mehnat va Usta (Labor)',
  2: 'Material (Material)',
  3: 'Transport (Transport)',
  4: 'Yoqilg\'i (Fuel)',
  5: 'Subpudrat (Subcontractor)',
  6: 'Qo\'shimcha (Extra)',
  7: 'Boshqa (Other)',
  8: 'Tozalash ishlari',
  9: 'Yuklarni tashish / Ko\'tarish (Gipskarton va b.)',
  10: 'Qo\'shimcha mayda ishlar',
  11: 'Elektr (svet to\'lovi)',
  12: 'Internet',
  13: 'Ijara',
  14: 'Ofis jihozlari',
  15: 'Suv to\'lovi',
  16: 'Gaz to\'lovi',
  17: 'Umumiy kommunal xarajatlar'
};

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [project, setProject] = useState<Project | null>(null);
  const [isRenameOpen, setIsRenameOpen] = useState(false);
  const { user } = useAuth();
  const canRename = user?.role === UserRole.SuperAdmin || user?.role === UserRole.Admin || user?.role === UserRole.ProjectManager;
  const canAttachAgreementPdf = canRename || user?.role === UserRole.Finance;
  const canUseAi = canAttachAgreementPdf;
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'tasks' | 'materials' | 'workers' | 'expenses' | 'extraworks' | 'photos' | 'documents' | 'ai'>('overview');
  const [loading, setLoading] = useState(true);

  // Tab Data States
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [stages, setStages] = useState<ProjectStage[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<MaterialPurchase[]>([]);
  const [materialsSummary, setMaterialsSummary] = useState<MaterialSummary[]>([]);
  const [workerPayments, setWorkerPayments] = useState<WorkerPayment[]>([]);
  const [workersSummary, setWorkersSummary] = useState<WorkerSummary[]>([]);
  const [extraWorks, setExtraWorks] = useState<ExtraWork[]>([]);
  const [photos, setPhotos] = useState<ProjectPhoto[]>([]);
  const [documents, setDocuments] = useState<ProjectDocument[]>([]);

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isPurchaseModalOpen, setIsPurchaseModalOpen] = useState(false);
  const [isWorkerModalOpen, setIsWorkerModalOpen] = useState(false);
  const [isExtraWorkModalOpen, setIsExtraWorkModalOpen] = useState(false);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  // Catalogs
  const [catalogMaterials, setCatalogMaterials] = useState<Material[]>([]);
  const [catalogWorkers, setCatalogWorkers] = useState<Worker[]>([]);

  // Task Form State
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskWeight, setNewTaskWeight] = useState(1);
  const [newTaskStageId, setNewTaskStageId] = useState('');

  // Payment Form State
  const [newPayAmount, setNewPayAmount] = useState<number | ''>('');
  const [newPayCurrency, setNewPayCurrency] = useState<Currency>('USD');
  const [newPayMethod, setNewPayMethod] = useState(1);
  const [newPayNotes, setNewPayNotes] = useState('');

  // Expense Form State
  const [newExpCategory, setNewExpCategory] = useState(9); // Default: Yuklarni tashish / Ko'tarish
  const [newExpAmount, setNewExpAmount] = useState<number | ''>('');
  const [newExpCurrency, setNewExpCurrency] = useState<Currency>('UZS');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Purchase Form State
  const [newPurMatName, setNewPurMatName] = useState('');
  const [newPurMatBrand, setNewPurMatBrand] = useState('');
  const [newPurMatUnit, setNewPurMatUnit] = useState('dona');
  const [newPurQty, setNewPurQty] = useState<number | ''>('');
  const [newPurPrice, setNewPurPrice] = useState<number | ''>('');
  const [newPurCurrency, setNewPurCurrency] = useState<Currency>('UZS');
  const [newPurSupplier, setNewPurSupplier] = useState('');

  // Worker Payment Form State
  const [isNewWorker, setIsNewWorker] = useState(false);
  const [newWorkerFullName, setNewWorkerFullName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerSpecialty, setNewWorkerSpecialty] = useState('');
  const [newWorkId, setNewWorkId] = useState('');
  const [newWorkDesc, setNewWorkDesc] = useState('');
  const [newWorkAgreed, setNewWorkAgreed] = useState<number | ''>('');
  const [newWorkCurrency, setNewWorkCurrency] = useState<Currency>('UZS');

  // Pay Worker Modal State
  const [isPayWorkerModalOpen, setIsPayWorkerModalOpen] = useState(false);
  const [selectedWorkerForPay, setSelectedWorkerForPay] = useState<WorkerPayment | null>(null);
  const [payWorkerAmount, setPayWorkerAmount] = useState<number | ''>('');
  const [payWorkerCurrency, setPayWorkerCurrency] = useState<Currency>('UZS');
  const [payWorkerDate, setPayWorkerDate] = useState(new Date().toISOString().split('T')[0]);
  const [payWorkerNotes, setPayWorkerNotes] = useState('');

  // Document Upload State
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [docUploadMode, setDocUploadMode] = useState<'file' | 'url'>('file');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const [isAttachingAgreementPdf, setIsAttachingAgreementPdf] = useState(false);

  // Update Work Amount (Hakediş) Modal State
  const [isWorkAmountModalOpen, setIsWorkAmountModalOpen] = useState(false);
  const [selectedWorkerForWorkAmount, setSelectedWorkerForWorkAmount] = useState<WorkerPayment | null>(null);
  const [workAmountInput, setWorkAmountInput] = useState<number | ''>('');
  const [workAmountCurrency, setWorkAmountCurrency] = useState<Currency>('UZS');
  const [workAmountNotes, setWorkAmountNotes] = useState('');

  // Extra Work Form State
  const [newExtraTitle, setNewExtraTitle] = useState('');
  const [newExtraCustAmt, setNewExtraCustAmt] = useState<number | ''>('');
  const [newExtraCost, setNewExtraCost] = useState<number | ''>('');
  const [newExtraCurrency, setNewExtraCurrency] = useState<Currency>('USD');

  // Photo Form State
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoVisible, setNewPhotoVisible] = useState(true);

  const cbuRate = useCbuRate();

  const exceedsUzsLimit = (amount: number, currency: Currency, limitUzs: number) =>
    currency === 'USD' ? cbuRate > 0 && amount > limitUzs / cbuRate + 0.01 : amount > limitUzs;
  const payRemaining = selectedWorkerForPay ? selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount : 0;
  const payExceeds = !!selectedWorkerForPay && exceedsUzsLimit(Number(payWorkerAmount) || 0, payWorkerCurrency, payRemaining);
  const workAmountExceeds = !!selectedWorkerForWorkAmount &&
    exceedsUzsLimit(Number(workAmountInput) || 0, workAmountCurrency, selectedWorkerForWorkAmount.agreedAmount);

  const handleOpenExpenseModal = () => {
    setNewExpCurrency('UZS');
    setNewExpAmount('');
    setNewExpDesc('');
    setNewExpDate(new Date().toISOString().split('T')[0]);
    setIsExpenseModalOpen(true);
  };

  const handleOpenPurchaseModal = () => {
    setNewPurMatName('');
    setNewPurMatBrand('');
    setNewPurMatUnit('dona');
    setNewPurCurrency('UZS');
    setNewPurPrice('');
    setNewPurQty(1);
    setNewPurSupplier('');
    setIsPurchaseModalOpen(true);
  };

  const handleOpenWorkerModal = () => {
    setNewWorkCurrency('UZS');
    setNewWorkAgreed('');
    setNewWorkDesc('');
    setIsWorkerModalOpen(true);
  };

  useEffect(() => {
    if (id) {
      loadAllData(id);
    }
  }, [id]);

  const loadAllData = async (projId: string) => {
    setLoading(true);
    try {
      const [
        p,
        s,
        t,
        stg,
        pay,
        exp,
        pur,
        mSum,
        wp,
        wSum,
        ew,
        ph,
        doc,
        cMat,
        cWork
      ] = await Promise.all([
        projectsApi.getById(projId),
        projectsApi.getSummary(projId),
        projectsApi.getTasks(projId),
        projectsApi.getStages(projId),
        projectsApi.getPayments(projId),
        projectsApi.getExpenses(projId),
        projectsApi.getPurchases(projId),
        projectsApi.getMaterialsSummary(projId),
        projectsApi.getWorkerPayments(projId),
        projectsApi.getWorkersSummary(projId),
        projectsApi.getExtraWorks(projId),
        projectsApi.getPhotos(projId),
        projectsApi.getDocuments(projId),
        materialsApi.getAll(),
        workersApi.getAll()
      ]);

      setProject(p);
      setSummary(s);
      setTasks(t);
      setStages(stg);
      setPayments(pay);
      setExpenses(exp);
      setPurchases(pur);
      setMaterialsSummary(mSum);
      setWorkerPayments(wp);
      setWorkersSummary(wSum);
      setExtraWorks(ew);
      setPhotos(ph);
      setDocuments(doc);
      setCatalogMaterials(cMat);
      setCatalogWorkers(cWork);

      if (cWork.length > 0) setNewWorkId(cWork[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleTask = async (taskId: string) => {
    if (!id) return;
    try {
      await projectsApi.toggleTaskComplete(id, taskId);
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await projectsApi.createTask(id, {
        title: newTaskTitle,
        weight: Number(newTaskWeight) || 1,
        stageId: newTaskStageId || undefined,
      });
      setIsTaskModalOpen(false);
      setNewTaskTitle('');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleCreatePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await projectsApi.createPayment(id, {
        amount: Number(newPayAmount) || 0,
        currency: newPayCurrency,
        paymentMethod: newPayMethod,
        paymentDate: new Date().toISOString(),
        notes: newPayNotes || undefined
      });
      setIsPaymentModalOpen(false);
      setNewPayAmount('');
      setNewPayNotes('');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const amountVal = Number(newExpAmount);

    if (!amountVal || amountVal <= 0) {
      alert("Summa 0 dan katta bo'lishi kerak.");
      return;
    }

    try {
      await projectsApi.createExpense(id, {
        category: newExpCategory,
        amount: amountVal,
        currency: newExpCurrency,
        description: newExpDesc.trim(),
        expenseDate: new Date(newExpDate).toISOString(),
      });
      setIsExpenseModalOpen(false);
      setNewExpAmount('');
      setNewExpCurrency('UZS');
      setNewExpDesc('');
      setNewExpDate(new Date().toISOString().split('T')[0]);
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const unitPriceVal = Number(newPurPrice);

    if (!unitPriceVal || unitPriceVal <= 0) {
      alert("Narx 0 dan katta bo'lishi kerak.");
      return;
    }

    try {
      // Server katalogdan nom+brend bo'yicha topadi, bo'lmasa yangi material yaratadi
      await projectsApi.createPurchase(id, {
        materialName: newPurMatName.trim(),
        brand: newPurMatBrand.trim() || undefined,
        unit: newPurMatUnit,
        quantity: Number(newPurQty) || 0,
        unitPrice: unitPriceVal,
        currency: newPurCurrency,
        supplier: newPurSupplier || undefined,
        purchaseDate: new Date().toISOString()
      });
      setIsPurchaseModalOpen(false);
      setNewPurMatName('');
      setNewPurMatBrand('');
      setNewPurQty('');
      setNewPurPrice('');
      setNewPurCurrency('UZS');
      setNewPurSupplier('');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleCreateWorkerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    const agreedVal = Number(newWorkAgreed);

    if (!Number.isFinite(agreedVal) || agreedVal <= 0) {
      alert("Kelishilgan summa 0 dan katta bo'lishi kerak.");
      return;
    }

    try {
      let finalWorkerId = newWorkId;

      if (isNewWorker) {
        const createdWorker = await workersApi.create({
          fullName: newWorkerFullName,
          phoneNumber: newWorkerPhone,
          specialty: newWorkerSpecialty || undefined
        });
        finalWorkerId = createdWorker.id;
      }

      await projectsApi.createWorkerPayment(id, {
        workerId: finalWorkerId,
        jobDescription: newWorkDesc,
        agreedAmount: agreedVal,
        currency: newWorkCurrency,
      });
      setIsWorkerModalOpen(false);
      setIsNewWorker(false);
      setNewWorkerFullName('');
      setNewWorkerPhone('');
      setNewWorkDesc('');
      setNewWorkAgreed('');
      setNewWorkCurrency('UZS');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const openPayWorkerModal = (wp: WorkerPayment) => {
    setSelectedWorkerForPay(wp);
    const maxAllowed = Math.max(0, wp.remainingAllowedToPay ?? wp.agreedAmount - wp.paidAmount);
    setPayWorkerCurrency('UZS');
    setPayWorkerAmount(maxAllowed > 0 ? maxAllowed : '');
    setPayWorkerDate(new Date().toISOString().split('T')[0]);
    setPayWorkerNotes('');
    setIsPayWorkerModalOpen(true);
  };

  const submitPayWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedWorkerForPay) return;
    const amountVal = Number(payWorkerAmount);

    if (!amountVal || amountVal <= 0) {
      alert("Iltimos, to'g'ri to'lov summasini kiriting.");
      return;
    }

    const maxAllowed = selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount;
    const isUsd = payWorkerCurrency === 'USD';
    // USD kiritilganda 1 sentlik yaxlitlash farqiga ruxsat (server qoldiqqa tenglashtiradi)
    const exceeds = isUsd
      ? cbuRate > 0 && amountVal > maxAllowed / cbuRate + 0.01
      : amountVal > maxAllowed;

    if (exceeds) {
      alert(`⚠️ Ustaga faqat ${formatUzs(maxAllowed)}${cbuRate > 0 ? ` (≈ ${formatUsd(maxAllowed / cbuRate)})` : ''} to'lash mumkin. Kiritilgan summa kelishilgan umumiy summadan (${formatUzs(selectedWorkerForPay.agreedAmount)}) oshib ketmoqda.`);
      return;
    }

    try {
      await projectsApi.payWorker(id, selectedWorkerForPay.id, {
        amount: amountVal,
        currency: payWorkerCurrency,
        paymentDate: new Date(payWorkerDate).toISOString(),
        notes: payWorkerNotes || undefined
      });
      setIsPayWorkerModalOpen(false);
      setSelectedWorkerForPay(null);
      setPayWorkerAmount('');
      setPayWorkerCurrency('UZS');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const openWorkAmountModal = (wp: WorkerPayment) => {
    setSelectedWorkerForWorkAmount(wp);
    setWorkAmountInput(wp.workAmount || '');
    setWorkAmountCurrency('UZS');
    setWorkAmountNotes('');
    setIsWorkAmountModalOpen(true);
  };

  const submitWorkAmount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedWorkerForWorkAmount) return;
    const workAmt = Number(workAmountInput);

    if (workAmt < 0) {
      alert("Ishlangan haq manfiy bo'lishi mumkin emas.");
      return;
    }

    const agreed = selectedWorkerForWorkAmount.agreedAmount;
    const workExceeds = workAmountCurrency === 'USD'
      ? cbuRate > 0 && workAmt > agreed / cbuRate + 0.01
      : workAmt > agreed;
    if (workExceeds) {
      alert(`⚠️ Ishlangan haq kelishilgan umumiy summadan (${formatUzs(agreed)}) ko'p bo'lishi mumkin emas.`);
      return;
    }

    try {
      await projectsApi.updateWorkAmount(id, selectedWorkerForWorkAmount.id, workAmt, workAmountCurrency, workAmountNotes || undefined);
      setIsWorkAmountModalOpen(false);
      setSelectedWorkerForWorkAmount(null);
      setWorkAmountInput('');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const handleCreateExtraWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await projectsApi.createExtraWork(id, {
        title: newExtraTitle,
        customerAmount: Number(newExtraCustAmt) || 0,
        actualCost: Number(newExtraCost) || 0,
        currency: newExtraCurrency,
        isApprovedByCustomer: true,
      });
      setIsExtraWorkModalOpen(false);
      setNewExtraTitle('');
      setNewExtraCustAmt('');
      setNewExtraCost('');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleToggleExtraWork = async (ewId: string) => {
    if (!id) return;
    try {
      await projectsApi.toggleExtraWorkApproval(id, ewId);
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleCreatePhoto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      await projectsApi.createPhoto(id, {
        photoUrl: newPhotoUrl,
        caption: newPhotoCaption || undefined,
        isVisibleToCustomer: newPhotoVisible,
        photoDate: new Date().toISOString()
      });
      setIsPhotoModalOpen(false);
      setNewPhotoUrl('');
      setNewPhotoCaption('');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  if (loading || !project) {
    return <div className="p-4 sm:p-8 text-center text-xs text-gray-500">Loyiha yuklanmoqda...</div>;
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 bg-white min-w-0">
      {/* Detail Head */}
      <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="border border-[#e4e7ec] bg-white hover:bg-gray-50 rounded-lg h-[34px] px-3 text-xs text-gray-700 font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Loyihalar</span>
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h2 className="text-xl font-bold text-[#171b25] truncate">{project.name}</h2>
            {canRename && (
              <button
                type="button"
                title="Nomini o'zgartirish"
                aria-label="Nomini o'zgartirish"
                onClick={() => setIsRenameOpen(true)}
                className="shrink-0 p-1.5 rounded-md text-gray-400 hover:text-[#ff7a16] hover:bg-orange-50 transition-colors"
              >
                <Pencil className="w-4 h-4" />
              </button>
            )}
          </div>
          <p className="text-xs text-[#7b8190] mt-0.5">
            {project.customerName} · {project.location || 'Toshkent'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
          {/* Excel Export Button */}
          <button
            onClick={() => reportsApi.downloadProjectExcel(project.id)}
            className="border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 rounded-lg h-[34px] px-3 text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>9 Varaqli Excel</span>
          </button>
        </div>
      </div>

      {/* Detail Navigation Tabs */}
      <div className="flex gap-1.5 overflow-x-auto scrollbar-none pb-1 border-b border-[#e4e7ec]">
        {[
          { id: 'overview', label: 'Umumiy ko‘rinish' },
          { id: 'finance', label: 'Moliya & To\'lovlar' },
          { id: 'tasks', label: 'Vazifalar' },
          { id: 'materials', label: 'Materiallar' },
          { id: 'workers', label: 'Ustalar & Ish haqi' },
          { id: 'expenses', label: 'Qo\'shimcha xarajatlar' },
          { id: 'extraworks', label: 'Qo\'shimcha ishlar' },
          { id: 'photos', label: 'Fotosuratlar' },
          { id: 'documents', label: 'Hujjatlar' },
          ...(canUseAi ? [{ id: 'ai', label: '✨ AI tahlil' }] : []),
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`border rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap flex-shrink-0 transition-colors ${
              activeTab === tab.id
                ? 'bg-[#eef5ff] text-[#2563c7] border-[#cfe0fb]'
                : 'bg-white text-[#6c7380] border-[#e4e7ec] hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4 Finance Cards — asosiy USD, ostida so'm */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">SHARTNOMA</small>
          <UsdWithUzs
            className="text-lg sm:text-xl font-extrabold text-[#171b25] mt-1.5 break-all"
            uzsClassName="text-[11px] mt-0.5"
            usd={summary?.contractAmount ?? project.contractAmount}
            uzs={summary?.contractAmountUzs ?? project.contractAmountUzs}
          />
          {project.exchangeRate ? (
            <span className="block text-[10px] text-gray-400">Shartnoma kursi: {project.exchangeRate.toLocaleString('ru-RU')}</span>
          ) : null}
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">OLINGAN TO'LOV</small>
          <UsdWithUzs
            className="text-lg sm:text-xl font-extrabold text-[#21bd68] mt-1.5 break-all"
            uzsClassName="text-[11px] mt-0.5"
            usd={summary?.totalPaid ?? 0}
            uzs={summary?.totalPaidUzs}
          />
        </div>

        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">QOLGAN TO'LOV (QARZ)</small>
          <UsdWithUzs
            className="text-lg sm:text-xl font-extrabold text-[#ff7a16] mt-1.5 break-all"
            uzsClassName="text-[11px] mt-0.5"
            usd={summary?.remainingPayment ?? project.contractAmount}
            uzs={summary?.remainingPaymentUzs}
          />
        </div>

        {(() => {
          const netUsd = summary?.netBalance ?? ((summary?.totalPaid ?? 0) - (summary?.totalExpenses ?? 0));
          const netUzs = summary?.netBalanceUzs;
          const isNegative = netUsd < 0;
          return (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">NET BALANS (QO'LDAGI SUMMA)</small>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isNegative ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {isNegative ? 'Kamomad' : 'Kassa ijobiy'}
                  </span>
                </div>
                <UsdWithUzs
                  className={`text-lg sm:text-xl font-extrabold mt-1.5 break-all ${isNegative ? 'text-red-600' : 'text-[#21bd68]'}`}
                  uzsClassName="text-[11px] mt-0.5"
                  usd={netUsd}
                  uzs={netUzs}
                />
              </div>
              <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-between">
                <span>Olingan to'lov − Xarajatlar</span>
                <span className="text-[9px] text-purple-600 font-medium" title="Kutilayotgan sof foyda">
                  Kutilayotgan: {formatUsd(summary?.grossProfit ?? 0)}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5">
            {/* Timeline Progress Card */}
            <div className="lg:col-span-7 bg-white border border-[#e4e7ec] rounded-xl p-4 sm:p-5 shadow-xs flex flex-col justify-between space-y-4 min-w-0">
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-bold text-xs text-[#171b25]">Loyiha rivojlanishi (Avtomatik Progress)</h3>
                    <div className="text-[10px] text-[#9399a4]">Vazifalar og'irligi asosida avtomatik hisoblangan</div>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-[#e6f8ee] text-[#159452]">
                    {project.progressPercent}% Bajarildi
                  </span>
                </div>

                {/* Progress bar */}
                <div className="my-3.5">
                  <div className="h-2.5 bg-[#edf0f3] rounded-full overflow-hidden">
                    <div
                      style={{ width: `${Math.max(project.progressPercent, 2)}%` }}
                      className="h-full bg-gradient-to-r from-[#ff7a16] to-[#ff9438] rounded-full transition-all duration-500"
                    />
                  </div>
                </div>

                {/* Timeline Dates */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs pt-1">
                  <div>
                    <span className="block text-[10px] text-[#8c929d]">Boshlanish</span>
                    <strong className="text-gray-900 font-bold text-xs">{formatDateUz(project.startDate)}</strong>
                  </div>
                  <div className="sm:text-center">
                    <span className="block text-[10px] text-[#ff7a16] font-semibold">Holati</span>
                    <strong className="text-[#ff7a16] font-bold text-xs">{project.statusName}</strong>
                  </div>
                  <div className="sm:text-right">
                    <span className="block text-[10px] text-[#8c929d]">Topshirish</span>
                    <strong className="text-gray-900 font-bold text-xs">{project.endDate ? formatDateUz(project.endDate) : 'Belgilanmagan'}</strong>
                  </div>
                </div>
              </div>

              {/* Mini Stats Footer */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2.5 border-t border-gray-100 bg-gray-50/70 p-2.5 rounded-lg text-xs">
                <div>
                  <span className="block text-[10px] text-gray-500">Jami vazifalar:</span>
                  <b className="text-gray-800">{tasks.length} ta</b>
                </div>
                <div className="sm:text-center">
                  <span className="block text-[10px] text-gray-500">Bajarilgan:</span>
                  <b className="text-emerald-600">{tasks.filter(t => t.isCompleted).length} ta</b>
                </div>
                <div className="sm:text-right">
                  <span className="block text-[10px] text-gray-500">Kutilmoqda:</span>
                  <b className="text-orange-600">{tasks.filter(t => !t.isCompleted).length} ta</b>
                </div>
              </div>
            </div>

            {/* Recent Financial Movements */}
            <div className="lg:col-span-5 bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs min-w-0">
              <h3 className="font-bold text-xs text-[#171b25] mb-2.5">So'nggi Moliya Harakatlari</h3>
              <div className="divide-y divide-[#eef0f3] text-xs">
                {payments.slice(0, 2).map((p) => {
                  return (
                    <div key={p.id} className="py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 break-words">Mijoz to‘lovi ({p.paymentMethodName})</div>
                        <div className="text-[10px] text-gray-400">{formatDateUz(p.paymentDate)}</div>
                      </div>
                      <UsdWithUzs className="text-[#21bd68] font-bold text-right" usd={p.amount} uzs={p.amountUzs} />
                    </div>
                  );
                })}
                {expenses.slice(0, 2).map((e) => {
                  return (
                    <div key={e.id} className="py-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-800 break-words">{expenseCategoryLabels[e.category] || e.categoryName}: {e.description}</div>
                        <div className="text-[10px] text-gray-400">{formatDateUz(e.expenseDate)}</div>
                      </div>
                      <UsdWithUzs className="text-[#ef5350] font-bold text-right" usd={e.amountUsd} uzs={e.amount} />
                    </div>
                  );
                })}
                {payments.length === 0 && expenses.length === 0 && (
                  <div className="py-6 text-center text-gray-400 text-[11px]">Hali harakatlar mavjud emas</div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks in this project */}
          <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-[#e4e7ec]">
              <div>
                <h3 className="font-bold text-xs text-[#171b25]">Ushbu loyihadagi vazifalar</h3>
                <div className="text-[10px] text-[#9399a4]">Vazifalar bajarilishi bilan loyiha progressi oshadi</div>
              </div>
              <button
                onClick={() => setIsTaskModalOpen(true)}
                className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Vazifa qo'shish</span>
              </button>
            </div>

            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full min-w-[640px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                  <th className="py-3 px-4 font-bold text-[#7c838e] text-[10px] uppercase w-20">HOLAT</th>
                  <th className="py-3 px-4 font-bold text-[#7c838e] text-[10px] uppercase">VAZIFA</th>
                  <th className="py-3 px-4 font-bold text-[#7c838e] text-[10px] uppercase">BOSQICH</th>
                  <th className="py-3 px-4 font-bold text-[#7c838e] text-[10px] uppercase">OG'IRLIK</th>
                  <th className="py-3 px-4 font-bold text-[#7c838e] text-[10px] uppercase">MUDDAT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#eef0f3]">
                {tasks.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleToggleTask(t.id)}
                        className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${
                          t.isCompleted
                            ? 'bg-[#21bd68] border-[#21bd68] text-white shadow-xs'
                            : 'border-gray-300 hover:border-[#ff7a16] bg-white'
                        }`}
                        title={t.isCompleted ? "Bajarildi" : "Bajarish uchun bosing"}
                      >
                        {t.isCompleted && <CheckCircle2 className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="py-3 px-4 font-semibold text-gray-900">
                      <div className="flex flex-wrap items-center gap-2">
                        <span>{t.title}</span>
                        {t.isCompleted && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f8ee] text-[#159452]">
                            Bajarildi ✓
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-gray-600 font-medium">{t.stageName || 'Asosiy bosqich'}</td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 bg-gray-100 border border-gray-200 text-gray-800 rounded font-bold text-[11px]">
                        {t.weight} ball
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 font-medium">{formatDateUz(t.dueDate)}</td>
                  </tr>
                ))}
                {tasks.length === 0 && (
                  <tr><td colSpan={5} className="py-8 text-center text-xs text-gray-400">Vazifalar qo'shilmagan</td></tr>
                )}
              </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: FINANCE & PAYMENTS (Mijoz To'lovlari / Kirim) */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-[#e4e7ec] bg-emerald-50/30">
              <div>
                <div className="font-bold text-xs text-emerald-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Mijoz To'lovlari (Kirim & Shartnoma To'lovlari)</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Mijoz tomonidan loyiha shartnomasi bo'yicha amalga oshirilgan to'lovlar
                </div>
              </div>
              <button
                onClick={() => setIsPaymentModalOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ To'lov qabul qilish</span>
              </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-[450px] overflow-y-auto custom-scrollbar">
              {payments.map((p) => {
                return (
                  <div key={p.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs hover:bg-gray-50/50 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-gray-900 flex flex-wrap items-center gap-2 min-w-0">
                        <span>{formatUsd(p.amount)}</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">{p.paymentMethodName}</span>
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Sana: {formatDateUz(p.paymentDate)} · Qabul qildi: <b className="text-gray-700">{p.receivedByName}</b>
                      </div>
                      {p.currency === 'UZS' && p.originalAmount ? (
                        <div className="text-[10px] text-gray-400">Kiritilgan: {formatUzs(p.originalAmount)} · kurs {p.exchangeRate?.toLocaleString('ru-RU')}</div>
                      ) : null}
                      {p.notes && <div className="text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded mt-1 border border-gray-100">Izoh: {p.notes}</div>}
                    </div>
                    <UsdWithUzs className="text-emerald-700 font-extrabold text-base text-left sm:text-right break-all" usd={p.amount} uzs={p.amountUzs} />
                  </div>
                );
              })}
              {payments.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">
                  Mijozdan to'lovlar hali qabul qilinmagan. Yuqoridagi "+ To'lov qabul qilish" orqali kiritishingiz mumkin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Loyiha Qo'shimcha Xarajatlari — ustalar ishiga kirmaydigan qo'shimcha xarajatlar (Yuk tashish, Tozalash va b.) */}
      {activeTab === 'expenses' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 border-b border-[#e4e7ec] bg-red-50/30">
              <div>
                <div className="font-bold text-xs text-red-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-red-600" />
                  <span>Qo'shimcha Xarajatlar (Yuk tashish, Tozalash, Gipskarton ko'tarish va b.)</span>
                </div>
                <div className="text-[10px] text-gray-500 mt-0.5">
                  Loyiha xarajatlari: yuk ko'tarish, kvartirani tozalash, transport va boshqalar (qo'lda kiritiladi)
                </div>
              </div>
              <button
                onClick={handleOpenExpenseModal}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Qo'shimcha xarajat kiritish</span>
              </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-[450px] overflow-y-auto custom-scrollbar">
              {expenses.map((exp) => {
                const isUsd = exp.currency === 'USD' && !!exp.originalAmount;
                return (
                  <div key={exp.id} className="p-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 text-xs hover:bg-gray-50/50 transition-colors">
                    <div className="space-y-0.5">
                      <div className="font-bold text-sm text-gray-900 flex flex-wrap items-center gap-2 min-w-0">
                        <span className="font-bold text-base text-gray-900">{formatUsd(exp.amountUsd ?? 0)}</span>
                        {isUsd && (
                          <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            Kiritilgan: {formatUsd(exp.originalAmount!)} · kurs {exp.exchangeRateToUzs?.toLocaleString('ru-RU') || '-'}
                          </span>
                        )}
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-800 font-medium">
                          {expenseCategoryLabels[exp.category] || exp.categoryName}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-700 font-medium">
                        {exp.description}
                      </div>
                      <div className="text-[11px] text-gray-400">
                        Sana: {formatDateUz(exp.expenseDate)} · Kiritdi: <b className="text-gray-700">{exp.createdByName}</b>
                      </div>
                    </div>
                    <div className="text-right">
                      <UsdWithUzs className="text-red-600 font-extrabold text-base sm:items-end break-all" usd={exp.amountUsd} uzs={exp.amount} />
                    </div>
                  </div>
                );
              })}
              {expenses.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">
                  Qo'shimcha xarajatlar hali kiritilmagan. Yuqoridagi "+ Qo'shimcha xarajat kiritish" orqali gipskarton ko'tarish, tozalash va boshqa xarajatlarni kiritishingiz mumkin.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: TASKS */}
      {activeTab === 'tasks' && (
        <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 border-b border-[#e4e7ec]">
            <h3 className="font-bold text-xs text-[#171b25]">Vazifalar & Bosqichlar Ro'yxati</h3>
            <button
              onClick={() => setIsTaskModalOpen(true)}
              className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Yangi Vazifa</span>
            </button>
          </div>

          <div className="space-y-2">
            {tasks.map((t) => (
              <div
                key={t.id}
                onClick={() => handleToggleTask(t.id)}
                className={`p-3 rounded-lg border flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 cursor-pointer transition-colors ${
                  t.isCompleted ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${t.isCompleted ? 'bg-[#21bd68] border-[#21bd68] text-white' : 'border-gray-300'}`}>
                    {t.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{t.title}</div>
                    <div className="text-[10px] text-gray-400">Bosqich: {t.stageName || 'Asosiy'} · Muddat: {formatDateUz(t.dueDate)}</div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {t.isCompleted && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#e6f8ee] text-[#159452]">
                      Bajarildi ✓
                    </span>
                  )}
                  <span className="text-xs font-bold px-2 py-0.5 bg-gray-100 text-gray-700 rounded">
                    {t.weight} ball
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MATERIALS */}
      {activeTab === 'materials' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 border-b border-[#e4e7ec] mb-3">
              <div>
                <h3 className="font-bold text-xs text-[#171b25]">Materiallar Xulosasi (Tahlil)</h3>
                <div className="text-[10px] text-[#9399a4]">Qaysi materialdan qancha olingani va jami summasi</div>
              </div>
              <button
                onClick={handleOpenPurchaseModal}
                className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Material xaridi kiritish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {materialsSummary.map((m) => (
                <div key={`${m.materialId}-${m.brand ?? ''}-${m.unit}`} className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs space-y-1.5">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="font-bold text-xs text-gray-900 truncate">{m.materialName}</div>
                    {m.brand && (
                      <span className="px-1.5 py-0.5 bg-orange-50 text-[#ff7a16] border border-orange-100 rounded text-[9px] font-bold">
                        {m.brand}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-between text-xs text-gray-600">
                    <span className="text-gray-500">Miqdor:</span>
                    <b className="text-gray-800">{m.totalQuantity} {m.unit}</b>
                  </div>
                  <div className="flex justify-between text-xs text-gray-600 pt-1 border-t border-gray-50">
                    <span className="text-gray-500">Jami xarajat:</span>
                    <UsdWithUzs className="text-[#ff7a16] font-bold items-end" usd={m.totalCostUsd} uzs={m.totalCost} />
                  </div>
                </div>
              ))}
              {materialsSummary.length === 0 && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-6 text-center text-xs text-gray-400">Material xaridlari mavjud emas</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-xs text-[#171b25] mb-3">Barcha Xarid Cheklari</h3>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">SANA</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">MATERIAL</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">BREND</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">MIQDOR</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">NARX</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">JAMI</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">DO'KON / YETKAZUVCHI</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">KIM OLDI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {purchases.map((pur) => (
                    <tr key={pur.id} className="hover:bg-gray-50/50">
                      <td className="py-2.5 px-3">{formatDateUz(pur.purchaseDate)}</td>
                      <td className="py-2.5 px-3 font-semibold text-gray-900">{pur.materialName}</td>
                      <td className="py-2.5 px-3">
                        {pur.brand ? (
                          <span className="px-1.5 py-0.5 bg-orange-50 text-[#ff7a16] border border-orange-100 rounded text-[9px] font-bold">
                            {pur.brand}
                          </span>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3">{pur.quantity} {pur.unit}</td>
                      <td className="py-2.5 px-3 font-medium">
                        {pur.currency === 'USD' && pur.originalUnitPrice ? (
                          <div>
                            <span>{formatUsd(pur.originalUnitPrice)}</span>
                            <div className="text-[10px] text-gray-400">kurs: {pur.exchangeRateToUzs?.toLocaleString('ru-RU')}</div>
                          </div>
                        ) : (
                          formatUzs(pur.unitPrice)
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#ff7a16]">
                        <UsdWithUzs usd={pur.totalCostUsd} uzs={pur.totalCost} />
                      </td>
                      <td className="py-2.5 px-3 text-gray-600">{pur.supplier || '-'}</td>
                      <td className="py-2.5 px-3 text-gray-600 font-medium">{pur.createdByName || '-'}</td>
                    </tr>
                  ))}
                  {purchases.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-gray-400">
                        Xaridlar mavjud emas. Yuqoridagi "+ Material xaridi kiritish" orqali yangi xarid qo'shing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: WORKERS & WORK PAYMENTS */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          {/* TOP BANNER: SUMMARY CARDS & RULES */}
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center pb-3 border-b border-[#e4e7ec] gap-3">
              <div>
                <h3 className="font-bold text-xs text-[#171b25]">Ustalar Balansi (Qarzlar Nazorati)</h3>
                <div className="text-[10px] text-[#9399a4]">Usta qancha ishladi, qancha to'landi, qancha qarzmiz</div>
              </div>
              <button
                onClick={handleOpenWorkerModal}
                className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ustaga ish biriktirish</span>
              </button>
            </div>

            {/* WORKER CARDS GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {workersSummary.map((w) => {
                const debt = w.totalAgreedAmount - w.totalPaidAmount;
                const isFullyPaid = w.totalAgreedAmount > 0 && w.totalPaidAmount >= w.totalAgreedAmount;
                const isOverpaid = debt < 0;

                return (
                  <div key={w.workerId} className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="font-bold text-xs text-gray-900">{w.workerName}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">{w.specialty || 'Usta'}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Kelishilgan:</span>
                        <UsdWithUzs className="font-bold text-gray-900 items-end" uzs={w.totalAgreedAmount} />
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Ishlangan haq:</span>
                        <UsdWithUzs className="font-bold text-purple-700 items-end" uzs={w.totalWorkAmount} />
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>To'langan:</span>
                        <UsdWithUzs className="font-bold items-end" uzs={w.totalPaidAmount} />
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                        <span className="text-gray-600 font-medium">Qoldiq qarzimiz:</span>
                        <UsdWithUzs className={`font-bold items-end ${isOverpaid ? 'text-red-600' : isFullyPaid ? 'text-emerald-700' : 'text-gray-900'}`} uzs={debt} />
                      </div>
                    </div>

                    <div className="pt-1">
                      {isFullyPaid ? (
                        <span className="w-full inline-flex justify-center items-center gap-1 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✅ To'liq to'langan
                        </span>
                      ) : w.totalPaidAmount > 0 ? (
                        <span className="w-full inline-flex justify-center items-center gap-1 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ⏳ Qisman to'langan (Qoldiq: {formatUsd(cbuRate > 0 ? debt / cbuRate : 0)})
                        </span>
                      ) : (
                        <span className="w-full inline-flex justify-center items-center gap-1 py-1 rounded-md text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200">
                          To'lanmagan (Qoldiq: {formatUsd(cbuRate > 0 ? debt / cbuRate : 0)})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {workersSummary.length === 0 && (
                <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-6 text-center text-xs text-gray-400">
                  Ushbu loyihaga hali usta biriktirilmagan
                </div>
              )}
            </div>
          </div>

          {/* TABLE OF WORKER JOBS */}
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-xs text-[#171b25] mb-3">Bajarilayotgan Ishlar Ro'yxati</h3>
            <div className="overflow-x-auto scrollbar-none">
              <table className="w-full min-w-[980px] text-left text-xs">
                <thead>
                  <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">USTA</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">ISH TAVSIFI</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">KELISHILGAN</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">ISHLANGAN HAQ</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">TO'LANGAN</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">QARZ</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">HOLATI</th>
                    <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px] text-right">AMALLAR</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {workerPayments.map((wp) => {
                    const debt = wp.agreedAmount - wp.paidAmount;
                    const isFullyPaid = wp.agreedAmount > 0 && wp.paidAmount >= wp.agreedAmount;
                    const isOverpaid = debt < 0;

                    return (
                      <tr key={wp.id} className="hover:bg-gray-50/50">
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-gray-900">{wp.workerName}</div>
                          {wp.workerSpecialty && <div className="text-[10px] text-gray-400">{wp.workerSpecialty}</div>}
                        </td>
                        <td className="py-2.5 px-3 text-gray-700">{wp.jobDescription}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-900">
                          <UsdWithUzs usd={wp.agreedAmountUsd} uzs={wp.agreedAmount} />
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-purple-700"><UsdWithUzs uzs={wp.workAmount} /></td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700"><UsdWithUzs usd={wp.paidAmountUsd} uzs={wp.paidAmount} /></td>
                        <td className="py-2.5 px-3 font-bold">
                          <UsdWithUzs className={isOverpaid ? 'text-red-600' : isFullyPaid ? 'text-emerald-700' : 'text-gray-900'} uzs={debt} />
                        </td>
                        <td className="py-2.5 px-3">
                          {isFullyPaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              ✅ To'liq to'langan
                            </span>
                          ) : isOverpaid ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                              ❌ Ortiqcha to'langan
                            </span>
                          ) : wp.paidAmount > 0 ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                              ⏳ Qisman to'langan
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                              To'lanmagan
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right whitespace-nowrap">
                          <div className="flex flex-wrap justify-end gap-1.5">
                          <button
                            onClick={() => openWorkAmountModal(wp)}
                            className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-lg border border-purple-200 text-[10px] font-semibold hover:bg-purple-100 transition-colors"
                          >
                            Ish haqini kiritish
                          </button>
                          {isFullyPaid ? (
                            <button
                              disabled
                              className="px-2.5 py-1 bg-emerald-50 text-emerald-600 rounded-lg border border-emerald-200 text-[10px] font-bold opacity-75 cursor-not-allowed"
                            >
                              To'liq to'langan ✓
                            </button>
                          ) : (
                            <button
                              onClick={() => openPayWorkerModal(wp)}
                              className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-semibold hover:bg-emerald-700 transition-colors shadow-xs"
                            >
                              Pul to'lash
                            </button>
                          )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {workerPayments.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-xs text-gray-400">
                        Ishlar ro'yxati mavjud emas. Yuqoridagi "+ Ustaga ish biriktirish" orqali yangi ish qo'shing.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: EXTRA WORKS */}
      {activeTab === 'extraworks' && (
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 border-b border-[#e4e7ec]">
            <div>
              <h3 className="font-bold text-xs text-[#171b25]">Qo'shimcha Ishlar (Extra Works — PDF §7)</h3>
              <div className="text-[10px] text-[#9399a4]">Shartnomadan tashqari yangi ishlar va sof foyda ta'siri</div>
            </div>
            <button
              onClick={() => setIsExtraWorkModalOpen(true)}
              className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Qo'shimcha ish kiritish</span>
            </button>
          </div>

          <div className="space-y-2">
            {extraWorks.map((ew) => (
              <div key={ew.id} className="p-3.5 bg-white border border-gray-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-xs">
                <div>
                  <div className="font-bold text-xs text-gray-900">{ew.title}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{ew.description || 'Izohsiz'}</div>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mt-2 text-xs">
                    <span className="text-gray-600">Mijoz narxi: <UsdWithUzs className="font-bold" usd={ew.customerAmount} uzs={ew.customerAmountUzs} /></span>
                    <span className="text-gray-600">Tannarx: <UsdWithUzs className="font-bold" usd={ew.actualCost} uzs={ew.actualCostUzs} /></span>
                    <span className="text-emerald-700">Foyda: <UsdWithUzs className="font-bold" usd={ew.customerAmount - ew.actualCost} /></span>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleExtraWork(ew.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                    ew.isApprovedByCustomer
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                      : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                  }`}
                >
                  {ew.isApprovedByCustomer ? "Tasdiqlangan ✓" : "Kutilmoqda (Tasdiqlash)"}
                </button>
              </div>
            ))}
            {extraWorks.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">Qo'shimcha ishlar kiritilmagan</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 7: PHOTOS */}
      {activeTab === 'photos' && (
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 border-b border-[#e4e7ec]">
            <div>
              <h3 className="font-bold text-xs text-[#171b25]">Fotosuratlar Galereyasi (Oldin / Keyin)</h3>
              <div className="text-[10px] text-[#9399a4]">Saha xodimi yuklagan progress rasmlari</div>
            </div>
            <button
              onClick={() => setIsPhotoModalOpen(true)}
              className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>Rasm qo'shish</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {photos.map((ph) => (
              <div key={ph.id} className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-xs">
                <img
                  src={ph.photoUrl}
                  alt={ph.caption || 'Photo'}
                  className="w-full h-40 object-cover"
                  onError={(e) => {
                    (e.target as any).src = 'https://images.unsplash.com/photo-1541888946425-d0fbb186156a?w=400';
                  }}
                />
                <div className="p-2.5">
                  <div className="text-xs font-semibold text-gray-800 truncate">{ph.caption || 'Tavsifsiz rasm'}</div>
                  <div className="flex flex-wrap justify-between gap-2 text-[10px] text-gray-400 mt-1">
                    <span>{formatDateUz(ph.photoDate)}</span>
                    <span className={ph.isVisibleToCustomer ? 'text-emerald-600 font-bold' : 'text-gray-500'}>
                      {ph.isVisibleToCustomer ? 'Mijozga ochiq' : 'Ichki'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {photos.length === 0 && (
              <div className="col-span-1 sm:col-span-2 lg:col-span-3 py-12 text-center text-xs text-gray-400">Rasmlar yuklanmagan</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: DOCUMENTS & SHARTNOMALAR */}
      {activeTab === 'ai' && id && canUseAi && <AiAnalysisPanel key={id} projectId={id} />}

      {activeTab === 'documents' && (
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 pb-3 border-b border-[#e4e7ec]">
            <div>
              <h3 className="font-bold text-xs text-[#171b25]">Hujjatlar & Shartnomalar</h3>
              <div className="text-[10px] text-[#9399a4]">Shartnomalar, cheklar, hisob-fakturalar va boshqa hujjatlar</div>
            </div>
            <button
              onClick={() => {
                const titleEl = document.getElementById('doc-title') as HTMLInputElement;
                if (titleEl) titleEl.focus();
              }}
              className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Hujjat qo'shish</span>
            </button>
          </div>

          {project.agreementId && canAttachAgreementPdf && !documents.some(isAgreementPdfDoc) && (
            <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="text-xs text-purple-800">
                <div className="font-bold">Bu loyiha shartnomadan yaratilgan</div>
                <div className="text-[11px] text-purple-600">Shartnoma PDF i hali hujjatlarga qo'shilmagan.</div>
              </div>
              <button
                type="button"
                disabled={isAttachingAgreementPdf}
                onClick={async () => {
                  if (!id || !project.agreementId) return;
                  setIsAttachingAgreementPdf(true);
                  try {
                    const agreement = await agreementsApi.getById(project.agreementId);
                    await uploadAgreementPdfToProject(id, agreement);
                    loadAllData(id);
                  } catch (err: any) {
                    alert(err?.response?.data?.message || 'Shartnoma PDF ini yaratib bo\'lmadi');
                  } finally {
                    setIsAttachingAgreementPdf(false);
                  }
                }}
                className="h-8 px-3 bg-[#7c3aed] hover:bg-[#6d28d9] text-white text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 disabled:opacity-50"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{isAttachingAgreementPdf ? 'PDF tayyorlanmoqda...' : 'Shartnoma PDF ini qo\'shish'}</span>
              </button>
            </div>
          )}

          {/* Add Document Form */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#ff7a16]" />
                <span>Yangi Hujjat / Shartnoma Qo'shish</span>
              </div>
              <div className="flex items-center overflow-x-auto scrollbar-none bg-gray-200/80 p-0.5 rounded-lg text-[11px] font-semibold max-w-full">
                <button
                  type="button"
                  onClick={() => setDocUploadMode('file')}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap flex-shrink-0 transition-all ${docUploadMode === 'file' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  📁 Kompyuterdan fayl yuklash
                </button>
                <button
                  type="button"
                  onClick={() => setDocUploadMode('url')}
                  className={`px-2.5 py-1 rounded-md whitespace-nowrap flex-shrink-0 transition-all ${docUploadMode === 'url' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  🔗 Havola (URL)
                </button>
              </div>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!id) return;
                const form = e.target as HTMLFormElement;
                const title = (form.elements.namedItem('docTitle') as HTMLInputElement)?.value.trim();
                const fileType = (form.elements.namedItem('docType') as HTMLSelectElement)?.value;

                if (docUploadMode === 'file') {
                  if (!selectedDocFile) {
                    alert("Iltimos, kompyuterdan faylni tanlang.");
                    return;
                  }
                  setIsUploadingDoc(true);
                  try {
                    const fd = new FormData();
                    fd.append('file', selectedDocFile);
                    if (title) fd.append('title', title);
                    if (fileType) fd.append('fileType', fileType);
                    await projectsApi.uploadDocument(id, fd);
                    setSelectedDocFile(null);
                    form.reset();
                    loadAllData(id);
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Fayl yuklashda xatolik yuz berdi');
                  } finally {
                    setIsUploadingDoc(false);
                  }
                } else {
                  const url = (form.elements.namedItem('docUrl') as HTMLInputElement)?.value.trim();
                  if (!title || !url) {
                    alert("Hujjat nomi va URL manzilini kiriting.");
                    return;
                  }
                  try {
                    await projectsApi.createDocument(id, { title, filePath: url, fileType, fileSizeBytes: 0 });
                    form.reset();
                    loadAllData(id);
                  } catch (err: any) {
                    alert(err.response?.data?.message || 'Xatolik');
                  }
                }
              }}
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 items-center"
            >
              {docUploadMode === 'file' ? (
                <div className="sm:col-span-1">
                  <label className="relative flex items-center justify-center gap-2 h-8 px-2 border-2 border-dashed border-[#ff7a16]/40 hover:border-[#ff7a16] bg-white rounded cursor-pointer text-[11px] font-medium text-gray-700 hover:bg-orange-50/40 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#ff7a16]" />
                    <span className="truncate">{selectedDocFile ? selectedDocFile.name : 'Faylni tanlang...'}</span>
                    <input
                      type="file"
                      accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSelectedDocFile(file);
                        const titleInput = document.getElementById('doc-title') as HTMLInputElement;
                        if (file && titleInput && !titleInput.value) {
                          const baseName = file.name.replace(/\.[^/.]+$/, "");
                          titleInput.value = baseName;
                        }
                      }}
                    />
                  </label>
                </div>
              ) : (
                <input
                  name="docUrl"
                  type="url"
                  required
                  placeholder="URL yo'li (https://...)"
                  className="sm:col-span-1 h-8 px-2 border border-gray-300 rounded text-xs bg-white outline-none focus:border-[#ff7a16]"
                />
              )}

              <input
                id="doc-title"
                name="docTitle"
                type="text"
                required
                placeholder="Hujjat nomi (masalan: Asosiy shartnoma)"
                className="sm:col-span-1 h-8 px-2 border border-gray-300 rounded text-xs bg-white outline-none focus:border-[#ff7a16]"
              />

              <select
                name="docType"
                className="h-8 px-2 border border-gray-300 rounded text-xs bg-white outline-none focus:border-[#ff7a16]"
              >
                <option value="shartnoma">📋 Shartnoma</option>
                <option value="chek">🧾 Chek / Kvitansiya</option>
                <option value="hisob-faktura">📊 Hisob-faktura</option>
                <option value="chizma">📐 Chizma / Loyiha</option>
                <option value="rasm">🖼️ Rasm</option>
                <option value="boshqa">📎 Boshqa</option>
              </select>

              <button
                type="submit"
                disabled={isUploadingDoc}
                className="h-8 bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold rounded flex items-center justify-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isUploadingDoc ? 'Yuklanmoqda...' : 'Qo\'shish'}</span>
              </button>
            </form>
          </div>

          {/* Documents Table */}
          <div className="overflow-x-auto scrollbar-none">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead>
                <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">HUJJAT NOMI</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">TURI</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">HAJMI</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">KIM YUKLAGAN</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px]">SANA</th>
                  <th className="py-2.5 px-3 font-bold text-gray-500 text-[10px] text-right">AMAL</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-gray-50/50">
                    <td className="py-2.5 px-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <FileText className="w-4 h-4 text-[#ff7a16] flex-shrink-0" />
                        <span className="font-semibold text-gray-800">{d.title}</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                        {d.fileType || 'hujjat'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-500 text-[11px]">
                      {d.fileSizeBytes > 0
                        ? d.fileSizeBytes > 1024 * 1024
                          ? `${(d.fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`
                          : `${Math.round(d.fileSizeBytes / 1024)} KB`
                        : '-'}
                    </td>
                    <td className="py-2.5 px-3 text-gray-600">{d.uploadedByName}</td>
                    <td className="py-2.5 px-3 text-gray-500">{formatDateUz(d.createdAt)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a
                          href={getFileUrl(d.filePath)}
                          target="_blank"
                          rel="noreferrer"
                          download
                          onClick={async (event) => {
                            if (!d.filePath.startsWith('/api/projects/')) return;
                            event.preventDefault();
                            try {
                              const apiPath = d.filePath.replace(/^\/api/, '');
                              const response = await apiClient.get(apiPath, { responseType: 'blob' });
                              const fileUrl = URL.createObjectURL(response.data);
                              const link = document.createElement('a');
                              link.href = fileUrl;
                              const title = d.title.replace(/[\\/:*?"<>|]/g, '_');
                              const disposition = response.headers['content-disposition'] as string | undefined;
                              const encodedName = disposition?.match(/filename\*=UTF-8''([^;]+)/i)?.[1];
                              const plainName = disposition?.match(/filename="?([^";]+)"?/i)?.[1];
                              link.download = encodedName
                                ? decodeURIComponent(encodedName)
                                : plainName || `${title}.${d.fileType || 'bin'}`;
                              document.body.appendChild(link);
                              link.click();
                              link.remove();
                              window.setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
                            } catch {
                              alert("Hujjatni yuklab bo'lmadi. Ruxsatingizni tekshirib, qayta urinib ko'ring.");
                            }
                          }}
                          className="px-2.5 py-1 bg-[#ff7a16] text-white rounded text-[11px] font-semibold hover:bg-[#e86807] transition-colors"
                        >
                          Ochish →
                        </a>
                        <button
                          type="button"
                          onClick={async () => {
                            if (!id) return;
                            if (window.confirm(`"${d.title}" hujjatini o'chirishni tasdiqlaysizmi?`)) {
                              try {
                                await projectsApi.deleteDocument(id, d.id);
                                loadAllData(id);
                              } catch (err: any) {
                                alert(err.response?.data?.message || "O'chirishda xatolik");
                              }
                            }
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                          title="Hujjatni o'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-gray-400">
                      Hujjatlar mavjud emas. Yuqoridagi formadan fayl tanlang yoki havola kiriting.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD TASK */}
      {isTaskModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-[#171b25]">Yangi Vazifa Qo'shish</h3>
            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Vazifa Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Kafel terish"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Og'irlik (Ball: 1-10) *</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  required
                  value={newTaskWeight}
                  onChange={(e) => setNewTaskWeight(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD PAYMENT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-[#171b25]">Mijozdan To'lov Qabul Qilish</h3>
            <form onSubmit={handleCreatePayment} className="space-y-3">
              <MoneyInput
                label="Summa"
                required
                value={newPayAmount}
                onChange={setNewPayAmount}
                currency={newPayCurrency}
                onCurrencyChange={setNewPayCurrency}
              />
              <div>
                <label className="block text-xs font-semibold mb-1">To'lov Usuli</label>
                <select
                  value={newPayMethod}
                  onChange={(e) => setNewPayMethod(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                >
                  <option value={1}>Naqd pul (Cash)</option>
                  <option value={2}>Bank o'tkazmasi (BankTransfer)</option>
                  <option value={3}>Plastik karta (Card)</option>
                  <option value={4}>Boshqa (Other)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Izoh</label>
                <input
                  type="text"
                  placeholder="1-bosqich to'lovi"
                  value={newPayNotes}
                  onChange={(e) => setNewPayNotes(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">Qabul qilish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-[#171b25]">Xarajat Kiritish</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Kategoriya *</label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                >
                  <option value={9}>📦 Yuklarni tashish / Ko'tarish (Gipskarton va b.)</option>
                  <option value={8}>🧹 Tozalash ishlari</option>
                  <option value={10}>🔧 Qo'shimcha mayda ishlar</option>
                  <option value={11}>⚡ Elektr (svet to'lovi)</option>
                  <option value={15}>💧 Suv to'lovi</option>
                  <option value={16}>🔥 Gaz to'lovi</option>
                  <option value={17}>🏢 Umumiy kommunal xarajatlar</option>
                  <option value={3}>🚛 Transport (Transport)</option>
                  <option value={4}>⛽ Yoqilg'i (Fuel)</option>
                  <option value={5}>🤝 Subpudrat (Subcontractor)</option>
                  <option value={6}>➕ Qo'shimcha (Extra)</option>
                  <option value={7}>📋 Boshqa (Other)</option>
                </select>
              </div>
              <MoneyInput
                label="Summa"
                required
                value={newExpAmount}
                onChange={setNewExpAmount}
                currency={newExpCurrency}
                onCurrencyChange={setNewExpCurrency}
              />
              <div>
                <label className="block text-xs font-semibold mb-1">Tavsif (Izoh) *</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Gipskartonni 4-qavatga ko'tarish, kvartirani tozalash"
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Xarajat Sanasi *</label>
                <input
                  type="date"
                  required
                  value={newExpDate}
                  onChange={(e) => setNewExpDate(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD MATERIAL PURCHASE */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#171b25]">Material Xaridi Kiritish</h3>
              <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="w-8 h-8 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-3">
              <MaterialPicker
                materials={catalogMaterials}
                name={newPurMatName}
                brand={newPurMatBrand}
                unit={newPurMatUnit}
                onNameChange={setNewPurMatName}
                onBrandChange={setNewPurMatBrand}
                onUnitChange={setNewPurMatUnit}
              />

              <div>
                <label className="block text-xs font-semibold mb-1">Miqdor ({newPurMatUnit}) *</label>
                <input
                  type="number"
                  required
                  min="0.01"
                  step="any"
                  placeholder="50"
                  value={newPurQty}
                  onChange={(e) => setNewPurQty(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <MoneyInput
                label="Birlik narxi"
                required
                value={newPurPrice}
                onChange={setNewPurPrice}
                currency={newPurCurrency}
                onCurrencyChange={setNewPurCurrency}
              />
              {Number(newPurQty) > 0 && Number(newPurPrice) > 0 && (
                <div className="text-[11px] font-semibold text-gray-700 text-right">
                  Jami: {newPurCurrency === 'USD'
                    ? `${formatUsd(Number(newPurQty) * Number(newPurPrice))}`
                    : formatUzs(Number(newPurQty) * Number(newPurPrice))}
                </div>
              )}
              <div>
                <label className="block text-xs font-semibold mb-1">Do'kon / Yetkazib beruvchi</label>
                <input
                  type="text"
                  placeholder="Kerama Marazzi"
                  value={newPurSupplier}
                  onChange={(e) => setNewPurSupplier(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Xaridni Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD WORKER */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#171b25]">Ustaga Ish Biriktirish</h3>
              <button
                type="button"
                onClick={() => setIsNewWorker(!isNewWorker)}
                className="text-[11px] text-[#ff7a16] font-semibold hover:underline flex items-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>{isNewWorker ? "Katalogdan tanlash" : "+ Yangi usta qo'shish"}</span>
              </button>
            </div>

            <form onSubmit={handleCreateWorkerPayment} className="space-y-3">
              {isNewWorker ? (
                <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Usta Ismi va Familiyasi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Hasan Usta"
                      value={newWorkerFullName}
                      onChange={(e) => setNewWorkerFullName(e.target.value)}
                      className="w-full h-8 px-2.5 border border-gray-300 rounded text-xs bg-white outline-none focus:border-[#ff7a16]"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Telefon *</label>
                      <input
                        type="text"
                        required
                        placeholder="+998901112233"
                        value={newWorkerPhone}
                        onChange={(e) => setNewWorkerPhone(e.target.value)}
                        className="w-full h-8 px-2 border border-gray-300 rounded text-xs bg-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Mutaxassisligi</label>
                      <input
                        type="text"
                        placeholder="Kafelchi, Suvoqchi"
                        value={newWorkerSpecialty}
                        onChange={(e) => setNewWorkerSpecialty(e.target.value)}
                        className="w-full h-8 px-2 border border-gray-300 rounded text-xs bg-white outline-none"
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold mb-1">Usta *</label>
                  <select
                    value={newWorkId}
                    onChange={(e) => setNewWorkId(e.target.value)}
                    required
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                  >
                    {catalogWorkers.map((w) => (
                      <option key={w.id} value={w.id}>{w.fullName} ({w.specialty || 'Usta'})</option>
                    ))}
                    {catalogWorkers.length === 0 && (
                      <option value="">Ustalar yo'q — tepadan yangi qo'shing</option>
                    )}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold mb-1">Ish Tavsifi *</label>
                <input
                  type="text"
                  required
                  placeholder="Oshxona va vanna kafelini terish"
                  value={newWorkDesc}
                  onChange={(e) => setNewWorkDesc(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <MoneyInput
                label="Kelishilgan Haq"
                required
                value={newWorkAgreed}
                onChange={setNewWorkAgreed}
                currency={newWorkCurrency}
                onCurrencyChange={setNewWorkCurrency}
              />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsWorkerModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Biriktirish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD EXTRA WORK */}
      {isExtraWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-[#171b25]">Qo'shimcha Ish Qo'shish</h3>
            <form onSubmit={handleCreateExtraWork} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Ish Nomi *</label>
                <input
                  type="text"
                  required
                  placeholder="Balkonga qo'shimcha elektr montaji"
                  value={newExtraTitle}
                  onChange={(e) => setNewExtraTitle(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <MoneyInput
                label="Mijoz Narxi"
                required
                value={newExtraCustAmt}
                onChange={setNewExtraCustAmt}
                currency={newExtraCurrency}
                onCurrencyChange={setNewExtraCurrency}
              />
              <MoneyInput
                label="Tannarx"
                required
                min={0}
                value={newExtraCost}
                onChange={setNewExtraCost}
                currency={newExtraCurrency}
                onCurrencyChange={setNewExtraCurrency}
                lockCurrency
              />
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsExtraWorkModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: ADD PHOTO */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-[#171b25]">Fotosurat Qo'shish</h3>
            <form onSubmit={handleCreatePhoto} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Rasm URL manzili *</label>
                <input
                  type="url"
                  required
                  placeholder="https://workdex.uz/uploads/photos/kafel-1.jpg"
                  value={newPhotoUrl}
                  onChange={(e) => setNewPhotoUrl(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Izoh</label>
                <input
                  type="text"
                  placeholder="Oshxona kafel terish jarayoni"
                  value={newPhotoCaption}
                  onChange={(e) => setNewPhotoCaption(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="checkbox"
                  id="visCust"
                  checked={newPhotoVisible}
                  onChange={(e) => setNewPhotoVisible(e.target.checked)}
                  className="w-4 h-4 rounded text-[#ff7a16]"
                />
                <label htmlFor="visCust" className="text-xs text-gray-700">Mijoz portalida ko'rinsin</label>
              </div>
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPhotoModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Yuklash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: PAY WORKER */}
      {isPayWorkerModalOpen && selectedWorkerForPay && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#171b25] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Ustaga Pul To'lash</span>
              </h3>
              <button onClick={() => setIsPayWorkerModalOpen(false)} className="w-8 h-8 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            {/* Worker Info Card */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1 text-xs">
              <div className="font-bold text-gray-900">{selectedWorkerForPay.workerName} ({selectedWorkerForPay.workerSpecialty || 'Usta'})</div>
              <div className="text-gray-600">Ish tavsifi: <b className="text-gray-800">{selectedWorkerForPay.jobDescription}</b></div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 mt-1 border-t border-gray-200 text-[11px]">
                <div>
                  <span className="text-gray-500">Kelishilgan:</span>
                  <UsdWithUzs className="font-bold text-gray-900" uzs={selectedWorkerForPay.agreedAmount} usd={selectedWorkerForPay.agreedAmountUsd} />
                </div>
                <div>
                  <span className="text-gray-500">To'langan:</span>
                  <UsdWithUzs className="font-bold text-emerald-700" uzs={selectedWorkerForPay.paidAmount} usd={selectedWorkerForPay.paidAmountUsd} />
                </div>
                <div>
                  <span className="text-gray-500">Qolgan limit:</span>
                  <UsdWithUzs className="font-bold text-blue-700" uzs={selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount} />
                </div>
              </div>
            </div>

            <form onSubmit={submitPayWorker} className="space-y-3">
              <MoneyInput
                label="To'lov Summasi"
                required
                value={payWorkerAmount}
                onChange={setPayWorkerAmount}
                currency={payWorkerCurrency}
                onCurrencyChange={(c) => {
                  setPayWorkerCurrency(c);
                  const rem = selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount;
                  if (rem > 0) setPayWorkerAmount(c === 'USD' ? (cbuRate > 0 ? Math.floor((rem / cbuRate) * 100) / 100 : '') : rem);
                }}
              />
              {payExceeds && (
                <p className="text-[11px] text-red-600 mt-1 font-medium bg-red-50 p-2 rounded border border-red-200">
                  ⚠️ Ustaga faqat {formatUzs(payRemaining)}{cbuRate > 0 ? ` (≈ ${formatUsd(payRemaining / cbuRate)})` : ''} to'lash mumkin.
                </p>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">To'lov Sanasi *</label>
                <input
                  type="date"
                  required
                  value={payWorkerDate}
                  onChange={(e) => setPayWorkerDate(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="Kafel ishi uchun bo'nak / to'lov"
                  value={payWorkerNotes}
                  onChange={(e) => setPayWorkerNotes(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPayWorkerModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={!payWorkerAmount || Number(payWorkerAmount) <= 0 || payExceeds}
                  className="px-4 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  To'lovni Tasdiqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 9: UPDATE WORK AMOUNT (HAKEDİŞ) */}
      {isWorkAmountModalOpen && selectedWorkerForWorkAmount && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#171b25] flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-purple-600" />
                <span>Ishlangan Haqni Kiritish (Hakediş)</span>
              </h3>
              <button onClick={() => setIsWorkAmountModalOpen(false)} className="w-8 h-8 inline-flex items-center justify-center text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            {/* Worker Info Card */}
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg space-y-1 text-xs">
              <div className="font-bold text-purple-950">{selectedWorkerForWorkAmount.workerName}</div>
              <div className="text-gray-600">Ish: <b className="text-gray-800">{selectedWorkerForWorkAmount.jobDescription}</b></div>
              <div className="text-gray-600">Kelishilgan umumiy summa: <UsdWithUzs inline className="font-bold text-gray-900" uzs={selectedWorkerForWorkAmount.agreedAmount} usd={selectedWorkerForWorkAmount.agreedAmountUsd} /></div>
            </div>

            <form onSubmit={submitWorkAmount} className="space-y-3">
              <div>
                <MoneyInput
                  label="Hozirgacha Bajarilgan Ish Haqi"
                  required
                  min={0}
                  value={workAmountInput}
                  onChange={setWorkAmountInput}
                  currency={workAmountCurrency}
                  onCurrencyChange={(c) => {
                    setWorkAmountCurrency(c);
                    const cur = selectedWorkerForWorkAmount.workAmount;
                    if (cur > 0) setWorkAmountInput(c === 'USD' ? (cbuRate > 0 ? Math.round((cur / cbuRate) * 100) / 100 : '') : cur);
                  }}
                />
                {workAmountExceeds && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium bg-red-50 p-2 rounded border border-red-200">
                    ⚠️ Ishlangan haq kelishilgan umumiy summadan ({formatUzs(selectedWorkerForWorkAmount.agreedAmount)}) oshishi mumkin emas.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  placeholder="50% kafel terildi, 2-qavat bitdi"
                  value={workAmountNotes}
                  onChange={(e) => setWorkAmountNotes(e.target.value)}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsWorkAmountModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={workAmountInput === '' || Number(workAmountInput) < 0 || workAmountExceeds}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <RenameProjectModal
        project={isRenameOpen ? project : null}
        onClose={() => setIsRenameOpen(false)}
        onRenamed={(updated) => setProject((prev) => (prev ? { ...prev, name: updated.name } : prev))}
      />
    </div>
  );
};

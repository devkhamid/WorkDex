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
  PackagePlus,
  Clock,
  HardHat,
  Upload,
  Trash2
} from 'lucide-react';
import { projectsApi, reportsApi, materialsApi, workersApi } from '../api/services';
import { getFileUrl } from '../api/client';
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
  Worker
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
  const [summary, setSummary] = useState<ProjectSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'finance' | 'tasks' | 'materials' | 'workers' | 'extraworks' | 'photos' | 'documents'>('overview');
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
  const [newPayMethod, setNewPayMethod] = useState(1);
  const [newPayNotes, setNewPayNotes] = useState('');

  // Expense Form State
  const [newExpCategory, setNewExpCategory] = useState(9); // Default: Yuklarni tashish / Ko'tarish
  const [newExpAmount, setNewExpAmount] = useState<number | ''>('');
  const [newExpCurrency, setNewExpCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [newExpRate, setNewExpRate] = useState<number | ''>('');
  const [newExpAmountUsd, setNewExpAmountUsd] = useState<number | ''>('');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpDate, setNewExpDate] = useState(new Date().toISOString().split('T')[0]);

  // Purchase Form State
  const [isNewMaterial, setIsNewMaterial] = useState(false);
  const [newPurMatName, setNewPurMatName] = useState('');
  const [newPurMatBrand, setNewPurMatBrand] = useState('');
  const [newPurMatUnit, setNewPurMatUnit] = useState('dona');
  const [newPurMatId, setNewPurMatId] = useState('');
  const [newPurQty, setNewPurQty] = useState<number | ''>('');
  const [newPurPrice, setNewPurPrice] = useState<number | ''>('');
  const [newPurCurrency, setNewPurCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [newPurRate, setNewPurRate] = useState<number | ''>('');
  const [newPurPriceUsd, setNewPurPriceUsd] = useState<number | ''>('');
  const [newPurSupplier, setNewPurSupplier] = useState('');

  // Worker Payment Form State
  const [isNewWorker, setIsNewWorker] = useState(false);
  const [newWorkerFullName, setNewWorkerFullName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerSpecialty, setNewWorkerSpecialty] = useState('');
  const [newWorkId, setNewWorkId] = useState('');
  const [newWorkDesc, setNewWorkDesc] = useState('');
  const [newWorkAgreed, setNewWorkAgreed] = useState<number | ''>('');
  const [newWorkCurrency, setNewWorkCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [newWorkRate, setNewWorkRate] = useState<number | ''>('');
  const [newWorkAgreedUsd, setNewWorkAgreedUsd] = useState<number | ''>('');

  // Pay Worker Modal State
  const [isPayWorkerModalOpen, setIsPayWorkerModalOpen] = useState(false);
  const [selectedWorkerForPay, setSelectedWorkerForPay] = useState<WorkerPayment | null>(null);
  const [payWorkerAmount, setPayWorkerAmount] = useState<number | ''>('');
  const [payWorkerCurrency, setPayWorkerCurrency] = useState<'UZS' | 'USD'>('UZS');
  const [payWorkerRate, setPayWorkerRate] = useState<number | ''>('');
  const [payWorkerAmountUsd, setPayWorkerAmountUsd] = useState<number | ''>('');
  const [payWorkerDate, setPayWorkerDate] = useState(new Date().toISOString().split('T')[0]);
  const [payWorkerNotes, setPayWorkerNotes] = useState('');

  // Document Upload State
  const [selectedDocFile, setSelectedDocFile] = useState<File | null>(null);
  const [docUploadMode, setDocUploadMode] = useState<'file' | 'url'>('file');
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);

  // Update Work Amount (Hakediş) Modal State
  const [isWorkAmountModalOpen, setIsWorkAmountModalOpen] = useState(false);
  const [selectedWorkerForWorkAmount, setSelectedWorkerForWorkAmount] = useState<WorkerPayment | null>(null);
  const [workAmountInput, setWorkAmountInput] = useState<number | ''>('');
  const [workAmountNotes, setWorkAmountNotes] = useState('');

  // Extra Work Form State
  const [newExtraTitle, setNewExtraTitle] = useState('');
  const [newExtraCustAmt, setNewExtraCustAmt] = useState<number | ''>('');
  const [newExtraCost, setNewExtraCost] = useState<number | ''>('');

  // Photo Form State
  const [newPhotoUrl, setNewPhotoUrl] = useState('');
  const [newPhotoCaption, setNewPhotoCaption] = useState('');
  const [newPhotoVisible, setNewPhotoVisible] = useState(true);

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

      if (cMat.length > 0) setNewPurMatId(cMat[0].id);
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
    const isUsd = newExpCurrency === 'USD';
    const amountVal = isUsd ? Number(newExpAmountUsd) : Number(newExpAmount);
    const rateVal = isUsd ? Number(newExpRate) : undefined;

    if (!amountVal || amountVal <= 0) {
      alert("Summa 0 dan katta bo'lishi kerak.");
      return;
    }
    if (isUsd && (!rateVal || rateVal <= 0)) {
      alert("Dollar kursini kiriting (masalan: 11 750).");
      return;
    }

    try {
      await projectsApi.createExpense(id, {
        category: newExpCategory,
        amount: isUsd ? Math.round(amountVal * (rateVal || 1)) : amountVal,
        currency: newExpCurrency,
        exchangeRateToUzs: rateVal,
        originalAmount: isUsd ? amountVal : undefined,
        description: newExpDesc.trim(),
        expenseDate: new Date(newExpDate).toISOString(),
      });
      setIsExpenseModalOpen(false);
      setNewExpAmount('');
      setNewExpAmountUsd('');
      setNewExpRate('');
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
    const isUsd = newPurCurrency === 'USD';
    const unitPriceVal = isUsd ? Number(newPurPriceUsd) : Number(newPurPrice);
    const rateVal = isUsd ? Number(newPurRate) : undefined;

    if (!unitPriceVal || unitPriceVal <= 0) {
      alert("Narx 0 dan katta bo'lishi kerak.");
      return;
    }
    if (isUsd && (!rateVal || rateVal <= 0)) {
      alert("Dollar kursini kiriting (masalan: 11 750).");
      return;
    }

    try {
      let finalMaterialId = newPurMatId;

      if (isNewMaterial) {
        const createdMat = await materialsApi.create({
          name: newPurMatName,
          brand: newPurMatBrand || undefined,
          unit: newPurMatUnit
        });
        finalMaterialId = createdMat.id;
      }

      await projectsApi.createPurchase(id, {
        materialId: finalMaterialId,
        brand: newPurMatBrand || undefined,
        quantity: Number(newPurQty) || 0,
        unitPrice: isUsd ? Math.round(unitPriceVal * (rateVal || 1)) : unitPriceVal,
        currency: newPurCurrency,
        exchangeRateToUzs: rateVal,
        originalUnitPrice: isUsd ? unitPriceVal : undefined,
        supplier: newPurSupplier || undefined,
        purchaseDate: new Date().toISOString()
      });
      setIsPurchaseModalOpen(false);
      setIsNewMaterial(false);
      setNewPurMatName('');
      setNewPurMatBrand('');
      setNewPurQty('');
      setNewPurPrice('');
      setNewPurPriceUsd('');
      setNewPurRate('');
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
    const isUsd = newWorkCurrency === 'USD';
    const agreedVal = isUsd ? Number(newWorkAgreedUsd) : Number(newWorkAgreed);
    const rateVal = isUsd ? Number(newWorkRate) : undefined;

    if (!Number.isFinite(agreedVal) || agreedVal <= 0) {
      alert("Kelishilgan summa 0 dan katta bo'lishi kerak.");
      return;
    }
    if (isUsd && (!rateVal || rateVal <= 0)) {
      alert("Dollar kursini kiriting (masalan: 11 750).");
      return;
    }

    const effectiveAgreed = isUsd ? Math.round(agreedVal * (rateVal || 1)) : agreedVal;

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
        agreedAmount: effectiveAgreed,
        currency: newWorkCurrency,
        exchangeRateToUzs: rateVal,
        originalAgreedAmount: isUsd ? agreedVal : undefined,
      });
      setIsWorkerModalOpen(false);
      setIsNewWorker(false);
      setNewWorkerFullName('');
      setNewWorkerPhone('');
      setNewWorkDesc('');
      setNewWorkAgreed('');
      setNewWorkAgreedUsd('');
      setNewWorkRate('');
      setNewWorkCurrency('UZS');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const openPayWorkerModal = (wp: WorkerPayment) => {
    setSelectedWorkerForPay(wp);
    const maxAllowed = Math.max(0, wp.remainingAllowedToPay ?? wp.agreedAmount - wp.paidAmount);
    setPayWorkerAmount(maxAllowed > 0 ? maxAllowed : '');
    setPayWorkerAmountUsd('');
    setPayWorkerRate('');
    setPayWorkerCurrency('UZS');
    setPayWorkerDate(new Date().toISOString().split('T')[0]);
    setPayWorkerNotes('');
    setIsPayWorkerModalOpen(true);
  };

  const submitPayWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !selectedWorkerForPay) return;
    const isUsd = payWorkerCurrency === 'USD';
    const amountVal = isUsd ? Number(payWorkerAmountUsd) : Number(payWorkerAmount);
    const rateVal = isUsd ? Number(payWorkerRate) : undefined;

    if (!amountVal || amountVal <= 0) {
      alert("Iltimos, to'g'ri to'lov summasini kiriting.");
      return;
    }
    if (isUsd && (!rateVal || rateVal <= 0)) {
      alert("Dollar kursini kiriting (masalan: 11 750).");
      return;
    }

    const effectiveAmountInUzs = isUsd ? Math.round(amountVal * (rateVal || 1)) : amountVal;
    const maxAllowed = selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount;

    if (effectiveAmountInUzs > maxAllowed) {
      alert(`⚠️ Ustaga faqat ${maxAllowed.toLocaleString()} so'm to'lash mumkin. Kiritilgan summa (${effectiveAmountInUzs.toLocaleString()} so'm) kelishilgan umumiy summadan (${selectedWorkerForPay.agreedAmount.toLocaleString()} so'm) oshib ketmoqda.`);
      return;
    }

    try {
      await projectsApi.payWorker(id, selectedWorkerForPay.id, {
        amount: effectiveAmountInUzs,
        currency: payWorkerCurrency,
        exchangeRateToUzs: rateVal,
        originalAmount: isUsd ? amountVal : undefined,
        paymentDate: new Date(payWorkerDate).toISOString(),
        notes: payWorkerNotes || undefined
      });
      setIsPayWorkerModalOpen(false);
      setSelectedWorkerForPay(null);
      setPayWorkerAmount('');
      setPayWorkerAmountUsd('');
      setPayWorkerRate('');
      setPayWorkerCurrency('UZS');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik yuz berdi');
    }
  };

  const openWorkAmountModal = (wp: WorkerPayment) => {
    setSelectedWorkerForWorkAmount(wp);
    setWorkAmountInput(wp.workAmount || '');
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

    if (workAmt > selectedWorkerForWorkAmount.agreedAmount) {
      alert(`⚠️ Ishlangan haq kelishilgan umumiy summadan ($${selectedWorkerForWorkAmount.agreedAmount.toLocaleString()}) ko'p bo'lishi mumkin emas.`);
      return;
    }

    try {
      await projectsApi.updateWorkAmount(id, selectedWorkerForWorkAmount.id, workAmt, workAmountNotes || undefined);
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
    return <div className="p-8 text-center text-xs text-gray-500">Loyiha yuklanmoqda...</div>;
  }

  return (
    <div className="p-6 space-y-4 bg-white">
      {/* Detail Head */}
      <div className="flex flex-wrap items-start gap-4">
        <button
          onClick={() => navigate('/projects')}
          className="border border-[#e4e7ec] bg-white hover:bg-gray-50 rounded-lg h-[34px] px-3 text-xs text-gray-700 font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Loyihalar</span>
        </button>

        <div>
          <h2 className="text-xl font-bold text-[#171b25]">{project.name}</h2>
          <p className="text-xs text-[#7b8190] mt-0.5">
            {project.customerName} · {project.location || 'Toshkent'}
          </p>
        </div>

        <div className="flex items-center gap-2 ml-auto">
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
      <div className="flex gap-1.5 overflow-x-auto pb-1 border-b border-[#e4e7ec]">
        {[
          { id: 'overview', label: 'Umumiy ko‘rinish' },
          { id: 'finance', label: 'Moliya & To\'lovlar' },
          { id: 'tasks', label: 'Vazifalar' },
          { id: 'materials', label: 'Materiallar' },
          { id: 'workers', label: 'Ustalar & Ish haqi' },
          { id: 'extraworks', label: 'Qo\'shimcha ishlar' },
          { id: 'photos', label: 'Fotosuratlar' },
          { id: 'documents', label: 'Hujjatlar' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`border rounded-lg px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-[#eef5ff] text-[#2563c7] border-[#cfe0fb]'
                : 'bg-white text-[#6c7380] border-[#e4e7ec] hover:bg-gray-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* 4 Finance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* SHARTNOMA CARD */}
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">SHARTNOMA</small>
          {(() => {
            const isUzs = (project.currency || 'USD').toUpperCase() === 'UZS';
            const uzsAmount = summary?.contractAmountUzs ?? project.contractAmountUzs;
            const usdAmount = summary?.contractAmount ?? project.contractAmount;
            if (isUzs && uzsAmount) {
              return (
                <>
                  <b className="text-xl font-extrabold text-[#171b25] block mt-1.5">
                    {uzsAmount.toLocaleString()} so'm
                  </b>
                  <span className="text-[11px] text-gray-400 mt-0.5 block">
                    ≈ ${usdAmount.toLocaleString()}
                    {project.exchangeRate && <span className="ml-1 text-[10px]">(kurs: {project.exchangeRate.toLocaleString()})</span>}
                  </span>
                </>
              );
            }
            return <b className="text-xl font-extrabold text-[#171b25] block mt-1.5">${usdAmount.toLocaleString()}</b>;
          })()}
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">OLINGAN TO'LOV</small>
          <b className="text-xl font-extrabold text-[#21bd68] block mt-1.5">${summary?.totalPaid.toLocaleString() ?? 0}</b>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">QOLGAN TO'LOV (QARZ)</small>
          <b className="text-xl font-extrabold text-[#ff7a16] block mt-1.5">${(summary?.remainingPayment ?? project.contractAmount).toLocaleString()}</b>
        </div>
        {(() => {
          const netBal = summary?.netBalance ?? ((summary?.totalPaid ?? 0) - (summary?.totalExpenses ?? 0));
          const isNegative = netBal < 0;
          return (
            <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">NET BALANS (QO'LDAGI SUMMA)</small>
                  <span className={`text-[9px] px-1 py-0.2 rounded font-bold ${isNegative ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    {isNegative ? 'Kamomad' : 'Kassa ijobiy'}
                  </span>
                </div>
                <b className={`text-xl font-extrabold block mt-1.5 ${isNegative ? 'text-red-600' : 'text-[#21bd68]'}`}>
                  {isNegative ? `-$${Math.abs(netBal).toLocaleString()}` : `$${netBal.toLocaleString()}`}
                </b>
              </div>
              <div className="text-[10px] text-gray-400 mt-1 flex items-center justify-between">
                <span>Olingan to'lov − Xarajatlar</span>
                {summary?.grossProfit !== undefined && (
                  <span className="text-[9px] text-purple-600 font-medium" title="Kutilayotgan sof foyda">
                    Kutilayotgan: ${summary.grossProfit.toLocaleString()}
                  </span>
                )}
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
            <div className="lg:col-span-7 bg-white border border-[#e4e7ec] rounded-xl p-5 shadow-xs flex flex-col justify-between space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
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
                <div className="grid grid-cols-3 text-xs pt-1">
                  <div>
                    <span className="block text-[10px] text-[#8c929d]">Boshlanish</span>
                    <strong className="text-gray-900 font-bold text-xs">{formatDateUz(project.startDate)}</strong>
                  </div>
                  <div className="text-center">
                    <span className="block text-[10px] text-[#ff7a16] font-semibold">Holati</span>
                    <strong className="text-[#ff7a16] font-bold text-xs">{project.statusName}</strong>
                  </div>
                  <div className="text-right">
                    <span className="block text-[10px] text-[#8c929d]">Topshirish</span>
                    <strong className="text-gray-900 font-bold text-xs">{project.endDate ? formatDateUz(project.endDate) : 'Belgilanmagan'}</strong>
                  </div>
                </div>
              </div>

              {/* Mini Stats Footer */}
              <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-gray-100 bg-gray-50/70 p-2.5 rounded-lg text-xs">
                <div>
                  <span className="block text-[10px] text-gray-500">Jami vazifalar:</span>
                  <b className="text-gray-800">{tasks.length} ta</b>
                </div>
                <div className="text-center">
                  <span className="block text-[10px] text-gray-500">Bajarilgan:</span>
                  <b className="text-emerald-600">{tasks.filter(t => t.isCompleted).length} ta</b>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] text-gray-500">Kutilmoqda:</span>
                  <b className="text-orange-600">{tasks.filter(t => !t.isCompleted).length} ta</b>
                </div>
              </div>
            </div>

            {/* Recent Financial Movements */}
            <div className="lg:col-span-5 bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
              <h3 className="font-bold text-xs text-[#171b25] mb-2.5">So'nggi Moliya Harakatlari</h3>
              <div className="divide-y divide-[#eef0f3] text-xs">
                {payments.slice(0, 2).map((p) => (
                  <div key={p.id} className="py-2 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">Mijoz to‘lovi ({p.paymentMethodName})</div>
                      <div className="text-[10px] text-gray-400">{formatDateUz(p.paymentDate)}</div>
                    </div>
                    <span className="text-[#21bd68] font-bold">+${p.amount.toLocaleString()}</span>
                  </div>
                ))}
                {expenses.slice(0, 2).map((e) => (
                  <div key={e.id} className="py-2 flex justify-between items-center">
                    <div>
                      <div className="font-semibold text-gray-800">{e.categoryName}: {e.description}</div>
                      <div className="text-[10px] text-gray-400">{formatDateUz(e.expenseDate)}</div>
                    </div>
                    <span className="text-[#ef5350] font-bold">-${e.amount.toLocaleString()}</span>
                  </div>
                ))}
                {payments.length === 0 && expenses.length === 0 && (
                  <div className="py-6 text-center text-gray-400 text-[11px]">Hali harakatlar mavjud emas</div>
                )}
              </div>
            </div>
          </div>

          {/* Tasks in this project */}
          <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#e4e7ec]">
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

            <table className="w-full text-left text-xs">
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
                      <div className="flex items-center gap-2">
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
      )}

      {/* TAB 2: FINANCE & PAYMENTS (Mijoz To'lovlari / Kirim) */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#e4e7ec] bg-emerald-50/30">
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
              {payments.map((p) => (
                <div key={p.id} className="p-4 flex justify-between items-center text-xs hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <span>${p.amount.toLocaleString()}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-medium">{p.paymentMethodName}</span>
                    </div>
                    <div className="text-[11px] text-gray-400">
                      Sana: {formatDateUz(p.paymentDate)} · Qabul qildi: <b className="text-gray-700">{p.receivedByName}</b>
                    </div>
                    {p.notes && <div className="text-[11px] text-gray-600 bg-gray-50 px-2 py-1 rounded mt-1 border border-gray-100">Izoh: {p.notes}</div>}
                  </div>
                  <span className="text-emerald-700 font-extrabold text-base">+${p.amount.toLocaleString()}</span>
                </div>
              ))}
              {payments.length === 0 && (
                <div className="py-12 text-center text-xs text-gray-400">
                  Mijozdan to'lovlar hali qabul qilinmagan. Yuqoridagi "+ To'lov qabul qilish" orqali kiritishingiz mumkin.
                </div>
              )}
            </div>
          </div>

          {/* Loyiha Qo'shimcha Xarajatlari (Yuk tashish, Tozalash, Gipskarton va b.) */}
          <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#e4e7ec] bg-red-50/30">
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
                onClick={() => setIsExpenseModalOpen(true)}
                className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3.5 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Qo'shimcha xarajat kiritish</span>
              </button>
            </div>

            <div className="divide-y divide-gray-100 max-h-[450px] overflow-y-auto custom-scrollbar">
              {expenses.map((exp) => (
                <div key={exp.id} className="p-4 flex justify-between items-center text-xs hover:bg-gray-50/50 transition-colors">
                  <div className="space-y-0.5">
                    <div className="font-bold text-sm text-gray-900 flex items-center gap-2">
                      <span>{exp.amount.toLocaleString()} so'm</span>
                      {exp.currency === 'USD' && exp.originalAmount && (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ${exp.originalAmount.toLocaleString()} (kurs: {exp.exchangeRateToUzs?.toLocaleString() || '-'})
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
                    <span className="text-red-600 font-extrabold text-base block">-${exp.amount.toLocaleString()} so'm</span>
                    {exp.currency === 'USD' && exp.originalAmount && (
                      <span className="text-xs text-gray-500 font-medium block">
                        -${exp.originalAmount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              ))}
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
          <div className="flex justify-between items-center pb-3 border-b border-[#e4e7ec]">
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
                className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-colors ${
                  t.isCompleted ? 'bg-emerald-50/40 border-emerald-200' : 'bg-white border-gray-200 hover:border-orange-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-5 h-5 rounded flex items-center justify-center border ${t.isCompleted ? 'bg-[#21bd68] border-[#21bd68] text-white' : 'border-gray-300'}`}>
                    {t.isCompleted && <CheckCircle2 className="w-3.5 h-3.5" />}
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-gray-900">{t.title}</div>
                    <div className="text-[10px] text-gray-400">Bosqich: {t.stageName || 'Asosiy'} · Muddat: {formatDateUz(t.dueDate)}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
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
            <div className="flex justify-between items-center pb-3 border-b border-[#e4e7ec] mb-3">
              <div>
                <h3 className="font-bold text-xs text-[#171b25]">Materiallar Xulosasi (Tahlil)</h3>
                <div className="text-[10px] text-[#9399a4]">Qaysi materialdan qancha olingani va jami summasi</div>
              </div>
              <button
                onClick={() => setIsPurchaseModalOpen(true)}
                className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Material xaridi kiritish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {materialsSummary.map((m) => (
                <div key={m.materialId} className="p-3 bg-white border border-gray-200 rounded-xl shadow-xs space-y-1.5">
                  <div className="flex items-center justify-between">
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
                    <b className="text-[#ff7a16] font-bold">${m.totalCost.toLocaleString()}</b>
                  </div>
                </div>
              ))}
              {materialsSummary.length === 0 && (
                <div className="col-span-3 py-6 text-center text-xs text-gray-400">Material xaridlari mavjud emas</div>
              )}
            </div>
          </div>

          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-xs text-[#171b25] mb-3">Barcha Xarid Cheklari</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
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
                            <span className="font-bold text-emerald-700">${pur.originalUnitPrice.toLocaleString()}</span>
                            <div className="text-[10px] text-gray-400">kurs: {pur.exchangeRateToUzs?.toLocaleString()} ({pur.unitPrice.toLocaleString()} so'm)</div>
                          </div>
                        ) : (
                          `${pur.unitPrice.toLocaleString()} so'm`
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#ff7a16]">
                        {pur.currency === 'USD' && pur.originalUnitPrice ? (
                          <div>
                            <span className="text-emerald-700 font-bold">${(pur.originalUnitPrice * pur.quantity).toLocaleString()}</span>
                            <div className="text-[10px] text-gray-500 font-normal">({pur.totalCost.toLocaleString()} so'm)</div>
                          </div>
                        ) : (
                          `${pur.totalCost.toLocaleString()} so'm`
                        )}
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
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-[#e4e7ec] gap-3">
              <div>
                <h3 className="font-bold text-xs text-[#171b25]">Ustalar Balansi (Qarzlar Nazorati)</h3>
                <div className="text-[10px] text-[#9399a4]">Usta qancha ishladi, qancha to'landi, qancha qarzmiz</div>
              </div>
              <button
                onClick={() => setIsWorkerModalOpen(true)}
                className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Ustaga ish biriktirish</span>
              </button>
            </div>

            {/* WORKER CARDS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {workersSummary.map((w) => {
                const debt = w.totalAgreedAmount - w.totalPaidAmount;
                const isFullyPaid = w.totalAgreedAmount > 0 && w.totalPaidAmount >= w.totalAgreedAmount;
                const isOverpaid = debt < 0;

                return (
                  <div key={w.workerId} className="p-3.5 bg-white border border-gray-200 rounded-xl shadow-xs space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-xs text-gray-900">{w.workerName}</div>
                      <span className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-600 font-medium">{w.specialty || 'Usta'}</span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex justify-between text-gray-600">
                        <span>Kelishilgan:</span>
                        <b className="text-gray-900">${w.totalAgreedAmount.toLocaleString()}</b>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Ishlangan haq:</span>
                        <b className="text-purple-700">${w.totalWorkAmount.toLocaleString()}</b>
                      </div>
                      <div className="flex justify-between text-emerald-700">
                        <span>To'langan:</span>
                        <b>${w.totalPaidAmount.toLocaleString()}</b>
                      </div>
                      <div className="flex justify-between items-center pt-1.5 border-t border-gray-100">
                        <span className="text-gray-600 font-medium">Qoldiq qarzimiz:</span>
                        <b className={isOverpaid ? 'text-red-600' : isFullyPaid ? 'text-emerald-700' : 'text-gray-900'}>
                          {isOverpaid ? `-$${Math.abs(debt).toLocaleString()}` : `$${debt.toLocaleString()}`}
                        </b>
                      </div>
                    </div>

                    <div className="pt-1">
                      {isFullyPaid ? (
                        <span className="w-full inline-flex justify-center items-center gap-1 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          ✅ To'liq to'langan
                        </span>
                      ) : w.totalPaidAmount > 0 ? (
                        <span className="w-full inline-flex justify-center items-center gap-1 py-1 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          ⏳ Qisman to'langan (Qoldiq: ${debt.toLocaleString()})
                        </span>
                      ) : (
                        <span className="w-full inline-flex justify-center items-center gap-1 py-1 rounded-md text-[10px] font-bold bg-gray-50 text-gray-600 border border-gray-200">
                          To'lanmagan (Qoldiq: ${debt.toLocaleString()})
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {workersSummary.length === 0 && (
                <div className="col-span-3 py-6 text-center text-xs text-gray-400">
                  Ushbu loyihaga hali usta biriktirilmagan
                </div>
              )}
            </div>
          </div>

          {/* TABLE OF WORKER JOBS */}
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-xs text-[#171b25] mb-3">Bajarilayotgan Ishlar Ro'yxati</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
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
                          {wp.currency === 'USD' && wp.originalAgreedAmount ? (
                            <div>
                              <span className="text-emerald-700 font-bold">${wp.originalAgreedAmount.toLocaleString()}</span>
                              <div className="text-[10px] text-gray-400 font-normal">kurs: {wp.exchangeRateToUzs?.toLocaleString()} ({wp.agreedAmount.toLocaleString()} so'm)</div>
                            </div>
                          ) : (
                            `${wp.agreedAmount.toLocaleString()} so'm`
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-purple-700">{wp.workAmount.toLocaleString()} so'm</td>
                        <td className="py-2.5 px-3 font-semibold text-emerald-700">{wp.paidAmount.toLocaleString()} so'm</td>
                        <td className="py-2.5 px-3 font-bold">
                          <span className={isOverpaid ? 'text-red-600' : isFullyPaid ? 'text-emerald-700' : 'text-gray-900'}>
                            {isOverpaid ? `-${Math.abs(debt).toLocaleString()} so'm` : `${debt.toLocaleString()} so'm`}
                          </span>
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
                        <td className="py-2.5 px-3 text-right space-x-1.5 whitespace-nowrap">
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
          <div className="flex justify-between items-center pb-3 border-b border-[#e4e7ec]">
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
              <div key={ew.id} className="p-3.5 bg-white border border-gray-200 rounded-lg flex items-center justify-between shadow-xs">
                <div>
                  <div className="font-bold text-xs text-gray-900">{ew.title}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{ew.description || 'Izohsiz'}</div>
                  <div className="flex gap-4 mt-2 text-xs">
                    <span className="text-gray-600">Mijoz narxi: <b>${ew.customerAmount.toLocaleString()}</b></span>
                    <span className="text-gray-600">Tannarx: <b>${ew.actualCost.toLocaleString()}</b></span>
                    <span className="text-emerald-700 font-bold">Foyda: +${(ew.customerAmount - ew.actualCost).toLocaleString()}</span>
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
          <div className="flex justify-between items-center pb-3 border-b border-[#e4e7ec]">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>{formatDateUz(ph.photoDate)}</span>
                    <span className={ph.isVisibleToCustomer ? 'text-emerald-600 font-bold' : 'text-gray-500'}>
                      {ph.isVisibleToCustomer ? 'Mijozga ochiq' : 'Ichki'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
            {photos.length === 0 && (
              <div className="col-span-3 py-12 text-center text-xs text-gray-400">Rasmlar yuklanmagan</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 8: DOCUMENTS & SHARTNOMALAR */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-[#e4e7ec]">
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

          {/* Add Document Form */}
          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                <Upload className="w-4 h-4 text-[#ff7a16]" />
                <span>Yangi Hujjat / Shartnoma Qo'shish</span>
              </div>
              <div className="flex items-center bg-gray-200/80 p-0.5 rounded-lg text-[11px] font-semibold">
                <button
                  type="button"
                  onClick={() => setDocUploadMode('file')}
                  className={`px-2.5 py-1 rounded-md transition-all ${docUploadMode === 'file' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  📁 Kompyuterdan fayl yuklash
                </button>
                <button
                  type="button"
                  onClick={() => setDocUploadMode('url')}
                  className={`px-2.5 py-1 rounded-md transition-all ${docUploadMode === 'url' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-700'}`}
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
              className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center"
            >
              {docUploadMode === 'file' ? (
                <div className="sm:col-span-1">
                  <label className="relative flex items-center justify-center gap-2 h-8 px-2 border-2 border-dashed border-[#ff7a16]/40 hover:border-[#ff7a16] bg-white rounded cursor-pointer text-[11px] font-medium text-gray-700 hover:bg-orange-50/40 transition-colors">
                    <Upload className="w-3.5 h-3.5 text-[#ff7a16]" />
                    <span className="truncate">{selectedDocFile ? selectedDocFile.name : 'Faylni tanlang...'}</span>
                    <input
                      type="file"
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
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
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
                      <div className="flex items-center gap-2">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
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
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsTaskModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD PAYMENT */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
            <h3 className="font-bold text-sm text-[#171b25]">Mijozdan To'lov Qabul Qilish</h3>
            <form onSubmit={handleCreatePayment} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Summa ($) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="5000"
                  value={newPayAmount}
                  onChange={(e) => setNewPayAmount(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                />
              </div>
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
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPaymentModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold">Qabul qilish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD EXPENSE */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
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
                  <option value={1}>👷 Mehnat va Usta (Labor)</option>
                  <option value={2}>🧱 Material (Material)</option>
                  <option value={5}>🤝 Subpudrat (Subcontractor)</option>
                  <option value={6}>➕ Qo'shimcha (Extra)</option>
                  <option value={7}>📋 Boshqa (Other)</option>
                </select>
              </div>
              {/* Currency Toggle */}
              <div>
                <label className="block text-xs font-semibold mb-1">To'lov Valyutasi</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setNewExpCurrency('UZS')}
                    className={`py-1 text-xs font-semibold rounded-md transition-all ${newExpCurrency === 'UZS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    🇺🇿 So'm (UZS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewExpCurrency('USD')}
                    className={`py-1 text-xs font-semibold rounded-md transition-all ${newExpCurrency === 'USD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    💵 Dollar (USD)
                  </button>
                </div>
              </div>

              {newExpCurrency === 'UZS' ? (
                <div>
                  <label className="block text-xs font-semibold mb-1">Summa (so'm) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="300 000"
                    value={newExpAmount}
                    onChange={(e) => setNewExpAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                  />
                </div>
              ) : (
                <div className="space-y-2 p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Dollar summasi ($) *</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        placeholder="100"
                        value={newExpAmountUsd}
                        onChange={(e) => setNewExpAmountUsd(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-8 px-2.5 border border-emerald-300 rounded text-xs bg-white outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Dollar kursi (manual) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="11750"
                        value={newExpRate}
                        onChange={(e) => setNewExpRate(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-8 px-2.5 border border-emerald-300 rounded text-xs bg-white outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  {Number(newExpAmountUsd) > 0 && Number(newExpRate) > 0 && (
                    <div className="text-[11px] font-semibold text-emerald-800 text-right">
                      = {(Number(newExpAmountUsd) * Number(newExpRate)).toLocaleString()} so'm
                    </div>
                  )}
                </div>
              )}
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
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: ADD MATERIAL PURCHASE */}
      {isPurchaseModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold text-sm text-[#171b25]">Material Xaridi Kiritish</h3>
              <button
                type="button"
                onClick={() => setIsNewMaterial(!isNewMaterial)}
                className="text-[11px] text-[#ff7a16] font-semibold hover:underline flex items-center gap-1"
              >
                <PackagePlus className="w-3.5 h-3.5" />
                <span>{isNewMaterial ? "Katalogdan tanlash" : "+ Yangi material qo'shish"}</span>
              </button>
            </div>

            <form onSubmit={handleCreatePurchase} className="space-y-3">
              {isNewMaterial ? (
                <div className="p-3 bg-orange-50/50 border border-orange-200 rounded-lg space-y-2">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Material Nomi *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ispan kafeli 60x60"
                      value={newPurMatName}
                      onChange={(e) => setNewPurMatName(e.target.value)}
                      className="w-full h-8 px-2.5 border border-gray-300 rounded text-xs bg-white outline-none focus:border-[#ff7a16]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">Brend / Ishlab chiqaruvchi</label>
                      <input
                        type="text"
                        placeholder="Knauf, Kerama Marazzi..."
                        value={newPurMatBrand}
                        onChange={(e) => setNewPurMatBrand(e.target.value)}
                        className="w-full h-8 px-2.5 border border-gray-300 rounded text-xs bg-white outline-none focus:border-[#ff7a16]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1">O'lchov Birligi *</label>
                      <select
                        value={newPurMatUnit}
                        onChange={(e) => setNewPurMatUnit(e.target.value)}
                        className="w-full h-8 px-2 border border-gray-300 rounded text-xs bg-white outline-none"
                      >
                        <option value="dona">dona</option>
                        <option value="m²">m²</option>
                        <option value="kg">kg</option>
                        <option value="qop">qop</option>
                        <option value="m³">m³</option>
                        <option value="metr">metr</option>
                        <option value="litr">litr</option>
                      </select>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Material *</label>
                    <select
                      value={newPurMatId}
                      onChange={(e) => {
                        setNewPurMatId(e.target.value);
                        const selMat = catalogMaterials.find(m => m.id === e.target.value);
                        if (selMat?.brand) setNewPurMatBrand(selMat.brand);
                      }}
                      required
                      className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                    >
                      {catalogMaterials.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name} {m.brand ? `[${m.brand}]` : ''} ({m.unit})
                        </option>
                      ))}
                      {catalogMaterials.length === 0 && (
                        <option value="">Materiallar yo'q — tepadan yangi qo'shing</option>
                      )}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">Brend / Ishlab chiqaruvchi</label>
                    <input
                      type="text"
                      placeholder="Knauf, Kerama Marazzi, Marshall..."
                      value={newPurMatBrand}
                      onChange={(e) => setNewPurMatBrand(e.target.value)}
                      className="w-full h-8 px-2.5 border border-gray-300 rounded-lg text-xs bg-white outline-none focus:border-[#ff7a16]"
                    />
                  </div>
                </div>
              )}

              {/* Currency Toggle */}
              <div>
                <label className="block text-xs font-semibold mb-1">Narx Valyutasi</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setNewPurCurrency('UZS')}
                    className={`py-1 text-xs font-semibold rounded-md transition-all ${newPurCurrency === 'UZS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    🇺🇿 So'm (UZS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewPurCurrency('USD')}
                    className={`py-1 text-xs font-semibold rounded-md transition-all ${newPurCurrency === 'USD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    💵 Dollar (USD)
                  </button>
                </div>
              </div>

              {newPurCurrency === 'UZS' ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-semibold mb-1">Miqdor *</label>
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
                  <div>
                    <label className="block text-xs font-semibold mb-1">Birlik narxi (so'm) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      step="any"
                      placeholder="250 000"
                      value={newPurPrice}
                      onChange={(e) => setNewPurPrice(e.target.value === '' ? '' : Number(e.target.value))}
                      className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
              ) : (
                <div className="space-y-2 p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Miqdor *</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        placeholder="50"
                        value={newPurQty}
                        onChange={(e) => setNewPurQty(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-8 px-2.5 border border-emerald-300 rounded text-xs bg-white outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Birlik narxi ($) *</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        placeholder="25"
                        value={newPurPriceUsd}
                        onChange={(e) => setNewPurPriceUsd(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-8 px-2.5 border border-emerald-300 rounded text-xs bg-white outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Dollar kursi *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="11750"
                        value={newPurRate}
                        onChange={(e) => setNewPurRate(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-8 px-2.5 border border-emerald-300 rounded text-xs bg-white outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  {Number(newPurQty) > 0 && Number(newPurPriceUsd) > 0 && Number(newPurRate) > 0 && (
                    <div className="text-[11px] font-semibold text-emerald-800 text-right">
                      = ${(Number(newPurQty) * Number(newPurPriceUsd)).toLocaleString()} × {Number(newPurRate).toLocaleString()} = {(Number(newPurQty) * Number(newPurPriceUsd) * Number(newPurRate)).toLocaleString()} so'm
                    </div>
                  )}
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
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPurchaseModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Xaridni Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD WORKER */}
      {isWorkerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
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
                  <div className="grid grid-cols-2 gap-2">
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
              {/* Currency Toggle */}
              <div>
                <label className="block text-xs font-semibold mb-1">Valyuta</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setNewWorkCurrency('UZS')}
                    className={`py-1 text-xs font-semibold rounded-md transition-all ${newWorkCurrency === 'UZS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    🇺🇿 So'm (UZS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewWorkCurrency('USD')}
                    className={`py-1 text-xs font-semibold rounded-md transition-all ${newWorkCurrency === 'USD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    💵 Dollar (USD)
                  </button>
                </div>
              </div>

              {newWorkCurrency === 'UZS' ? (
                <div>
                  <label className="block text-xs font-semibold mb-1">Kelishilgan Haq (so'm) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="3 000 000"
                    value={newWorkAgreed}
                    onChange={(e) => setNewWorkAgreed(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-[#ff7a16]"
                  />
                </div>
              ) : (
                <div className="space-y-2 p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Kelishilgan Haq ($) *</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        placeholder="300"
                        value={newWorkAgreedUsd}
                        onChange={(e) => setNewWorkAgreedUsd(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-8 px-2.5 border border-emerald-300 rounded text-xs bg-white outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Dollar kursi *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="11750"
                        value={newWorkRate}
                        onChange={(e) => setNewWorkRate(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-8 px-2.5 border border-emerald-300 rounded text-xs bg-white outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  {Number(newWorkAgreedUsd) > 0 && Number(newWorkRate) > 0 && (
                    <div className="text-[11px] font-semibold text-emerald-800 text-right">
                      = ${(Number(newWorkAgreedUsd)).toLocaleString()} × {Number(newWorkRate).toLocaleString()} = {(Number(newWorkAgreedUsd) * Number(newWorkRate)).toLocaleString()} so'm
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsWorkerModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Biriktirish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 6: ADD EXTRA WORK */}
      {isExtraWorkModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
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
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Mijoz Narxi ($) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="1500"
                    value={newExtraCustAmt}
                    onChange={(e) => setNewExtraCustAmt(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Tannarx ($) *</label>
                  <input
                    type="number"
                    required
                    min="0"
                    placeholder="800"
                    value={newExtraCost}
                    onChange={(e) => setNewExtraCost(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsExtraWorkModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: ADD PHOTO */}
      {isPhotoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
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
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="visCust"
                  checked={newPhotoVisible}
                  onChange={(e) => setNewPhotoVisible(e.target.checked)}
                  className="w-4 h-4 rounded text-[#ff7a16]"
                />
                <label htmlFor="visCust" className="text-xs text-gray-700">Mijoz portalida ko'rinsin</label>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsPhotoModalOpen(false)} className="px-3 py-1.5 border rounded-lg text-xs">Bekor qilish</button>
                <button type="submit" className="px-3 py-1.5 bg-[#ff7a16] text-white rounded-lg text-xs font-semibold">Yuklash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 8: PAY WORKER */}
      {isPayWorkerModalOpen && selectedWorkerForPay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#171b25] flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Ustaga Pul To'lash</span>
              </h3>
              <button onClick={() => setIsPayWorkerModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            {/* Worker Info Card */}
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg space-y-1 text-xs">
              <div className="font-bold text-gray-900">{selectedWorkerForPay.workerName} ({selectedWorkerForPay.workerSpecialty || 'Usta'})</div>
              <div className="text-gray-600">Ish tavsifi: <b className="text-gray-800">{selectedWorkerForPay.jobDescription}</b></div>
              <div className="grid grid-cols-3 gap-1 pt-2 mt-1 border-t border-gray-200 text-[11px]">
                <div>
                  <span className="text-gray-500">Kelishilgan:</span>
                  <div className="font-bold text-gray-900">
                    {selectedWorkerForPay.currency === 'USD' && selectedWorkerForPay.originalAgreedAmount
                      ? `$${selectedWorkerForPay.originalAgreedAmount.toLocaleString()} (${selectedWorkerForPay.agreedAmount.toLocaleString()} so'm)`
                      : `${selectedWorkerForPay.agreedAmount.toLocaleString()} so'm`}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500">To'langan:</span>
                  <div className="font-bold text-emerald-700">{selectedWorkerForPay.paidAmount.toLocaleString()} so'm</div>
                </div>
                <div>
                  <span className="text-gray-500">Qolgan limit:</span>
                  <div className="font-bold text-blue-700">{(selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount).toLocaleString()} so'm</div>
                </div>
              </div>
            </div>

            <form onSubmit={submitPayWorker} className="space-y-3">
              {/* Currency Toggle */}
              <div>
                <label className="block text-xs font-semibold mb-1">To'lov Valyutasi</label>
                <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setPayWorkerCurrency('UZS')}
                    className={`py-1 text-xs font-semibold rounded-md transition-all ${payWorkerCurrency === 'UZS' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    🇺🇿 So'm (UZS)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPayWorkerCurrency('USD')}
                    className={`py-1 text-xs font-semibold rounded-md transition-all ${payWorkerCurrency === 'USD' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500 hover:text-gray-800'}`}
                  >
                    💵 Dollar (USD)
                  </button>
                </div>
              </div>

              {payWorkerCurrency === 'UZS' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">To'lov Summasi (so'm) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder={`Maksimal: ${(selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount).toLocaleString()} so'm`}
                    value={payWorkerAmount}
                    onChange={(e) => setPayWorkerAmount(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-emerald-600"
                  />
                  {Number(payWorkerAmount) > (selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount) && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ Ustaga faqat {(selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount).toLocaleString()} so'm to'lash mumkin.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2 p-2.5 bg-emerald-50/50 border border-emerald-200 rounded-lg">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">To'lov summasi ($) *</label>
                      <input
                        type="number"
                        required
                        min="0.01"
                        step="any"
                        placeholder="100"
                        value={payWorkerAmountUsd}
                        onChange={(e) => setPayWorkerAmountUsd(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-8 px-2.5 border border-emerald-300 rounded text-xs bg-white outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-emerald-900 mb-1">Dollar kursi (manual) *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        placeholder="11750"
                        value={payWorkerRate}
                        onChange={(e) => setPayWorkerRate(e.target.value === '' ? '' : Number(e.target.value))}
                        className="w-full h-8 px-2.5 border border-emerald-300 rounded text-xs bg-white outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>
                  {Number(payWorkerAmountUsd) > 0 && Number(payWorkerRate) > 0 && (
                    <div className="text-[11px] font-semibold text-emerald-800 text-right">
                      = ${(Number(payWorkerAmountUsd)).toLocaleString()} × {Number(payWorkerRate).toLocaleString()} = {(Number(payWorkerAmountUsd) * Number(payWorkerRate)).toLocaleString()} so'm
                    </div>
                  )}
                  {Number(payWorkerAmountUsd) > 0 && Number(payWorkerRate) > 0 && (Number(payWorkerAmountUsd) * Number(payWorkerRate)) > (selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount) && (
                    <p className="text-[11px] text-red-600 mt-1 font-medium bg-red-50 p-2 rounded border border-red-200">
                      ⚠️ Hisoblangan summa ({(Number(payWorkerAmountUsd) * Number(payWorkerRate)).toLocaleString()} so'm) qoldiqdan oshib ketmoqda.
                    </p>
                  )}
                </div>
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

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsPayWorkerModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={
                    payWorkerCurrency === 'UZS'
                      ? (!payWorkerAmount ||
                         Number(payWorkerAmount) <= 0 ||
                         Number(payWorkerAmount) > (selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount))
                      : (!payWorkerAmountUsd ||
                         Number(payWorkerAmountUsd) <= 0 ||
                         !payWorkerRate ||
                         Number(payWorkerRate) <= 0 ||
                         (Number(payWorkerAmountUsd) * Number(payWorkerRate)) > (selectedWorkerForPay.agreedAmount - selectedWorkerForPay.paidAmount))
                  }
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-sm text-[#171b25] flex items-center gap-1.5">
                <HardHat className="w-4 h-4 text-purple-600" />
                <span>Ishlangan Haqni Kiritish (Hakediş)</span>
              </h3>
              <button onClick={() => setIsWorkAmountModalOpen(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
            </div>

            {/* Worker Info Card */}
            <div className="p-3 bg-purple-50/50 border border-purple-200 rounded-lg space-y-1 text-xs">
              <div className="font-bold text-purple-950">{selectedWorkerForWorkAmount.workerName}</div>
              <div className="text-gray-600">Ish: <b className="text-gray-800">{selectedWorkerForWorkAmount.jobDescription}</b></div>
              <div className="text-gray-600">Kelishilgan umumiy summa: <b className="text-gray-900">${selectedWorkerForWorkAmount.agreedAmount.toLocaleString()}</b></div>
            </div>

            <form onSubmit={submitWorkAmount} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Hozirgacha Bajarilgan Ish Haq Summasi ($) *</label>
                <input
                  type="number"
                  required
                  min="0"
                  step="any"
                  max={selectedWorkerForWorkAmount.agreedAmount}
                  placeholder={`Maksimal: $${selectedWorkerForWorkAmount.agreedAmount}`}
                  value={workAmountInput}
                  onChange={(e) => setWorkAmountInput(e.target.value === '' ? '' : Number(e.target.value))}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none focus:border-purple-600"
                />
                {Number(workAmountInput) > selectedWorkerForWorkAmount.agreedAmount && (
                  <p className="text-[11px] text-red-600 mt-1 font-medium bg-red-50 p-2 rounded border border-red-200">
                    ⚠️ Ishlangan haq kelishilgan umumiy summadan (${selectedWorkerForWorkAmount.agreedAmount.toLocaleString()}) oshishi mumkin emas.
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

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsWorkAmountModalOpen(false)}
                  className="px-3 py-1.5 border rounded-lg text-xs text-gray-600 hover:bg-gray-50"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  disabled={workAmountInput === '' || Number(workAmountInput) < 0 || Number(workAmountInput) > selectedWorkerForWorkAmount.agreedAmount}
                  className="px-4 py-1.5 bg-purple-600 text-white rounded-lg text-xs font-semibold hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};


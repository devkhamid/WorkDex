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
  Clock
} from 'lucide-react';
import { projectsApi, reportsApi, materialsApi, workersApi } from '../api/services';
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
  const [newExpCategory, setNewExpCategory] = useState(2);
  const [newExpAmount, setNewExpAmount] = useState<number | ''>('');
  const [newExpDesc, setNewExpDesc] = useState('');

  // Purchase Form State
  const [isNewMaterial, setIsNewMaterial] = useState(false);
  const [newPurMatName, setNewPurMatName] = useState('');
  const [newPurMatUnit, setNewPurMatUnit] = useState('dona');
  const [newPurMatId, setNewPurMatId] = useState('');
  const [newPurQty, setNewPurQty] = useState<number | ''>('');
  const [newPurPrice, setNewPurPrice] = useState<number | ''>('');
  const [newPurSupplier, setNewPurSupplier] = useState('');

  // Worker Payment Form State
  const [isNewWorker, setIsNewWorker] = useState(false);
  const [newWorkerFullName, setNewWorkerFullName] = useState('');
  const [newWorkerPhone, setNewWorkerPhone] = useState('');
  const [newWorkerSpecialty, setNewWorkerSpecialty] = useState('');
  const [newWorkId, setNewWorkId] = useState('');
  const [newWorkDesc, setNewWorkDesc] = useState('');
  const [newWorkAgreed, setNewWorkAgreed] = useState<number | ''>('');

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
    try {
      await projectsApi.createExpense(id, {
        category: newExpCategory,
        amount: Number(newExpAmount) || 0,
        description: newExpDesc,
        expenseDate: new Date().toISOString(),
      });
      setIsExpenseModalOpen(false);
      setNewExpAmount('');
      setNewExpDesc('');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleCreatePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      let finalMaterialId = newPurMatId;

      if (isNewMaterial) {
        const createdMat = await materialsApi.create({
          name: newPurMatName,
          unit: newPurMatUnit
        });
        finalMaterialId = createdMat.id;
      }

      await projectsApi.createPurchase(id, {
        materialId: finalMaterialId,
        quantity: Number(newPurQty) || 0,
        unitPrice: Number(newPurPrice) || 0,
        supplier: newPurSupplier || undefined,
        purchaseDate: new Date().toISOString()
      });
      setIsPurchaseModalOpen(false);
      setIsNewMaterial(false);
      setNewPurMatName('');
      setNewPurQty('');
      setNewPurPrice('');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleCreateWorkerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
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
        agreedAmount: Number(newWorkAgreed) || 0,
      });
      setIsWorkerModalOpen(false);
      setIsNewWorker(false);
      setNewWorkerFullName('');
      setNewWorkerPhone('');
      setNewWorkDesc('');
      setNewWorkAgreed('');
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handlePayWorker = async (paymentId: string) => {
    if (!id) return;
    const amountStr = prompt("Ustaga to'lanadigan summani kiriting ($):");
    if (!amountStr) return;
    const amount = Number(amountStr);
    if (isNaN(amount) || amount <= 0) return alert("Noto'g'ri summa");

    try {
      await projectsApi.payWorker(id, paymentId, amount, new Date().toISOString());
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
    }
  };

  const handleUpdateWorkAmount = async (paymentId: string) => {
    if (!id) return;
    const amountStr = prompt("Bajarilgan ish hajmi summasini kiriting (Ish haqi $):");
    if (!amountStr) return;
    const workAmount = Number(amountStr);
    if (isNaN(workAmount) || workAmount < 0) return alert("Noto'g'ri summa");

    try {
      await projectsApi.updateWorkAmount(id, paymentId, workAmount);
      loadAllData(id);
    } catch (err: any) {
      alert(err.response?.data?.message || 'Xatolik');
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
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">SHARTNOMA</small>
          <b className="text-xl font-extrabold text-[#171b25] block mt-1.5">${summary?.contractAmount.toLocaleString() ?? project.contractAmount.toLocaleString()}</b>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">OLINGAN TO'LOV</small>
          <b className="text-xl font-extrabold text-[#21bd68] block mt-1.5">${summary?.totalPaid.toLocaleString() ?? 0}</b>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">QOLGAN TO'LOV (QARZ)</small>
          <b className="text-xl font-extrabold text-[#ff7a16] block mt-1.5">${summary?.remainingPayment.toLocaleString() ?? project.contractAmount.toLocaleString()}</b>
        </div>
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-3.5 shadow-xs">
          <small className="block text-[9px] font-bold text-[#8e95a0] uppercase tracking-wider">KUTILAYOTGAN SOF FOYDA</small>
          <b className="text-xl font-extrabold text-[#8b5cf6] block mt-1.5">${summary?.grossProfit.toLocaleString() ?? 0}</b>
        </div>
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

      {/* TAB 2: FINANCE & PAYMENTS */}
      {activeTab === 'finance' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Payments Card */}
            <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#e4e7ec] bg-emerald-50/30">
                <div className="font-bold text-xs text-emerald-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Mijoz To'lovlari (Kirim)</span>
                </div>
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>To'lov qabul qilish</span>
                </button>
              </div>

              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto custom-scrollbar">
                {payments.map((p) => (
                  <div key={p.id} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-gray-800">${p.amount.toLocaleString()} ({p.paymentMethodName})</div>
                      <div className="text-[10px] text-gray-400">{formatDateUz(p.paymentDate)} · Qabul qildi: {p.receivedByName}</div>
                      {p.notes && <div className="text-[10px] text-gray-500 italic mt-0.5">{p.notes}</div>}
                    </div>
                    <span className="text-emerald-600 font-bold text-sm">+${p.amount.toLocaleString()}</span>
                  </div>
                ))}
                {payments.length === 0 && (
                  <div className="py-6 text-center text-xs text-gray-400">To'lovlar mavjud emas</div>
                )}
              </div>
            </div>

            {/* Expenses Card */}
            <div className="bg-white border border-[#e4e7ec] rounded-xl shadow-xs overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#e4e7ec] bg-red-50/30">
                <div className="font-bold text-xs text-red-800 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-red-600" />
                  <span>Xarajatlar (Chiqim — 7 Kategoriya)</span>
                </div>
                <button
                  onClick={() => setIsExpenseModalOpen(true)}
                  className="bg-red-600 hover:bg-red-700 text-white text-xs font-semibold px-3 py-1 rounded-lg flex items-center gap-1 shadow-xs"
                >
                  <Plus className="w-3 h-3" />
                  <span>Xarajat kiritish</span>
                </button>
              </div>

              <div className="divide-y divide-gray-100 max-h-80 overflow-y-auto custom-scrollbar">
                {expenses.map((e) => (
                  <div key={e.id} className="p-3 flex justify-between items-center text-xs">
                    <div>
                      <div className="font-semibold text-gray-800"><span className="px-1.5 py-0.5 bg-red-100 text-red-800 rounded text-[9px] mr-1">{e.categoryName}</span> {e.description}</div>
                      <div className="text-[10px] text-gray-400">{formatDateUz(e.expenseDate)} · Kiritdi: {e.createdByName}</div>
                    </div>
                    <span className="text-red-600 font-bold text-sm">-${e.amount.toLocaleString()}</span>
                  </div>
                ))}
                {expenses.length === 0 && (
                  <div className="py-6 text-center text-xs text-gray-400">Xarajatlar mavjud emas</div>
                )}
              </div>
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
                <div key={m.materialId} className="p-3 bg-white border border-gray-200 rounded-lg shadow-xs">
                  <div className="font-semibold text-xs text-gray-900 truncate">{m.materialName}</div>
                  <div className="flex justify-between mt-2 text-xs">
                    <span className="text-gray-500">Miqdor:</span>
                    <b className="text-gray-800">{m.totalQuantity} {m.unit}</b>
                  </div>
                  <div className="flex justify-between mt-1 text-xs">
                    <span className="text-gray-500">Jami xarajat:</span>
                    <b className="text-[#ff7a16]">${m.totalCost.toLocaleString()}</b>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-xs text-[#171b25] mb-3">Barcha Xarid Cheklari</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">SANA</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">MATERIAL</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">MIQDOR</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">NARX</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">JAMI</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">DO'KON</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map((pur) => (
                  <tr key={pur.id}>
                    <td className="py-2.5 px-3">{formatDateUz(pur.purchaseDate)}</td>
                    <td className="py-2.5 px-3 font-semibold">{pur.materialName}</td>
                    <td className="py-2.5 px-3">{pur.quantity} {pur.unit}</td>
                    <td className="py-2.5 px-3">${pur.unitPrice}</td>
                    <td className="py-2.5 px-3 font-bold text-[#ff7a16]">${pur.totalCost.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-gray-500">{pur.supplier || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: WORKERS & WORK PAYMENTS */}
      {activeTab === 'workers' && (
        <div className="space-y-4">
          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
            <div className="flex justify-between items-center pb-3 border-b border-[#e4e7ec] mb-3">
              <div>
                <h3 className="font-bold text-xs text-[#171b25]">Ustalar Balansi (Qarzlar Nazorati)</h3>
                <div className="text-[10px] text-[#9399a4]">Usta qancha ishladi, qancha to'landi, qancha qarzmiz</div>
              </div>
              <button
                onClick={() => setIsWorkerModalOpen(true)}
                className="bg-[#ff7a16] hover:bg-[#e86807] text-white text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Ustaga ish biriktirish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {workersSummary.map((w) => (
                <div key={w.workerId} className="p-3 bg-white border border-purple-200 rounded-lg shadow-xs">
                  <div className="font-bold text-xs text-purple-950">{w.workerName} ({w.specialty || 'Usta'})</div>
                  <div className="mt-2 space-y-1 text-xs">
                    <div className="flex justify-between text-gray-600"><span>Kelishilgan:</span> <b>${w.totalAgreedAmount.toLocaleString()}</b></div>
                    <div className="flex justify-between text-gray-600"><span>Ishlangan haq:</span> <b>${w.totalWorkAmount.toLocaleString()}</b></div>
                    <div className="flex justify-between text-emerald-700"><span>To'langan:</span> <b>${w.totalPaidAmount.toLocaleString()}</b></div>
                    <div className="flex justify-between text-red-600 pt-1 border-t border-purple-200">
                      <span>Qoldiq qarzimiz:</span> <b>${w.remainingAmount.toLocaleString()}</b>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs">
            <h3 className="font-bold text-xs text-[#171b25] mb-3">Bajarilayotgan Ishlar Ro'yxati</h3>
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#e4e7ec] bg-gray-50/50">
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">USTA</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">ISH TAVSIFI</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">KELISHILGAN</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">ISHLANGAN HAQ</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">TO'LANGAN</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px]">QARZ</th>
                  <th className="py-2 px-3 font-bold text-gray-500 text-[10px] text-right">AMALLAR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {workerPayments.map((wp) => (
                  <tr key={wp.id}>
                    <td className="py-2.5 px-3 font-semibold">{wp.workerName}</td>
                    <td className="py-2.5 px-3 text-gray-700">{wp.jobDescription}</td>
                    <td className="py-2.5 px-3 font-semibold">${wp.agreedAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-semibold text-purple-700">${wp.workAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-semibold text-emerald-700">${wp.paidAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 font-bold text-red-600">${wp.remainingAmount.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right space-x-1.5">
                      <button
                        onClick={() => handleUpdateWorkAmount(wp.id)}
                        className="px-2 py-1 bg-purple-50 text-purple-700 rounded border border-purple-200 text-[10px] font-semibold hover:bg-purple-100"
                      >
                        Ish haqini kiritish
                      </button>
                      <button
                        onClick={() => handlePayWorker(wp.id)}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 rounded border border-emerald-200 text-[10px] font-semibold hover:bg-emerald-100"
                      >
                        Pul to'lash
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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

      {/* TAB 8: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-[#e4e7ec] rounded-xl p-4 shadow-xs space-y-3">
          <div className="flex justify-between items-center pb-3 border-b border-[#e4e7ec]">
            <h3 className="font-bold text-xs text-[#171b25]">Hujjatlar & Shartnomalar</h3>
          </div>

          <div className="divide-y divide-gray-100">
            {documents.map((d) => (
              <div key={d.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[#ff7a16]" />
                  <div>
                    <div className="font-semibold text-gray-800">{d.title}</div>
                    <div className="text-[10px] text-gray-400">{d.filePath} · Yukladi: {d.uploadedByName}</div>
                  </div>
                </div>
                <a
                  href={d.filePath}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-gray-100 text-gray-700 rounded text-xs hover:bg-gray-200"
                >
                  Ochish
                </a>
              </div>
            ))}
            {documents.length === 0 && (
              <div className="py-8 text-center text-xs text-gray-400">Hujjatlar mavjud emas</div>
            )}
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
            <h3 className="font-bold text-sm text-[#171b25]">Xarajat Kiritish (7 Kategoriya)</h3>
            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">Kategoriya *</label>
                <select
                  value={newExpCategory}
                  onChange={(e) => setNewExpCategory(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                >
                  <option value={1}>1. Mehnat va Usta (Labor)</option>
                  <option value={2}>2. Material (Material)</option>
                  <option value={3}>3. Transport (Transport)</option>
                  <option value={4}>4. Yoqilg'i (Fuel)</option>
                  <option value={5}>5. Subpudrat (Subcontractor)</option>
                  <option value={6}>6. Qo'shimcha (Extra)</option>
                  <option value={7}>7. Boshqa (Other)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Summa ($) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="1200"
                  value={newExpAmount}
                  onChange={(e) => setNewExpAmount(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold mb-1">Tavsif *</label>
                <input
                  type="text"
                  required
                  placeholder="Material yetkazish uchun yuk mashinasi"
                  value={newExpDesc}
                  onChange={(e) => setNewExpDesc(e.target.value)}
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
              ) : (
                <div>
                  <label className="block text-xs font-semibold mb-1">Material *</label>
                  <select
                    value={newPurMatId}
                    onChange={(e) => setNewPurMatId(e.target.value)}
                    required
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs bg-white outline-none"
                  >
                    {catalogMaterials.map((m) => (
                      <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
                    ))}
                    {catalogMaterials.length === 0 && (
                      <option value="">Materiallar yo'q — tepadan yangi qo'shing</option>
                    )}
                  </select>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold mb-1">Miqdor *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    placeholder="50"
                    value={newPurQty}
                    onChange={(e) => setNewPurQty(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">Birlik narxi ($) *</label>
                  <input
                    type="number"
                    required
                    min="0.1"
                    step="any"
                    placeholder="25"
                    value={newPurPrice}
                    onChange={(e) => setNewPurPrice(Number(e.target.value))}
                    className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                  />
                </div>
              </div>
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
              <div>
                <label className="block text-xs font-semibold mb-1">Kelishilgan Haq ($) *</label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="3000"
                  value={newWorkAgreed}
                  onChange={(e) => setNewWorkAgreed(Number(e.target.value))}
                  className="w-full h-9 px-3 border border-gray-300 rounded-lg text-xs outline-none"
                />
              </div>
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
    </div>
  );
};

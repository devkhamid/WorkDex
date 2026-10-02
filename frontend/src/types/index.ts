export enum UserRole {
  SuperAdmin = 0,
  Admin = 1,
  ProjectManager = 2,
  FieldWorker = 3,
  Finance = 4,
  Customer = 5
}

// DIQQAT: qiymatlar backenddagi WorkDex.Api/Models/ProjectStatus.cs bilan
// aynan bir xil bo'lishi shart — bu enum yorliq rangi, matni va status
// filtriga to'g'ridan-to'g'ri raqam sifatida uzatiladi.
export enum ProjectStatus {
  Planning = 1,
  InProgress = 2,
  OnHold = 3,
  Completed = 4,
  Cancelled = 5
}

export enum PaymentMethod {
  Cash = 1,
  BankTransfer = 2,
  Card = 3,
  Other = 4
}

export enum ExpenseCategory {
  Labor = 1,
  Material = 2,
  Transport = 3,
  Fuel = 4,
  Subcontractor = 5,
  Extra = 6,
  Other = 7,
  Cleaning = 8,
  Carrying = 9,
  AdditionalWork = 10,
  Electricity = 11,
  Internet = 12,
  Rent = 13,
  OfficeSupplies = 14,
  Water = 15,
  Gas = 16,
  Communal = 17
}

export enum ExpenseFrequency {
  OneTime = 1,
  Daily = 2,
  Monthly = 3
}

export type Currency = 'USD' | 'UZS';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string;
  companyName?: string;
  role: UserRole;
  roleName: string;
  isActive: boolean;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  userId: string;
  fullName: string;
  email: string;
  role: UserRole;
  expiresAt: string;
}

export interface Customer {
  id: string;
  fullName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  notes?: string;
  createdAt: string;
  projectCount?: number;
  projects?: Project[];
}

export interface Project {
  id: string;
  name: string;
  projectType?: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  contractAmount: number;
  contractAmountUzs?: number; // UZS da kiritilgan asl shartnoma summasi
  budget: number;
  currency: string;
  exchangeRate?: number; // Loyiha yaratilgan paytdagi CBU kursi
  startDate: string;
  endDate?: string;
  actualEndDate?: string;
  status: ProjectStatus;
  statusName: string;
  progressPercent: number;
  location?: string;
  notes?: string;
  createdAt: string;
  stages?: ProjectStage[];
  members?: ProjectMember[];
}

export interface ProjectStage {
  id: string;
  projectId: string;
  name: string;
  description?: string;
  orderIndex: number;
  isCompleted: boolean;
  completedAt?: string;
}

export interface ProjectMember {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  roleInProject?: string;
  assignedAt: string;
}

export interface ProjectSummary {
  projectId: string;
  projectName: string;
  customerName: string;
  contractAmount: number;
  contractAmountUzs?: number; // UZS da kiritilgan asl shartnoma summasi
  currency: string;
  exchangeRate?: number;
  totalPaid: number;
  totalPaidUzs?: number;
  remainingPayment: number;
  remainingPaymentUzs?: number;
  materialExpenses: number;
  materialExpensesUzs?: number;
  laborExpenses: number;
  laborExpensesUzs?: number;
  otherExpenses: number;
  otherExpensesUzs?: number;
  extraWorkIncome: number;
  extraWorkCost: number;
  totalExpenses: number;
  totalExpensesUzs?: number;
  budgetUtilizationPercent: number;
  grossProfit: number;
  grossProfitUzs?: number;
  netBalance?: number;
  netBalanceUzs?: number;
  remainingBudget: number;
  progressPercent: number;
  status: ProjectStatus;
}

export interface Payment {
  id: string;
  projectId: string;
  amount: number; // USD
  currency?: Currency;
  exchangeRate?: number;
  originalAmount?: number;
  amountUzs?: number;
  paymentMethod: PaymentMethod;
  paymentMethodName: string;
  paymentDate: string;
  notes?: string;
  receivedByUserId: string;
  receivedByName: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  projectId?: string;
  category: ExpenseCategory;
  categoryName: string;
  frequency?: ExpenseFrequency;
  frequencyName?: string;
  amount: number; // so'm
  amountUsd?: number;
  currency?: string;
  exchangeRateToUzs?: number;
  originalAmount?: number;
  description: string;
  expenseDate: string;
  notes?: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface Material {
  id: string;
  name: string;
  brand?: string;
  unit: string;
  description?: string;
  purchaseCount?: number;
  createdAt: string;
}

export interface MaterialPurchase {
  id: string;
  projectId: string;
  materialId: string;
  materialName: string;
  brand?: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number; // so'm
  totalCostUsd?: number;
  currency?: string;
  exchangeRateToUzs?: number;
  originalUnitPrice?: number;
  supplier?: string;
  purchaseDate: string;
  receiptNumber?: string;
  notes?: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface MaterialSummary {
  materialId: string;
  materialName: string;
  brand?: string;
  unit: string;
  totalQuantity: number;
  totalCost: number;
  totalCostUsd?: number;
  purchaseCount: number;
}

export interface MaterialUsage {
  materialId: string;
  materialName: string;
  brand?: string;
  unit: string;
  projectId: string;
  projectName: string;
  totalQuantity: number;
  totalCost: number; // so'm
  totalCostUsd: number;
  averageUnitPrice: number; // so'm
  purchaseCount: number;
  lastPurchaseDate: string;
}

export interface Worker {
  id: string;
  fullName: string;
  phoneNumber: string;
  specialty?: string;
  notes?: string;
  createdAt: string;
}

export interface WorkerPayment {
  id: string;
  projectId: string;
  workerId: string;
  workerName: string;
  workerSpecialty?: string;
  jobDescription: string;
  agreedAmount: number;
  currency?: string;
  exchangeRateToUzs?: number;
  originalAgreedAmount?: number;
  workAmount: number;
  paidAmount: number;
  agreedAmountUsd?: number;
  paidAmountUsd?: number;
  remainingAmount: number;
  remainingAllowedToPay: number;
  isFullyPaid: boolean;
  paymentDate?: string;
  notes?: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface WorkerSummary {
  workerId: string;
  workerName: string;
  specialty?: string;
  totalAgreedAmount: number;
  totalWorkAmount: number;
  totalPaidAmount: number;
  remainingAmount: number;
  remainingAllowedToPay: number;
  isFullyPaid: boolean;
  jobCount: number;
}

export interface ExtraWork {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  customerAmount: number; // USD
  actualCost: number; // USD
  currency?: Currency;
  exchangeRate?: number;
  originalCustomerAmount?: number;
  originalActualCost?: number;
  customerAmountUzs?: number;
  actualCostUzs?: number;
  profitImpact: number;
  isApprovedByCustomer: boolean;
  approvedAt?: string;
  notes?: string;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  stageId?: string;
  stageName?: string;
  title: string;
  description?: string;
  assignedToUserId?: string;
  assignedToUserName?: string;
  weight: number;
  isCompleted: boolean;
  completedAt?: string;
  dueDate?: string;
  createdAt: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  title: string;
  filePath: string;
  fileType?: string;
  fileSizeBytes: number;
  uploadedByUserId: string;
  uploadedByName: string;
  createdAt: string;
}

export interface ProjectPhoto {
  id: string;
  projectId: string;
  stageId?: string;
  stageName?: string;
  photoUrl: string;
  caption?: string;
  isVisibleToCustomer: boolean;
  photoDate: string;
  uploadedByUserId: string;
  uploadedByName: string;
  createdAt: string;
}

export interface ProjectUpdate {
  id: string;
  projectId: string;
  stageId?: string;
  stageName?: string;
  message: string;
  isVisibleToCustomer: boolean;
  createdByUserId: string;
  createdByName: string;
  createdAt: string;
}

export interface DashboardStats {
  totalProjects: number;
  activeProjects: number;
  completedProjects: number;
  onHoldProjects: number;
  totalContractValue: number;
  totalRevenueReceived: number;
  totalPendingReceivables: number;
  totalExpenses: number;
  totalNetProfit: number;
  netBalance?: number;
  totalContractValueUzs?: number;
  totalRevenueReceivedUzs?: number;
  totalPendingReceivablesUzs?: number;
  totalExpensesUzs?: number;
  totalNetProfitUzs?: number;
  netBalanceUzs?: number;
  averageBudgetUtilizationPercent: number;
  atRiskProjectsCount: number;
}

export interface DashboardRecentActivity {
  activityType: string;
  title: string;
  projectName: string;
  amount?: number; // USD
  amountUzs?: number;
  createdByName: string;
  createdAt: string;
}

export interface CustomerPortalProject {
  projectId: string;
  projectName: string;
  projectType?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  status: ProjectStatus;
  statusName: string;
  progressPercent: number;
  contractAmount: number;
  totalPaid: number;
  remainingPayment: number;
  currency: string;
  stages: {
    id: string;
    name: string;
    description?: string;
    orderIndex: number;
    isCompleted: boolean;
    completedAt?: string;
  }[];
  photos: {
    id: string;
    stageName?: string;
    photoUrl: string;
    caption?: string;
    photoDate: string;
  }[];
  updates: {
    id: string;
    stageName?: string;
    message: string;
    createdAt: string;
  }[];
  approvedExtraWorks: {
    id: string;
    title: string;
    description?: string;
    amount: number;
    approvedAt?: string;
  }[];
}

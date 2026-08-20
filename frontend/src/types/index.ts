export enum UserRole {
  SuperAdmin = 0,
  Admin = 1,
  ProjectManager = 2,
  FieldWorker = 3,
  Finance = 4,
  Customer = 5
}

export enum ProjectStatus {
  Planning = 1,
  InProgress = 2,
  Completed = 3,
  OnHold = 4
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
  Other = 7
}

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
  budget: number;
  currency: string;
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
  currency: string;
  totalPaid: number;
  remainingPayment: number;
  materialExpenses: number;
  laborExpenses: number;
  otherExpenses: number;
  extraWorkIncome: number;
  extraWorkCost: number;
  totalExpenses: number;
  budgetUtilizationPercent: number;
  grossProfit: number;
  remainingBudget: number;
  progressPercent: number;
  status: ProjectStatus;
}

export interface Payment {
  id: string;
  projectId: string;
  amount: number;
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
  projectId: string;
  category: ExpenseCategory;
  categoryName: string;
  amount: number;
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
  unit: string;
  description?: string;
  createdAt: string;
}

export interface MaterialPurchase {
  id: string;
  projectId: string;
  materialId: string;
  materialName: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalCost: number;
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
  unit: string;
  totalQuantity: number;
  totalCost: number;
  purchaseCount: number;
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
  workAmount: number;
  paidAmount: number;
  remainingAmount: number;
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
  jobCount: number;
}

export interface ExtraWork {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  customerAmount: number;
  actualCost: number;
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
  averageBudgetUtilizationPercent: number;
  atRiskProjectsCount: number;
}

export interface DashboardRecentActivity {
  activityType: string;
  title: string;
  projectName: string;
  amount?: number;
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

import { apiClient } from './client';
import {
  AuthResponse,
  Currency,
  Customer,
  DashboardRecentActivity,
  DashboardStats,
  Expense,
  ExtraWork,
  Material,
  MaterialPurchase,
  MaterialSummary,
  MaterialUsage,
  Payment,
  Project,
  ProjectDocument,
  ProjectPhoto,
  ProjectStage,
  ProjectSummary,
  ProjectTask,
  ProjectUpdate,
  User,
  Worker,
  WorkerPayment,
  WorkerSummary,
  CustomerPortalProject
} from '../types';

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/login', { email, password });
    return res.data;
  },
  register: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    role: number;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
  getMe: async (): Promise<User> => {
    const res = await apiClient.get<User>('/users/me');
    return res.data;
  },
  getUsers: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users');
    return res.data;
  }
};

export const usersApi = {
  getAll: async (): Promise<User[]> => {
    const res = await apiClient.get<User[]>('/users');
    return res.data;
  },
  createAdmin: async (data: {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    companyName?: string;
    password: string;
    role: number;
  }): Promise<AuthResponse> => {
    const res = await apiClient.post<AuthResponse>('/auth/register', data);
    return res.data;
  },
  toggleActive: async (id: string): Promise<any> => {
    const res = await apiClient.patch(`/users/${id}/toggle-active`);
    return res.data;
  },
  deleteUser: async (id: string): Promise<any> => {
    const res = await apiClient.delete(`/users/${id}`);
    return res.data;
  },
  getTeam: async (): Promise<StaffMember[]> => {
    const res = await apiClient.get<StaffMember[]>('/users/team');
    return res.data;
  },
  getUserTasks: async (id: string): Promise<StaffTask[]> => {
    const res = await apiClient.get<StaffTask[]>(`/users/${id}/tasks`);
    return res.data;
  },
  update: async (id: string, data: {
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
    role: number;
  }): Promise<User> => {
    const res = await apiClient.put<User>(`/users/${id}`, data);
    return res.data;
  },
  resetPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.post(`/users/${id}/reset-password`, { newPassword });
  }
};

export interface StaffMember extends User {
  firstName: string;
  lastName: string;
  isCompanyOwner: boolean;
  openTaskCount: number;
  completedTaskCount: number;
  overdueTaskCount: number;
}

export interface StaffTask extends ProjectTask {
  projectName: string;
  projectStatus: number;
}

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await apiClient.get<DashboardStats>('/dashboard/stats');
    return res.data;
  },
  getRecentActivities: async (limit = 10): Promise<DashboardRecentActivity[]> => {
    const res = await apiClient.get<DashboardRecentActivity[]>(`/dashboard/recent-activities?limit=${limit}`);
    return res.data;
  },
  getStatusDistribution: async () => {
    const res = await apiClient.get('/dashboard/status-distribution');
    return res.data;
  }
};

export const projectsApi = {
  getAll: async (): Promise<Project[]> => {
    const res = await apiClient.get<Project[]>('/projects');
    return res.data;
  },
  getById: async (id: string): Promise<Project> => {
    const res = await apiClient.get<Project>(`/projects/${id}`);
    return res.data;
  },
  create: async (data: {
    name: string;
    projectType?: string;
    customerId: string;
    contractAmount: number;
    budget: number;
    currency: Currency;
    startDate: string;
    endDate?: string;
    location?: string;
    notes?: string;
  }): Promise<Project> => {
    const res = await apiClient.post<Project>('/projects', data);
    return res.data;
  },
  update: async (id: string, data: Partial<Project>): Promise<Project> => {
    const res = await apiClient.put<Project>(`/projects/${id}`, data);
    return res.data;
  },
  rename: async (id: string, name: string): Promise<Project> => {
    const res = await apiClient.patch<Project>(`/projects/${id}/name`, { name });
    return res.data;
  },
  updateStatus: async (id: string, status: number, actualEndDate?: string): Promise<Project> => {
    const res = await apiClient.patch<Project>(`/projects/${id}/status`, { status, actualEndDate });
    return res.data;
  },
  getSummary: async (id: string): Promise<ProjectSummary> => {
    const res = await apiClient.get<ProjectSummary>(`/projects/${id}/summary`);
    return res.data;
  },
  aiAnalyze: async (
    id: string,
    question?: string
  ): Promise<{ analysis: string; model: string; generatedAt: string }> => {
    const res = await apiClient.post(`/projects/${id}/ai-analysis`, { question: question || null }, { timeout: 150000 });
    return res.data;
  },
  delete: async (id: string): Promise<any> => {
    const res = await apiClient.delete(`/projects/${id}`);
    return res.data;
  },
  // Stages
  getStages: async (projectId: string): Promise<ProjectStage[]> => {
    const res = await apiClient.get<ProjectStage[]>(`/projects/${projectId}/stages`);
    return res.data;
  },
  createStage: async (projectId: string, data: { name: string; orderIndex: number; description?: string }): Promise<ProjectStage> => {
    const res = await apiClient.post<ProjectStage>(`/projects/${projectId}/stages`, data);
    return res.data;
  },
  completeStage: async (projectId: string, stageId: string): Promise<ProjectStage> => {
    const res = await apiClient.patch<ProjectStage>(`/projects/${projectId}/stages/${stageId}/complete`);
    return res.data;
  },
  // Payments
  getPayments: async (projectId: string): Promise<Payment[]> => {
    const res = await apiClient.get<Payment[]>(`/projects/${projectId}/payments`);
    return res.data;
  },
  createPayment: async (projectId: string, data: {
    amount: number;
    currency: Currency;
    paymentMethod: number;
    paymentDate: string;
    notes?: string;
  }): Promise<Payment> => {
    const res = await apiClient.post<Payment>(`/projects/${projectId}/payments`, data);
    return res.data;
  },
  // Expenses
  getExpenses: async (projectId: string, category?: number): Promise<Expense[]> => {
    const url = category ? `/projects/${projectId}/expenses?category=${category}` : `/projects/${projectId}/expenses`;
    const res = await apiClient.get<Expense[]>(url);
    return res.data;
  },
  createExpense: async (projectId: string, data: {
    category: number;
    amount: number;
    currency: Currency;
    description: string;
    expenseDate: string;
    notes?: string;
  }): Promise<Expense> => {
    const res = await apiClient.post<Expense>(`/projects/${projectId}/expenses`, data);
    return res.data;
  },
  // Material Purchases
  getPurchases: async (projectId: string): Promise<MaterialPurchase[]> => {
    const res = await apiClient.get<MaterialPurchase[]>(`/projects/${projectId}/material-purchases`);
    return res.data;
  },
  createPurchase: async (projectId: string, data: {
    materialId?: string;
    // materialName berilsa server katalogdan nom+brend bo'yicha topadi yoki yaratadi
    materialName?: string;
    brand?: string;
    unit?: string;
    quantity: number;
    unitPrice: number;
    currency: Currency;
    supplier?: string;
    purchaseDate: string;
    receiptNumber?: string;
    notes?: string;
  }): Promise<MaterialPurchase> => {
    const res = await apiClient.post<MaterialPurchase>(`/projects/${projectId}/material-purchases`, data);
    return res.data;
  },
  getMaterialsSummary: async (projectId: string): Promise<MaterialSummary[]> => {
    const res = await apiClient.get<MaterialSummary[]>(`/projects/${projectId}/materials-summary`);
    return res.data;
  },
  // Worker Payments
  getWorkerPayments: async (projectId: string): Promise<WorkerPayment[]> => {
    const res = await apiClient.get<WorkerPayment[]>(`/projects/${projectId}/worker-payments`);
    return res.data;
  },
  createWorkerPayment: async (projectId: string, data: {
    workerId: string;
    jobDescription: string;
    agreedAmount: number;
    currency: Currency;
    workAmount?: number;
    paidAmount?: number;
    paymentDate?: string;
    notes?: string;
  }): Promise<WorkerPayment> => {
    const res = await apiClient.post<WorkerPayment>(`/projects/${projectId}/worker-payments`, data);
    return res.data;
  },
  updateWorkAmount: async (projectId: string, paymentId: string, workAmount: number, currency: Currency, notes?: string): Promise<WorkerPayment> => {
    const res = await apiClient.patch<WorkerPayment>(`/projects/${projectId}/worker-payments/${paymentId}/work-amount`, { workAmount, currency, notes });
    return res.data;
  },
  payWorker: async (projectId: string, paymentId: string, data: {
    amount: number;
    currency: Currency;
    paymentDate: string;
    notes?: string;
  }): Promise<WorkerPayment> => {
    const res = await apiClient.patch<WorkerPayment>(`/projects/${projectId}/worker-payments/${paymentId}/pay`, data);
    return res.data;
  },
  getWorkersSummary: async (projectId: string): Promise<WorkerSummary[]> => {
    const res = await apiClient.get<WorkerSummary[]>(`/projects/${projectId}/workers-summary`);
    return res.data;
  },
  // Extra Works
  getExtraWorks: async (projectId: string): Promise<ExtraWork[]> => {
    const res = await apiClient.get<ExtraWork[]>(`/projects/${projectId}/extra-works`);
    return res.data;
  },
  createExtraWork: async (projectId: string, data: {
    title: string;
    description?: string;
    customerAmount: number;
    actualCost: number;
    currency: Currency;
    isApprovedByCustomer: boolean;
    notes?: string;
  }): Promise<ExtraWork> => {
    const res = await apiClient.post<ExtraWork>(`/projects/${projectId}/extra-works`, data);
    return res.data;
  },
  toggleExtraWorkApproval: async (projectId: string, extraWorkId: string): Promise<ExtraWork> => {
    const res = await apiClient.patch<ExtraWork>(`/projects/${projectId}/extra-works/${extraWorkId}/toggle-approval`);
    return res.data;
  },
  // Tasks
  getTasks: async (projectId: string): Promise<ProjectTask[]> => {
    const res = await apiClient.get<ProjectTask[]>(`/projects/${projectId}/tasks`);
    return res.data;
  },
  createTask: async (projectId: string, data: {
    title: string;
    stageId?: string;
    description?: string;
    assignedToUserId?: string;
    weight: number;
    dueDate?: string;
  }): Promise<ProjectTask> => {
    const res = await apiClient.post<ProjectTask>(`/projects/${projectId}/tasks`, data);
    return res.data;
  },
  toggleTaskComplete: async (projectId: string, taskId: string): Promise<ProjectTask> => {
    const res = await apiClient.patch<ProjectTask>(`/projects/${projectId}/tasks/${taskId}/toggle-complete`);
    return res.data;
  },
  updateTask: async (projectId: string, taskId: string, data: {
    title: string;
    stageId?: string | null;
    description?: string | null;
    assignedToUserId?: string | null;
    weight: number;
    isCompleted: boolean;
    dueDate?: string | null;
  }): Promise<ProjectTask> => {
    const res = await apiClient.put<ProjectTask>(`/projects/${projectId}/tasks/${taskId}`, data);
    return res.data;
  },
  deleteTask: async (projectId: string, taskId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/tasks/${taskId}`);
  },
  // Documents
  getDocuments: async (projectId: string): Promise<ProjectDocument[]> => {
    const res = await apiClient.get<ProjectDocument[]>(`/projects/${projectId}/documents`);
    return res.data;
  },
  createDocument: async (projectId: string, data: {
    title: string;
    filePath: string;
    fileType?: string;
    fileSizeBytes?: number;
  }): Promise<ProjectDocument> => {
    const res = await apiClient.post<ProjectDocument>(`/projects/${projectId}/documents`, data);
    return res.data;
  },
  uploadDocument: async (projectId: string, formData: FormData): Promise<ProjectDocument> => {
    const res = await apiClient.post<ProjectDocument>(`/projects/${projectId}/documents/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  deleteDocument: async (projectId: string, documentId: string): Promise<void> => {
    await apiClient.delete(`/projects/${projectId}/documents/${documentId}`);
  },
  // Photos
  getPhotos: async (projectId: string): Promise<ProjectPhoto[]> => {
    const res = await apiClient.get<ProjectPhoto[]>(`/projects/${projectId}/photos`);
    return res.data;
  },
  createPhoto: async (projectId: string, data: {
    photoUrl: string;
    stageId?: string;
    caption?: string;
    isVisibleToCustomer: boolean;
    photoDate: string;
  }): Promise<ProjectPhoto> => {
    const res = await apiClient.post<ProjectPhoto>(`/projects/${projectId}/photos`, data);
    return res.data;
  },
  // Updates
  getUpdates: async (projectId: string): Promise<ProjectUpdate[]> => {
    const res = await apiClient.get<ProjectUpdate[]>(`/projects/${projectId}/updates`);
    return res.data;
  },
  createUpdate: async (projectId: string, data: {
    message: string;
    stageId?: string;
    isVisibleToCustomer: boolean;
  }): Promise<ProjectUpdate> => {
    const res = await apiClient.post<ProjectUpdate>(`/projects/${projectId}/updates`, data);
    return res.data;
  }
};

export const customersApi = {
  getAll: async (): Promise<Customer[]> => {
    const res = await apiClient.get<Customer[]>('/customers');
    return res.data;
  },
  getById: async (id: string): Promise<Customer> => {
    const res = await apiClient.get<Customer>(`/customers/${id}`);
    return res.data;
  },
  create: async (data: {
    fullName: string;
    phoneNumber: string;
    email?: string;
    address?: string;
    notes?: string;
  }): Promise<Customer> => {
    const res = await apiClient.post<Customer>('/customers', data);
    return res.data;
  }
};

export const materialsApi = {
  getAll: async (): Promise<Material[]> => {
    const res = await apiClient.get<Material[]>('/materials');
    return res.data;
  },
  create: async (data: { name: string; brand?: string; unit: string; description?: string }): Promise<Material> => {
    const res = await apiClient.post<Material>('/materials', data);
    return res.data;
  },
  getUsage: async (from?: string, to?: string): Promise<MaterialUsage[]> => {
    const res = await apiClient.get<MaterialUsage[]>('/materials/usage', { params: { from: from || undefined, to: to || undefined } });
    return res.data;
  },
  // sourceId dagi barcha xaridlar targetId ga o'tkaziladi, sourceId o'chiriladi
  merge: async (sourceId: string, targetId: string): Promise<Material> => {
    const res = await apiClient.post<Material>(`/materials/${sourceId}/merge`, { targetId });
    return res.data;
  }
};

export const workersApi = {
  getAll: async (): Promise<Worker[]> => {
    const res = await apiClient.get<Worker[]>('/workers');
    return res.data;
  },
  create: async (data: { fullName: string; phoneNumber: string; specialty?: string; notes?: string }): Promise<Worker> => {
    const res = await apiClient.post<Worker>('/workers', data);
    return res.data;
  }
};

export const portalApi = {
  getProject: async (projectId: string): Promise<CustomerPortalProject> => {
    const res = await apiClient.get<CustomerPortalProject>(`/portal/projects/${projectId}`);
    return res.data;
  }
};

export const reportsApi = {
  downloadProjectExcel: async (projectId: string) => {
    try {
      const response = await apiClient.get(`/reports/projects/${projectId}/excel`, {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WorkDex_Project_${projectId}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Excel hisobotni yuklab olishda xatolik yuz berdi");
    }
  },
  downloadAllProjectsExcel: async () => {
    try {
      const response = await apiClient.get('/reports/all-projects/excel', {
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WorkDex_All_Projects_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Excel hisobotni yuklab olishda xatolik yuz berdi");
    }
  },
  downloadAnnualExcel: async (year: number) => {
    try {
      const response = await apiClient.get('/reports/annual/excel', {
        params: { year },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WorkDex_Yillik_Hisobot_${year}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      alert("Yillik hisobotni yuklab olishda xatolik yuz berdi");
    }
  },
  downloadRangeExcel: async (from: string, to: string) => {
    try {
      const response = await apiClient.get('/reports/range/excel', {
        params: { from, to },
        responseType: 'blob',
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `WorkDex_Hisobot_${from}_${to}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      let message = "Davr bo'yicha hisobotni yuklab olishda xatolik yuz berdi";
      const data = err?.response?.data;
      if (data instanceof Blob) {
        try {
          const parsed = JSON.parse(await data.text());
          if (parsed?.message) message = parsed.message;
        } catch {
          // javob JSON emas — umumiy xabar ko'rsatiladi
        }
      }
      alert(message);
    }
  }
};

export const officeExpensesApi = {
  getAll: async (): Promise<Expense[]> => {
    const res = await apiClient.get<Expense[]>('/office-expenses');
    return res.data;
  },
  create: async (data: {
    category: number;
    frequency: number;
    amount: number;
    currency: Currency;
    description: string;
    expenseDate: string;
    notes?: string;
  }): Promise<Expense> => {
    const res = await apiClient.post<Expense>('/office-expenses', data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/office-expenses/${id}`);
  }
};

export const agreementsApi = {
  getAll: async (): Promise<any[]> => {
    const res = await apiClient.get<any[]>('/agreements');
    return res.data;
  },
  getById: async (id: string): Promise<any> => {
    const res = await apiClient.get<any>(`/agreements/${id}`);
    return res.data;
  },
  getNextNumber: async (): Promise<number> => {
    const res = await apiClient.get<{ nextNumber: number }>('/agreements/next-number');
    return res.data.nextNumber;
  },
  create: async (data: any): Promise<any> => {
    const res = await apiClient.post<any>('/agreements', data);
    return res.data;
  },
  update: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.put<any>(`/agreements/${id}`, data);
    return res.data;
  },
  finalize: async (id: string, data: any): Promise<any> => {
    const res = await apiClient.post<any>(`/agreements/${id}/finalize`, data);
    return res.data;
  },
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/agreements/${id}`);
  }
};

export interface AppNotification {
  id: string;
  actorUserId: string;
  actorName: string;
  action: 1 | 2 | 3;
  entityType: string;
  message: string;
  projectId?: string | null;
  createdAt: string;
  isOwn: boolean;
  isUnread: boolean;
}

export const notificationsApi = {
  getAll: async (take = 30): Promise<{ items: AppNotification[]; unreadCount: number }> => {
    const res = await apiClient.get<{ items: AppNotification[]; unreadCount: number }>('/notifications', { params: { take } });
    return res.data;
  },
  markAllRead: async (): Promise<void> => {
    await apiClient.post('/notifications/read');
  }
};

export const currencyApi = {
  getRate: async (): Promise<{ rate: number; currency: string; toCurrency: string; date: string }> => {
    const res = await apiClient.get<{ rate: number; currency: string; toCurrency: string; date: string }>('/currency/rate');
    return res.data;
  },
  getHistory: async (days: number): Promise<CurrencyRateHistoryPoint[]> => {
    const res = await apiClient.get<CurrencyRateHistoryPoint[]>('/currency/history', { params: { days } });
    return res.data;
  }
};

export interface CurrencyRateHistoryPoint {
  date: string;
  rate: number;
}

// CBU kursi kuniga bir marta o'zgaradi — barcha komponentlar bitta so'rovni bo'lishadi
let cbuRatePromise: Promise<number> | null = null;
export const getCbuRate = (): Promise<number> => {
  if (!cbuRatePromise) {
    cbuRatePromise = currencyApi.getRate()
      .then((r) => (r.rate > 0 ? r.rate : 0))
      .catch(() => {
        cbuRatePromise = null;
        return 0;
      });
  }
  return cbuRatePromise;
};

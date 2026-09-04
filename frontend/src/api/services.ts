import { apiClient } from './client';
import {
  AuthResponse,
  Customer,
  DashboardRecentActivity,
  DashboardStats,
  Expense,
  ExtraWork,
  Material,
  MaterialPurchase,
  MaterialSummary,
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
  }
};

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
    currency: string;
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
  updateStatus: async (id: string, status: number, actualEndDate?: string): Promise<Project> => {
    const res = await apiClient.patch<Project>(`/projects/${id}/status`, { status, actualEndDate });
    return res.data;
  },
  getSummary: async (id: string): Promise<ProjectSummary> => {
    const res = await apiClient.get<ProjectSummary>(`/projects/${id}/summary`);
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
    materialId: string;
    brand?: string;
    quantity: number;
    unitPrice: number;
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
    workAmount?: number;
    paidAmount?: number;
    paymentDate?: string;
    notes?: string;
  }): Promise<WorkerPayment> => {
    const res = await apiClient.post<WorkerPayment>(`/projects/${projectId}/worker-payments`, data);
    return res.data;
  },
  updateWorkAmount: async (projectId: string, paymentId: string, workAmount: number, notes?: string): Promise<WorkerPayment> => {
    const res = await apiClient.patch<WorkerPayment>(`/projects/${projectId}/worker-payments/${paymentId}/work-amount`, { workAmount, notes });
    return res.data;
  },
  payWorker: async (projectId: string, paymentId: string, amount: number, paymentDate: string, notes?: string): Promise<WorkerPayment> => {
    const res = await apiClient.patch<WorkerPayment>(`/projects/${projectId}/worker-payments/${paymentId}/pay`, { amount, paymentDate, notes });
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

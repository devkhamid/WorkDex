import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { NewProjectModal } from './components/NewProjectModal';

// Pages
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { ProjectsPage } from './pages/ProjectsPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { CustomersPage } from './pages/CustomersPage';
import { MaterialsPage } from './pages/MaterialsPage';
import { WorkforcePage } from './pages/WorkforcePage';
import { FinancePage } from './pages/FinancePage';
import { TasksPage } from './pages/TasksPage';
import { ReportsPage } from './pages/ReportsPage';
import { SuperAdminPage } from './pages/SuperAdminPage';
import { OfficeExpensesPage } from './pages/OfficeExpensesPage';
import { AgreementsPage } from './pages/AgreementsPage';
import { AgreementFormPage } from './pages/AgreementFormPage';
import { FinalizeAgreementPage } from './pages/FinalizeAgreementPage';
import { UserRole } from './types';
import { ShieldAlert, FileQuestion } from 'lucide-react';

// Har bir sahifa uchun ruxsat etilgan rollar. Ro'yxatlar backenddagi
// [Authorize(Roles = ...)] atributlaridan ko'chirilgan: sahifaning ASOSIY
// o'qish (GET) endpointi qaysi rollarga ochiq bo'lsa, sahifa ham aynan shu
// rollarga ochiq. Backend ruxsatlari o'zgartirilmagan — bu faqat UI tomonda
// bo'sh sahifa yoki tushunarsiz "Xatolik yuz berdi" o'rniga aniq xabar
// ko'rsatish uchun. Backendda rollar o'zgarsa, bu ro'yxat ham yangilanishi kerak.
const ROUTE_ROLES: Record<string, UserRole[]> = {
  // GET /api/dashboard/* → DashboardController
  '/': [UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance, UserRole.ProjectManager],
  // GET /api/users → UsersController:40
  '/superadmin': [UserRole.SuperAdmin, UserRole.Admin],
  // GET /api/projects → ProjectsController:32
  '/projects': [UserRole.SuperAdmin, UserRole.Admin, UserRole.ProjectManager, UserRole.Finance, UserRole.FieldWorker],
  // GET /api/projects/{id} → ProjectsController:42 (SuperAdmin bu yerda yo'q)
  '/projects/:id': [UserRole.Admin, UserRole.ProjectManager, UserRole.Finance, UserRole.FieldWorker],
  // GET /api/customers → CustomersController:24
  '/customers': [UserRole.SuperAdmin, UserRole.Admin, UserRole.ProjectManager, UserRole.Finance],
  // GET /api/materials → MaterialsController:23
  '/materials': [UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance, UserRole.ProjectManager, UserRole.FieldWorker],
  // GET /api/workers → WorkersController:23
  '/workers': [UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance, UserRole.ProjectManager, UserRole.FieldWorker],
  // dashboard/stats + reports → DashboardController & ReportsController
  '/finance': [UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance, UserRole.ProjectManager],
  // GET /api/projects/{id}/tasks → TasksController:21
  '/tasks': [UserRole.Admin, UserRole.Finance, UserRole.ProjectManager, UserRole.FieldWorker],
  // ReportsController:10
  '/reports': [UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance, UserRole.ProjectManager],
  // OfficeExpensesController:11
  '/office': [UserRole.SuperAdmin, UserRole.Admin, UserRole.Finance],
  // AgreementsController
  '/agreements': [UserRole.SuperAdmin, UserRole.Admin, UserRole.ProjectManager],
};

const EmptyState: React.FC<{
  icon: React.ReactNode;
  title: string;
  text: string;
}> = ({ icon, title, text }) => {
  const navigate = useNavigate();
  return (
    <div className="p-4 sm:p-6">
      <div className="max-w-md mx-auto mt-10 sm:mt-16 text-center bg-white border border-[#e4e7ec] rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="flex justify-center mb-3">{icon}</div>
        <div className="text-sm font-bold text-gray-800">{title}</div>
        <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">{text}</p>
        <button
          onClick={() => navigate('/')}
          className="mt-5 h-9 px-4 bg-[#ff7a16] hover:bg-[#e96c0c] text-white rounded-lg text-xs font-bold transition-colors"
        >
          Boshqaruv paneliga qaytish
        </button>
      </div>
    </div>
  );
};

// Rol yetarli bo'lmasa sahifa o'rniga tushunarli xabar chiqaradi.
// `user` hali yuklanmagan bo'lsa hech narsa to'smaymiz — haqiqiy himoya
// baribir backendda, bu qatlam faqat foydalanuvchiga tushuntirish uchun.
const RoleRoute: React.FC<{ allow: UserRole[]; children: React.ReactElement }> = ({ allow, children }) => {
  const { user } = useAuth();

  if (user && !allow.includes(user.role)) {
    return (
      <EmptyState
        icon={<ShieldAlert className="w-10 h-10 text-[#ff7a16]" />}
        title="Bu bo'limga ruxsatingiz yo'q"
        text={`Sizning rolingiz — ${user.roleName}. Bu sahifa boshqa rollar uchun mo'ljallangan. Kerak bo'lsa administratoringizga murojaat qiling.`}
      />
    );
  }

  return children;
};

const ProtectedLayout: React.FC = () => {
  const { token, user, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white text-xs text-gray-500 font-medium">
        WorkDex yuklanmoqda...
      </div>
    );
  }

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const getPageTitle = (pathname: string) => {
    if (pathname === '/') return 'Boshqaruv paneli';
    if (pathname.startsWith('/projects/') && pathname !== '/projects') return 'Loyiha Tafsiloti';
    if (pathname === '/superadmin') return 'Super Admin — Kompaniyalar & Adminlar';
    if (pathname === '/projects') return 'Loyihalar';
    if (pathname === '/customers') return 'Mijozlar';
    if (pathname === '/materials') return 'Materiallar';
    if (pathname === '/workers') return 'Jamoa & Ustalar';
    if (pathname === '/finance') return 'Moliya';
    if (pathname === '/tasks') return 'Vazifalar';
    if (pathname === '/reports') return 'Hisobotlar (Excel)';
    if (pathname === '/office') return 'Mening Ofisim';
    if (pathname === '/agreements') return 'Shartnomalar';
    if (pathname === '/agreements/new') return 'Yangi shartnoma';
    if (pathname.startsWith('/agreements/') && pathname.endsWith('/edit')) return 'Shartnomani tahrirlash';
    if (pathname.startsWith('/agreements/') && pathname.endsWith('/preview')) return 'Shartnomani ko\'rish';
    if (pathname.startsWith('/agreements/') && pathname.endsWith('/finalize')) return 'Loyihani yakunlash';
    return 'Boshqaruv paneli';
  };

  const isSuperAdmin = user?.role === UserRole.SuperAdmin;

  const navTabs = isSuperAdmin
    ? [
        { label: 'Adminlar & Kompaniyalar', path: '/superadmin' },
      ]
    : [
        { label: 'Umumiy ko‘rinish', path: '/' },
        { label: 'Loyihalar', path: '/projects' },
        { label: 'Jamoa', path: '/workers' },
        { label: 'Moliya', path: '/finance' },
        { label: 'Vazifalar', path: '/tasks' },
        { label: 'Hisobotlar', path: '/reports' },
        { label: 'Mening Ofisim', path: '/office' },
      ];

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/' || tabPath === '/superadmin') return location.pathname === tabPath || (isSuperAdmin && location.pathname === '/');
    return location.pathname.startsWith(tabPath);
  };

  return (
    <div className="flex min-h-screen max-w-[1500px] mx-auto bg-white lg:border-x border-[#f0f2f5] shadow-xs">
      {/* Sidebar matching prototype */}
      <Sidebar
        onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        mobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <Header
          title={getPageTitle(location.pathname)}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
          onOpenMenu={() => setIsMobileMenuOpen(true)}
        />

        {/* Persistent Sub-header Navigation Tabs (Never disappears) */}
        <div className="no-print h-[44px] lg:h-[48px] bg-white flex items-end px-2 sm:px-6 border-b border-[#e4e7ec] gap-1 overflow-x-auto scrollbar-none">
          {navTabs.map((tab) => {
            const active = isTabActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`h-10 lg:h-11 px-3 lg:px-3.5 flex-shrink-0 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
                  active
                    ? 'text-[#111827] border-[#ff7a16] font-bold'
                    : 'text-[#64748b] border-transparent hover:text-gray-900 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <main className="flex-1 overflow-y-auto bg-white">
          <Routes>
            <Route path="/" element={
              <RoleRoute allow={ROUTE_ROLES['/']}>
                {isSuperAdmin ? <SuperAdminPage /> : <DashboardPage />}
              </RoleRoute>
            } />
            <Route path="/superadmin" element={
              <RoleRoute allow={ROUTE_ROLES['/superadmin']}><SuperAdminPage /></RoleRoute>
            } />
            <Route path="/projects" element={
              <RoleRoute allow={ROUTE_ROLES['/projects']}>
                <ProjectsPage onOpenNewProject={() => setIsNewProjectModalOpen(true)} />
              </RoleRoute>
            } />
            <Route path="/projects/:id" element={
              <RoleRoute allow={ROUTE_ROLES['/projects/:id']}><ProjectDetailPage /></RoleRoute>
            } />
            <Route path="/customers" element={
              <RoleRoute allow={ROUTE_ROLES['/customers']}><CustomersPage /></RoleRoute>
            } />
            <Route path="/materials" element={
              <RoleRoute allow={ROUTE_ROLES['/materials']}><MaterialsPage /></RoleRoute>
            } />
            <Route path="/workers" element={
              <RoleRoute allow={ROUTE_ROLES['/workers']}><WorkforcePage /></RoleRoute>
            } />
            <Route path="/finance" element={
              <RoleRoute allow={ROUTE_ROLES['/finance']}><FinancePage /></RoleRoute>
            } />
            <Route path="/tasks" element={
              <RoleRoute allow={ROUTE_ROLES['/tasks']}><TasksPage /></RoleRoute>
            } />
            <Route path="/reports" element={
              <RoleRoute allow={ROUTE_ROLES['/reports']}><ReportsPage /></RoleRoute>
            } />
            <Route path="/office" element={
              <RoleRoute allow={ROUTE_ROLES['/office']}><OfficeExpensesPage /></RoleRoute>
            } />
            <Route path="/agreements" element={
              <RoleRoute allow={ROUTE_ROLES['/agreements']}><AgreementsPage /></RoleRoute>
            } />
            <Route path="/agreements/new" element={
              <RoleRoute allow={ROUTE_ROLES['/agreements']}><AgreementFormPage /></RoleRoute>
            } />
            <Route path="/agreements/:id/edit" element={
              <RoleRoute allow={ROUTE_ROLES['/agreements']}><AgreementFormPage /></RoleRoute>
            } />
            <Route path="/agreements/:id/preview" element={
              <RoleRoute allow={ROUTE_ROLES['/agreements']}><AgreementFormPage /></RoleRoute>
            } />
            <Route path="/agreements/:id/finalize" element={
              <RoleRoute allow={ROUTE_ROLES['/agreements']}><FinalizeAgreementPage /></RoleRoute>
            } />
            {/* Noma'lum manzil — ilgari bo'sh oq sahifa chiqardi */}
            <Route path="*" element={
              <EmptyState
                icon={<FileQuestion className="w-10 h-10 text-gray-300" />}
                title="Sahifa topilmadi"
                text="Bu manzil bo'yicha sahifa mavjud emas. Manzilni tekshirib ko'ring yoki quyidagi tugma bilan asosiy sahifaga o'ting."
              />
            } />
          </Routes>
        </main>
      </div>

      <NewProjectModal
        isOpen={isNewProjectModalOpen}
        onClose={() => setIsNewProjectModalOpen(false)}
        onSuccess={() => {
          window.location.reload();
        }}
      />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

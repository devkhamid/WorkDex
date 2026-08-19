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

const ProtectedLayout: React.FC = () => {
  const { token, isLoading } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

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
    if (pathname === '/projects') return 'Loyihalar';
    if (pathname === '/customers') return 'Mijozlar';
    if (pathname === '/materials') return 'Materiallar';
    if (pathname === '/workers') return 'Jamoa & Ustalar';
    if (pathname === '/finance') return 'Moliya';
    if (pathname === '/tasks') return 'Vazifalar';
    if (pathname === '/reports') return 'Hisobotlar (Excel)';
    return 'Boshqaruv paneli';
  };

  const navTabs = [
    { label: 'Umumiy ko‘rinish', path: '/' },
    { label: 'Loyihalar', path: '/projects' },
    { label: 'Jamoa', path: '/workers' },
    { label: 'Moliya', path: '/finance' },
    { label: 'Vazifalar', path: '/tasks' },
    { label: 'Hisobotlar', path: '/reports' },
  ];

  const isTabActive = (tabPath: string) => {
    if (tabPath === '/') return location.pathname === '/';
    return location.pathname.startsWith(tabPath);
  };

  return (
    <div className="flex min-h-screen max-w-[1500px] mx-auto bg-white border-x border-[#f0f2f5] shadow-xs">
      {/* Sidebar matching prototype */}
      <Sidebar onOpenNewProject={() => setIsNewProjectModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-white">
        <Header
          title={getPageTitle(location.pathname)}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        />

        {/* Persistent Sub-header Navigation Tabs (Never disappears) */}
        <div className="h-[48px] bg-white flex items-end px-6 border-b border-[#e4e7ec] gap-1 overflow-x-auto">
          {navTabs.map((tab) => {
            const active = isTabActive(tab.path);
            return (
              <button
                key={tab.path}
                onClick={() => navigate(tab.path)}
                className={`h-11 px-3.5 text-xs font-semibold border-b-2 transition-all whitespace-nowrap ${
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
            <Route path="/" element={<DashboardPage />} />
            <Route path="/projects" element={<ProjectsPage onOpenNewProject={() => setIsNewProjectModalOpen(true)} />} />
            <Route path="/projects/:id" element={<ProjectDetailPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/materials" element={<MaterialsPage />} />
            <Route path="/workers" element={<WorkforcePage />} />
            <Route path="/finance" element={<FinancePage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/reports" element={<ReportsPage />} />
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

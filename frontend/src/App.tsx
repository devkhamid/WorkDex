import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f6f7f9] text-xs text-gray-500">
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

  return (
    <div className="flex min-h-screen max-w-[1440px] mx-auto bg-[#f6f7f9] shadow-2xl">
      {/* Sidebar matching prototype */}
      <Sidebar onOpenNewProject={() => setIsNewProjectModalOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          title={getPageTitle(location.pathname)}
          onOpenNewProject={() => setIsNewProjectModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto">
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

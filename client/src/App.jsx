import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import SettingsPage from './pages/SettingsPage';
import DashboardPage from './pages/DashboardPage';
import ClientsPage from './pages/ClientsPage';
import ClientDetailPage from './pages/ClientDetailPage';
import ProjectsPage from './pages/ProjectsPage';
import SubscriptionsPage from './pages/SubscriptionsPage';
import PaymentsPage from './pages/PaymentsPage';
import FinancePage from './pages/FinancePage';
import GoalsPage from './pages/GoalsPage';
import DuesPage from './pages/DuesPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-dark">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <AppLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/clients" element={<ClientsPage />} />
                <Route path="/clients/:id" element={<ClientDetailPage />} />
                <Route path="/projects" element={<ProjectsPage />} />
                <Route path="/subscriptions" element={<SubscriptionsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                {/* M6 screens */}
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/dues" element={<DuesPage />} />
                <Route path="/goals" element={<GoalsPage />} />
              </Routes>
            </AppLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

function ComingSoon({ title }) {
  return (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
      <div className="glass-card p-12 text-center">
        <h2 className="page-title mb-3">{title}</h2>
        <p className="text-slate-400">This screen will be built in an upcoming milestone.</p>
      </div>
    </div>
  );
}

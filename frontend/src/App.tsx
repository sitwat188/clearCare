import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import type { RootState } from './store/store';
import { ROUTES } from './config/routes';

// Auth pages
import LoginPage from './pages/auth/LoginPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import OAuthCallbackPage from './pages/auth/OAuthCallbackPage';

// Patient pages
import PatientDashboard from './pages/patient/DashboardPage';
import PatientInstructions from './pages/patient/InstructionsPage';
import PatientInstructionDetail from './pages/patient/InstructionDetailPage';
import PatientCompliance from './pages/patient/CompliancePage';
import PatientHistory from './pages/patient/HistoryPage';
import PatientNotifications from './pages/patient/NotificationsPage';

// Shared pages
import ProfilePage from './pages/shared/ProfilePage';
import SettingsPage from './pages/shared/SettingsPage';

// Provider pages
import ProviderDashboard from './pages/provider/DashboardPage';
import ProviderPatients from './pages/provider/PatientsPage';
import CreateInstruction from './pages/provider/CreateInstructionPage';
import ProviderInstructions from './pages/provider/InstructionsPage';
import ProviderCompliance from './pages/provider/CompliancePage';
import ProviderReports from './pages/provider/ReportsPage';
import ProviderTemplates from './pages/provider/TemplatesPage';
import ProviderNotifications from './pages/patient/NotificationsPage';

// Admin pages
import AdminDashboard from './pages/admin/DashboardPage';
import AdminUsers from './pages/admin/UsersPage';
import AdminRoles from './pages/admin/RolesPage';
import AdminAuditLogs from './pages/admin/AuditLogsPage';
import AdminReports from './pages/admin/ReportsPage';
import AdminSettings from './pages/admin/SettingsPage';
import AdminNotifications from './pages/patient/NotificationsPage';

// Layout
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/common/ProtectedRoute';

function App() {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const user = useSelector((state: RootState) => state.auth.user);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPasswordPage />} />
        <Route path={ROUTES.RESET_PASSWORD} element={<ResetPasswordPage />} />
        <Route path={ROUTES.OAUTH_CALLBACK} element={<OAuthCallbackPage />} />

        {/* Protected routes */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  {/* Patient routes */}
                  {user?.role === 'patient' && (
                    <>
                      <Route path="/patient/dashboard" element={<PatientDashboard />} />
                      <Route path="/patient/instructions" element={<PatientInstructions />} />
                      <Route path="/patient/instructions/:id" element={<PatientInstructionDetail />} />
                      <Route path="/patient/compliance" element={<PatientCompliance />} />
                      <Route path="/patient/history" element={<PatientHistory />} />
                      <Route path="/patient/notifications" element={<PatientNotifications />} />
                      <Route path="/patient/profile" element={<ProfilePage />} />
                      <Route path="/patient/settings" element={<SettingsPage />} />
                    </>
                  )}

                  {/* Provider routes */}
                  {user?.role === 'provider' && (
                    <>
                      <Route path="/provider/dashboard" element={<ProviderDashboard />} />
                      <Route path="/provider/patients" element={<ProviderPatients />} />
                      <Route path="/provider/instructions/create" element={<CreateInstruction />} />
                      <Route path="/provider/instructions" element={<ProviderInstructions />} />
                      <Route path="/provider/instructions/:id" element={<ProviderInstructions />} />
                      <Route path="/provider/compliance" element={<ProviderCompliance />} />
                      <Route path="/provider/compliance/:patientId" element={<ProviderCompliance />} />
                      <Route path="/provider/reports" element={<ProviderReports />} />
                      <Route path="/provider/templates" element={<ProviderTemplates />} />
                      <Route path="/provider/notifications" element={<ProviderNotifications />} />
                      <Route path="/provider/profile" element={<ProfilePage />} />
                      <Route path="/provider/settings" element={<SettingsPage />} />
                    </>
                  )}

                  {/* Admin routes */}
                  {user?.role === 'administrator' && (
                    <>
                      <Route path="/admin/dashboard" element={<AdminDashboard />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/users/:id" element={<AdminUsers />} />
                      <Route path="/admin/roles" element={<AdminRoles />} />
                      <Route path="/admin/audit-logs" element={<AdminAuditLogs />} />
                      <Route path="/admin/reports" element={<AdminReports />} />
                      <Route path="/admin/settings" element={<AdminSettings />} />
                      <Route path="/admin/notifications" element={<AdminNotifications />} />
                      <Route path="/admin/profile" element={<ProfilePage />} />
                    </>
                  )}

                  {/* Default redirect based on role */}
                  <Route
                    path="/"
                    element={
                      <Navigate
                        to={
                          user?.role === 'patient'
                            ? ROUTES.PATIENT.DASHBOARD
                            : user?.role === 'provider'
                            ? ROUTES.PROVIDER.DASHBOARD
                            : user?.role === 'administrator'
                            ? ROUTES.ADMIN.DASHBOARD
                            : ROUTES.LOGIN
                        }
                        replace
                      />
                    }
                  />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

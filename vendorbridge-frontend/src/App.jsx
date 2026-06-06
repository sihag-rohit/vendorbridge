import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/layout/Layout';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import VendorListPage from './pages/vendors/VendorListPage';
import RFQListPage from './pages/rfqs/RFQListPage';
import RFQFormPage from './pages/rfqs/RFQFormPage';
import RFQDetailPage from './pages/rfqs/RFQDetailPage';
import QuotationSubmitPage from './pages/quotations/QuotationSubmitPage';
import QuotationComparisonPage from './pages/quotations/QuotationComparisonPage';
import QuotationListPage from './pages/quotations/QuotationListPage';
import ApprovalPage from './pages/approvals/ApprovalPage';
import POListPage from './pages/purchaseOrders/POListPage';
import PODetailPage from './pages/purchaseOrders/PODetailPage';
import InvoiceListPage from './pages/invoices/InvoiceListPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
import ProfilePage from './pages/profile/ProfilePage';
import NotificationsPage from './pages/notifications/NotificationsPage';
import ActivityLogPage from './pages/activityLogs/ActivityLogPage';
import ReportsPage from './pages/reports/ReportsPage';
import LoadingSpinner from './components/ui/LoadingSpinner';

// Protected Route wrapper
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><LoadingSpinner size="lg" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (allowedRoles && !allowedRoles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><LoadingSpinner size="lg" /></div>;

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/dashboard" replace />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Protected routes */}
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />

        {/* Vendor Management - admin */}
        <Route path="vendors" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <VendorListPage />
          </ProtectedRoute>
        } />

        {/* RFQs */}
        <Route path="rfqs" element={
          <ProtectedRoute allowedRoles={['officer', 'vendor']}>
            <RFQListPage />
          </ProtectedRoute>
        } />
        <Route path="rfqs/new" element={
          <ProtectedRoute allowedRoles={['officer']}>
            <RFQFormPage />
          </ProtectedRoute>
        } />
        <Route path="rfqs/:id/edit" element={
          <ProtectedRoute allowedRoles={['officer']}>
            <RFQFormPage />
          </ProtectedRoute>
        } />
        <Route path="rfqs/:id" element={
          <ProtectedRoute allowedRoles={['officer', 'vendor']}>
            <RFQDetailPage />
          </ProtectedRoute>
        } />
        <Route path="rfqs/:id/compare" element={
          <ProtectedRoute allowedRoles={['officer']}>
            <QuotationComparisonPage />
          </ProtectedRoute>
        } />

        {/* Quotations */}
        <Route path="quotations" element={
          <ProtectedRoute allowedRoles={['officer', 'vendor']}>
            <QuotationListPage />
          </ProtectedRoute>
        } />
        <Route path="quotations/submit/:rfqId" element={
          <ProtectedRoute allowedRoles={['vendor']}>
            <QuotationSubmitPage />
          </ProtectedRoute>
        } />

        {/* Approvals - manager */}
        <Route path="approvals" element={
          <ProtectedRoute allowedRoles={['manager']}>
            <ApprovalPage />
          </ProtectedRoute>
        } />

        {/* Purchase Orders */}
        <Route path="purchase-orders" element={
          <ProtectedRoute allowedRoles={['officer', 'vendor']}>
            <POListPage />
          </ProtectedRoute>
        } />
        <Route path="purchase-orders/:id" element={
          <ProtectedRoute allowedRoles={['officer', 'vendor']}>
            <PODetailPage />
          </ProtectedRoute>
        } />

        {/* Invoices */}
        <Route path="invoices" element={
          <ProtectedRoute allowedRoles={['officer', 'vendor']}>
            <InvoiceListPage />
          </ProtectedRoute>
        } />
        <Route path="invoices/:id" element={
          <ProtectedRoute allowedRoles={['officer', 'vendor']}>
            <InvoiceDetailPage />
          </ProtectedRoute>
        } />

        {/* Notifications, Logs, Reports, Profile */}
        <Route path="profile" element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } />
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="activity-logs" element={
          <ProtectedRoute allowedRoles={['admin']}>
            <ActivityLogPage />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <ReportsPage />
          </ProtectedRoute>
        } />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
        </NotificationProvider>
      </AuthProvider>
    </Router>
  );
}

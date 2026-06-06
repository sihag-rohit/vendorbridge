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
import ApprovalPage from './pages/approvals/ApprovalPage';
import POListPage from './pages/purchaseOrders/POListPage';
import PODetailPage from './pages/purchaseOrders/PODetailPage';
import InvoiceListPage from './pages/invoices/InvoiceListPage';
import InvoiceDetailPage from './pages/invoices/InvoiceDetailPage';
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

        {/* Vendor Management - admin, officer */}
        <Route path="vendors" element={
          <ProtectedRoute allowedRoles={['admin', 'officer']}>
            <VendorListPage />
          </ProtectedRoute>
        } />

        {/* RFQs */}
        <Route path="rfqs" element={<RFQListPage />} />
        <Route path="rfqs/new" element={
          <ProtectedRoute allowedRoles={['admin', 'officer']}>
            <RFQFormPage />
          </ProtectedRoute>
        } />
        <Route path="rfqs/:id/edit" element={
          <ProtectedRoute allowedRoles={['admin', 'officer']}>
            <RFQFormPage />
          </ProtectedRoute>
        } />
        <Route path="rfqs/:id" element={<RFQDetailPage />} />
        <Route path="rfqs/:id/compare" element={
          <ProtectedRoute allowedRoles={['admin', 'officer', 'manager']}>
            <QuotationComparisonPage />
          </ProtectedRoute>
        } />

        {/* Quotations - vendor only */}
        <Route path="quotations/submit/:rfqId" element={
          <ProtectedRoute allowedRoles={['vendor', 'admin']}>
            <QuotationSubmitPage />
          </ProtectedRoute>
        } />

        {/* Approvals - manager, admin */}
        <Route path="approvals" element={
          <ProtectedRoute allowedRoles={['admin', 'manager']}>
            <ApprovalPage />
          </ProtectedRoute>
        } />

        {/* Purchase Orders */}
        <Route path="purchase-orders" element={<POListPage />} />
        <Route path="purchase-orders/:id" element={<PODetailPage />} />

        {/* Invoices */}
        <Route path="invoices" element={<InvoiceListPage />} />
        <Route path="invoices/:id" element={<InvoiceDetailPage />} />

        {/* Notifications, Logs, Reports */}
        <Route path="notifications" element={<NotificationsPage />} />
        <Route path="activity-logs" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'officer']}>
            <ActivityLogPage />
          </ProtectedRoute>
        } />
        <Route path="reports" element={
          <ProtectedRoute allowedRoles={['admin', 'manager', 'officer']}>
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

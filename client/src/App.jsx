import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { lazy, Suspense, useEffect } from 'react';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/layout/Navbar.jsx';
import Footer from './components/layout/Footer.jsx';
import { Spinner } from './components/ui/Spinner.jsx';
import VerifyEmailBanner from './components/auth/VerifyEmailBanner.jsx';

// Immersive auth pages get their own full-viewport split layout — no nav/footer.
const AUTH_ROUTES = ['/login', '/register', '/forgot-password', '/reset-password', '/verify-email', '/auth/social'];

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

// Code-split all routes — reduces initial JS from 927kB to ~180kB
const Home = lazy(() => import('./pages/marketing/Home.jsx'));
const Services = lazy(() => import('./pages/marketing/Services.jsx'));
const ServiceDetail = lazy(() => import('./pages/marketing/ServiceDetail.jsx'));
const About = lazy(() => import('./pages/marketing/About.jsx'));
const Fleet = lazy(() => import('./pages/marketing/Fleet.jsx'));
const Rates = lazy(() => import('./pages/marketing/Rates.jsx'));
const Contact = lazy(() => import('./pages/marketing/Contact.jsx'));
const Careers = lazy(() => import('./pages/marketing/Careers.jsx'));
const Reservations = lazy(() => import('./pages/passenger/Reservations.jsx'));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword.jsx'));
const ResetPassword = lazy(() => import('./pages/ResetPassword.jsx'));
const VerifyEmail = lazy(() => import('./pages/VerifyEmail.jsx'));
const SocialCallback = lazy(() => import('./pages/SocialCallback.jsx'));
const RideHistory = lazy(() => import('./pages/passenger/RideHistory.jsx'));
const RideTracking = lazy(() => import('./pages/passenger/RideTracking.jsx'));
const DriverDashboard = lazy(() => import('./pages/driver/Dashboard.jsx'));
const AdminDashboard = lazy(() => import('./pages/admin/Dashboard.jsx'));
const Profile = lazy(() => import('./pages/Profile.jsx'));
const CrmShell = lazy(() => import('./modules/crm/layout/CrmShell.tsx'));
const OverviewPage = lazy(() => import('./modules/crm/features/overview/OverviewPage.tsx'));
const DispatchBoard = lazy(() => import('./modules/crm/features/dispatch/DispatchBoard.tsx'));
const LiveMapPage = lazy(() => import('./modules/crm/features/operations/LiveMapPage.tsx'));
const ReservationsPage = lazy(() => import('./modules/crm/features/reservations/ReservationsPage.tsx'));
const DriversPage = lazy(() => import('./modules/crm/features/drivers/DriversPage.tsx'));
const PassengersPage = lazy(() => import('./modules/crm/features/passengers/PassengersPage.tsx'));
const FleetPage = lazy(() => import('./modules/crm/features/fleet/FleetPage.tsx'));
const FinancePage = lazy(() => import('./modules/crm/features/finance/FinancePage.tsx'));
const AnalyticsPage = lazy(() => import('./modules/crm/features/analytics/AnalyticsPage.tsx'));
const SupportPage = lazy(() => import('./modules/crm/features/support/SupportPage.tsx'));
const NotificationsPage = lazy(() => import('./modules/crm/features/notifications/NotificationsPage.tsx'));
const AuditPage = lazy(() => import('./modules/crm/features/audit/AuditPage.tsx'));
const SettingsPage = lazy(() => import('./modules/crm/features/settings/SettingsPage.tsx'));
const WebsitePage = lazy(() => import('./modules/crm/features/website/WebsitePage.tsx'));
const DriverShell = lazy(() => import('./modules/driver/layout/DriverShell.tsx'));
const DriverDashboardPage = lazy(() => import('./modules/driver/features/dashboard/DashboardPage.tsx'));
const DriverRequestsPage = lazy(() => import('./modules/driver/features/requests/RequestsPage.tsx'));
const DriverCurrentPage = lazy(() => import('./modules/driver/features/current/CurrentRidePage.tsx'));
const DriverHistoryPage = lazy(() => import('./modules/driver/features/history/HistoryPage.tsx'));
const DriverEarningsPage = lazy(() => import('./modules/driver/features/earnings/EarningsPage.tsx'));
const DriverWalletPage = lazy(() => import('./modules/driver/features/wallet/WalletPage.tsx'));
const DriverVehiclePage = lazy(() => import('./modules/driver/features/vehicle/VehiclePage.tsx'));
const DriverDocumentsPage = lazy(() => import('./modules/driver/features/documents/DocumentsPage.tsx'));
const DriverRatingsPage = lazy(() => import('./modules/driver/features/ratings/RatingsPage.tsx'));
const DriverPerformancePage = lazy(() => import('./modules/driver/features/performance/PerformancePage.tsx'));
const DriverNotificationsPage = lazy(() => import('./modules/driver/features/notifications/NotificationsPage.tsx'));
const DriverSupportPage = lazy(() => import('./modules/driver/features/support/SupportPage.tsx'));
const DriverSettingsPage = lazy(() => import('./modules/driver/features/settings/SettingsPage.tsx'));
const DriverMapPage = lazy(() => import('./modules/driver/features/map/MapPage.tsx'));

const RequireRole = ({ role, roles, children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  const allowed = roles || (role ? [role] : null);
  if (allowed) {
    const effective = user.role === 'admin' ? ['admin','super_admin'] : [user.role];
    if (!allowed.some(r=> effective.includes(r) || r===user.role)) return <Navigate to="/" replace />;
  }
  return children;
};

const Fallback = () => <div className="flex h-[60vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-200 border-t-brand-600" /></div>;

export default function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const isDriver = location.pathname.startsWith('/driver');
  const isAuthRoute = AUTH_ROUTES.includes(location.pathname);
  if (isAdmin) {
    if (location.pathname.startsWith('/admin/legacy')) {
      return (
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/admin/legacy" element={<RequireRole roles={['admin','super_admin']}><div className="min-h-screen bg-paper"><div className="mx-auto max-w-7xl px-4 py-6"><p className="mb-4 rounded-xl bg-gold-50 border border-gold-200 px-4 py-3 text-sm text-gold-700">Legacy CRM — <a href="/admin" className="underline font-medium">Go to new Admin</a></p><AdminDashboard /></div></div></RequireRole>} />
            <Route path="*" element={<Navigate to="/admin/legacy" replace />} />
          </Routes>
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/admin" element={<RequireRole roles={['admin','super_admin','dispatcher','manager','finance','support']}><CrmShell /></RequireRole>}>
            <Route index element={<OverviewPage />} />
            <Route path="dispatch" element={<DispatchBoard />} />
            <Route path="operations" element={<LiveMapPage />} />
            <Route path="reservations" element={<ReservationsPage />} />
            <Route path="drivers" element={<DriversPage />} />
            <Route path="passengers" element={<PassengersPage />} />
            <Route path="fleet" element={<FleetPage />} />
            <Route path="website" element={<WebsitePage />} />
            <Route path="finance" element={<FinancePage />} />
            <Route path="analytics" element={<AnalyticsPage />} />
            <Route path="support" element={<SupportPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="audit" element={<AuditPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>
          <Route path="/crm" element={<Navigate to="/admin" replace />} />
          <Route path="/crm/*" element={<Navigate to="/admin" replace />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Suspense>
    );
  }
  if (isDriver) {
    if (location.pathname.startsWith('/driver/legacy')) {
      return (
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/driver/legacy" element={<RequireRole role="driver"><div className="min-h-screen bg-paper"><div className="mx-auto max-w-5xl px-4 py-6"><p className="mb-4 rounded-xl bg-gold-50 border border-gold-200 px-4 py-3 text-sm">Legacy Driver — <a href="/driver" className="underline font-medium text-brand-700">Go to new Portal</a></p><DriverDashboard /></div></div></RequireRole>} />
            <Route path="*" element={<Navigate to="/driver/legacy" replace />} />
          </Routes>
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/driver" element={<RequireRole role="driver"><DriverShell /></RequireRole>}>
            <Route index element={<DriverDashboardPage />} />
            <Route path="requests" element={<DriverRequestsPage />} />
            <Route path="current" element={<DriverCurrentPage />} />
            <Route path="upcoming" element={<DriverHistoryPage />} />
            <Route path="history" element={<DriverHistoryPage />} />
            <Route path="earnings" element={<DriverEarningsPage />} />
            <Route path="wallet" element={<DriverWalletPage />} />
            <Route path="vehicle" element={<DriverVehiclePage />} />
            <Route path="documents" element={<DriverDocumentsPage />} />
            <Route path="ratings" element={<DriverRatingsPage />} />
            <Route path="performance" element={<DriverPerformancePage />} />
            <Route path="notifications" element={<DriverNotificationsPage />} />
            <Route path="support" element={<DriverSupportPage />} />
            <Route path="settings" element={<DriverSettingsPage />} />
            <Route path="map" element={<DriverMapPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/driver" replace />} />
        </Routes>
      </Suspense>
    );
  }
  return (
    <div className="flex min-h-screen flex-col">
      <ScrollToTop />
      {!isAuthRoute && <Navbar />}
      {!isAuthRoute && <VerifyEmailBanner />}
      <main className="flex-1">
        <Suspense fallback={<Fallback />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/services/:slug" element={<ServiceDetail />} />
            <Route path="/fleet" element={<Fleet />} />
            <Route path="/rates" element={<Rates />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/careers" element={<Careers />} />
            <Route path="/reservations" element={<Reservations />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/auth/social" element={<SocialCallback />} />

            <Route path="/rides/history" element={<RequireRole role="passenger"><RideHistory /></RequireRole>} />
            <Route path="/rides/track/:id" element={<RequireRole role="passenger"><RideTracking /></RequireRole>} />

            <Route path="/profile" element={<RequireRole><Profile /></RequireRole>} />

            <Route path="/driver/legacy" element={<Navigate to="/driver" replace />} />
            <Route path="/crm" element={<Navigate to="/admin" replace />} />
            <Route path="/crm/*" element={<Navigate to="/admin" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
      {!isAuthRoute && <Footer />}
    </div>
  );
}

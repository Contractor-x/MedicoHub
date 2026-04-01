import * as React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { LandingPage } from './pages/LandingPage';
import { Onboarding } from './pages/Onboarding';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ForgotPassword } from './pages/ForgotPassword';
import { VerifyEmail } from './pages/VerifyEmail';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { Learning } from './pages/Learning';
import { Profile } from './pages/Profile';
import { Store } from './pages/Store';
import { Pricing } from './pages/Pricing';
import { About } from './pages/About';
import { MCamp } from './pages/MCamp';
import { MCampUserDashboard } from './pages/MCampUserDashboard';
import { PrivacyPolicy } from './pages/PrivacyPolicy';
import { TermsOfService } from './pages/TermsOfService';
import { Legal } from './pages/Legal';
import { User, AppRoute, Notification } from './types';
import { Stethoscope } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { api } from './services/api';
import { StatusModal, ModalType } from './components/StatusModal';

const ScrollToTop = () => {
  const { pathname } = useLocation();

  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
};

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { EmailVerificationBanner } from './components/EmailVerificationBanner';
import { NotFound } from './components/NotFound';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

const queryClient = new QueryClient();

// Layout component to control footer visibility
const MainLayout: React.FC<{ user: User | null; children: React.ReactNode }> = ({ user, children }) => {
  const location = useLocation();

  // Routes where the footer should be HIDDEN
  const hideFooterRoutes = [
    AppRoute.DASHBOARD,
    AppRoute.LEARNING,
    AppRoute.PROFILE,
    AppRoute.MCAMP_DASHBOARD,
    AppRoute.ONBOARDING,
    AppRoute.LOGIN,
    AppRoute.SIGNUP,
    AppRoute.FORGOT_PASSWORD
  ];

  // Also hide footer for direct resource links like /learning/m1
  const isLearningResource = location.pathname.startsWith(AppRoute.LEARNING + '/');
  const shouldShowFooter = !hideFooterRoutes.includes(location.pathname as AppRoute) && !isLearningResource;

  return (
    <div className="min-h-screen font-sans selection:bg-brand-yellow selection:text-brand-dark bg-white flex flex-col">
      <Navbar user={user} />

      <main className="flex-grow">
        {children}
      </main>

      {shouldShowFooter && <Footer />}
    </div>
  );
};

const AppContent: React.FC = () => {
  const { user: firebaseUser, loading, logout, deleteAccount } = useAuth();
  const { maintenanceMode } = useSettings();
  const [user, setUser] = React.useState<User | null>(null);
  const [notifications, setNotifications] = React.useState<Notification[]>([]);
  const [appLoading, setAppLoading] = React.useState(true);
  const [modalConfig, setModalConfig] = React.useState<{ isOpen: boolean; title: string; message: string; type: ModalType }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });

  // Sync Firebase User with App User State
  // Sync Firebase User with App User State (Real-time)
  React.useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupUserListener = async () => {
      if (firebaseUser) {
        setAppLoading(true);
        try {
          // Fetch from MongoDB via our API instead of Firestore Snapshot
          const userData = await api.users.get(firebaseUser.uid);

          if (userData) {
            // Ensure year is mapped from academicYear if missing (for frontend compatibility)
            // CRITICAL: Ensure 'name' is never undefined. Fallback to Firebase displayName if MongoDB name is missing.
            const resolvedName = userData.name || firebaseUser.displayName || 'Student';

            // SELF-HEALING: If MongoDB name was missing but we have it in Firebase, fix it in the DB now.
            if (!userData.name && firebaseUser.displayName) {
              console.log("[App] Self-healing user name in MongoDB...");
              api.users.update(firebaseUser.uid, { name: firebaseUser.displayName }).catch(e => console.error("Self-heal failed", e));
            }

            const mappedUser: User = {
              ...userData,
              name: resolvedName,
              year: userData.year || userData.academicYear || '',
              academicYear: userData.academicYear || userData.year || '',
              profileImage: userData.photoURL || userData.profileImage || '',
              emailVerified: firebaseUser.emailVerified
            };

            // RACE CONDITION PROTECTION:
            // If we already have a specialized year locally, don't revert to 'General' just because 
            // the backend sync hasn't fully propagated or is returning a stale default.
            setUser(prev => {
              if (prev && isOnboarded(prev)) {
                const isStale = (mappedUser.academicYear === 'General' || mappedUser.academicYear === '') &&
                  (prev.academicYear !== 'General' && prev.academicYear !== '');

                if (isStale) {
                  console.log("[App] Blocking stale user state update to prevent redirect loop.");
                  return { ...prev, ...mappedUser, year: prev.year, academicYear: prev.academicYear };
                }
              }
              return mappedUser;
            });
            const localNotifs = generateNotifications(mappedUser);

            setNotifications(prev => {
              const broadcasts = prev.filter(n => n.isBroadcast || n.id.startsWith('email-verified'));
              const existingIds = new Set(broadcasts.map(n => n.id));
              const newLocals = localNotifs.filter(n => !existingIds.has(n.id));
              return [...broadcasts, ...newLocals];
            });
          } else {
            // Fallback for new users or if not in MongoDB yet (only if current state is empty)
            setUser(prev => {
              if (prev && (prev.year || prev.academicYear)) return prev;
              return {
                uid: firebaseUser.uid,
                name: firebaseUser.displayName || 'Student',
                email: firebaseUser.email || '',
                isSubscribed: false,
                year: '',
                academicYear: ''
              } as any as User;
            });
          }
        } catch (error) {
          console.error("Error fetching user data from MongoDB:", error);
          // If we already have a user in state, don't overwrite with a broken fallback
          setUser(prev => {
            if (prev && (prev.year || prev.academicYear)) return prev;
            return {
              uid: firebaseUser.uid,
              name: firebaseUser.displayName || 'Student',
              email: firebaseUser.email || '',
              isSubscribed: false,
              year: '',
              academicYear: ''
            } as any as User;
          });
        } finally {
          setAppLoading(false);
        }
      } else {
        setUser(null);
        setNotifications([]);
        setAppLoading(false);
      }
    };

    if (!loading) {
      setupUserListener();
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [firebaseUser, loading]);

  // SUBSCRIPTION EXPIRATION CHECK: 
  // We check if the user's Pro account has exceeded 30 days (Monthly) or 365 days (Yearly).
  React.useEffect(() => {
    const checkSubscriptionStatus = async () => {
      if (!user || !user.isSubscribed || !user.subscriptionDate) return;

      const subDate = new Date(user.subscriptionDate);
      const now = new Date();
      const diffInDays = Math.floor((now.getTime() - subDate.getTime()) / (1000 * 60 * 60 * 24));

      const plan = user.subscriptionPlan || 'monthly';
      const limit = plan === 'annual' ? 365 : 30;

      if (diffInDays >= limit) {
        try {
          // Update MongoDB via API
          await api.users.update(firebaseUser!.uid, {
            isSubscribed: false,
            subscriptionPlan: null,
            subscriptionDate: null
          });

          // Notify the user via a local notification
          const expiredNotif: Notification = {
            id: 'sub-expired-' + Date.now(),
            title: 'Subscription Expired',
            message: 'Your Pro plan has ended. Upgrade again to keep your benefits!',
            type: 'alert',
            date: new Date().toLocaleDateString(),
            read: false
          };
          setNotifications(prev => [expiredNotif, ...prev]);
        } catch (e) {
          console.error("Failed to update expired subscription:", e);
        }
      }
    };

    checkSubscriptionStatus();
  }, [user, firebaseUser]);

  // Check for email verification status and notify
  React.useEffect(() => {
    if (firebaseUser?.emailVerified) {
      const storageKey = `verified_notification_sent_${firebaseUser.uid}`;
      const alreadyNotified = localStorage.getItem(storageKey);

      if (!alreadyNotified) {
        const verificationNotification: Notification = {
          id: 'email-verified-' + Date.now(),
          title: 'Email Verified',
          message: 'Your email address has been successfully verified. Thank you!',
          type: 'success',
          date: new Date().toLocaleDateString(),
          read: false
        };

        setNotifications(prev => [verificationNotification, ...prev]);
        localStorage.setItem(storageKey, 'true');
      }
    }
  }, [firebaseUser]);

  // Fetch MongoDB Notifications
  React.useEffect(() => {
    if (firebaseUser) {
      const fetchNotifications = async () => {
        try {
          const data = await api.notifications.get();
          if (Array.isArray(data)) {
            setNotifications(data);
          }
        } catch (error) {
          console.error("Failed to fetch notifications from MongoDB:", error);
        }
      };

      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // Poll every minute
      return () => clearInterval(interval);
    }
  }, [firebaseUser]);


  // Helper function
  const generateNotifications = (u: User) => {
    const newNotifs: Notification[] = [];
    const now = new Date();

    if (!u.phoneNumber || !u.email || (u.currentCourses && u.currentCourses.length === 0)) {
      newNotifs.push({
        id: 'profile-inc',
        title: 'Complete Your Profile',
        message: 'Add your contact info and current courses to get personalized recommendations.',
        type: 'alert',
        date: 'Just now',
        read: false
      });
    }

    newNotifs.push({
      id: 'new-course',
      title: 'New Content Added',
      message: 'Neurology: Central Nervous System Basics has been added to your Learning Library.',
      type: 'success',
      date: '2 hours ago',
      read: false
    });

    const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    if (now.getDate() >= lastDayOfMonth - 3) {
      newNotifs.push({
        id: 'analytics',
        title: 'Monthly Analytics Ready',
        message: `Your study analytics for ${now.toLocaleString('default', { month: 'long' })} are ready for review.`,
        type: 'info',
        date: 'Yesterday',
        read: false
      });
    }

    return newNotifs;
  };


  const handleUpdateUser = async (data: Partial<User>) => {
    if (user && firebaseUser) {
      // Optimistic update - ensure year and academicYear are SYNCED
      const updatedUser = {
        ...user,
        ...data,
        // Cross-sync year and academicYear locally
        year: data.year || data.academicYear || user.year || user.academicYear || '',
        academicYear: data.academicYear || data.year || user.academicYear || user.year || ''
      };
      setUser(updatedUser);

      try {
        // Prepare data for backend - send both to be safe
        const payload = {
          ...data,
          year: data.year || data.academicYear,
          academicYear: data.academicYear || data.year
        };
        // Hit MongoDB Backend API
        await api.users.update(firebaseUser.uid, payload);
      } catch (e) {
        console.error("Error updating user profile in MongoDB:", e);
      }
    }
  };

  const handleSubscriptionComplete = (isPro: boolean) => {
    handleUpdateUser({ isSubscribed: isPro });
  };

  const handleLogout = async () => {
    await logout();
    setUser(null);
    setNotifications([]);
  };

  const handleDeleteAccount = async () => {
    try {
      if (deleteAccount) {
        await deleteAccount();
        setUser(null);
        setNotifications([]);
        window.location.href = '/'; // Hard refresh to clear any lingering state
      }
    } catch (error: any) {
      console.error("Failed to delete account from App handler", error);
      let title = 'Deletion Failed';
      let message = 'Failed to delete account. Please try again.';
      let type: ModalType = 'error';

      if (error.code === 'auth/requires-recent-login') {
        title = 'Security Verification Required';
        message = 'For security reasons, please log out and log back in, then try deleting your account again.';
        type = 'info';
      } else if (error.code === 'auth/operation-not-allowed') {
        message = 'Account deletion is currently disabled by the administrator.';
      } else {
        message = error.message || 'An unknown error occurred while deleting your account.';
      }

      setModalConfig({
        isOpen: true,
        title,
        message,
        type
      });
    }
  };

  const [clearedNotificationIds, setClearedNotificationIds] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('cleared_notifications');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist cleared notifications
  React.useEffect(() => {
    localStorage.setItem('cleared_notifications', JSON.stringify(clearedNotificationIds));
  }, [clearedNotificationIds]);

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearNotification = (id: string) => {
    setClearedNotificationIds(prev => [...prev, id]);
  };

  const handleClearAll = () => {
    const ids = notifications.map(n => n.id);
    setClearedNotificationIds(prev => [...new Set([...prev, ...ids])]);
  };

  // Filter out cleared notifications for display
  const visibleNotifications = React.useMemo(() => {
    if (!notifications) return [];
    return notifications.filter(n => !clearedNotificationIds.includes(n.id));
  }, [notifications, clearedNotificationIds]);

  if (loading || appLoading) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-brand-blue/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-16 h-16 bg-brand-blue text-white rounded-2xl flex items-center justify-center shadow-xl shadow-brand-blue/30 mb-6 animate-bounce">
            <Stethoscope size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-brand-dark tracking-tight mb-2">Medico<span className="text-brand-blue">Hub</span></h2>
        </div >
      </div >
    );
  }



  if (maintenanceMode) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 text-center">
        <div className="w-24 h-24 bg-white rounded-full shadow-xl flex items-center justify-center mb-8 animate-bounce">
          <Stethoscope size={48} className="text-brand-blue" />
        </div>
        <h1 className="text-4xl font-extrabold text-brand-dark mb-4">Under Maintenance</h1>
        <p className="text-gray-500 max-w-md mx-auto text-lg mb-8">
          We're currently upgrading the platform to improve your experience.
          Please check back soon.
        </p>
        <div className="bg-blue-50 text-brand-blue px-6 py-3 rounded-full font-bold text-sm">
          Expected downtime: ~1 hour
        </div>
      </div>
    );
  }

  // Wrappers to pass to Login/Signup are no longer needed as they used context directly,
  // but we keep the prop interface for now or refactor pages.
  const noop = () => { };

  const commonProps = {
    notifications: visibleNotifications,
    onMarkAllRead: handleMarkAllRead,
    onClearNotification: handleClearNotification,
    onClearAll: handleClearAll,
    onLogout: handleLogout,
    onDeleteAccount: handleDeleteAccount
  };

  const isOnboarded = (u: User | null) => {
    // A user is considered onboarded if they have a year set that isn't empty
    // We treat 'General' as the default/starting state that REQUIRES completion.
    const year = u?.year || u?.academicYear || '';
    return !!u && !!year && year !== 'General';
  };

  return (
    <MainLayout user={user}>
      <StatusModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
      <Routes>
        <Route path={AppRoute.HOME} element={<LandingPage />} />
        <Route path={AppRoute.ABOUT} element={<About />} />
        <Route path={AppRoute.PRICING} element={<Pricing user={user} onUpdateUser={handleUpdateUser} />} />
        <Route path={AppRoute.MCAMP} element={<MCamp user={user} onLogout={handleLogout} />} />

        <Route
          path={AppRoute.LOGIN}
          element={
            user ? (
              !isOnboarded(user) ? <Navigate to={AppRoute.ONBOARDING} /> : <Navigate to={AppRoute.PROFILE} />
            ) : <Login onLogin={noop} />
          }
        />

        <Route
          path={AppRoute.SIGNUP}
          element={
            user ? (
              !isOnboarded(user) ? <Navigate to={AppRoute.ONBOARDING} /> : <Navigate to={AppRoute.PROFILE} />
            ) : <Signup onSignup={noop} />
          }
        />

        <Route
          path={AppRoute.FORGOT_PASSWORD}
          element={
            user ? <Navigate to={AppRoute.PROFILE} /> : <ForgotPassword />
          }
        />

        <Route path="/verify-email" element={<VerifyEmail />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        <Route
          path={AppRoute.ONBOARDING}
          element={
            user ? <Onboarding updateUser={handleUpdateUser} /> : <Navigate to={AppRoute.SIGNUP} />
          }
        />


        <Route
          path={AppRoute.DASHBOARD}
          element={
            user ? (
              !isOnboarded(user) ? <Navigate to={AppRoute.ONBOARDING} /> : <Dashboard user={user} {...commonProps} />
            ) : <Navigate to={AppRoute.LOGIN} />
          }
        />

        <Route
          path={AppRoute.PROFILE}
          element={
            user ? (
              !isOnboarded(user) ? <Navigate to={AppRoute.ONBOARDING} /> : <Profile user={user} onUpdate={handleUpdateUser} {...commonProps} />
            ) : <Navigate to={AppRoute.LOGIN} />
          }
        />

        <Route
          path={AppRoute.LEARNING}
          element={
            user ? (
              !isOnboarded(user) ? <Navigate to={AppRoute.ONBOARDING} /> : <Learning user={user} {...commonProps} />
            ) : <Navigate to={AppRoute.LOGIN} />
          }
        />

        {/* Direct Link to a resource */}
        <Route
          path={`${AppRoute.LEARNING}/:resourceId`}
          element={
            user ? (
              !isOnboarded(user) ? <Navigate to={AppRoute.ONBOARDING} /> : <Learning user={user} {...commonProps} />
            ) : <Navigate to={AppRoute.LOGIN} />
          }
        />

        <Route
          path={AppRoute.MCAMP_DASHBOARD}
          element={
            user ? (
              !isOnboarded(user) ? <Navigate to={AppRoute.ONBOARDING} /> : <MCampUserDashboard user={user} onUpdateUser={handleUpdateUser} {...commonProps} />
            ) : <Navigate to={AppRoute.LOGIN} />
          }
        />

        <Route path={AppRoute.STORE} element={<Store user={user} />} />
        <Route path={AppRoute.PRIVACY} element={<PrivacyPolicy />} />
        <Route path={AppRoute.TERMS} element={<TermsOfService />} />
        <Route path={AppRoute.LEGAL} element={<Legal />} />

        {/* Catch-all 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </MainLayout>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <GlobalErrorBoundary>
        <SettingsProvider>
          <QueryClientProvider client={queryClient}>
            <HashRouter>
              <ScrollToTop />
              <AppContent />
            </HashRouter>
          </QueryClientProvider>
        </SettingsProvider>
      </GlobalErrorBoundary>
    </AuthProvider>
  );
}

export default App;

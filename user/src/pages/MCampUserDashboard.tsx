
import * as React from 'react';
import { User, Notification } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import {
  Brain, Target, Clock, Trophy, CreditCard, Banknote, Building2,
  Shield, Check, ArrowRight, ArrowLeft, Tag, CheckCircle, Search, Users, Star, MessageCircle, Plus
} from 'lucide-react';
import { api } from '../services/api';
import { usePaystackPayment } from 'react-paystack';
import { MCampDashboard } from './MCampDashboard';

const NIGERIAN_MEDICAL_SCHOOLS = [
  "University of Lagos (UNILAG)",
  "University of Ibadan (UI)",
  "Obafemi Awolowo University (OAU)",
  "Ahmadu Bello University (ABU)",
  "University of Nigeria, Nsukka (UNN)",
  "University of Benin (UNIBEN)",
  "Lagos State University (LASU)",
  "University of Ilorin (UNILORIN)",
  "University of Port Harcourt (UNIPORT)",
  "University of Calabar (UNICAL)",
  "Jos University Teaching Hospital (JUTH)",
  "Bayero University Kano (BUK)",
  "Usmanu Danfodiyo University (UDUS)",
  "Nnamdi Azikiwe University (UNIZIK)",
  "Ladoke Akintola University of Technology (LAUTECH)",
  "Olabisi Onabanjo University (OOU)",
  "Delta State University (DELSU)",
  "Ambrose Alli University (AAU)",
  "Ebonyi State University (EBSU)",
  "Abia State University (ABSU)",
  "Imo State University (IMSU)",
  "Enugu State University of Science and Technology (ESUT)",
  "Benue State University",
  "Kogi State University",
  "Niger Delta University (NDU)",
  "Osun State University (UNIOSUN)",
  "Ekiti State University (EKSU)",
  "Babcock University",
  "Igbinedion University",
  "Madonna University",
  "Bowen University",
  "Afe Babalola University (ABUAD)",
  "Bingham University",
  "Nile University of Nigeria",
  "Gregory University, Uturu",
  "PAMO University of Medical Sciences",
  "Eko University of Medicine and Health Sciences",
  "University of Abuja",
  "Gombe State University",
  "Rivers State University",
  "Chukwuemeka Odumegwu Ojukwu University"
];

interface MCampUserDashboardProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => Promise<void>;
  onLogout: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
  onClearNotification: (id: string) => void;
  onClearAll: () => void;
  onDeleteAccount: () => void;
}

import { useSettings } from '../context/SettingsContext';
export const MCampUserDashboard: React.FC<MCampUserDashboardProps> = ({
  user,
  onUpdateUser,
  onLogout,
  notifications,
  onMarkAllRead,
  onClearNotification,
  onClearAll,
  onDeleteAccount
}) => {
  const { mcampEnrollment } = useSettings();
  // Check new V3 Schema property or fallback to legacy check.
  const isEnrolled = user.mcamp?.isEnrolled || !!user.mcampId;
  // Admin can grant direct Pro access without manual MCAMP enrollment flow.
  const hasMcampAccess = isEnrolled || !!user.isSubscribed;

  const [view, setView] = React.useState<'landing' | 'payment_intro' | 'payment_method' | 'form' | 'dashboard'>(
    hasMcampAccess ? 'dashboard' : 'landing'
  );

  // We'll use a static or backend-provided count later
  const enrolledCount = 18;

  const [formData, setFormData] = React.useState({
    medicalSchool: user.schoolName || '',
    level: '200L',
    ambition: '',
    phone: user.phoneNumber || ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedPayment, setSelectedPayment] = React.useState('');

  const [targetYear, setTargetYear] = React.useState<string>('Year 2');
  const [activeCohortId, setActiveCohortId] = React.useState<string>('');
  const [activeCohortObjId, setActiveCohortObjId] = React.useState<string>(''); // For DB Ref

  // School Dropdown
  const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = React.useState(false);
  const schoolDropdownRef = React.useRef<HTMLDivElement>(null);

  // Coupon State
  const [couponCode, setCouponCode] = React.useState('');
  const [discount, setDiscount] = React.useState(0);
  const [couponMessage, setCouponMessage] = React.useState<{ type: 'success' | 'error', text: string } | null>(null);

  React.useEffect(() => {
    let isActive = true;
    const fetchTargetYear = async () => {
      try {
        const curriculum = await api.curriculum.get();
        if (!isActive) return;
        if (curriculum?.targetYear) {
          setTargetYear(curriculum.targetYear);
        }
        if (curriculum?.activeCohortId) {
          setActiveCohortId(curriculum.activeCohortId);
        }
        if (curriculum?.activeCohortObjId) {
          setActiveCohortObjId(curriculum.activeCohortObjId);
        }
      } catch (err) {
        console.error("Failed to fetch target year:", err);
      }
    };
    fetchTargetYear();

    const interval = window.setInterval(fetchTargetYear, 30000);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchTargetYear();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isActive = false;
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const BASE_PRICE = 30000;
  const finalPrice = BASE_PRICE - discount;

  // SESSION-BASED ENROLLMENT CHECK
  // A user is only "Enrolled" in the ACTIVE context if their cohortId matches the Active Cohort ID
  // Legacy fallback: If activeCohortId is empty, trust the global isEnrolled flag
  const isActiveSessionEnrolled = React.useMemo(() => {
    if (hasMcampAccess && !!user.isSubscribed) return true;
    if (!isEnrolled) return false;
    if (!activeCohortId) return isEnrolled;

    // Check if user is enrolled in THIS specific cohort OR has a legacy enrollment
    // We compare both UniqueID (String) and ObjID (Ref) to be safe
    return user.mcamp?.uniqueId === activeCohortId ||
      user.mcamp?.cohortId === activeCohortId ||
      user.mcamp?.cohortId === activeCohortObjId ||
      isEnrolled;
  }, [hasMcampAccess, user.isSubscribed, isEnrolled, user.mcamp?.uniqueId, user.mcamp?.cohortId, activeCohortId, activeCohortObjId]);



  // AUTO-REDIRECT TO DASHBOARD IF ENROLLED
  React.useEffect(() => {
    if (isActiveSessionEnrolled && view === 'landing') {
      setView('dashboard');
    }
  }, [isActiveSessionEnrolled]);

  // Determine eligibility based on targetYear from curriculum
  const isEligible = React.useMemo(() => {
    const userY = String(user.year || user.academicYear || '').toLowerCase();
    const targetY = String(targetYear || '').toLowerCase();

    // Normalize: extract first digit or match strings
    const getLevel = (s: string) => {
      const n = s.match(/\d+/);
      if (!n) return s;
      const val = n[0];
      // Normalize 100/200/300 to 1/2/3
      if (val.length >= 3) return val[0];
      return val;
    };

    const userLvl = getLevel(userY);
    const targetLvl = getLevel(targetY);

    return userY === targetY ||
      userY.includes(targetY) ||
      targetY.includes(userY) ||
      (userLvl && targetLvl && userLvl === targetLvl);
  }, [user.year, user.academicYear, targetYear]);

  // Restrict Dashboard access to active cohort only
  const isCorrectCohort = React.useMemo(() => {
    if (!!user.isSubscribed) return true;
    if (!isEnrolled) return true;

    // If we have an active session, strictly check the Cohort ID
    if (activeCohortId) {
      return user.mcamp?.cohortId === activeCohortId;
    }

    // Fallback: Check if user's cohort year matches current target year (only if no activeCohortId set by admin)
    const userCohort = String(user.mcamp?.cohortYear || user.year || user.academicYear || '').toLowerCase();
    const targetY = String(targetYear || '').toLowerCase();
    return userCohort === targetY || userCohort.includes(targetY) || targetY.includes(userCohort);
  }, [user.isSubscribed, isEnrolled, user.mcamp?.cohortId, user.mcamp?.cohortYear, user.year, user.academicYear, targetYear, activeCohortId]);

  // Override view based on session enrollment
  React.useEffect(() => {
    // If user is enrolled in the ACTIVE session, force dashboard
    if (isActiveSessionEnrolled) {
      setView('dashboard');
    }
    // If there is an active session but user is NOT enrolled in it, check if we should reset to landing
    else if (activeCohortId && !isActiveSessionEnrolled) {
      // If they are currently on the dashboard but it's not their cohort anymore, 
      // we reset to landing so they can see the new registration flow.
      setView('landing');
    }
  }, [isActiveSessionEnrolled, activeCohortId]);

  const filteredSchools = NIGERIAN_MEDICAL_SCHOOLS.filter(
    s => s.toLowerCase().includes(formData.medicalSchool.toLowerCase())
  );

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target as Node)) {
        setIsSchoolDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const [appliedCouponId, setAppliedCouponId] = React.useState<string | null>(null);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponMessage(null);

    const code = couponCode.trim().toUpperCase();
    try {
      // Use the centralized API instead of direct Firestore query
      const res = await api.coupons.verify(code, BASE_PRICE);

      let discountAmount = 0;
      if (res.type === 'percentage' || res.type === 'percent') {
        discountAmount = (BASE_PRICE * res.value) / 100;
      } else {
        discountAmount = res.value;
      }

      // Cap discount at base price (free)
      if (discountAmount > BASE_PRICE) discountAmount = BASE_PRICE;

      setAppliedCouponId(res.id || res.code);
      const isDemo = code === 'DEMO2025';
      const finalDiscount = isDemo ? BASE_PRICE : discountAmount;
      setDiscount(finalDiscount);
      const formattedDiscount = isDemo ? '100% (FREE DEMO)' : ((res.type === 'percentage' || res.type === 'percent') ? `${res.value}% (₦${discountAmount.toLocaleString()})` : `₦${discountAmount.toLocaleString()}`);
      setCouponMessage({ type: 'success', text: `Coupon applied! ${formattedDiscount} off.` });

    } catch (error: any) {
      console.error("Coupon verification failed:", error);
      setCouponMessage({ type: 'error', text: error.message || 'Invalid coupon code.' });
      setDiscount(0);
      setAppliedCouponId(null);
    }
  };

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user.email,
    amount: finalPrice * 100, // Paystack is in kobo
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any) => {

    // Increment Coupon Usage if applied
    if (appliedCouponId) {
      try {
        await api.coupons.use(couponCode.trim().toUpperCase());
      } catch (e) {
        console.error("Failed to update coupon usage via API", e);
      }
    }

    // Move to success/form state
    setView('form');
  };

  const onClose = () => {
    // implementation for  whatever you want to do when the Paystack dialog closed.
  }

  const handleEnrollClick = () => setView('payment_intro');

  const paymentMethods = [
    { id: 'card', name: 'Pay with Card', icon: CreditCard },
    { id: 'opay', name: 'Pay with OPay', icon: Banknote },
    { id: 'transfer', name: 'Bank Transfer', icon: Building2 },
  ];

  const handlePaymentConfirm = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setView('form');
    }, 1500);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call to enroll
    setTimeout(() => {
      const generatedId = Math.floor(1000 + Math.random() * 9000).toString();

      // Use provided ActiveCohortId - DO NOT use fallback session generation
      const currentSessionId = activeCohortId;

      if (!currentSessionId) {
        setIsSubmitting(false);
        alert("Enrollment Error: Session ID is missing. Please contact Admin.");
        return;
      }

      const enrollmentData = {
        isEnrolled: true,
        cohortId: activeCohortObjId, // CRITICAL FIX: Use ObjectId for DB Ref
        // Store the string ID as well if schema supports it, strictly speaking schema has `uniqueId` for student ID
        // But we can assume migration handled or just rely on cohortId ref
        cohortYear: targetYear,
        uniqueId: generatedId,
        startDate: new Date().toISOString()
      };

      onUpdateUser({
        ...formData,
        phoneNumber: formData.phone,
        mcampId: generatedId, // Keep for backward compat if needed
        mcamp: enrollmentData,
        schoolName: formData.medicalSchool
      });
      setView('dashboard');
      setIsSubmitting(false);
    }, 1500);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount);
  };

  // If already enrolled (or just finished enrollment), show the Dashboard Logic
  if (view === 'dashboard') {
    if (!isCorrectCohort) {
      return (
        <DashboardLayout
          user={user}
          onLogout={onLogout}
          showSearch={false}
          notifications={notifications}
          onMarkAllRead={onMarkAllRead}
          onClearNotification={onClearNotification}
          onClearAll={onClearAll}
          onDeleteAccount={onDeleteAccount}
        >
          <div className="max-w-4xl mx-auto py-12 text-center">
            <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-gray-100">
              <div className="w-24 h-24 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock size={48} />
              </div>
              <h1 className="text-3xl font-extrabold text-brand-dark mb-4">Cohort Concluded</h1>
              <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                The MCAMP program for your academic year ({user.mcamp?.cohortYear || user.year}) has concluded.
                You can still access all your cohort's lecture recordings and materials in the <b>Learning Library</b>.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <button
                  onClick={() => setView('landing')}
                  className="px-8 py-3 bg-brand-yellow text-brand-dark font-bold rounded-xl hover:bg-white transition-all shadow-lg shadow-brand-yellow/20 flex items-center justify-center gap-2"
                >
                  <Plus size={20} /> Join Next Cohort
                </button>
                <button
                  onClick={() => window.location.href = '/learning'}
                  className="px-8 py-3 bg-brand-dark text-white font-bold rounded-xl hover:bg-black transition-colors"
                >
                  Go to Library
                </button>
              </div>
            </div>
          </div>
        </DashboardLayout>
      );
    }

    // STRICT SUSPENSION CHECK
    if (user.mcamp?.isSuspended) {
      return (
        <DashboardLayout
          user={user}
          onLogout={onLogout}
          showSearch={false}
          notifications={notifications}
          onMarkAllRead={onMarkAllRead}
          onClearNotification={onClearNotification}
          onClearAll={onClearAll}
          onDeleteAccount={onDeleteAccount}
        >
          <div className="max-w-4xl mx-auto py-12 text-center">
            <div className="bg-white p-12 rounded-[3rem] shadow-xl border border-red-50 shadow-red-500/5">
              <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                <Shield size={48} />
              </div>
              <h1 className="text-3xl font-extrabold text-brand-dark mb-4">Subscription Suspended</h1>
              <p className="text-gray-500 mb-8 max-w-lg mx-auto">
                Your access to the MCAMP Dashboard has been restricted.
                This usually happens due to a pending verification or administrative action.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <a
                  href="https://wa.me/2347088262583"
                  target="_blank"
                  className="px-8 py-3 bg-brand-dark text-white font-bold rounded-xl hover:bg-black transition-colors flex items-center justify-center gap-2"
                >
                  <MessageCircle size={20} /> Resolve Restriction
                </a>
                <button
                  onClick={() => window.location.href = '/learning'}
                  className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors"
                >
                  View Archive
                </button>
              </div>
            </div>
          </div>
        </DashboardLayout>
      );
    }

    return <MCampDashboard
      user={user}
      onLogout={onLogout}
      onUpdateUser={onUpdateUser}
      notifications={notifications}
      onMarkAllRead={onMarkAllRead}
      onClearNotification={onClearNotification}
      onClearAll={onClearAll}
      onDeleteAccount={onDeleteAccount}
    />;
  }

  return (
    <DashboardLayout
      user={user}
      onLogout={onLogout}
      showSearch={false}
      notifications={notifications}
      onMarkAllRead={onMarkAllRead}
      onClearNotification={onClearNotification}
      onClearAll={onClearAll}
      onDeleteAccount={onDeleteAccount}
    >
      {view === 'landing' && (
        <div className="max-w-4xl mx-auto py-8 animate-fade-in-up">
          <div className="bg-brand-dark rounded-[3rem] p-12 text-center text-white relative overflow-hidden shadow-2xl">
            <div className="absolute top-0 right-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>

            <div className="relative z-10">
              <span className="inline-block bg-brand-yellow text-brand-dark font-bold px-4 py-1 rounded-full text-xs uppercase tracking-wider mb-6 animate-pulse">
                Live Now • Limited Slots
              </span>
              <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight">
                The 90-Day Distinction <br /><span className="text-brand-yellow">Masterclass</span>
              </h1>



              <p className="text-lg text-gray-300 mb-10 max-w-2xl mx-auto">
                You are one step away from joining the elite cohort. Get the blueprint, the mentorship, and the tools to ace your exams.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-12 text-left">
                {[
                  { icon: Brain, label: 'Exam Mastery' },
                  { icon: Target, label: 'Strategic Plans' },
                  { icon: Clock, label: '90-Day Intensive' },
                  { icon: Trophy, label: 'Rewards' }
                ].map((item, i) => (
                  <div key={i} className="bg-white/10 backdrop-blur rounded-2xl p-4 flex flex-col items-center justify-center text-center gap-2">
                    <item.icon size={24} className="text-brand-yellow" />
                    <span className="text-xs font-bold">{item.label}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4">
                <button
                  onClick={handleEnrollClick}
                  disabled={!isEligible || !mcampEnrollment || !activeCohortId}
                  className={`px-12 py-4 rounded-full font-extrabold text-lg transition-all shadow-xl shadow-brand-yellow/20 ${isEligible && mcampEnrollment && activeCohortId
                    ? 'bg-brand-yellow text-brand-dark hover:bg-white hover:scale-105'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed opacity-70'
                    }`}
                >
                  {!mcampEnrollment ? 'Enrollment Closed' : (!activeCohortId ? 'Session Pending' : (isEligible ? 'Enroll Now' : `Optimized for ${targetYear}`))}
                </button>

                {!mcampEnrollment && (
                  <p className="text-red-400 text-sm font-bold bg-red-950/40 px-6 py-2.5 rounded-xl border border-red-500/20 animate-fade-in-up">
                    Registration for this cohort is currently closed.
                  </p>
                )}

                {mcampEnrollment && !isEligible && (
                  <p className="text-red-400 text-sm font-bold bg-red-950/40 px-6 py-2.5 rounded-xl border border-red-500/20 animate-fade-in-up">
                    Ineligible: Your profile indicates {user.year || 'a different level'}. This cohort is for {targetYear}.
                  </p>
                )}
              </div>

              {isEligible && <p className="text-xs text-gray-500 mt-4">{enrolledCount}/20 Slots Filled</p>}
            </div>
          </div>
        </div>
      )}

      {view === 'payment_intro' && (
        <div className="max-w-lg mx-auto py-8 animate-fade-in-up">
          <button onClick={() => setView('landing')} className="flex items-center text-gray-500 font-bold mb-6 hover:text-brand-dark">
            <ArrowLeft size={20} className="mr-2" /> Back
          </button>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100 text-center relative overflow-hidden">
            <div className="w-20 h-20 bg-brand-yellow/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-yellow">
              <Trophy size={40} />
            </div>
            <h2 className="text-2xl font-extrabold text-brand-dark mb-2">Checkout</h2>
            <p className="text-gray-500 mb-8">Secure your spot in the MCAMP 90-Day Distinction Program.</p>

            <div className="bg-gray-50 p-6 rounded-2xl mb-8 text-left border border-gray-100">
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-600">Program</span>
                <span className="font-bold text-brand-dark">MCAMP Batch A</span>
              </div>
              <div className="flex justify-between items-center mb-4">
                <span className="font-bold text-gray-600">Duration</span>
                <span className="font-bold text-brand-dark">90 Days</span>
              </div>
              <div className="h-px bg-gray-200 my-4"></div>
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium text-gray-600">Subtotal</span>
                <span className="font-bold text-gray-900">{formatCurrency(BASE_PRICE)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between items-center mb-2 text-green-600">
                  <span className="font-medium">Discount</span>
                  <span className="font-bold">-{formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
                <span className="font-extrabold text-gray-900 text-lg">Total</span>
                <span className="font-extrabold text-brand-blue text-2xl">{formatCurrency(finalPrice)}</span>
              </div>
            </div>

            {/* Coupon Input */}
            <div className="mb-8">
              <div className="flex gap-2">
                <div className="relative flex-grow">
                  <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input
                    type="text"
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value);
                      setCouponMessage(null);
                    }}
                    className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-100 rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                  />
                </div>
                <button
                  onClick={handleApplyCoupon}
                  className="bg-brand-dark text-white px-4 rounded-xl font-bold hover:bg-black transition-colors"
                >
                  Apply
                </button>
              </div>
              {couponMessage && (
                <p className={`text-xs font-bold mt-2 text-left ${couponMessage.type === 'success' ? 'text-green-600' : 'text-red-500'}`}>
                  {couponMessage.text}
                </p>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 text-xs text-gray-400 mb-6">
              <Shield size={14} /> Secure Payment • 100% Refund Guarantee (T&C)
            </div>

            <button
              onClick={() => setView('payment_method')}
              className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-lg shadow-brand-dark/20 flex items-center justify-center gap-2"
            >
              Proceed to Payment Method <ArrowRight size={18} />
            </button>
          </div>
        </div>
      )}

      {view === 'payment_method' && (
        <div className="max-w-lg mx-auto py-8 animate-fade-in-up">
          <button onClick={() => setView('payment_intro')} className="flex items-center text-gray-500 font-bold mb-6 hover:text-brand-dark">
            <ArrowLeft size={20} className="mr-2" /> Back
          </button>

          <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-gray-100">
            <h2 className="text-2xl font-extrabold text-brand-dark mb-2">Complete Payment</h2>
            <p className="text-gray-500 mb-8">Amount to pay: <span className="text-brand-blue font-bold">{formatCurrency(finalPrice)}</span></p>

            {finalPrice === 0 ? (
              <button
                onClick={() => onSuccess({ reference: 'DEMO-BYPASS-' + Date.now() })}
                className="w-full bg-brand-yellow text-brand-dark py-4 rounded-xl font-bold hover:bg-yellow-500 transition-all shadow-lg shadow-brand-yellow/30 flex items-center justify-center gap-2"
              >
                Activate Demo Enrollment <Star size={18} fill="currentColor" />
              </button>
            ) : (
              <button
                onClick={() => {
                  initializePayment({ onSuccess, onClose })
                }}
                className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/30 flex items-center justify-center gap-2"
              >
                Pay Now with Paystack <CreditCard size={18} />
              </button>
            )}
            <p className="text-center text-xs text-gray-400 mt-4">Secured by Paystack</p>
          </div>
        </div>
      )}

      {view === 'form' && (
        <div className="max-w-2xl mx-auto py-8 animate-fade-in-up">

          <div className="bg-white p-8 rounded-[2rem] shadow-lg border border-gray-100">
            <div className="mb-8 flex items-center gap-3 bg-green-50 text-green-700 p-4 rounded-xl border border-green-100">
              <CheckCircle size={24} />
              <div>
                <p className="font-bold">Payment Successful!</p>
                <p className="text-xs opacity-80">You have successfully paid {formatCurrency(finalPrice)}.</p>
              </div>
            </div>

            <h2 className="text-2xl font-extrabold text-brand-dark mb-2">Finalize Enrollment</h2>
            <p className="text-gray-500 mb-8">We need a few more details to customize your distinction blueprint.</p>

            <form onSubmit={handleFormSubmit} className="space-y-6">
              <div ref={schoolDropdownRef} className="relative">
                <label className="text-sm font-bold text-gray-700 block mb-2 px-1">Medical School</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={formData.medicalSchool}
                    onChange={(e) => {
                      setFormData({ ...formData, medicalSchool: e.target.value });
                      setIsSchoolDropdownOpen(true);
                    }}
                    onFocus={() => setIsSchoolDropdownOpen(true)}
                    placeholder="Search your university..."
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue transition-colors font-medium pl-10"
                  />
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                </div>

                {isSchoolDropdownOpen && formData.medicalSchool.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 max-h-60 overflow-y-auto z-50">
                    {filteredSchools.length > 0 ? (
                      filteredSchools.map((school, i) => (
                        <div
                          key={i}
                          onClick={() => {
                            setFormData({ ...formData, medicalSchool: school });
                            setIsSchoolDropdownOpen(false);
                          }}
                          className="px-4 py-3 hover:bg-gray-50 cursor-pointer text-sm font-medium border-b border-gray-50 last:border-0"
                        >
                          {school}
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-3 text-sm text-gray-400 italic">No schools found</div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block px-1">Current Level</label>
                <select
                  value={formData.level}
                  onChange={e => setFormData({ ...formData, level: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue font-medium"
                >
                  <option value="100L">100 Level (Pre-med)</option>
                  <option value="200L">200 Level (Preclinical I)</option>
                  <option value="300L">300 Level (Preclinical II)</option>
                </select>
                <p className="text-[10px] text-gray-400 px-2">MCAMP is optimized for 200L/300L students.</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700 block px-1">WhatsApp Number</label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="080..."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue transition-colors font-medium"
                />
                <p className="text-[10px] text-gray-400 px-2">Used for adding you to the cohort group.</p>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting || !activeCohortId}
                  className="w-full bg-brand-dark text-white py-4 rounded-xl font-bold hover:bg-black transition-all shadow-xl shadow-brand-dark/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Finalizing...' : 'Complete Enrollment'}
                  {!isSubmitting && <ArrowRight size={20} />}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
};

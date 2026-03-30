import * as React from 'react';
import { Check, Lock, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { AppRoute, User } from '../types';
import { usePaystackPayment } from 'react-paystack';
import { StatusModal, ModalType } from '../components/StatusModal';

interface PricingProps {
  user?: User | null;
  onUpdateUser?: (data: Partial<User>) => Promise<void>;
}

export const Pricing: React.FC<PricingProps> = ({ user, onUpdateUser }) => {
  const navigate = useNavigate();
  const [isAnnual, setIsAnnual] = React.useState(false);
  const [modalConfig, setModalConfig] = React.useState<{ isOpen: boolean; title: string; message: string; type: ModalType }>({
    isOpen: false,
    title: '',
    message: '',
    type: 'success'
  });
  const [promoCode, setPromoCode] = React.useState('');
  const [isDemoMode, setIsDemoMode] = React.useState(false);

  // Paystack Config
  const baseAmount = isAnnual ? 5760000 : 600000;
  const amount = isDemoMode ? 0 : baseAmount; // 57,600 or 6,000 * 100 kobo

  const config = {
    reference: (new Date()).getTime().toString(),
    email: user?.email || '',
    amount: amount,
    publicKey: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
  };

  const initializePayment = usePaystackPayment(config);

  const onSuccess = async (reference: any) => {
    if (user && onUpdateUser) {
      try {
        await onUpdateUser({
          isSubscribed: true,
          subscriptionPlan: isAnnual ? 'annual' : 'monthly',
          subscriptionDate: new Date().toISOString()
        });
        setModalConfig({
          isOpen: true,
          title: 'Welcome to Pro!',
          message: 'Your subscription has been activated successfully. You now have full access to all resources!',
          type: 'success'
        });
      } catch (e: any) {
        console.error("Error updating subscription", e);
        setModalConfig({
          isOpen: true,
          title: 'Update Failed',
          message: 'Payment was successful, but we couldn\'t update your profile automatically. Please contact support.',
          type: 'error'
        });
      }
    }
  };

  const onClose = () => {
  }

  const handleProClick = () => {
    if (user?.isSubscribed) {
      setModalConfig({
        isOpen: true,
        title: 'Already Pro!',
        message: 'You are already a Pro member. You won\'t be charged again until your current plan expires.',
        type: 'info'
      });
      return;
    }

    if (user) {
      if (isDemoMode) {
        onSuccess({ reference: 'DEMO-BYPASS-' + Date.now() });
      } else {
        initializePayment({ onSuccess, onClose });
      }
    } else {
      navigate(AppRoute.SIGNUP, { state: { intent: 'pro' } });
    }
  };

  const handleFreeClick = () => {
    if (user) {
      navigate(AppRoute.DASHBOARD);
    } else {
      navigate(AppRoute.SIGNUP);
    }
  };

  return (
    <div className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto bg-white min-h-screen">
      <StatusModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onClose={() => {
          setModalConfig(prev => ({ ...prev, isOpen: false }));
          if (modalConfig.type === 'success') {
            navigate(AppRoute.DASHBOARD);
          }
        }}
      />
      <div className="text-center max-w-3xl mx-auto mb-16">
        <h1 className="text-5xl font-extrabold text-brand-dark mb-6">
          Simple Pricing, <span className="text-brand-blue">Infinite Knowledge</span>
        </h1>
        <p className="text-xl text-gray-500 mb-12">
          Unlock your full potential with Medico Pro, or start with the essentials for free.
        </p>

        <div className="inline-flex bg-gray-50 p-1.5 rounded-full relative shadow-sm border border-gray-100 mb-8">
          <button
            onClick={() => setIsAnnual(false)}
            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${!isAnnual ? 'bg-brand-dark text-white shadow-md' : 'text-gray-500 hover:text-brand-dark'}`}
          >
            Monthly
          </button>
          <button
            onClick={() => setIsAnnual(true)}
            className={`px-8 py-2.5 rounded-full text-sm font-bold transition-all ${isAnnual ? 'bg-brand-dark text-white shadow-md' : 'text-gray-500 hover:text-brand-dark'}`}
          >
            Yearly <span className="text-brand-yellow text-xs ml-1">-20%</span>
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
        {/* Free Tier */}
        <div className="bg-white border-2 border-gray-100 rounded-[2.5rem] p-8 lg:p-10 hover:border-gray-200 transition-colors flex flex-col h-full shadow-sm">
          <h3 className="text-2xl font-bold text-brand-dark mb-2">Basic Access</h3>
          <p className="text-gray-500 mb-6">Limited resources for casual study.</p>
          <div className="text-4xl font-extrabold text-brand-dark mb-8">₦0</div>

          <ul className="space-y-4 mb-10 flex-1">
            <li className="flex items-center gap-3 text-gray-600">
              <div className="bg-blue-50 p-1 rounded-full text-brand-blue"><Check size={14} /></div>
              Store Access
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <div className="bg-blue-50 p-1 rounded-full text-brand-blue"><Check size={14} /></div>
              3 Limited Daily AI Queries
            </li>
            <li className="flex items-center gap-3 text-gray-600">
              <div className="bg-blue-50 p-1 rounded-full text-brand-blue"><Check size={14} /></div>
              Basic Anatomy Notes
            </li>
            <li className="flex items-center gap-3 text-gray-400">
              <div className="bg-gray-50 p-1 rounded-full"><Lock size={14} /></div>
              Unlimited AI Queries
            </li>
            <li className="flex items-center gap-3 text-gray-400">
              <div className="bg-gray-50 p-1 rounded-full"><Lock size={14} /></div>
              Full Resource Library
            </li>
            <li className="flex items-center gap-3 text-gray-400">
              <div className="bg-gray-50 p-1 rounded-full"><Lock size={14} /></div>
              Performance Analytics
            </li>
          </ul>
          <button
            onClick={handleFreeClick}
            className="block w-full text-center bg-gray-100 hover:bg-gray-200 text-brand-dark font-bold py-4 rounded-2xl transition-all active:scale-95"
          >
            {user && !user.isSubscribed ? 'Current Plan' : 'Continue for Free'}
          </button>
        </div>

        {/* Pro Tier */}
        <div className="bg-brand-dark text-white rounded-[2.5rem] p-10 lg:p-12 relative shadow-2xl shadow-brand-blue/30 flex flex-col h-full border border-gray-800 transform md:scale-105">
          <div className="absolute top-0 right-0 bg-brand-blue text-white text-xs font-bold px-4 py-2 rounded-bl-2xl rounded-tr-[2.5rem] flex items-center gap-1.5 uppercase tracking-wider">
            <Star size={14} fill="currentColor" /> Recommended
          </div>
          <h3 className="text-2xl font-bold mb-2 text-brand-blue">Medico Pro</h3>
          <p className="text-gray-400 mb-6">The complete toolkit for distinction.</p>
          <div className="flex items-end gap-2 mb-8">
            <span className="text-5xl font-extrabold">{isAnnual ? '₦4,800' : '₦6,000'}</span>
            <span className="text-gray-400 mb-2 font-medium">/month</span>
          </div>

          <ul className="space-y-4 mb-10 flex-1">
            {[
              'Unlimited AI Queries',
              'Full Library Access',
              'Advanced Performance Charts',
              'Exclusive Store Discounts',
              'Priority Support',
              'Professional Mentorship Access'
            ].map(f => (
              <li key={f} className="flex items-center gap-3">
                <div className="bg-brand-blue p-1 rounded-full text-white"><Check size={14} /></div>
                <span className="font-medium">{f}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={handleProClick}
            className="block w-full text-center bg-brand-blue hover:bg-blue-600 text-white font-bold py-4 rounded-2xl transition-all shadow-lg shadow-brand-blue/40 active:scale-95 animate-pop-in"
          >
            {user?.isSubscribed ? 'Manage Subscription' : (isDemoMode ? 'Complete Demo Activation' : 'Activate Pro Membership')}
          </button>

          {!user?.isSubscribed && (
            <div className="mt-8 pt-8 border-t border-white/10">
              {isDemoMode ? (
                <div className="flex items-center justify-between text-brand-blue text-sm font-bold">
                  <span>Demo Mode Active</span>
                  <button onClick={() => { setIsDemoMode(false); setPromoCode(''); }} className="text-gray-400 hover:text-white underline">Cancel</button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs text-gray-500 font-bold uppercase tracking-widest">Have a Promo Code?</p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter code"
                      className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-brand-blue"
                      value={promoCode}
                      onChange={(e) => {
                        setPromoCode(e.target.value);
                        if (e.target.value.toUpperCase() === 'DEMO2025') setIsDemoMode(true);
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
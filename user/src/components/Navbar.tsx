import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Stethoscope, Menu, X, User as UserIcon, Zap } from 'lucide-react';
import { AppRoute, User } from '../types';
import { useSettings } from '../context/SettingsContext';

interface NavbarProps {
  user: User | null;
}

export const Navbar: React.FC<NavbarProps> = ({ user }) => {
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const isLoggedIn = !!user;
  const { mcampLive } = useSettings();

  const navLinks = [
    { name: 'Home', path: AppRoute.HOME },
    { name: 'MCAMP', path: AppRoute.MCAMP, isSpecial: true },
    { name: 'Store', path: AppRoute.STORE },
    { name: 'About', path: AppRoute.ABOUT },
    { name: 'Pricing', path: AppRoute.PRICING },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link to={AppRoute.HOME} className="flex items-center gap-2 group z-50 shrink-0">
            <div className="bg-brand-blue p-2 rounded-xl text-white shadow-lg shadow-brand-blue/20 group-hover:scale-110 transition-transform">
              <Stethoscope size={24} strokeWidth={2.5} />
            </div>
            <span className="font-extrabold text-2xl tracking-tight text-brand-dark">
              Medico<span className="text-brand-blue">Hub</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-2 lg:gap-8 mx-2 lg:mx-0">
            <div className="flex items-center gap-1 bg-gray-50/50 p-1 lg:p-1.5 rounded-full border border-gray-100">
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 lg:px-5 py-2 rounded-full text-sm font-bold transition-all flex items-center gap-1.5 lg:gap-2 ${isActive(link.path)
                      ? 'bg-white text-brand-dark shadow-sm'
                      : 'text-gray-500 hover:text-brand-blue hover:bg-gray-100'
                    } ${link.isSpecial ? 'text-brand-blue' : ''}`}
                >
                  {link.name}
                  {link.isSpecial && <Zap size={14} fill="currentColor" />}
                  {link.name === 'MCAMP' && mcampLive && <span className="ml-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded animate-pulse">LIVE</span>}
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3 lg:gap-4 shrink-0">
            {isLoggedIn ? (
              <Link
                to={AppRoute.DASHBOARD}
                title="Dashboard"
                className="flex items-center justify-center bg-brand-dark text-white p-3 rounded-full hover:bg-black transition-all shadow-lg shadow-brand-dark/20"
              >
                <UserIcon size={20} />
              </Link>
            ) : (
              <>
                <Link to={AppRoute.LOGIN} className="font-bold text-gray-500 hover:text-brand-dark transition-colors text-sm">Log in</Link>
                <Link to={AppRoute.SIGNUP} className="bg-brand-blue text-white px-5 lg:px-6 py-2.5 lg:py-3 rounded-full font-bold text-sm hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/30 hover:-translate-y-0.5 whitespace-nowrap">
                  Get Started
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors z-50"
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`md:hidden absolute top-0 left-0 right-0 bg-white border-b border-gray-100 shadow-xl transition-all duration-300 ease-in-out transform ${isMobileMenuOpen ? 'translate-y-20 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'} z-40`}>
        <div className="p-4 flex flex-col gap-2 pb-6 bg-white">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`px-4 py-3 rounded-xl font-bold transition-colors flex items-center gap-2 ${isActive(link.path)
                  ? 'bg-gray-50 text-brand-blue'
                  : 'text-gray-500 hover:bg-gray-50'
                }`}
            >
              {link.name}
              {link.isSpecial && <Zap size={16} fill="currentColor" className="text-brand-yellow" />}
              {link.name === 'MCAMP' && mcampLive && <span className="ml-1 bg-red-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded animate-pulse">LIVE</span>}
            </Link>
          ))}
          <div className="h-px bg-gray-100 my-2"></div>
          {isLoggedIn ? (
            <Link
              to={AppRoute.DASHBOARD}
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 bg-brand-dark text-white px-6 py-3 rounded-xl font-bold text-sm"
            >
              <UserIcon size={18} />
              Go to Dashboard
            </Link>
          ) : (
            <div className="flex flex-col gap-3">
              <Link
                to={AppRoute.LOGIN}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center font-bold text-gray-600 py-3 rounded-xl hover:bg-gray-50"
              >
                Log in
              </Link>
              <Link
                to={AppRoute.SIGNUP}
                onClick={() => setIsMobileMenuOpen(false)}
                className="w-full text-center bg-brand-blue text-white py-3 rounded-xl font-bold"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

import { LayoutDashboard, Users, BookOpen, ShoppingBag, Settings, LogOut, Stethoscope, X, GraduationCap } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const sidebarItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
    { icon: Users, label: 'Users', path: '/users' },
    { icon: BookOpen, label: 'Learning Content', path: '/learning' },
    { icon: GraduationCap, label: 'MCAMP', path: '/mcamp' },
    { icon: ShoppingBag, label: 'Store', path: '/store' },
    { icon: Settings, label: 'Settings', path: '/settings' },
];

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
    const location = useLocation();
    const { logout } = useAuth();

    return (
        <>
            {/* Mobile Backdrop */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-brand-dark/50 backdrop-blur-sm z-40 md:hidden animate-fade-in"
                    onClick={onClose}
                />
            )}

            {/* Sidebar Container */}
            <div className={`w-64 bg-white text-gray-500 h-screen flex flex-col fixed left-0 top-0 border-r border-gray-100 shadow-xl z-50 transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
                <div className="p-8 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-brand-blue text-white rounded-xl flex items-center justify-center shadow-lg shadow-brand-blue/20">
                            <Stethoscope size={24} />
                        </div>
                        <div>
                            <h1 className="text-xl font-extrabold text-brand-dark tracking-tight leading-none">
                                Medico<span className="text-brand-blue">Hub</span>
                            </h1>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Admin</span>
                        </div>
                    </div>
                    {/* Close Button Mobile Only */}
                    <button
                        onClick={onClose}
                        className="md:hidden p-2 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 py-4 overflow-y-auto">
                    {sidebarItems.map((item) => (
                        <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => onClose()} // Close on navigation (mobile)
                            className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 group font-bold text-sm ${location.pathname === item.path
                                ? 'bg-brand-dark text-white shadow-lg shadow-brand-dark/20'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-brand-blue'
                                }`}
                        >
                            <item.icon size={20} className={location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-brand-blue transition-colors'} />
                            <span>{item.label}</span>
                        </Link>
                    ))}
                </nav>

                <div className="p-4 m-4 border-t border-gray-50">
                    <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3 w-full text-left rounded-2xl hover:bg-red-50 hover:text-red-500 transition-colors text-gray-400 font-bold text-sm"
                    >
                        <LogOut size={20} />
                        <span>Sign Out</span>
                    </button>
                </div>
            </div>
        </>
    );
};

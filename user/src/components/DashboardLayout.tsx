import * as React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutGrid, User as UserIcon, GraduationCap, LogOut, Menu,
    Search, Bell, Sparkles, CheckCircle, AlertCircle, Info, ChevronDown, ChevronUp, X, Zap, Trash2, AlertTriangle
} from 'lucide-react';
import { User, AppRoute, Notification } from '../types';
import { EmailVerificationBanner } from './EmailVerificationBanner';

interface DashboardLayoutProps {
    user: User;
    onLogout?: () => void;
    children: React.ReactNode;
    onSearch?: (query: string) => void;
    showSearch?: boolean;
    notifications?: Notification[];
    onMarkAllRead?: () => void;
    onClearNotification?: (id: string) => void;
    onClearAll?: () => void;
    onDeleteAccount?: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({
    user,
    onLogout,
    children,
    onSearch,
    showSearch = false,
    notifications = [],
    onMarkAllRead,
    onClearNotification,
    onClearAll,
    onDeleteAccount
}) => {
    const location = useLocation();
    const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false);
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = React.useState(false);
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [expandedNotificationId, setExpandedNotificationId] = React.useState<string | null>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
    const notificationRef = React.useRef<HTMLDivElement>(null);

    const isActive = (path: string) => location.pathname === path;
    const unreadCount = notifications.filter(n => !n.read).length;

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
                setShowNotifications(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getNotificationIcon = (type: string) => {
        switch (type) {
            case 'success': return <CheckCircle size={16} className="text-green-500" />;
            case 'alert': return <AlertCircle size={16} className="text-amber-500" />;
            default: return <Info size={16} className="text-blue-500" />;
        }
    };

    const toggleNotification = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setExpandedNotificationId(expandedNotificationId === id ? null : id);
    };

    return (
        <div className="pt-20 min-h-screen bg-gray-50 flex">
            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-pop-in">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl relative text-center">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle size={32} />
                        </div>
                        <h2 className="text-2xl font-extrabold text-brand-dark mb-3">Delete Account?</h2>
                        <p className="text-gray-500 mb-8 leading-relaxed">
                            This action is permanent and cannot be undone. All your progress, quizzes, and data will be wiped.
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={async () => {
                                    if (onDeleteAccount) {
                                        await onDeleteAccount();
                                    }
                                    setIsDeleteModalOpen(false);
                                }}
                                className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20"
                            >
                                Yes, Delete My Account
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Sidebar Overlay */}
            <div
                className={`fixed inset-0 bg-brand-dark/20 z-40 md:hidden backdrop-blur-sm transition-opacity duration-300 ${isMobileSidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
                    }`}
                onClick={() => setIsMobileSidebarOpen(false)}
            />

            {/* Sidebar */}
            <div
                className={`
          bg-white border-r border-gray-100 flex flex-col transition-all duration-300
          fixed md:top-20 top-0 bottom-0 z-50 md:z-30 h-screen md:h-[calc(100vh-80px)]
          ${isMobileSidebarOpen ? 'translate-x-0 w-72' : '-translate-x-full md:translate-x-0'}
          ${isSidebarCollapsed ? 'md:w-24' : 'md:w-72'}
          shadow-2xl md:shadow-none
        `}
            >
                <div className="flex-1 py-6 px-4 space-y-2 overflow-y-auto">
                    <div className="flex justify-between items-center mb-8 md:mb-0">
                        {/* Mobile Title */}
                        <span className="md:hidden font-extrabold text-xl text-brand-dark px-2">Menu</span>

                        {/* Mobile Close Button */}
                        <button
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className="md:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-xl"
                        >
                            <X size={24} />
                        </button>

                        {/* Desktop Collapse Button */}
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            className="hidden md:block mb-8 ml-2 text-gray-400 hover:text-brand-blue transition-colors"
                        >
                            <Menu size={24} />
                        </button>
                    </div>

                    {[
                        { name: 'Dashboard', icon: LayoutGrid, path: AppRoute.DASHBOARD },
                        { name: 'Learning', icon: GraduationCap, path: AppRoute.LEARNING },
                        { name: 'My Profile', icon: UserIcon, path: AppRoute.PROFILE },
                    ].map((item) => (
                        <Link
                            key={item.name}
                            to={item.path}
                            onClick={() => setIsMobileSidebarOpen(false)}
                            className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${isActive(item.path)
                                ? 'bg-brand-dark text-white shadow-lg shadow-brand-dark/20'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-brand-blue'
                                }`}
                        >
                            <item.icon size={22} strokeWidth={isActive(item.path) ? 2.5 : 2} />
                            <span className={`font-bold text-sm ${isSidebarCollapsed ? 'md:hidden' : 'block'}`}>
                                {item.name}
                            </span>
                        </Link>
                    ))}

                    {/* Special MCAMP Link */}
                    <Link
                        to={AppRoute.MCAMP_DASHBOARD}
                        onClick={() => setIsMobileSidebarOpen(false)}
                        className={`flex items-center gap-4 px-4 py-4 rounded-2xl transition-all mt-4 bg-gradient-to-r from-brand-yellow to-[#F59E0B] text-brand-dark hover:shadow-lg hover:scale-[1.02] transform origin-left shadow-md ${isActive(AppRoute.MCAMP_DASHBOARD) ? 'ring-2 ring-offset-2 ring-brand-yellow' : ''
                            }`}
                    >
                        <Zap size={22} fill="currentColor" />
                        <span className={`font-extrabold text-sm ${isSidebarCollapsed ? 'md:hidden' : 'block'}`}>
                            MCAMP <span className="text-[10px] bg-white/30 px-1.5 py-0.5 rounded ml-1">LIVE</span>
                        </span>
                    </Link>
                </div>

                <div className="p-4 space-y-2 border-t border-gray-50">
                    {!user.isSubscribed && (
                        <Link
                            to={AppRoute.PRICING}
                            className={`w-full flex items-center gap-3 px-4 py-4 rounded-2xl bg-gradient-to-r from-brand-blue to-brand-purple text-white shadow-lg shadow-brand-blue/20 hover:shadow-xl transition-all hover:-translate-y-0.5 ${isSidebarCollapsed ? 'justify-center' : ''}`}
                        >
                            <Sparkles size={22} fill="currentColor" />
                            <span className={`font-bold text-sm ${isSidebarCollapsed ? 'md:hidden' : 'block'}`}>
                                Upgrade
                            </span>
                        </Link>
                    )}

                    <button
                        onClick={onLogout}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <LogOut size={22} />
                        <span className={`font-bold text-sm ${isSidebarCollapsed ? 'md:hidden' : 'block'}`}>
                            Log out
                        </span>
                    </button>

                    <button
                        onClick={() => setIsDeleteModalOpen(true)}
                        className={`w-full flex items-center gap-4 px-4 py-3 rounded-2xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all ${isSidebarCollapsed ? 'justify-center' : ''}`}
                    >
                        <Trash2 size={20} />
                        <span className={`font-bold text-xs ${isSidebarCollapsed ? 'md:hidden' : 'block'}`}>
                            Delete Account
                        </span>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className={`flex-1 flex flex-col transition-all duration-300 w-full ${isSidebarCollapsed ? 'md:ml-24' : 'md:ml-72'}`}>

                {/* Top Search Bar */}
                <div className="bg-white border-b border-gray-100 sticky top-20 z-30 px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center gap-4">
                    {/* Mobile Hamburger Trigger */}
                    <button
                        onClick={() => setIsMobileSidebarOpen(true)}
                        className="md:hidden p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-xl shrink-0"
                    >
                        <Menu size={24} />
                    </button>

                    <div className="flex-1 flex items-center gap-4 max-w-2xl">
                        {showSearch && (
                            <div className="relative w-full max-w-xs lg:max-w-md hidden sm:block">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    onChange={(e) => onSearch && onSearch(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-brand-blue/20 text-sm font-medium transition-all focus:bg-white"
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-4 shrink-0">
                        {/* Notifications */}
                        <div ref={notificationRef} className="relative">
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className="p-2.5 sm:p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors relative cursor-pointer"
                            >
                                <Bell size={20} className="text-gray-600" />
                                {unreadCount > 0 && (
                                    <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
                                )}
                            </button>

                            {showNotifications && (
                                <div className="absolute right-0 sm:right-0 mt-4 w-[calc(100vw-2rem)] sm:w-96 -mr-4 sm:mr-0 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden z-50 animate-pop-in origin-top-right">
                                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
                                        <h3 className="font-bold text-lg text-brand-dark">Notifications</h3>
                                        <div className="flex gap-2">
                                            {unreadCount > 0 && onMarkAllRead && (
                                                <button onClick={onMarkAllRead} className="text-xs font-bold text-brand-blue hover:text-brand-dark transition-colors px-2 py-1 hover:bg-white rounded-lg">
                                                    Mark all read
                                                </button>
                                            )}
                                            {notifications && notifications.length > 0 && onClearAll && (
                                                <button onClick={onClearAll} className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors px-2 py-1 hover:bg-white rounded-lg">
                                                    Clear all
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <div className="max-h-[70vh] overflow-y-auto custom-scrollbar p-2 space-y-2">
                                        {notifications && notifications.length > 0 ? (
                                            notifications.map((notif) => (
                                                <div
                                                    key={notif.id}
                                                    onClick={(e) => toggleNotification(notif.id, e)}
                                                    className={`p-4 rounded-2xl transition-all cursor-pointer relative group border ${notif.read ? 'bg-white border-transparent hover:border-gray-100' : 'bg-blue-50/50 border-blue-100'}`}
                                                >
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                {!notif.read && <span className="w-2 h-2 rounded-full bg-brand-blue shrink-0 animate-pulse" />}
                                                                <h4 className={`font-bold text-sm leading-tight ${notif.read ? 'text-gray-700' : 'text-brand-dark'}`}>{notif.title}</h4>
                                                            </div>
                                                            <div className={`text-xs text-gray-500 mt-1 transition-all overflow-hidden ${expandedNotificationId === notif.id ? 'max-h-40' : 'max-h-10 line-clamp-2'}`}>
                                                                {notif.message}
                                                            </div>
                                                            <p className="text-[10px] text-gray-400 font-bold mt-2 uppercase tracking-wide">{notif.date}</p>
                                                        </div>
                                                        {onClearNotification && (
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onClearNotification(notif.id);
                                                                }}
                                                                className="text-gray-300 hover:text-red-500 p-1 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                                                                title="Clear notification"
                                                            >
                                                                <X size={14} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="py-12 text-center text-gray-400">
                                                <Bell size={32} className="mx-auto mb-3 opacity-20" />
                                                <p className="text-sm font-medium">No notifications yet</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* User Avatar */}
                        <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:border-l sm:border-gray-200">
                            <div className="text-right hidden lg:block">
                                <p className="text-sm font-bold text-brand-dark leading-none truncate max-w-[100px]">{user.name}</p>
                                <p className="text-[10px] text-gray-400 mt-1">{user.year || 'Student'}</p>
                            </div>
                            <Link to={AppRoute.PROFILE} className="w-10 h-10 rounded-2xl bg-brand-yellow text-brand-dark flex items-center justify-center font-extrabold shadow-sm hover:scale-105 transition-transform overflow-hidden shrink-0">
                                {user.profileImage ? (
                                    <img src={user.profileImage} alt={user.name} className="w-full h-full object-cover" />
                                ) : (
                                    user.name.charAt(0)
                                )}
                            </Link>
                        </div>
                    </div>
                </div>

                {location.pathname === AppRoute.DASHBOARD && <EmailVerificationBanner />}

                {/* Content Children */}
                <div className="flex-1 p-4 sm:p-8 overflow-x-hidden">
                    {children}
                </div>

            </div>
        </div>
    );
};
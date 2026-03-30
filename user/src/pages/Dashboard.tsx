import * as React from 'react';
import { User, Resource, AppRoute, Notification } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { Clock, BookOpen, Zap, PlayCircle, FileText, HelpCircle, Lock, Sparkles, MessageCircle } from 'lucide-react';
import { LineChart, Line, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Link } from 'react-router-dom';
import { Info, AlertCircle, AlertTriangle, CheckCircle2, Megaphone } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { api } from '../services/api';

/**
 * DASHBOARD PAGE:
 * This is the main screen a student sees when they login.
 * It shows their study hours, master progress, and learning charts.
 */
interface DashboardProps {
    user: User; // Details of the logged-in student
    onLogout: () => void;
    notifications: Notification[]; // List of alerts (e.g. "Order Shipped")
    onMarkAllRead: () => void;
    onClearNotification: (id: string) => void;
    onClearAll: () => void;
    onDeleteAccount: () => void;
}

const getThumbnailStyle = (index: number) => {
    const styles = [
        { bg: 'bg-orange-100', text: 'text-orange-600', icon: FileText },
        { bg: 'bg-blue-100', text: 'text-blue-600', icon: HelpCircle },
        { bg: 'bg-purple-100', text: 'text-purple-600', icon: BookOpen },
    ];
    return styles[index % styles.length];
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        const dataPoint = payload[0].payload;
        return (
            <div className="bg-brand-dark text-white p-4 rounded-2xl shadow-xl border border-gray-700">
                <p className="text-gray-400 font-medium text-xs uppercase tracking-wider mb-1">{dataPoint.fullDate || label}</p>
                <p className="text-lg font-bold">
                    <span className="text-brand-blue">{payload[0].value}h</span> Studied
                </p>
            </div>
        );
    }
    return null;
};

const YearlyTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white text-brand-dark p-3 rounded-xl shadow-xl border border-gray-100">
                <p className="font-bold text-sm mb-1">{label}</p>
                <p className="text-brand-blue font-bold">
                    {payload[0].value} hours
                </p>
            </div>
        );
    }
    return null;
};

export const Dashboard: React.FC<DashboardProps> = ({
    user,
    onLogout,
    notifications,
    onMarkAllRead,
    onClearNotification,
    onClearAll,
    onDeleteAccount
}) => {
    const { announcement } = useSettings();
    const monthlyData = React.useMemo(() => {
        const activity = user.analytics?.monthlyActivity;
        if (!activity || !Array.isArray(activity) || activity.length === 0) {
            // Return empty or zero-state data
            const today = new Date();
            return [{
                date: today.toLocaleString('default', { month: 'short', day: 'numeric' }),
                fullDate: today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
                hours: 0
            }];
        }

        // Ensure it's in the format Recharts expects (objects with date/hours)
        if (typeof activity[0] === 'number') {
            return (activity as unknown as number[]).map((h, i) => ({
                date: `Day ${i + 1}`,
                hours: h
            }));
        }

        return activity;
    }, [user.analytics]);

    const [allResources, setAllResources] = React.useState<Resource[]>([]);
    const [userProgress, setUserProgress] = React.useState<Record<string, any>>({});

    React.useEffect(() => {
        const load = async () => {
            try {
                const [res, prog] = await Promise.all([
                    api.resources.getAll(),
                    api.analytics.getUserProgress(user.uid || '')
                ]);
                setAllResources(Array.isArray(res) ? res : []);
                const progMap = (prog || []).reduce((acc: any, curr: any) => ({ ...acc, [curr.resourceId]: curr }), {});
                setUserProgress(progMap);
            } catch (e) {
                console.error("Failed to load dashboard data", e);
            }
        };
        load();
    }, [user.uid]);

    const recentResources = React.useMemo(() => {
        const sorted = (Object.values(userProgress) as any[])
            .sort((a, b) => new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime())
            .slice(0, 3);

        return sorted.map(p => allResources.find(r => r.id === p.resourceId)).filter(Boolean) as Resource[];
    }, [userProgress, allResources]);

    // Logic to prepare the graph data for the Year view
    const yearlyData = React.useMemo(() => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const activity = user.analytics?.yearlyActivity;

        // If no stats yet, just show 0 for every month
        if (!activity) {
            return months.map(month => ({ month, hours: 0 }));
        }

        return months.map(month => {
            let hours = 0;
            if (Array.isArray(activity)) {
                const found = activity.find(y => y.month === month);
                hours = found ? found.hours : 0;
            } else if (typeof activity === 'object') {
                // Handle Map/Object case
                hours = (activity as any)[month] || 0;
            }
            return { month, hours };
        });
    }, [user.analytics]);

    const currentMonthName = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });

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
            <div className="space-y-8 max-w-7xl mx-auto">
                {/* Global Announcement Banner */}
                {announcement && (
                    <div className="bg-brand-dark rounded-[1.5rem] p-6 shadow-xl relative overflow-hidden animate-pop-in mb-8">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-blue/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
                        <div className="flex items-start gap-5 relative z-10">
                            <div className="bg-white/10 p-3 rounded-xl shrink-0 backdrop-blur-sm">
                                <Megaphone className="text-white" size={24} />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg mb-1">Announcement</h3>
                                <p className="text-gray-300 leading-relaxed font-medium">{announcement}</p>
                            </div>
                        </div>
                    </div>
                )}


                {/* Stats Header */}
                <div className="animate-fade-in-up">
                    <div className="mb-8 flex flex-col sm:flex-row justify-between sm:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-brand-dark">Dashboard</h1>
                            <p className="text-gray-500 mt-1">Welcome back, {user.name.split(' ')[0]}. You're on a roll!</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <a
                                href="https://whatsapp.com/channel/0029VbAE0gLGehEMAmTuMj0D"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-sm font-bold text-[#25D366] hover:text-[#128C7E] transition-colors bg-green-50 px-4 py-2 rounded-xl"
                            >
                                <MessageCircle size={16} /> Join Community
                            </a>
                            {!user.isSubscribed && (
                                <Link to={AppRoute.PRICING} className="inline-flex items-center gap-2 text-sm font-bold text-brand-blue hover:text-brand-dark transition-colors bg-blue-50 px-4 py-2 rounded-xl">
                                    <Sparkles size={16} /> Upgrade to View Full Stats
                                </Link>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-lg transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-4 bg-blue-50 rounded-2xl text-blue-600 group-hover:scale-110 transition-transform">
                                    <Clock size={24} />
                                </div>
                                {/* Remove static percent for now, or calculate if we had last month data */}
                                {/* <span className="text-xs font-bold bg-green-100 text-green-700 px-3 py-1.5 rounded-xl">+12%</span> */}
                            </div>
                            <h3 className="text-3xl font-bold text-brand-dark">
                                {Math.floor(user.analytics?.totalHours || 0)}h
                                <span className="text-lg ml-1 text-gray-400 font-bold">
                                    {Math.round(((user.analytics?.totalHours || 0) % 1) * 60)}m
                                </span>
                            </h3>
                            <p className="text-gray-400 text-sm font-medium">Total Study time</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-lg transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-4 bg-purple-50 rounded-2xl text-purple-600 group-hover:scale-110 transition-transform">
                                    <BookOpen size={24} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-brand-dark">{user.analytics?.topicsMastered || 0}</h3>
                            <p className="text-gray-400 text-sm font-medium">Topics Mastered</p>
                        </div>
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 group hover:shadow-lg transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div className="p-4 bg-yellow-50 rounded-2xl text-yellow-600 group-hover:scale-110 transition-transform">
                                    <Zap size={24} />
                                </div>
                            </div>
                            <h3 className="text-3xl font-bold text-brand-dark">{user.analytics?.currentStreak || 0} Days</h3>
                            <p className="text-gray-400 text-sm font-medium">Current Streak</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Split */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Side: Monthly Activity Chart */}
                    <div className="lg:col-span-2 relative">
                        {/* The progress chart. We blur it (make it fuzzy) if the user hasn't paid for a Pro account. */}
                        <div className={`bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-fade-in-up h-[450px] flex flex-col ${!user.isSubscribed ? 'blur-sm select-none opacity-60' : ''}`} style={{ animationDelay: '100ms' }}>
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-xl font-bold text-gray-900">Monthly Activity</h3>
                                <div className="bg-gray-50 rounded-xl text-xs font-bold text-gray-500 py-2 px-4">
                                    {currentMonthName}
                                </div>
                            </div>
                            <div className="flex-grow w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={monthlyData}>
                                        <defs>
                                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#0066FF" stopOpacity={0.1} />
                                                <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="date" hide={true} />
                                        <Line
                                            type="monotone"
                                            dataKey="hours"
                                            stroke="#0066FF"
                                            strokeWidth={4}
                                            dot={false}
                                            activeDot={{ r: 8, strokeWidth: 0, fill: '#0066FF' }}
                                        />
                                        <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#e2e8f0', strokeWidth: 1, strokeDasharray: '4 4' }} />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Overlay to show "Unlock Pro" if they are on a free account */}
                        {!user.isSubscribed && (
                            <div className="absolute inset-0 flex items-center justify-center z-10">
                                <div className="text-center bg-white/90 backdrop-blur-md p-8 rounded-[2rem] shadow-xl border border-white/50">
                                    <div className="w-14 h-14 bg-brand-dark rounded-full flex items-center justify-center mx-auto mb-4 text-white">
                                        <Lock size={24} />
                                    </div>
                                    <h4 className="text-xl font-bold text-brand-dark mb-2">Pro Analytics</h4>
                                    <p className="text-gray-500 mb-6 text-sm max-w-[200px] mx-auto">Visualize your progress and optimize your study habits.</p>
                                    <Link to={AppRoute.PRICING} className="bg-brand-blue text-white px-8 py-3 rounded-xl text-sm font-bold shadow-lg shadow-brand-blue/30 hover:bg-blue-600 transition-colors inline-block">
                                        Unlock Pro
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Side: Quick Pick Up (Recent Resources) */}
                    {recentResources.length > 0 && (
                        <div className="lg:col-span-1 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
                            <h3 className="text-xl font-bold text-gray-900 mb-6">Jump Back In</h3>
                            <div className="space-y-4">
                                {recentResources.map((res, idx) => {
                                    const style = getThumbnailStyle(idx);
                                    const Icon = style.icon;
                                    const isLocked = res.isPro && !user.isSubscribed;

                                    return (
                                        <Link
                                            to={isLocked ? AppRoute.PRICING : `${AppRoute.LEARNING}/${res.id}`}
                                            key={res.id}
                                            className={`bg-white p-4 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all flex gap-4 items-center group relative ${isLocked ? 'opacity-70' : ''}`}
                                        >
                                            <div className={`w-14 h-14 rounded-xl flex items-center justify-center shrink-0 ${res.type === 'Video' ? 'bg-brand-dark text-white' : style.bg + ' ' + style.text}`}>
                                                {res.type === 'Video' ? <PlayCircle size={24} /> : <Icon size={24} />}
                                            </div>
                                            <div className="min-w-0 flex-1">
                                                <div className="flex justify-between items-center mb-1">
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{res.subject}</p>
                                                    {res.isPro && <span className="text-[10px] font-bold bg-brand-dark text-brand-yellow px-1.5 py-0.5 rounded uppercase tracking-wider">Pro</span>}
                                                </div>
                                                <h4 className="font-bold text-brand-dark text-sm truncate">{res.title}</h4>
                                            </div>
                                            {isLocked && (
                                                <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
                                                    <div className="bg-white p-1.5 rounded-full shadow-sm">
                                                        <Lock size={14} className="text-brand-dark" />
                                                    </div>
                                                </div>
                                            )}
                                        </Link>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                </div>

                {/* Yearly Analytics Section (Bar Chart) */}
                <div className={`mt-8 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100 animate-fade-in-up ${!user.isSubscribed ? 'blur-sm select-none opacity-60 pointer-events-none' : ''}`} style={{ animationDelay: '300ms' }}>
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-bold text-brand-dark">Yearly Performance</h3>
                            <p className="text-gray-500 text-sm">Total study hours across the year</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-brand-blue"></span>
                            <span className="text-xs font-bold text-gray-500">Study Hours</span>
                        </div>
                    </div>
                    <div className="h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={yearlyData} barSize={32}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="month"
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 600 }}
                                    dy={10}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                                />
                                <Tooltip cursor={{ fill: '#f8fafc', radius: 8 }} content={<YearlyTooltip />} />
                                <Bar dataKey="hours" fill="#0066FF" radius={[8, 8, 8, 8]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

            </div>
        </DashboardLayout>
    );
};
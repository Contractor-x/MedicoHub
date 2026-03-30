
import { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, BookOpen, DollarSign, Activity, Plus, TrendingUp, Calendar, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';



const ModernStatCard = ({ title, value, trend, icon: Icon, color, trendUp }: any) => {
    const colorStyles: any = {
        blue: 'bg-blue-50 text-blue-600',
        purple: 'bg-purple-50 text-purple-600',
        green: 'bg-green-50 text-green-600',
        yellow: 'bg-yellow-50 text-yellow-600'
    };

    return (
        <div className="bg-white p-6 rounded-[1.5rem] shadow-sm border border-gray-100 hover:shadow-xl transition-shadow duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-2xl ${colorStyles[color]} group-hover:scale-110 transition-transform`}>
                    <Icon size={24} />
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${trendUp ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {trendUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
                        {trend}
                    </div>
                )}
            </div>
            <div>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
                <h3 className="text-3xl font-extrabold text-brand-dark">{value}</h3>
            </div>
        </div>
    );
}

const timeAgo = (dateStr: string) => {
    if (!dateStr) return '';
    const diff = Date.now() - new Date(dateStr).getTime();
    const min = 60 * 1000;
    const hour = 60 * min;
    const day = 24 * hour;
    if (diff < min) return 'Just now';
    if (diff < hour) return Math.floor(diff / min) + 'm ago';
    if (diff < day) return Math.floor(diff / hour) + 'h ago';
    return Math.floor(diff / day) + 'd ago';
};

export const Dashboard = () => {
    const [stats, setStats] = useState({ users: 0, resources: 0, products: 0, revenue: 0 });
    const [recentUsers, setRecentUsers] = useState<any[]>([]);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            // Fetch Counts & Revenue
            try {
                const globalStats = await api.stats.getGlobal(30);
                const counts = await api.stats.getCounts();

                // Calculate total revenue from all days
                const totalRev = (Array.isArray(globalStats) ? globalStats : []).reduce((acc: number, curr: any) => acc + (curr.revenue || 0), 0);

                setStats({ ...counts, revenue: totalRev });

                // Map GlobalStats to Chart
                if (Array.isArray(globalStats)) {
                    const mapped = globalStats.map(s => ({
                        name: new Date(s.date).toLocaleDateString('en-US', { weekday: 'short' }),
                        users: s.activeUsers || 0,
                        engagement: s.totalActivity || 0,
                        revenue: s.revenue || 0
                    })).slice(-7); // Last 7 days
                    setChartData(mapped);
                }
            } catch (e) {
                console.error("Failed to load global stats", e);
            }

            // Fetch Recent Users
            try {
                const recent = await api.users.getRecent(5);
                setRecentUsers(recent);
            } catch (e) {
                console.error("Failed to load recent users", e);
            }
        };
        loadData();
    }, []);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(val);
    };

    return (
        <div className="space-y-8 pb-10">
            {/* Hero / Welcome Section */}
            <div className="relative overflow-hidden bg-gradient-to-r from-brand-dark to-brand-blue rounded-[2rem] p-8 md:p-12 text-white shadow-2xl shadow-brand-blue/20 animate-fade-in-up">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-extrabold mb-3">Welcome back, Admin 👋</h1>
                        <p className="text-blue-100 max-w-xl text-lg font-medium opacity-90">
                            Here's what's happening today. You have {stats.users} students and {stats.resources} resources active. Platform revenue: {formatCurrency(stats.revenue)}
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        <Link to="/learning" className="bg-white text-brand-dark px-6 py-3 rounded-xl font-bold hover:bg-gray-50 transition-colors flex items-center gap-2 shadow-lg shadow-black/10 hover:shadow-xl hover:-translate-y-0.5 transform">
                            <Plus size={18} strokeWidth={3} /> Add Resource
                        </Link>
                    </div>
                </div>

                {/* Decorative Background Elements */}
                <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-40 -mb-20 w-60 h-60 bg-brand-yellow/20 rounded-full blur-3xl"></div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <ModernStatCard title="Total Students" value={stats.users.toLocaleString()} trend="+12% vs last month" icon={Users} color="blue" trendUp={true} />
                <ModernStatCard title="Total Revenue" value={formatCurrency(stats.revenue)} trend="Live" icon={DollarSign} color="green" trendUp={true} />
                <ModernStatCard title="Learning Content" value={stats.resources.toLocaleString()} trend="+5 this week" icon={BookOpen} color="purple" trendUp={true} />
                <ModernStatCard title="Active Now" value="--" trend="-2.1% peak hours" icon={Activity} color="yellow" trendUp={false} />
            </div>

            {/* Detailed Analytics & Activity Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>

                {/* Main Curve Chart */}
                <div className="lg:col-span-2 bg-white p-8 rounded-[2rem] shadow-sm border border-gray-100">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-xl font-extrabold text-brand-dark">Engagement & Activity</h3>
                            <p className="text-sm text-gray-400 font-medium mt-1">Daily platform interactions over the last 7 days</p>
                        </div>
                        <div className="bg-gray-50 p-1 rounded-xl flex gap-1">
                            {['Week'].map((t) => (
                                <button key={t} className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all bg-white shadow text-brand-dark`}>
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-[350px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData.length ? chartData : [{ name: 'Mon', users: 0, engagement: 0 }, { name: 'Sun', users: 0, engagement: 0 }]}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#0066FF" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#0066FF" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorEngage" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 12, fontWeight: 600 }} allowDecimals={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ fontWeight: 600 }}
                                />
                                <Area type="monotone" dataKey="users" stroke="#0066FF" strokeWidth={4} fillOpacity={1} fill="url(#colorUsers)" />
                                <Area type="monotone" dataKey="engagement" stroke="#10B981" strokeWidth={4} fillOpacity={1} fill="url(#colorEngage)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Column: Mini Widgets */}
                <div className="space-y-6">
                    {/* Recent Signups */}
                    <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-brand-dark">Recent Signups</h3>
                            <Link to="/users" className="text-brand-blue text-xs font-bold hover:underline">View All</Link>
                        </div>
                        <div className="space-y-6 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                            {recentUsers.length === 0 ? (
                                <p className="text-gray-400 text-sm text-center py-4">No recent signups.</p>
                            ) : (
                                recentUsers.map((user) => (
                                    <div key={user.id || user.uid} className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-full bg-brand-light flex items-center justify-center font-bold text-brand-blue text-xs shrink-0 border border-blue-100 uppercase">
                                            {(user.name || user.email || 'U').substring(0, 2)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h4 className="text-sm font-bold text-gray-800 truncate">{user.name || 'Anonymous'}</h4>
                                            <p className="text-xs text-gray-400 truncate">{user.schoolName || user.email || 'Student'}</p>
                                        </div>
                                        <span className="text-[10px] font-bold text-gray-300 whitespace-nowrap">{timeAgo(user.createdAt)}</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <button className="w-full mt-auto bg-gray-50 text-gray-500 font-bold py-3.5 rounded-xl hover:bg-gray-100 transition-colors flex items-center justify-center gap-2 text-sm">
                            View All Users <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Quick Actions Note */}
            <div className="bg-brand-dark text-white p-6 rounded-[1.5rem] flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-xl">
                        <Calendar size={24} className="text-brand-yellow" />
                    </div>
                    <div>
                        <h4 className="font-bold text-lg">Scheduled Maintenance</h4>
                        <p className="text-gray-400 text-sm">System scheduled for update on Dec 24, 2025.</p>
                    </div>
                </div>
                <button className="px-6 py-2 bg-brand-yellow text-brand-dark font-extrabold rounded-lg hover:bg-[#F59E0B] transition-colors">
                    Manage Schedule
                </button>
            </div>
        </div>
    );
};

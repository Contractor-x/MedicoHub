import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../services/api';
import { Plus, Save, Calendar, CheckSquare, Users, Trophy, BookOpen, Lock, Unlock, Search, X, CheckCircle, ChevronDown, ChevronRight, Trash2, Edit, ArrowLeft, Clock, Upload, Loader, Star, Megaphone, Tag, Copy, AlertCircle, GraduationCap } from 'lucide-react';
import { createPortal } from 'react-dom';
import { CohortSwitcher } from '../components/CohortSwitcher';

const TabButton = ({ active, onClick, icon: Icon, label }: any) => (
    <button
        onClick={onClick}
        className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all ${active
            ? 'bg-brand-blue text-white shadow-lg shadow-brand-blue/30'
            : 'bg-white text-gray-500 hover:bg-gray-50'
            }`}
    >
        <Icon size={18} />
        {label}
    </button>
);

export const MCampPage = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [activeTab, setActiveTab] = useState<'schedule' | 'quizzes' | 'leaderboard' | 'grading' | 'coupons'>('schedule');
    const [selectedCohort, setSelectedCohort] = useState<any>(null); // Full Cohort Object

    const handleCohortSelect = (cohort: any) => {
        setSelectedCohort(cohort);
        if (cohort?.uniqueId) {
            setSearchParams({ cid: cohort.uniqueId });
        }
    };

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-extrabold text-brand-dark">MCAMP Management</h1>
                    <p className="text-gray-500 mt-2">Manage curriculum, quizzes, and track cohort progress.</p>
                </div>
                <CohortSwitcher
                    selectedCohortId={selectedCohort?.uniqueId || searchParams.get('cid')}
                    onSelect={handleCohortSelect}
                />
            </div>

            {/* Tabs */}
            <div className="flex flex-wrap gap-4 overflow-x-auto pb-2 custom-scrollbar">
                <TabButton active={activeTab === 'schedule'} onClick={() => setActiveTab('schedule')} icon={Calendar} label="Schedule & Resources" />
                <TabButton active={activeTab === 'quizzes'} onClick={() => setActiveTab('quizzes')} icon={CheckSquare} label="Quiz Manager" />
                <TabButton active={activeTab === 'leaderboard'} onClick={() => setActiveTab('leaderboard')} icon={Trophy} label="Cohort Leaderboard" />
                <TabButton active={activeTab === 'grading'} onClick={() => setActiveTab('grading')} icon={Users} label="Grading" />
                <TabButton active={activeTab === 'coupons'} onClick={() => setActiveTab('coupons')} icon={Tag} label="Coupons" />
            </div>

            {/* Content Area */}
            <div className="bg-white rounded-[2rem] p-8 shadow-sm min-h-[600px] relative">
                {activeTab === 'schedule' && <ScheduleManager key={selectedCohort ? selectedCohort.uniqueId : 'global-schedule'} cohort={selectedCohort} />}
                {activeTab === 'quizzes' && <QuizManager key={selectedCohort ? selectedCohort.uniqueId : 'global-quizzes'} cohort={selectedCohort} />}
                {activeTab === 'leaderboard' && <LeaderboardView key={selectedCohort ? selectedCohort.uniqueId : 'global-leaderboard'} cohort={selectedCohort} />}
                {activeTab === 'grading' && <GradingView key={selectedCohort ? selectedCohort.uniqueId : 'global-grading'} cohort={selectedCohort} />}
                {activeTab === 'coupons' && <CouponManager key={selectedCohort ? selectedCohort.uniqueId : 'global-coupons'} cohort={selectedCohort} />}
            </div>
        </div>
    );
};

// --- COUPON MANAGER ---
const CouponManager = ({ cohort }: any) => {
    // Keep cohort in scope for future filtering
    useEffect(() => { if (cohort) console.log("Coupon Context:", cohort.uniqueId); }, [cohort]);

    const [coupons, setCoupons] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newCoupon, setNewCoupon] = useState({
        code: '',
        type: 'fixed' as 'fixed' | 'percent',
        value: 0,
        maxUses: 10,
        expiryDate: ''
    });

    useEffect(() => {
        loadCoupons();
    }, []);

    const loadCoupons = async () => {
        try {
            const list = await api.coupons.getAll();
            const allCoupons = Array.isArray(list) ? list : [];
            // Only show MCAMP coupons here
            setCoupons(allCoupons.filter((c: any) => c.code.startsWith('MCAMP-')));
        } catch (e) {
            console.error("Failed to load coupons", e);
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newCoupon.code || newCoupon.value <= 0) {
            alert("Please enter a valid code and value.");
            return;
        }
        try {
            await api.coupons.create({
                ...newCoupon,
                type: newCoupon.type === 'percent' ? 'percentage' : 'fixed',
                value: Number(newCoupon.value),
                maxUses: Number(newCoupon.maxUses),
                code: newCoupon.code.toUpperCase(),
                isActive: true
            });
            setIsCreating(false);
            setNewCoupon({ code: '', type: 'fixed', value: 0, maxUses: 10, expiryDate: '' });
            loadCoupons();
            alert("Coupon created successfully!");
        } catch (e: any) {
            console.error(e);
            const msg = e.details ? e.details.join('\n') : e.message;
            alert(`Failed to create coupon:\n${msg}`);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this coupon?")) return;
        try {
            await api.coupons.delete(id);
            setCoupons(prev => prev.filter(c => (c.id || c._id) !== id));
        } catch (e: any) {
            console.error(e);
            alert(`Failed to delete coupon: ${e.message || 'Unknown error'}`);
        }
    };

    const generateRandomCode = () => {
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        setNewCoupon(prev => ({ ...prev, code: `MCAMP-${random}` }));
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-800">Coupon Management</h2>
                <button
                    onClick={() => setIsCreating(true)}
                    className="flex items-center gap-2 px-6 py-2.5 bg-brand-dark text-white rounded-xl font-bold hover:bg-black transition-all shadow-lg"
                >
                    <Plus size={18} /> Create Coupon
                </button>
            </div>

            {isCreating && (
                <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 animate-fade-in-down mb-6">
                    <h3 className="font-bold text-lg mb-4">New Coupon</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Coupon Code</label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={newCoupon.code}
                                    onChange={e => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                                    className="w-full pl-3 pr-10 py-2 rounded-lg border border-gray-300 font-mono font-bold uppercase"
                                    placeholder="SUMMER2025"
                                />
                                <button
                                    onClick={generateRandomCode}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-blue"
                                    title="Generate Random"
                                >
                                    <Clock size={16} /> {/* Using Clock as a 'random' icon placeholder or utilize another */}
                                </button>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Discount Type</label>
                            <select
                                value={newCoupon.type}
                                onChange={e => setNewCoupon({ ...newCoupon, type: e.target.value as any })}
                                className="w-full p-2 rounded-lg border border-gray-300 bg-white"
                            >
                                <option value="fixed">Fixed Amount (₦)</option>
                                <option value="percent">Percentage (%)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Value</label>
                            <input
                                type="number"
                                value={newCoupon.value}
                                onChange={e => setNewCoupon({ ...newCoupon, value: Number(e.target.value) })}
                                className="w-full p-2 rounded-lg border border-gray-300"
                                placeholder={newCoupon.type === 'fixed' ? '5000' : '20'}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Max Uses</label>
                            <input
                                type="number"
                                value={newCoupon.maxUses}
                                onChange={e => setNewCoupon({ ...newCoupon, maxUses: Number(e.target.value) })}
                                className="w-full p-2 rounded-lg border border-gray-300"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-6 py-2 bg-brand-blue text-white font-bold rounded-lg shadow-lg hover:bg-blue-600"
                        >
                            Create Coupon
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {coupons.map(coupon => {
                    const cId = coupon.id || coupon._id;
                    const usage = coupon.usageCount || 0;
                    const max = coupon.maxUses || 999999;
                    const isExhausted = usage >= max;
                    const isActive = coupon.isActive !== false && !isExhausted;

                    return (
                        <div key={cId} className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all relative group">
                            <div className="flex justify-between items-start mb-4">
                                <div className="bg-blue-50 text-brand-blue px-3 py-1 rounded-lg font-mono font-bold text-lg border border-blue-100 flex items-center gap-2">
                                    <Tag size={16} />
                                    {coupon.code}
                                </div>
                                <div className={`px-2 py-1 rounded text-xs font-bold uppercase ${isExhausted ? 'bg-red-100 text-red-600' : isActive ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                    {isExhausted ? 'Exhausted' : isActive ? 'Active' : 'Inactive'}
                                </div>
                            </div>

                            <div className="flex justify-between items-end mb-4">
                                <div>
                                    <p className="text-gray-500 text-xs uppercase font-bold">Discount</p>
                                    <p className="text-2xl font-extrabold text-gray-800">
                                        {coupon.type === 'fixed' ? `₦${coupon.value.toLocaleString()}` : `${coupon.value}% OFF`}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500 text-xs uppercase font-bold">Usage</p>
                                    <p className="text-lg font-bold text-gray-800">
                                        {usage} <span className="text-gray-400 text-sm">/ {max === 999999 ? '∞' : max}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-50 flex justify-between items-center">
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(coupon.code);
                                        alert("Code copied!");
                                    }}
                                    className="text-xs font-bold text-gray-400 hover:text-brand-blue flex items-center gap-1"
                                >
                                    <Copy size={14} /> Copy Code
                                </button>
                                <button
                                    onClick={() => handleDelete(cId)}
                                    className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <Trash2 size={18} />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {coupons.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400 italic">
                    No coupons found. Create one to get started.
                </div>
            )}
        </div>
    );
};

// --- SCHEDULE MANAGER ---
const ScheduleManager = ({ cohort }: any) => {
    const [weeks, setWeeks] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [resources, setResources] = useState<any[]>([]);
    const [selectedDay, setSelectedDay] = useState<{ weekId: number, dayId: number } | null>(null);
    const [isResourceModalOpen, setIsResourceModalOpen] = useState(false);

    // New State for Accordion & Saving
    const [expandedWeekId, setExpandedWeekId] = useState<number | null>(1);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [targetYear, setTargetYear] = useState<string>('Year 2');
    const [activeCohortId, setActiveCohortId] = useState<string>('');

    // Safety Features
    const [initialActiveCohortId, setInitialActiveCohortId] = useState<string>('');
    const [isSessionLocked, setIsSessionLocked] = useState(true);
    const [showSessionConfirmation, setShowSessionConfirmation] = useState(false);

    useEffect(() => {
        fetchData(cohort);
    }, [cohort]);

    const fetchData = async (overrideCohort?: any) => {
        setLoading(true);
        try {
            let curData: any = {};
            let allRes: any[] = [];

            if (overrideCohort) {
                // Cohort Mode: Fetch fresh data to ensure we have latest weeks (ignoring potentially stale prop)
                const [freshCohort, rData] = await Promise.all([
                    api.cohorts.get(overrideCohort._id || overrideCohort.uniqueId),
                    api.resources.getAll()
                ]);

                allRes = rData;
                curData = {
                    weeks: freshCohort.weeks || [],
                    targetYear: freshCohort.targetYear || 'Year 2',
                    activeCohortId: freshCohort.uniqueId
                };
                setIsSessionLocked(true);
            } else {
                // Legacy Mode: Fetch both
                const [cData, rData] = await Promise.all([
                    api.curriculum.get(),
                    api.resources.getAll()
                ]);
                curData = cData;
                allRes = rData;
                // Don't auto-lock in legacy legacy? Keep default behavior or lock?
                // Let's keep it consistent.
            }

            const validResIds = new Set(Array.isArray(allRes) ? allRes.map((r: any) => r.id || r._id) : []);
            setResources(Array.isArray(allRes) ? allRes.filter((r: any) => r && r.isMcampExclusive) : []);

            let loadedWeeks = curData.weeks || [];
            if (curData.targetYear) setTargetYear(curData.targetYear);
            if (curData.activeCohortId) {
                setActiveCohortId(curData.activeCohortId);
                setInitialActiveCohortId(curData.activeCohortId);
            }

            if (loadedWeeks.length === 0) {
                loadedWeeks = Array.from({ length: 13 }, (_, i) => ({
                    id: i + 1,
                    title: `Week ${i + 1}`,
                    isUnlocked: false,
                    days: {}
                }));
            }

            // Ensure 13 weeks (90 days)
            if (loadedWeeks.length < 13) {
                const missingCount = 13 - loadedWeeks.length;
                loadedWeeks = [
                    ...loadedWeeks,
                    ...Array.from({ length: missingCount }, (_, i) => ({
                        id: loadedWeeks.length + i + 1,
                        title: `Week ${loadedWeeks.length + i + 1}`,
                        isUnlocked: false,
                        days: {}
                    }))
                ];
            }

            // Cleanup: Remove any resource IDs that no longer exist in the database
            let scheduleChanged = false;
            const cleanedWeeks = loadedWeeks.map((week: any) => {
                const cleanedDays = { ...week.days };
                let weekChanged = false;

                Object.keys(cleanedDays).forEach((dayId: any) => {
                    const ids = cleanedDays[dayId] || [];
                    const filtered = ids.filter((id: string) => validResIds.has(id));
                    if (filtered.length !== ids.length) {
                        cleanedDays[dayId] = filtered;
                        weekChanged = true;
                        scheduleChanged = true;
                    }
                });

                return weekChanged ? { ...week, days: cleanedDays } : week;
            });

            setWeeks(cleanedWeeks);
            if (scheduleChanged) {
                setHasUnsavedChanges(true);
            }
        } catch (error) {
            console.error("MCAMP Schedule Fetch Error:", error);
        } finally {
            setLoading(false);
        }
    };

    const saveChanges = async () => {
        // Validation...
        if (!activeCohortId.trim()) {
            alert("Error: Session ID is mandatory.");
            return;
        }

        if (cohort) {
            // Save to Specific Cohort
            setIsSaving(true);
            try {
                // Determine ID to use (prefer _id if available, else uniqueId)
                const idToUpdate = cohort._id || cohort.uniqueId;
                await api.cohorts.update(idToUpdate, {
                    weeks,
                    // targetYear // Usually targetYear is fixed for a cohort, but maybe allowed to update?
                });
                setHasUnsavedChanges(false);
                alert("Cohort Schedule saved successfully!");
            } catch (e: any) {
                console.error(e);
                alert("Failed to save cohort schedule.");
            } finally {
                setIsSaving(false);
            }
        } else {
            // Legacy Save
            if (activeCohortId !== initialActiveCohortId) {
                setShowSessionConfirmation(true);
                return;
            }
            await performSave();
        }
    };

    const performSave = async () => {
        setIsSaving(true);
        try {
            await api.curriculum.update({ weeks, targetYear, activeCohortId });
            setHasUnsavedChanges(false);
            setInitialActiveCohortId(activeCohortId);
            setIsSessionLocked(true);
            // Simple confirmation
            setTimeout(() => alert("Schedule saved successfully!"), 100);
        } catch (error) {
            console.error("Failed to save curriculum", error);
            alert("Failed to save changes.");
        } finally {
            setIsSaving(false);
            setShowSessionConfirmation(false);
        }
    };

    const toggleUnlock = (weekId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const newWeeks = weeks.map(w => w.id === weekId ? { ...w, isUnlocked: !w.isUnlocked } : w);
        setWeeks(newWeeks);
        setHasUnsavedChanges(true);
    };

    const handleAssignResources = (resourceIds: string[]) => {
        if (!selectedDay) return;
        const newWeeks = weeks.map(w => {
            if (w.id === selectedDay.weekId) {
                return {
                    ...w,
                    days: {
                        ...(w.days || {}),
                        [selectedDay.dayId]: resourceIds
                    }
                };
            }
            return w;
        });
        setWeeks(newWeeks);
        setHasUnsavedChanges(true);
        setIsResourceModalOpen(false);
    };

    // Get resources for currently selected day
    const currentDayResources = selectedDay
        ? (weeks.find(w => w.id === selectedDay.weekId)?.days?.[selectedDay.dayId] || [])
        : [];

    if (loading) return <div className="p-12 text-center text-gray-500">Loading schedule...</div>;

    return (
        <div className="space-y-8">
            {/* ... prev content ... */}

            {/* DANGER: Session ID Change Confirmation Modal */}
            {showSessionConfirmation && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-red-900/20 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-md shadow-2xl p-8 animate-pop-in border-2 border-red-100">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                                <AlertCircle size={32} />
                            </div>
                            <h3 className="text-xl font-extrabold text-brand-dark mb-2">Changing Session ID?</h3>
                            <p className="text-gray-500 mb-6 text-sm">
                                You are about to change the Cohort Session ID from <span className="font-mono font-bold bg-gray-100 px-1 rounded">{initialActiveCohortId}</span> to <span className="font-mono font-bold bg-blue-50 text-brand-blue px-1 rounded">{activeCohortId}</span>.
                                <br /><br />
                                <span className="text-red-600 font-bold bg-red-50 px-2 py-1 rounded">⚠️ This will disconnect all existing students</span> from the current schedule and tracking. They will need the new ID to rejoin.
                            </p>

                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setShowSessionConfirmation(false)}
                                    className="flex-1 py-3 text-gray-500 font-bold hover:bg-gray-50 rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={performSave}
                                    className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 shadow-lg shadow-red-500/20 transition-all"
                                >
                                    Yes, Change it
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Weekly Schedule</h2>
                    <p className="text-gray-500 text-sm">Assign study materials for each day of the 13-week program.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                    <div className="flex items-center gap-2 pl-2 border-r border-gray-200 pr-4">
                        <GraduationCap size={16} className="text-brand-blue" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Target Level:</span>
                        <select
                            value={targetYear}
                            onChange={(e) => {
                                setTargetYear(e.target.value);
                                setHasUnsavedChanges(true);
                            }}
                            disabled={!!cohort} // Lock if cohort is active
                            className={`bg-transparent font-bold text-sm focus:outline-none text-brand-dark ${!!cohort ? 'opacity-70 cursor-not-allowed' : ''}`}
                        >
                            <option value="Year 1">Year 1 (100L)</option>
                            <option value="Year 2">Year 2 (200L)</option>
                            <option value="Year 3">Year 3 (300L)</option>
                            <option value="Year 4">Year 4 (400L)</option>
                            <option value="Year 5">Year 5 (500L)</option>
                            <option value="Year 6">Year 6 (600L)</option>
                        </select>
                    </div>

                    <div className="flex items-center gap-2 border-r border-gray-200 pr-4">
                        <Tag size={16} className="text-purple-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Session ID:</span>
                        <div className="flex items-center gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200 focus-within:border-brand-blue transition-colors relative group">
                            <input
                                type="text"
                                placeholder="e.g. batch-a-2026"
                                value={activeCohortId}
                                disabled={isSessionLocked || !!cohort} // Force lock if cohort
                                onChange={(e) => {
                                    setActiveCohortId(e.target.value);
                                    setHasUnsavedChanges(true);
                                }}
                                className={`bg-transparent font-mono font-bold text-xs focus:outline-none w-32 ${(isSessionLocked || !!cohort) ? 'text-gray-500 cursor-not-allowed' : 'text-brand-dark'}`}
                            />

                            {/* Lock/Unlock Control */}
                            <button
                                onClick={() => setIsSessionLocked(!isSessionLocked)}
                                className={`p-1 rounded hover:bg-gray-100 transition-colors ${isSessionLocked ? 'text-gray-400' : 'text-brand-blue'}`}
                                title={isSessionLocked ? "Click to Unlock Editing" : "Click to Lock"}
                            >
                                {isSessionLocked ? <Lock size={12} /> : <Unlock size={12} />}
                            </button>

                            {!isSessionLocked && (
                                <button
                                    onClick={() => {
                                        const random = Math.random().toString(36).substring(2, 7).toUpperCase();
                                        setActiveCohortId(`cohort-v3-${random}`);
                                        setHasUnsavedChanges(true);
                                    }}
                                    className="text-gray-400 hover:text-brand-blue pl-1 border-l border-gray-100"
                                    title="Generate New Session ID"
                                >
                                    <Plus size={14} />
                                </button>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {hasUnsavedChanges && (
                            <span className="text-[10px] font-bold text-amber-500 animate-pulse flex items-center gap-1">
                                <AlertCircle size={12} /> Unsaved Changes
                            </span>
                        )}
                        <button
                            onClick={saveChanges}
                            disabled={!hasUnsavedChanges || isSaving}
                            className={`flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-bold transition-all ${hasUnsavedChanges
                                ? 'bg-brand-blue text-white hover:bg-blue-600 shadow-lg shadow-brand-blue/30'
                                : 'bg-white border border-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                        >
                            {isSaving ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                            {isSaving ? 'Saving...' : 'Save Schedule'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid gap-4">
                {weeks.map((week) => {
                    const isExpanded = expandedWeekId === week.id;
                    return (
                        <div key={week.id} className={`border rounded-2xl overflow-hidden shadow-sm transition-all ${isExpanded ? 'ring-2 ring-brand-blue/10 border-brand-blue/20' : 'border-gray-200 bg-white'}`}>
                            <div
                                onClick={() => setExpandedWeekId(isExpanded ? null : week.id)}
                                className={`flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isExpanded ? 'bg-gray-50' : ''}`}
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-2 rounded-lg ${isExpanded ? 'bg-brand-blue text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                                    </div>
                                    <h3 className="font-extrabold text-lg text-brand-dark flex items-center gap-2">
                                        {week.title}
                                    </h3>
                                    <div className="text-xs font-medium text-gray-400">
                                        {Object.values(week.days || {}).flat().length} Resources
                                    </div>
                                </div>

                                <button
                                    onClick={(e) => toggleUnlock(week.id, e)}
                                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors ${week.isUnlocked ? 'bg-green-100 text-green-700 hover:bg-green-200' : 'bg-gray-200 text-gray-400 hover:bg-gray-300'}`}
                                >
                                    {week.isUnlocked ? <Unlock size={14} /> : <Lock size={14} />}
                                    {week.isUnlocked ? 'Unlocked' : 'Locked'}
                                </button>
                            </div>

                            {isExpanded && (
                                <div className="p-4 grid grid-cols-1 md:grid-cols-7 gap-4 bg-white border-t border-gray-100 animate-fade-in-down">
                                    {[1, 2, 3, 4, 5, 6, 7].map(day => {
                                        const assignedIds = week.days?.[day] || [];
                                        return (
                                            <div
                                                key={day}
                                                onClick={() => { setSelectedDay({ weekId: week.id, dayId: day }); setIsResourceModalOpen(true); }}
                                                className="min-h-[120px] border border-dashed border-gray-300 rounded-xl p-3 hover:border-brand-blue hover:bg-blue-50/30 cursor-pointer transition-all bg-gray-50/50 group flex flex-col justify-between"
                                            >
                                                <div className="flex justify-between items-start">
                                                    <span className="text-xs font-bold text-gray-400 uppercase">Day {day}</span>
                                                    {assignedIds.length > 0 && <span className="bg-brand-blue text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-bold">{assignedIds.length}</span>}
                                                </div>
                                                {assignedIds.length === 0 ? (
                                                    <div className="text-center mt-2">
                                                        <Plus size={20} className="mx-auto text-gray-300 group-hover:text-brand-blue transition-colors" />
                                                        <span className="text-[10px] text-gray-300 group-hover:text-brand-blue block mt-1">Assign</span>
                                                    </div>
                                                ) : (
                                                    <div className="mt-2 space-y-1">
                                                        <div className="flex -space-x-1 overflow-hidden">
                                                            {assignedIds.slice(0, 3).map((id: string) => (
                                                                <div key={id} className="w-4 h-4 rounded-full bg-brand-dark border border-white"></div>
                                                            ))}
                                                            {assignedIds.length > 3 && <div className="w-4 h-4 rounded-full bg-gray-200 border border-white flex items-center justify-center text-[8px] font-bold text-gray-500">+{assignedIds.length - 3}</div>}
                                                        </div>
                                                        <p className="text-[10px] text-gray-600 font-medium truncate leading-tight mt-1">
                                                            {assignedIds.length} items assigned
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Resource Picker Modal */}
            {isResourceModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl shadow-2xl overflow-hidden animate-pop-in flex flex-col max-h-[90vh]">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-brand-dark">Assign Content</h3>
                                <p className="text-gray-500 text-sm">Week {selectedDay?.weekId} • Day {selectedDay?.dayId}</p>
                            </div>
                            <button onClick={() => setIsResourceModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                        </div>
                        <div className="p-6 overflow-y-auto custom-scrollbar flex-1">
                            <HelperResourcePicker
                                allResources={resources}
                                initialSelected={currentDayResources}
                                onSave={handleAssignResources}
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
};

const HelperResourcePicker = ({ allResources, initialSelected, onSave }: any) => {
    const [selected, setSelected] = useState<string[]>(initialSelected || []);
    const [search, setSearch] = useState('');

    return (
        <div className="space-y-4">
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                    type="text"
                    placeholder="Search MCAMP resources..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                />
            </div>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {allResources.filter((r: any) => r && (r.title || '').toLowerCase().includes(search.toLowerCase())).map((res: any) => (
                    <div
                        key={res.id || res._id}
                        onClick={() => {
                            const id = res.id || res._id;
                            setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
                        }}
                        className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition-all ${selected.includes(res.id || res._id) ? 'bg-blue-50 border-brand-blue' : 'bg-white border-gray-100 hover:border-gray-300'}`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${res.type === 'Quiz' ? 'bg-purple-100 text-purple-600' : 'bg-red-100 text-red-600'}`}>
                                {res.type === 'Quiz' ? 'Q' : 'V'}
                            </div>
                            <div>
                                <p className="font-bold text-sm text-gray-800">{res.title}</p>
                                <p className="text-[10px] text-gray-500 uppercase">{res.subject}</p>
                            </div>
                        </div>
                        {selected.includes(res.id || res._id) && <CheckCircle className="text-brand-blue" size={20} />}
                    </div>
                ))}
            </div>
            <button onClick={() => onSave(selected)} className="w-full py-3 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-brand-blue/20">
                Save Assignments
            </button>
        </div>
    );
};


// --- LEADERBOARD ---
const LeaderboardView = ({ cohort }: any) => {
    const [users, setUsers] = useState<any[]>([]);
    const [quizWeekMap, setQuizWeekMap] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);
    const [sortBy, setSortBy] = useState<'score' | 'quizzes' | 'name'>('score');
    const [selectedWeek, setSelectedWeek] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [sessionFilter, setSessionFilter] = useState<string>('all');
    const [announcementModal, setAnnouncementModal] = useState<{ isOpen: boolean, userId: string | null }>({ isOpen: false, userId: null });
    const [globalSessionId, setGlobalSessionId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    // Sync cohort prop
    useEffect(() => {
        if (cohort && cohort.uniqueId) setSessionFilter(cohort.uniqueId);
    }, [cohort]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, resourcesData, curData] = await Promise.all([
                api.users.getAll(),
                api.resources.getAll(),
                api.curriculum.get().catch(() => ({}))
            ]);

            setUsers(Array.isArray(usersData) ? usersData : []);
            setGlobalSessionId(curData?.currentSessionId || curData?.sessionId || '');

            // Build Quiz -> Week map
            const map: Record<string, string> = {};
            if (Array.isArray(resourcesData)) {
                resourcesData.forEach((r: any) => {
                    if (r.type === 'Quiz' && r.weekNumber) {
                        map[r.id] = r.weekNumber.toString();
                        if (r._id) map[r._id] = r.weekNumber.toString();
                    }
                });
            }
            setQuizWeekMap(map);

        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Calculate Unique Sessions (Active vs Past)
    const sessionGroups = useMemo(() => {
        const activeSet = new Set<string>();
        const pastSet = new Set<string>();

        // Always include currently configured session
        if (globalSessionId) activeSet.add(globalSessionId);

        users.forEach(u => {
            if (u.mcamp?.uniqueId && u.mcamp.isEnrolled) activeSet.add(u.mcamp.uniqueId);

            if (u.mcampHistory && Array.isArray(u.mcampHistory)) {
                u.mcampHistory.forEach((h: any) => {
                    if (h.uniqueId) pastSet.add(h.uniqueId);
                });
            }
        });

        const active = Array.from(activeSet).sort().reverse();
        const past = Array.from(pastSet).filter(id => !activeSet.has(id)).sort().reverse();
        return { active, past };
    }, [users]);

    const generateId = async (uid: string) => {
        if (!cohort) {
            alert("Please select a Cohort from the top switcher first.");
            return;
        }

        const uniqueId = cohort.uniqueId;
        const cohortId = cohort._id || cohort.id;

        // Optimistic UI
        setUsers(prev => prev.map(u => u.uid === uid || u.id === uid ? {
            ...u,
            mcamp: {
                ...u.mcamp,
                uniqueId,
                cohortId,
                isEnrolled: true
            }
        } : u));

        await api.users.update(uid, {
            mcamp: {
                isEnrolled: true,
                uniqueId,
                cohortId,
                startDate: new Date().toISOString()
            }
        });
    };

    const enrolledUsers = users.map(u => {
        let attempts: any[] = Object.entries(u.quizAttempts || {}).map(([k, v]: [string, any]) => ({ ...v, quizId: k }));

        // Filter by week if selected
        if (selectedWeek !== 'all') {
            attempts = attempts.filter(a => quizWeekMap[a.quizId] === selectedWeek);
        }

        // Summing score
        const totalScore = attempts.reduce((acc: number, curr: any) => acc + (Number(curr.score) || 0), 0);
        const quizzesTaken = attempts.length;
        const name = u.email || 'Unknown';
        const mcampId = u.mcamp?.uniqueId || '';
        const historyIds = (u.mcampHistory || []).map((h: any) => h.uniqueId);

        return { ...u, totalScore, quizzesTaken, name, mcampId, historyIds };
    })
        .filter(u => {
            // Base filters: Search query
            const matchesSearch = u.mcampId.toLowerCase().includes(searchQuery.toLowerCase());

            // Session Filter
            // If COHORT is selected, we STRICTLY filter by that cohort's ID (ignoring dropdown state)
            const activeFilter = cohort?.uniqueId || sessionFilter;
            const activeObjId = cohort?._id;

            // DEBUG
            if (cohort) {
                console.log(`[LeaderboardDebug] User ${u.name}: mcampId=${u.mcampId}, cohortId=${u.mcamp?.cohortId} vs Filter=${activeObjId || activeFilter}`);
            }

            const matchesSession = activeFilter === 'all'
                ? (u.mcamp?.isEnrolled || u.isSubscribed)
                : (cohort ? u.mcamp?.cohortId === activeObjId : (u.mcampId === activeFilter || (u.historyIds && u.historyIds.includes(activeFilter))));

            return matchesSearch && matchesSession;
        })
        .sort((a, b) => {
            if (sortBy === 'score') return b.totalScore - a.totalScore;
            if (sortBy === 'quizzes') return b.quizzesTaken - a.quizzesTaken;
            if (sortBy === 'name') return a.name.localeCompare(b.name);
            return 0;
        });

    if (loading) return <div className="p-12 text-center text-gray-500">Loading users...</div>;

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-800">Cohort Leaderboard</h2>
                    {cohort && (
                        <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                            <Users size={12} /> Filtering: {cohort.uniqueId}
                        </span>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search MCAMP ID..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-200 pl-9 pr-4 py-2 rounded-xl text-sm font-bold focus:outline-none focus:border-brand-blue w-48"
                        />
                    </div>

                    {/* Session Filter */}
                    {!cohort && (
                        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
                            <Users size={16} className="text-gray-400" />
                            <select
                                value={sessionFilter}
                                onChange={(e) => setSessionFilter(e.target.value)}
                                className="bg-transparent font-bold text-sm focus:outline-none text-brand-dark min-w-[140px]"
                            >
                                <option value="all">All Enrolled Users</option>
                                <optgroup label="Active Sessions">
                                    {sessionGroups.active.map((sid: string) => (
                                        <option key={sid} value={sid}>{sid}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Past Sessions">
                                    {sessionGroups.past.map((sid: string) => (
                                        <option key={sid} value={sid}>{sid}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    )}

                    {/* Week Filter */}
                    <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
                        <Calendar size={16} className="text-gray-400" />
                        <select
                            value={selectedWeek}
                            onChange={(e) => setSelectedWeek(e.target.value)}
                            className="bg-transparent font-bold text-sm focus:outline-none text-gray-700"
                        >
                            <option value="all">Overall Performance</option>
                            {Array.from({ length: 13 }, (_, i) => i + 1).map(w => (
                                <option key={w} value={w.toString()}>Week {w}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Sort */}
                <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
                    <span className="text-xs font-bold text-gray-400 uppercase">Sort:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="bg-transparent font-bold text-sm focus:outline-none text-gray-700"
                    >
                        <option value="score">Highest Score</option>
                        <option value="quizzes">Quizzes Taken</option>
                        <option value="name">Name (A-Z)</option>
                    </select>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-center w-16">Rank</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Student ID</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-center">
                                    {selectedWeek === 'all' ? 'Total Score' : `Week ${selectedWeek} Score`}
                                </th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-center">
                                    Quizzes
                                </th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-center">Status</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {enrolledUsers.length > 0 ? enrolledUsers.map((user, index) => {
                                const hasId = !!user.mcamp?.uniqueId;
                                // Rank based on current sort
                                const isTop3 = index < 3 && user.totalScore > 0;

                                let rankIcon = null;
                                if (index === 0 && isTop3) rankIcon = <Star size={16} className="text-yellow-400 fill-yellow-400" />;
                                else if (index === 1 && isTop3) rankIcon = <Star size={16} className="text-gray-400 fill-gray-400" />;
                                else if (index === 2 && isTop3) rankIcon = <Star size={16} className="text-orange-400 fill-orange-400" />;

                                return (
                                    <tr key={user.uid || user.id} className={`hover:bg-blue-50/10 transition-colors ${isTop3 ? 'bg-yellow-50/20' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <span className={`text-lg font-bold ${isTop3 ? 'text-brand-dark' : 'text-gray-400'}`}>{index + 1}</span>
                                                {rankIcon}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    {hasId ? (
                                                        <span className="text-sm font-mono bg-blue-50 text-brand-blue px-2 py-1 rounded border border-blue-100 font-bold">{user.mcamp.uniqueId}</span>
                                                    ) : <span className="text-gray-400 italic text-[10px]">Pending ID</span>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="font-bold text-gray-900 text-lg">{user.totalScore}</div>
                                            <div className="text-[10px] text-gray-400 uppercase font-bold">Points</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="font-bold text-gray-700">{user.quizzesTaken}</div>
                                            <div className="text-[10px] text-gray-400 uppercase font-bold">Submitted</div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${user.mcamp?.isSuspended ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                                                {user.mcamp?.isSuspended ? 'Suspended' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setAnnouncementModal({ isOpen: true, userId: user.uid || user.id })}
                                                    className="text-xs bg-purple-100 text-purple-600 px-3 py-1.5 rounded-lg font-bold hover:bg-purple-200 transition-colors flex items-center gap-1"
                                                    title="Send Announcement"
                                                >
                                                    <Megaphone size={14} /> Send
                                                </button>
                                                <button
                                                    onClick={async () => {
                                                        if (window.confirm(`Are you sure you want to ${user.mcamp?.isSuspended ? 'ACTIVATE' : 'SUSPEND'} this user?`)) {
                                                            try {
                                                                const isSuspending = !user.mcamp?.isSuspended;
                                                                await api.users.update(user.uid || user.id, {
                                                                    status: isSuspending ? 'suspended' : 'active',
                                                                    mcamp: {
                                                                        ...user.mcamp,
                                                                        isSuspended: isSuspending,
                                                                        suspensionDate: isSuspending ? new Date().toISOString() : null
                                                                    }
                                                                });
                                                                alert(`User successfully ${isSuspending ? 'suspended' : 'activated'}`);
                                                                loadData();
                                                            } catch (err: any) {
                                                                console.error("Suspension toggle failed:", err);
                                                                alert("Failed to update user status: " + (err.message || "Unknown error"));
                                                            }
                                                        }
                                                    }}
                                                    className={`text-xs px-3 py-1.5 rounded-lg font-bold transition-colors ${user.mcamp?.isSuspended ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'}`}
                                                >
                                                    {user.mcamp?.isSuspended ? 'Activate' : 'Suspend'}
                                                </button>
                                                {!hasId && (
                                                    <button onClick={() => generateId(user.uid || user.id)} className="text-xs bg-brand-dark text-white px-3 py-1.5 rounded-lg font-bold hover:bg-black transition-colors">
                                                        {cohort ? `Assign to ${cohort.uniqueId}` : "Assign to Cohort"}
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            }) : (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-400 italic">
                                        No students found matching filters.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Announcement Modal */}
            {
                announcementModal.isOpen && (
                    <AnnouncementModal
                        userId={announcementModal.userId}
                        onClose={() => setAnnouncementModal({ isOpen: false, userId: null })}
                    />
                )
            }
        </div >
    );
};

const AnnouncementModal = ({ userId, onClose }: { userId: string | null, onClose: () => void }) => {
    const [message, setMessage] = useState('');
    const [title, setTitle] = useState('Congratulations!');
    const [isSending, setIsSending] = useState(false);

    const handleSend = async () => {
        if (!userId || !message) return;
        setIsSending(true);
        try {
            await api.notifications.sendToUser(userId, {
                title,
                message,
                type: 'announcement',
                icon: 'Trophy'
            });
            alert('Announcement sent successfully!');
            onClose();
        } catch (e) {
            console.error(e);
            alert('Failed to send announcement');
        } finally {
            setIsSending(false);
        }
    };

    const presets = [
        "Congratulations, you scored Highest in the MCAMP Quiz this week!",
        "Great job on your recent quiz performance!",
        "Don't forget to complete this week's assignments."
    ];

    return createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl animate-pop-in">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        <Megaphone className="text-brand-blue" /> Send Announcement
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full"><X size={20} /></button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                        <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 font-bold focus:outline-none focus:border-brand-blue"
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">Message</label>
                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            className="w-full p-2 bg-gray-50 rounded-lg border border-gray-200 h-24 focus:outline-none focus:border-brand-blue"
                            placeholder="Type your message here..."
                        />
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Quick Presets</label>
                        <div className="flex flex-col gap-2">
                            {presets.map((msg, i) => (
                                <button
                                    key={i}
                                    onClick={() => setMessage(msg)}
                                    className="text-left text-xs p-2 bg-gray-50 hover:bg-blue-50 text-gray-600 hover:text-brand-blue rounded-lg transition-colors truncate"
                                >
                                    {msg}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={handleSend}
                        disabled={isSending || !message}
                        className="w-full py-3 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isSending ? <Loader size={18} className="animate-spin" /> : <Megaphone size={18} />}
                        Send Announcement
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

// --- QUIZ MANAGER ---
const QuizManager = ({ cohort }: any) => {
    const [quizzes, setQuizzes] = useState<any[]>([]);
    const [isEditing, setIsEditing] = useState(false);
    const [currentQuiz, setCurrentQuiz] = useState<any | null>(null);
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean, quizId: string | null, isPurge: boolean }>({
        isOpen: false, quizId: null, isPurge: false
    });
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        loadQuizzes();
    }, [cohort]); // Reload when cohort changes

    const loadQuizzes = async () => {
        try {
            const all = await api.resources.getAll();

            const quizList = all.filter((r: any) => {
                // Base Filter
                const isQuiz = r.type === 'Quiz' && (r.isMcampExclusive || r.tags?.includes('MCAMP'));
                if (!isQuiz) return false;


                // Cohort Filter
                if (cohort && cohort.targetYear) {

                    // Instead of strict equality, we check if one string contains the other
                    // This handles "Year 2" vs "Year 2 (200L)"
                    const qYear = (r.targetYear || '').trim().toLowerCase();
                    const cYear = (cohort.targetYear || '').trim().toLowerCase();

                    const match = qYear.includes(cYear) || cYear.includes(qYear);
                    console.log(`[QuizDebug] Q: "${qYear}" vs C: "${cYear}" | Match: ${match}`);

                    if (!cYear) return true; // If Cohort has no year, assume it wants everything? Or handle differently.

                    // FIX: If Quiz has NO year, but we are filtering by specific year, HIDE IT.
                    // Exception: If we decide empty means "General", we return true. But user complaint suggests we want strictness.
                    // For now, let's filter strict.
                    if (!qYear) return false;

                    // Check for overlap '2', '3' etc. if simple string match fails
                    const simpleMatch = qYear.includes(cYear) || cYear.includes(qYear);
                    return simpleMatch;
                }
                return true;
            }).map((q: any) => ({
                ...q,
                questions: (q.quizData || q.questions || []).map((qq: any, idx: number) => ({
                    ...qq,
                    id: qq.id || `q-${idx}`
                }))
            }));
            setQuizzes(quizList);
        } catch (e) {
            console.error(e);
        }
    };

    const handleSave = async (quizData: any) => {
        try {
            const dataToSave = {
                ...quizData,
                type: 'Quiz',
                subject: quizData.subject || 'MCAMP', // Ensure subject is present for validation
                isMcampExclusive: true,
                targetYear: quizData.targetYear || (cohort ? cohort.targetYear : undefined),
                tags: [...(quizData.tags || []), 'MCAMP'],
                quizData: quizData.questions, // Map frontend questions to backend quizData
                url: 'internal://quiz-mastery' // Internal marker for quiz type
            };

            const id = currentQuiz?.id || currentQuiz?._id;
            if (id) {
                await api.resources.update(id, dataToSave);
            } else {
                await api.resources.create(dataToSave);
            }
            setIsEditing(false);
            setCurrentQuiz(null);
            loadQuizzes();
        } catch (e: any) {
            console.error("Failed to save quiz", e);
            const msg = e.details ? e.details.join('\n') : e.message;
            alert(`Failed to save quiz:\n${msg}`);
        }
    };

    // Open Modal for Single Delete
    const handleDeleteClick = (id: string) => {
        setDeleteConfirm({ isOpen: true, quizId: id, isPurge: false });
    };

    // Open Modal for Purge
    const handlePurgeClick = () => {
        setDeleteConfirm({ isOpen: true, quizId: null, isPurge: true });
    };

    // ACTUAL DELETE LOGIC
    const executeDelete = async () => {
        setIsDeleting(true);
        const { quizId, isPurge } = deleteConfirm;

        try {

            if (isPurge) {
                const toDelete = quizzes.filter(q => !q.questions || q.questions.length === 0);
                let count = 0;

                for (const q of toDelete) {
                    try {
                        const id = q.id || q._id;
                        if (id) {
                            await api.resources.delete(id);
                            count++;
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
                // alert(`Purged ${count} empty quizzes.`); // Optional, maybe toaster instead
            } else if (quizId) {
                // Optimistic UI update
                setQuizzes(prev => prev.filter(q => q.id !== quizId && q._id !== quizId));

                // Backend Delete via API Service
                await api.resources.delete(quizId);
            }

            // Success cleanup
            loadQuizzes();
            setDeleteConfirm({ isOpen: false, quizId: null, isPurge: false });
        } catch (e) {
            console.error("Delete failed", e);
            alert("Delete failed. Check console.");
            loadQuizzes(); // Revert state
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* CUSTOM CONFIRMATION MODAL */}
            {deleteConfirm.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl transform transition-all scale-100">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trash2 size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Delete Quiz?</h3>
                        <p className="text-sm text-gray-500 text-center mb-6">
                            {deleteConfirm.isPurge
                                ? "This will cleanly remove ALL quizzes with 0 questions. This action cannot be undone."
                                : "Are you sure you want to delete this quiz? This action cannot be undone."
                            }
                        </p>

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={executeDelete}
                                disabled={isDeleting}
                                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                {isDeleting ? <Loader size={18} className="animate-spin" /> : null}
                                {isDeleting ? "Deleting..." : "Yes, Delete It"}
                            </button>
                            <button
                                onClick={() => setDeleteConfirm({ isOpen: false, quizId: null, isPurge: false })}
                                disabled={isDeleting}
                                className="w-full py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl transition-colors"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-800">Weekly Quizzes</h2>
                    {cohort && (
                        <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                            <Tag size={12} /> Filtered: {cohort.targetYear || cohort.uniqueId}
                        </span>
                    )}
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={handlePurgeClick}
                        className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded-xl font-bold hover:bg-red-200 transition-colors"
                    >
                        <Trash2 size={18} /> Cleanup Empty
                    </button>
                    <button
                        onClick={() => { setCurrentQuiz({}); setIsEditing(true); }}
                        className="flex items-center gap-2 px-4 py-2 bg-brand-dark text-white rounded-xl font-bold hover:bg-black transition-colors"
                    >
                        <Plus size={18} /> New Quiz
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                {quizzes.length === 0 ? (
                    <div className="p-12 text-center text-gray-400">
                        <BookOpen size={48} className="mx-auto mb-4 opacity-20" />
                        <p>No quizzes found. Create one to get started.</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Core Info</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Target</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Settings</th>
                                <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {quizzes.map(quiz => {
                                const quizId = quiz.id || quiz._id;
                                return (
                                    <tr key={quizId} className="hover:bg-gray-50/50">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900">{quiz.title}</p>
                                            <p className="text-xs text-gray-500 truncate max-w-[200px]">{quiz.description}</p>
                                            <p className="text-[10px] text-gray-300 font-mono mt-1">ID: {quizId}</p>
                                            {quiz.deadline && (
                                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded mt-2">
                                                    <Clock size={10} /> Deadline: {new Date(quiz.deadline).toLocaleString()}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {(quiz.weekNumber !== undefined && quiz.weekNumber !== null && quiz.weekNumber !== '') ? (
                                                <span className="inline-flex items-center gap-1 bg-brand-blue/10 text-brand-blue px-2 py-1 rounded text-xs font-bold">
                                                    Week {quiz.weekNumber}
                                                </span>
                                            ) : <span className="text-gray-400 text-xs">-</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">
                                            <div className="flex flex-col gap-1">
                                                <span className="flex items-center gap-1"><Clock size={12} /> {quiz.durationMinutes || 15} min</span>
                                                <span className="flex items-center gap-1"><CheckSquare size={12} /> {quiz.quizData?.length || quiz.questions?.length || 0} Qs</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right space-x-2">
                                            <button onClick={() => { setCurrentQuiz(quiz); setIsEditing(true); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-brand-blue">
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (quizId) handleDeleteClick(quizId);
                                                    else alert("Error: Quiz ID missing");
                                                }}
                                                className="p-2 hover:bg-red-50 rounded-lg text-gray-500 hover:text-red-500 transition-colors"
                                                title="Delete Quiz"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                )
                            })}
                        </tbody>
                    </table>
                )}
            </div>

            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white rounded-[2rem] w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
                        <QuizEditor
                            initialData={currentQuiz}
                            onSave={handleSave}
                            onCancel={() => { setIsEditing(false); setCurrentQuiz(null); }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

const QuizEditor = ({ initialData, onSave, onCancel }: any) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        durationMinutes: 15,
        weekNumber: '',
        maxAttempts: 1,
        questions: initialData?.quizData || initialData?.questions || [] as any[],
        // Cohort ID is injected by parent, no need to edit here unless we want to move quizzes?
        ...initialData
    });

    const [currentQuestion, setCurrentQuestion] = useState<any>({
        prompt: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        imageUrl: ''
    });
    const [isAddingQ, setIsAddingQ] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    const updateField = (field: string, value: any) => {
        setFormData((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const downloadURL = await api.files.upload(file);
            setCurrentQuestion((prev: any) => ({ ...prev, imageUrl: downloadURL }));
        } catch (error) {
            console.error("Upload failed", error);
            alert("Failed to upload image. Please check your connection.");
        } finally {
            setIsUploading(false);
        }
    };

    const addQuestion = () => {
        if (!currentQuestion.prompt) return alert("Prompt is required");
        setFormData((prev: any) => ({
            ...prev,
            questions: [...prev.questions, { ...currentQuestion, id: Date.now().toString() }]
        }));
        setCurrentQuestion({ prompt: '', options: ['', '', '', ''], correctAnswer: 0, imageUrl: '' });
        setIsAddingQ(false);
    };

    const removeQuestion = (idx: number) => {
        setFormData((prev: any) => ({
            ...prev,
            questions: prev.questions.filter((_: any, i: number) => i !== idx)
        }));
    };

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={onCancel} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
                <h2 className="text-2xl font-bold text-gray-800">{initialData?.id ? 'Edit Quiz' : 'Create Quiz'}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Title</label>
                        <input
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue font-bold"
                            value={formData.title}
                            onChange={e => updateField('title', e.target.value)}
                            placeholder="e.g. Week 1 Mastery"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Description</label>
                        <textarea
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue h-24"
                            value={formData.description}
                            onChange={e => updateField('description', e.target.value)}
                            placeholder="Brief description of topics covered..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Duration (mins)</label>
                            <input
                                type="number"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue"
                                value={formData.durationMinutes}
                                onChange={e => updateField('durationMinutes', Number(e.target.value))}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-500 uppercase">Max Attempts</label>
                            <input
                                type="number"
                                className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue"
                                value={formData.maxAttempts}
                                onChange={e => updateField('maxAttempts', Number(e.target.value))}
                            />
                        </div>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase">Target Week (Mandatory)</label>
                        <input
                            type="number"
                            placeholder="e.g. 1"
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue"
                            value={formData.weekNumber}
                            onChange={e => updateField('weekNumber', Number(e.target.value))}
                        />
                        <p className="text-[10px] text-gray-400">Used for "Weekly Mastery" identification.</p>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-1">
                            <Clock size={12} /> Submission Deadline (Optional)
                        </label>
                        <input
                            id="quiz-deadline"
                            type="datetime-local"
                            defaultValue={formData.deadline ? new Date(formData.deadline).toISOString().slice(0, 16) : ''}
                            className="w-full p-3 bg-gray-50 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-blue font-bold"
                            onChange={e => updateField('deadline', e.target.value)}
                        />
                        <p className="text-[10px] text-gray-400">Quiz will automatically close after this time.</p>
                    </div>
                </div>

                {/* Questions Section */}
                <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200 flex flex-col h-full">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-700">Questions ({formData.questions.length})</h3>
                        <button onClick={() => setIsAddingQ(true)} className="text-xs bg-brand-dark text-white px-3 py-1.5 rounded-lg font-bold">
                            + Add Question
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto space-y-3 custom-scrollbar max-h-[400px]">
                        {isAddingQ && (
                            <div className="bg-white p-4 rounded-xl border border-brand-blue shadow-sm animate-fade-in space-y-3">
                                <div className="flex gap-2 mb-2">
                                    <select
                                        className="text-xs bg-gray-100 p-2 rounded-lg font-bold border-none"
                                        value={currentQuestion.type || 'SBO'}
                                        onChange={e => setCurrentQuestion({ ...currentQuestion, type: e.target.value })}
                                    >
                                        <option value="SBO">Single Choice (SBO)</option>
                                        <option value="MCQ">Multiple Choice (MCQ)</option>
                                        <option value="FIB">Fill in the Blank (FIB)</option>
                                        <option value="FILL_GAP">Fill Gap</option>
                                        <option value="MFIB">Multiple Fill (MFIB)</option>
                                        <option value="IMAGE_ID">Image Identification</option>
                                        <option value="ESSAY">Essay / Reasoning</option>
                                    </select>
                                </div>
                                <input
                                    className="w-full p-2 border-b border-gray-200 focus:outline-none font-medium text-sm"
                                    placeholder="Question Prompt..."
                                    value={currentQuestion.prompt}
                                    onChange={e => setCurrentQuestion({ ...currentQuestion, prompt: e.target.value })}
                                />
                                <div className="space-y-2">
                                    <div className="flex gap-2 items-center">
                                        <div className="flex-1 relative">
                                            <input
                                                className="w-full p-2 pl-9 bg-gray-50 border border-gray-100 rounded text-xs focus:outline-none"
                                                placeholder="Image URL (or upload ->)"
                                                value={currentQuestion.imageUrl || ''}
                                                onChange={e => setCurrentQuestion({ ...currentQuestion, imageUrl: e.target.value })}
                                            />
                                            <Upload size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                        </div>
                                        <label className={`cursor-pointer bg-gray-100 hovering:bg-gray-200 text-gray-600 p-2 rounded-lg transition-colors ${isUploading ? 'opacity-50 pointer-events-none' : ''}`}>
                                            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                                            {isUploading ? <Loader size={16} className="animate-spin text-brand-blue" /> : <Upload size={16} />}
                                        </label>
                                    </div>
                                    {currentQuestion.imageUrl && (
                                        <div className="relative w-fit group">
                                            <img src={currentQuestion.imageUrl} alt="Preview" className="h-20 rounded-lg object-cover border border-gray-200" />
                                            <button
                                                onClick={() => setCurrentQuestion({ ...currentQuestion, imageUrl: '' })}
                                                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    {(currentQuestion.type === 'FIB' || currentQuestion.type === 'FILL_GAP' || currentQuestion.type === 'IMAGE_ID') ? (
                                        <input
                                            className="w-full p-2 bg-green-50 text-green-700 text-sm border border-green-100 rounded font-bold"
                                            placeholder="Correct Answer..."
                                            value={currentQuestion.correctAnswer || ''}
                                            onChange={e => setCurrentQuestion({ ...currentQuestion, correctAnswer: e.target.value })}
                                        />
                                    ) : currentQuestion.type === 'ESSAY' ? (
                                        <div className="p-3 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                                            Essay questions are manually graded by admins.
                                        </div>
                                    ) : currentQuestion.type === 'MFIB' ? (
                                        <div className="space-y-2">
                                            <label className="text-xs font-bold text-gray-500 uppercase">Correct Answers (ordered)</label>
                                            {(Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : []).map((ans: string, i: number) => (
                                                <div key={i} className="flex gap-2">
                                                    <input
                                                        className="flex-1 p-2 bg-green-50 text-green-700 text-sm border border-green-100 rounded font-bold"
                                                        placeholder={`Answer ${i + 1}`}
                                                        value={ans}
                                                        onChange={e => {
                                                            const newAns = [...(Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [])];
                                                            newAns[i] = e.target.value;
                                                            setCurrentQuestion({ ...currentQuestion, correctAnswer: newAns });
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newAns = (Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : []).filter((_: any, idx: number) => idx !== i);
                                                            setCurrentQuestion({ ...currentQuestion, correctAnswer: newAns });
                                                        }}
                                                        className="text-gray-300 hover:text-red-500"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setCurrentQuestion({ ...currentQuestion, correctAnswer: [...(Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : []), ''] })}
                                                className="text-xs flex items-center gap-1 text-green-600 font-bold px-2 py-1 hover:bg-green-50 rounded"
                                            >
                                                <Plus size={12} /> Add Answer
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {currentQuestion.options.map((opt: string, i: number) => (
                                                <div key={i} className="flex items-center gap-2 group">
                                                    <input
                                                        type={currentQuestion.type === 'MCQ' ? 'checkbox' : 'radio'}
                                                        name="correct"
                                                        checked={currentQuestion.type === 'MCQ' ? (Array.isArray(currentQuestion.correctAnswer) && currentQuestion.correctAnswer.includes(i)) : currentQuestion.correctAnswer === i}
                                                        onChange={() => {
                                                            if (currentQuestion.type === 'MCQ') {
                                                                const current = Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : [];
                                                                const newAns = current.includes(i) ? current.filter((x: number) => x !== i) : [...current, i];
                                                                setCurrentQuestion({ ...currentQuestion, correctAnswer: newAns });
                                                            } else {
                                                                setCurrentQuestion({ ...currentQuestion, correctAnswer: i });
                                                            }
                                                        }}
                                                    />
                                                    <input
                                                        className="flex-1 p-1.5 bg-gray-50 text-xs border border-gray-100 rounded focus:border-brand-blue outline-none"
                                                        placeholder={`Option ${i + 1}`}
                                                        value={opt}
                                                        onChange={e => {
                                                            const newOpts = [...currentQuestion.options];
                                                            newOpts[i] = e.target.value;
                                                            setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                                        }}
                                                    />
                                                    <button
                                                        onClick={() => {
                                                            const newOpts = currentQuestion.options.filter((_: any, idx: number) => idx !== i);
                                                            setCurrentQuestion({ ...currentQuestion, options: newOpts });
                                                        }}
                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                        tabIndex={-1}
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                onClick={() => setCurrentQuestion({ ...currentQuestion, options: [...currentQuestion.options, ''] })}
                                                className="text-xs flex items-center gap-1 text-brand-blue font-bold px-2 py-1 hover:bg-blue-50 rounded"
                                            >
                                                <Plus size={12} /> Add Option
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <button onClick={() => setIsAddingQ(false)} className="text-xs text-gray-500">Cancel</button>
                                    <button onClick={addQuestion} className="text-xs bg-brand-blue text-white px-3 py-1 rounded font-bold">Done</button>
                                </div>
                            </div>
                        )}

                        {formData.questions.map((q: any, idx: number) => (
                            <div key={idx} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-start group">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-black uppercase ${q.type === 'ESSAY' ? 'bg-blue-100 text-blue-600' :
                                            q.type === 'MFIB' ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-500'
                                            }`}>{q.type || 'SBO'}</span>
                                        {q.imageUrl && <img src={q.imageUrl} alt="Q" className="w-6 h-6 rounded object-cover border border-gray-200" />}
                                        <p className="text-sm font-bold text-gray-800">{idx + 1}. {q.prompt}</p>
                                    </div>
                                    <p className="text-xs text-brand-blue mt-1 font-mono italic">
                                        {q.type === 'ESSAY' ? 'Manual Grading Mode' :
                                            q.type === 'MFIB' ? `Answers: ${(q.correctAnswer || []).join(', ')}` :
                                                q.type === 'MCQ' ? `Correct: ${(Array.isArray(q.correctAnswer) ? q.correctAnswer : []).map((i: number) => q.options[i]).join(', ')}` :
                                                    (q.type === 'FIB' || q.type === 'FILL_GAP' || q.type === 'IMAGE_ID') ? `Key: ${q.correctAnswer}` :
                                                        `Answer: ${q.options?.[q.correctAnswer] || 'Not Set'}`}
                                    </p>
                                </div>
                                <button onClick={() => removeQuestion(idx)} className="text-gray-300 hover:text-red-500"><X size={14} /></button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="flex justify-end gap-4 pt-6 border-t border-gray-100">
                <button onClick={onCancel} className="px-6 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl">Cancel</button>
                <button onClick={() => {
                    if (!formData.weekNumber || formData.weekNumber === '') {
                        alert("Target Week is required for MCAMP quizzes to show up correctly.");
                        return;
                    }
                    onSave({ ...formData, deadline: (document.getElementById('quiz-deadline') as HTMLInputElement)?.value });
                }} className="px-8 py-3 bg-brand-dark text-white font-bold rounded-xl shadow-lg hover:bg-black transition-all">
                    Save Quiz
                </button>
            </div>
        </div>
    );
};

// --- GRADING ---
const GradingView = ({ cohort }: any) => {
    const [submissions, setSubmissions] = useState<any[]>([]);
    const [resources, setResources] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null);
    const [sessionFilter, setSessionFilter] = useState<string>('all');
    const [usersList, setUsersList] = useState<any[]>([]); // Keep raw user list for calculating sessions
    const [globalSessionId, setGlobalSessionId] = useState<string>('');

    useEffect(() => {
        loadData();
    }, []);

    // Sync cohort prop
    useEffect(() => {
        if (cohort && cohort.uniqueId) setSessionFilter(cohort.uniqueId);
    }, [cohort]);

    // Calculate Unique Sessions (Active vs Past)
    const sessionGroups = useMemo(() => {
        const activeSet = new Set<string>();
        const pastSet = new Set<string>();

        // Always include currently configured session
        if (globalSessionId) activeSet.add(globalSessionId);

        usersList.forEach(u => {
            // If user is currently enrolled, their ID is 'Active'
            if (u.mcamp?.uniqueId && u.mcamp.isEnrolled) {
                activeSet.add(u.mcamp.uniqueId);
            }

            // Check history for past sessions
            if (u.mcampHistory && Array.isArray(u.mcampHistory)) {
                u.mcampHistory.forEach((h: any) => {
                    if (h.uniqueId) pastSet.add(h.uniqueId);
                });
            }
        });

        // Remove active IDs from past set to avoid duplicates (unless we want them in both? usually distinct is better)
        // Actually, a session could be both if some entered and some left?
        // Let's keep them distinct based on "Is it currently an active session for ANYONE?"
        // If yes, it's Active.

        const active = Array.from(activeSet).sort().reverse();
        // Filter pastSet: only include if NOT in activeSet
        const past = Array.from(pastSet).filter(id => !activeSet.has(id)).sort().reverse();

        return { active, past };
    }, [usersList]);

    const loadData = async () => {
        setLoading(true);
        try {
            const [users, allResources, curData] = await Promise.all([
                api.users.getAll(),
                api.resources.getAll(),
                api.curriculum.get().catch(() => ({}))
            ]);

            setGlobalSessionId(curData?.currentSessionId || curData?.sessionId || '');

            // Filter only quizzes (and MCAMP ones primarily)
            const quizMap = Array.isArray(allResources)
                ? allResources.filter((r: any) => r.type === 'Quiz' || r.isMcampExclusive)
                    .map((q: any) => ({
                        ...q,
                        questions: (q.quizData || q.questions || []).map((qq: any, idx: number) => ({
                            ...qq,
                            id: qq.id || `q-${idx}`
                        }))
                    }))
                : [];
            setResources(quizMap);

            const userList = (Array.isArray(users) ? users : users?.users) || [];
            if (Array.isArray(userList)) setUsersList(userList);
            const pending: any[] = [];

            if (Array.isArray(userList)) {
                userList.forEach((u: any) => {
                    if (u.quizAttempts) {
                        const historyIds = (u.mcampHistory || []).map((h: any) => h.uniqueId);
                        Object.entries(u.quizAttempts).forEach(([quizId, attempt]: [string, any]) => {
                            // Show all for re-grading capability, but sort pending first
                            const quiz = quizMap.find((r: any) => r.id === quizId || r._id === quizId) as any;
                            pending.push({
                                userId: u.uid || u.id,
                                userEmail: u.email,
                                mcampId: u.mcamp?.uniqueId || 'Unknown',
                                historyIds, // Pass history for filtering
                                quizId,
                                quizTitle: quiz?.title || 'Unknown Quiz',
                                ...attempt
                            });
                        });
                    }
                });
            }
            // Sort: Pending first, then by date desc
            pending.sort((a, b) => {
                if (a.status === 'pending_grading' && b.status !== 'pending_grading') return -1;
                if (a.status !== 'pending_grading' && b.status === 'pending_grading') return 1;
                return new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime();
            });
            setSubmissions(pending);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSaveGrade = async (sub: any, grades: Record<string, boolean>, score: number) => {
        try {
            const userData = await api.users.get(sub.userId);

            if (userData) {
                const attempts = userData.quizAttempts || {};

                if (attempts[sub.quizId]) {
                    attempts[sub.quizId] = {
                        ...attempts[sub.quizId],
                        status: 'completed',
                        score: score,
                        corrections: grades, // Save per-question grading
                        gradedAt: new Date().toISOString()
                    };

                    await api.users.update(sub.userId, { quizAttempts: attempts });

                    // Send Notification
                    await api.notifications.broadcast({
                        title: 'Quiz Graded',
                        message: `Your attempt for "${sub.quizTitle}" has been graded. Check your dashboard to view the results.`,
                        type: 'grade',
                        target: sub.userId
                    });

                    // Update local list state
                    setSubmissions(prev => prev.map(p =>
                        (p.userId === sub.userId && p.quizId === sub.quizId)
                            ? { ...p, status: 'completed', score, corrections: grades }
                            : p
                    ));

                    setSelectedSubmission(null);
                    alert("Grade saved and student notified via MongoDB!");
                }
            }
        } catch (error) {
            console.error("Grading failed with MongoDB:", error);
            alert("Failed to save grade to MongoDB. Check console.");
        }
    };

    const formatAnswer = (ans: any, q: any, _isSystem = false) => {
        if (ans === undefined || ans === null) return <span className="text-gray-400 italic">No Answer</span>;

        if (q.type === 'MCQ') {
            const indices = Array.isArray(ans) ? ans : [ans];
            return indices.map((i: number) => q.options?.[i] || `Opt ${i + 1}`).join(', ');
        }

        if (q.type === 'SBO') {
            return q.options?.[ans] || (typeof ans === 'number' ? `Option ${ans + 1}` : ans);
        }

        if (q.type === 'MFIB') {
            return (Array.isArray(ans) ? ans : [ans]).join(' | ');
        }

        return String(ans);
    };

    const finishGrading = async (sub: any, grades: Record<string, boolean>) => {
        const totalQ = Object.keys(grades).length;
        const correct = Object.values(grades).filter(Boolean).length;
        const finalScore = Math.round((correct / totalQ) * 100);

        // Logic moved to Modal
        await handleSaveGrade(sub, grades, finalScore);
    };

    if (selectedSubmission) {
        const quiz = resources.find(r => r.id === selectedSubmission.quizId || r._id === selectedSubmission.quizId);
        return (
            <GradingDetail
                submission={selectedSubmission}
                quiz={quiz}
                onBack={() => setSelectedSubmission(null)}
                onSave={finishGrading}
                formatAnswer={formatAnswer}
            />
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <h2 className="text-2xl font-bold text-gray-800">Student Submissions</h2>
                    {cohort && (
                        <span className="bg-brand-blue/10 text-brand-blue text-xs font-bold px-3 py-1 rounded-full border border-blue-100 flex items-center gap-1">
                            <Users size={12} /> Filtering: {cohort.uniqueId}
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Session Filter */}
                    {!cohort && (
                        <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-2 rounded-xl">
                            <Users size={16} className="text-gray-400" />
                            <select
                                value={sessionFilter}
                                onChange={(e) => setSessionFilter(e.target.value)}
                                className="bg-transparent font-bold text-sm focus:outline-none text-brand-dark min-w-[140px]"
                            >
                                <option value="all">All Enrolled Users</option>
                                <optgroup label="Active Sessions">
                                    {sessionGroups.active.map((sid: string) => (
                                        <option key={sid} value={sid}>{sid}</option>
                                    ))}
                                </optgroup>
                                <optgroup label="Past Sessions">
                                    {sessionGroups.past.map((sid: string) => (
                                        <option key={sid} value={sid}>{sid}</option>
                                    ))}
                                </optgroup>
                            </select>
                        </div>
                    )}

                    <button onClick={loadData} className="text-brand-blue font-bold text-sm flex items-center gap-1 hover:bg-blue-50 px-3 py-1 rounded-lg">
                        <Clock size={14} /> Refresh
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="p-12 text-center text-gray-500">Loading submissions...</div>
            ) : submissions.length === 0 ? (
                <div className="p-12 text-center text-gray-400 bg-gray-50 rounded-2xl border border-gray-100">
                    No submissions found.
                </div>
            ) : (
                <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Student</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Quiz</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Submitted</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Status</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase">Score</th>
                                    <th className="px-6 py-4 font-bold text-gray-500 text-xs uppercase text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {submissions.filter(sub => {
                                    // PIVOT: ObjectId Filtering
                                    // If cohort is selected, we check if the Submission's User has the matching cohortId
                                    if (cohort && cohort._id) {
                                        // NOTE: Submission object needs to include User's Cohort ID attached or we rely on mcampId match
                                        // Since enrollment uniqueId is string, but we want robust check.
                                        // Fallback: Check if sub.mcampId matches cohort.uniqueId OR checking an enrolled list.
                                        // For now, let's keep the UniqueID check but make it strict:
                                        const activeFilter = cohort.uniqueId;
                                        return sub.mcampId === activeFilter || (sub.historyIds && sub.historyIds.includes(activeFilter));
                                    }

                                    if (sessionFilter === 'all') return true;
                                    return sub.mcampId === sessionFilter || (sub.historyIds && sub.historyIds.includes(sessionFilter));
                                }).map((sub, idx) => (
                                    <tr key={idx} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 text-sm">{sub.userEmail?.split('@')[0]}</p>
                                            <p className="text-xs text-brand-blue font-mono">{sub.mcampId}</p>
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="font-bold text-gray-900 text-sm truncate max-w-[200px]">{sub.quizTitle}</p>
                                            <p className="text-xs text-gray-400">{sub.quizId}</p>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {new Date(sub.submittedAt).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase ${sub.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                                                }`}>
                                                {sub.status === 'completed' ? 'Graded' : 'Pending'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-gray-900">
                                            {sub.score !== undefined ? sub.score : '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => setSelectedSubmission(sub)}
                                                className="px-4 py-2 bg-white border border-gray-200 shadow-sm text-sm font-bold rounded-lg hover:border-brand-blue hover:text-brand-blue transition-colors"
                                            >
                                                {sub.status === 'completed' ? 'Review / Edit' : 'Grade Now'}
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

// --- GRADING DETAIL SUB-COMPONENT ---
const GradingDetail = ({ submission, quiz, onBack, onSave, formatAnswer }: any) => {
    // Initial state: load from submission corrections OR auto-calculate
    const [grades, setGrades] = useState<Record<string, boolean>>(() => {
        if (submission.corrections) return submission.corrections;
        if (!quiz?.questions) return {};

        // Auto-grade init
        const initial: Record<string, boolean> = {};
        quiz.questions.forEach((q: any) => {
            const uAns = submission.answers?.[q.id];
            let isCorrect = false;
            if (q.type === 'MCQ') {
                // Array compare
                if (Array.isArray(uAns) && Array.isArray(q.correctAnswer)) {
                    isCorrect = JSON.stringify(uAns.sort()) === JSON.stringify(q.correctAnswer.sort());
                }
            } else if (q.type === 'FIB' || q.type === 'FILL_GAP' || q.type === 'IMAGE_ID') {
                isCorrect = String(uAns || "").toLowerCase().trim() === String(q.correctAnswer || "").toLowerCase().trim();
            } else if (q.type === 'MFIB') {
                // Check if all answers match in order
                const uArr = Array.isArray(uAns) ? uAns : [];
                const cArr = Array.isArray(q.correctAnswer) ? q.correctAnswer : [];
                if (uArr.length === cArr.length && cArr.length > 0) {
                    isCorrect = cArr.every((ans: string, idx: number) =>
                        String(ans).toLowerCase().trim() === String(uArr[idx] || '').toLowerCase().trim()
                    );
                }
            } else if (q.type === 'ESSAY') {
                isCorrect = false; // Always manual for essays
            } else {
                isCorrect = Number(uAns) === Number(q.correctAnswer);
            }
            initial[q.id] = isCorrect;
        });
        return initial;
    });

    const questions = quiz?.questions || [];
    const correctCount = Object.values(grades).filter(Boolean).length;
    const totalScore = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;

    const toggleGrade = (qId: string, status: boolean) => {
        setGrades(prev => ({ ...prev, [qId]: status }));
    };

    if (!quiz) return <div className="p-12 text-center">Quiz data not found for ID: {submission.quizId}</div>;

    const [showConfirm, setShowConfirm] = useState(false);

    return (
        <div className="space-y-6">
            <GradingConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={() => {
                    setShowConfirm(false);
                    onSave(submission, grades);
                }}
                score={totalScore}
                mcampId={submission.mcampId}
            />

            <div className="flex items-center gap-4 border-b border-gray-100 pb-4">
                <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full"><ArrowLeft size={20} /></button>
                <div>
                    <h2 className="text-xl font-bold text-gray-800">Grading: {quiz.title}</h2>
                    <p className="text-sm text-gray-500">{submission.mcampId} • {submission.userEmail}</p>
                </div>
                <div className="ml-auto flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-xs text-gray-400 uppercase font-bold">Current Score</p>
                        <p className="text-2xl font-extrabold text-brand-blue">{totalScore} pts</p>
                    </div>
                    <button
                        onClick={() => setShowConfirm(true)}
                        className="bg-brand-dark text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-colors"
                    >
                        Release Grade
                    </button>
                </div>
            </div>

            <div className="space-y-4 pb-20">
                {questions.map((q: any, i: number) => {
                    const uAns = submission.answers?.[q.id];
                    const isCorrect = grades[q.id];

                    return (
                        <div key={q.id || i} className={`p-6 rounded-2xl border-2 transition-colors ${isCorrect ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                            <div className="flex justify-between items-start gap-4">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="bg-white border px-2 py-0.5 rounded text-xs font-bold text-gray-500">Q{i + 1}</span>
                                        <p className="font-bold text-gray-800">{q.prompt}</p>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                        <div className="bg-white p-3 rounded-xl border border-gray-100">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">User Answer</p>
                                            <p className="font-medium text-gray-900">
                                                {formatAnswer(uAns, q)}
                                            </p>
                                        </div>
                                        <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 opacity-75">
                                            <p className="text-xs font-bold text-gray-400 uppercase mb-1">Correct Answer</p>
                                            <p className="font-medium text-gray-600">
                                                {formatAnswer(q.correctAnswer, q, true)}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-2 shrink-0">
                                    <button
                                        onClick={() => toggleGrade(q.id, true)}
                                        className={`p-2 rounded-lg border font-bold text-xs flex items-center gap-1 transition-all ${isCorrect
                                            ? 'bg-green-500 text-white border-green-500 shadow-lg shadow-green-200'
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-green-200'}`}
                                    >
                                        <CheckCircle size={14} /> Correct
                                    </button>
                                    <button
                                        onClick={() => toggleGrade(q.id, false)}
                                        className={`p-2 rounded-lg border font-bold text-xs flex items-center gap-1 transition-all ${!isCorrect
                                            ? 'bg-red-500 text-white border-red-500 shadow-lg shadow-red-200'
                                            : 'bg-white text-gray-400 border-gray-200 hover:border-red-200'}`}
                                    >
                                        <X size={14} /> Incorrect
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


const GradingConfirmModal = ({ isOpen, onClose, onConfirm, score, mcampId }: any) => {
    if (!isOpen) return null;
    return createPortal(
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-2xl w-full max-w-sm p-6 relative z-10 animate-fade-in-up shadow-2xl">
                <div className="w-16 h-16 bg-blue-50 text-brand-blue rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-center text-gray-900 mb-2">Publish Grades?</h3>
                <p className="text-center text-gray-500 mb-6">
                    This will finalize the score for <span className="font-bold text-gray-800">{mcampId}</span> and send them a notification instantly.
                </p>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 text-center">
                    <p className="text-xs uppercase font-bold text-gray-400">Final Score</p>
                    <p className="text-3xl font-extrabold text-brand-blue">{score}%</p>
                </div>

                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">
                        Cancel
                    </button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-brand-dark text-white font-bold rounded-xl hover:bg-black shadow-lg shadow-brand-dark/20 transition-all">
                        Confirm & Send
                    </button>
                </div>
            </div>
        </div>,
        document.body
    );
};

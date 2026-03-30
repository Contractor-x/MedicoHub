import { useState, useEffect } from 'react';
import { ChevronDown, Plus, Trash2, Check } from 'lucide-react';
import { api } from '../services/api';

interface Cohort {
    _id: string;
    uniqueId: string;
    startDate: string; // Date string
    status: 'active' | 'archived' | 'pending';
    targetYear: string;
}

interface CohortSwitcherProps {
    selectedCohortId: string | null;
    onSelect: (cohort: Cohort) => void;
}

export const CohortSwitcher = ({ selectedCohortId, onSelect }: CohortSwitcherProps) => {
    const [cohorts, setCohorts] = useState<Cohort[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form State
    const [newCohort, setNewCohort] = useState({
        targetYear: 'Year 2',
        month: new Date().toLocaleString('default', { month: 'short' }).toUpperCase(),
        year: new Date().getFullYear().toString()
    });

    useEffect(() => {
        loadCohorts();
    }, []);

    const loadCohorts = async () => {
        try {
            const list = await api.cohorts.getAll();
            if (Array.isArray(list) && list.length > 0) {
                setCohorts(list);

                // If ID is provided (e.g. from URL), select that specific cohort object to sync parent
                if (selectedCohortId) {
                    const match = list.find(c => c.uniqueId === selectedCohortId);
                    if (match) {
                        onSelect(match);
                        return;
                    }
                }

                // Fallback: Auto-select first if no ID or ID not found
                onSelect(list[0]);
            }
        } catch (e) {
            console.error("Failed to load cohorts", e);
        }
    };

    const handleCreate = async () => {
        setLoading(true);
        try {
            // format: MC-YYYY-MMM-Y#
            // e.g. MC-2026-JAN-Y2
            const id = `MC-${newCohort.year}-${newCohort.month}-${newCohort.targetYear.replace('Year ', 'Y')}`;

            const payload = {
                uniqueId: id.toUpperCase(),
                startDate: new Date().toISOString(), // Default to today, editable later? Or add field.
                targetYear: newCohort.targetYear,
                status: 'active'
            };

            const created = await api.cohorts.create(payload);
            await loadCohorts();
            onSelect(created); // Switch to new
            setIsCreating(false);
        } catch (e: any) {
            alert(e.message || "Failed to create cohort");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string, e: any) => {
        e.stopPropagation();
        if (!confirm("Are you sure? This will delete the cohort and its schedule data permanently.")) return;
        try {
            await api.cohorts.delete(id);
            await loadCohorts();
            // If we deleted the active one, select the first available
            if (selectedCohortId === id || selectedCohortId === cohorts.find(c => c._id === id)?.uniqueId) {
                const remaining = cohorts.filter(c => c._id !== id && c.uniqueId !== id);
                if (remaining.length > 0) onSelect(remaining[0]);
                else onSelect({ _id: '', uniqueId: '', startDate: '', status: 'active', targetYear: '' } as any);
            }
        } catch (e) {
            alert("Failed to delete cohort");
        }
    };

    const activeCohort = cohorts.find(c => c.uniqueId === selectedCohortId) || cohorts[0];

    return (
        <div className="relative z-50">
            {/* Main Button */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-white border border-gray-200 px-4 py-3 rounded-xl shadow-sm hover:shadow-md transition-all min-w-[240px] justify-between"
            >
                <div className="text-left">
                    <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Current Cohort</p>
                    <p className="text-brand-dark font-extrabold text-sm truncate">
                        {activeCohort?.uniqueId || "Select Cohort..."}
                    </p>
                </div>
                <ChevronDown size={18} className="text-gray-400" />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
                    <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl shadow-2xl border border-gray-100 p-2 z-50 max-h-[400px] overflow-y-auto custom-scrollbar">

                        {/* Create New Button */}
                        <button
                            onClick={() => { setIsCreating(true); setIsOpen(false); }}
                            className="w-full flex items-center justify-center gap-2 p-3 bg-brand-blue/5 text-brand-blue rounded-lg font-bold text-sm hover:bg-brand-blue/10 mb-2 transition-colors"
                        >
                            <Plus size={16} />
                            New Cohort
                        </button>

                        <div className="space-y-1">
                            {cohorts.length === 0 && <p className="text-center text-gray-400 text-xs py-4">No cohorts found.</p>}

                            {cohorts.map(cohort => (
                                <div
                                    key={cohort.uniqueId}
                                    onClick={() => { onSelect(cohort); setIsOpen(false); }}
                                    className={`flex items-center justify-between p-3 rounded-lg cursor-pointer group transition-colors ${selectedCohortId === cohort.uniqueId ? 'bg-gray-100' : 'hover:bg-gray-50'
                                        }`}
                                >
                                    <div>
                                        <p className={`font-bold text-sm ${selectedCohortId === cohort.uniqueId ? 'text-brand-dark' : 'text-gray-600'}`}>
                                            {cohort.uniqueId}
                                        </p>
                                        <p className="text-xs text-gray-400">{cohort.targetYear} • {new Date(cohort.startDate).toLocaleDateString()}</p>
                                    </div>

                                    {selectedCohortId === cohort.uniqueId ? (
                                        <Check size={16} className="text-brand-blue" />
                                    ) : (
                                        <button
                                            onClick={(e) => handleDelete(cohort._id || cohort.uniqueId, e)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-md transition-all"
                                            title="Delete Cohort"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Creation Modal */}
            {isCreating && (
                <div className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl animate-fade-in">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-extrabold text-gray-900">Create New Cohort</h3>
                            <button onClick={() => setIsCreating(false)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><X size={20} /></button>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Target Year</label>
                                <select
                                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-brand-blue transition-colors"
                                    value={newCohort.targetYear}
                                    onChange={e => setNewCohort({ ...newCohort, targetYear: e.target.value })}
                                >
                                    <option>Year 2</option>
                                    <option>Year 3</option>
                                    <option>Year 4</option>
                                    <option>Clinical</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Batch Month</label>
                                    <select
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-brand-blue transition-colors"
                                        value={newCohort.month}
                                        onChange={e => setNewCohort({ ...newCohort, month: e.target.value })}
                                    >
                                        {['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'].map(m => (
                                            <option key={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Batch Year</label>
                                    <input
                                        type="number"
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl font-bold focus:outline-none focus:border-brand-blue transition-colors"
                                        value={newCohort.year}
                                        onChange={e => setNewCohort({ ...newCohort, year: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="p-4 bg-brand-blue/5 rounded-xl border border-brand-blue/10">
                                <p className="text-xs font-bold text-brand-blue">Preview ID:</p>
                                <p className="text-lg font-mono font-black text-brand-dark mt-1">
                                    MC-{newCohort.year}-{newCohort.month}-{newCohort.targetYear.replace('Year ', 'Y')}
                                </p>
                            </div>

                            <button
                                onClick={handleCreate}
                                disabled={loading}
                                className="w-full py-3.5 bg-brand-dark text-white font-bold rounded-xl shadow-lg hover:shadow-xl hover:bg-black transition-all flex justify-center items-center gap-2 mt-4"
                            >
                                {loading ? <Loader className="animate-spin" /> : <Plus size={20} />}
                                Create & Launch Cohort
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Helper for X icon since I can't import it inside the component function if I use lucide-react in main file
// Actually I imported it at top.
import { X, Loader } from 'lucide-react';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Shield, X, Check, FilePenLine, User, Crown, Phone, RotateCw, AlertCircle, Download, AlertTriangle } from 'lucide-react';
// import { deleteField } from 'firebase/firestore'; // For removing requestedYear after approval
import { api } from '../services/api';

export const UsersPage = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'all' | 'requests'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    // Modal State
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({ year: '', isSubscribed: false, role: 'student' });
    const [isSaving, setIsSaving] = useState(false);

    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, [activeTab]);

    const fetchUsers = async () => {
        try {
            setError(null);
            setLoading(true);
            const data = activeTab === 'all'
                ? await api.users.getAll()
                : await api.users.getUpgradeRequests();

            if (Array.isArray(data)) {
                setUsers(data);
            } else {
                throw new Error("Invalid response format");
            }
        } catch (err: any) {
            console.error(err);
            setError(err.message || "Failed to load users.");
        } finally {
            setLoading(false);
        }
    };

    const handleEditClick = (user: any) => {
        setSelectedUser(user);

        // Normalize Year string to match Select options
        let normalizedYear = user.year || '';
        if (normalizedYear && !normalizedYear.startsWith('Year')) {
            normalizedYear = `Year ${normalizedYear}`;
        }
        if (!normalizedYear) normalizedYear = 'Year 1';

        setEditForm({
            year: normalizedYear,
            isSubscribed: !!user.isSubscribed,
            role: user.role || 'student'
        });
        setShowDeleteConfirm(false);
    };

    const handleSave = async () => {
        if (!selectedUser) return;
        setIsSaving(true);
        try {
            await api.users.update(selectedUser.uid || selectedUser._id, editForm);

            // Optimistic update
            setUsers(prev => prev.map(u =>
                (u.uid || u._id) === (selectedUser.uid || selectedUser._id) ? { ...u, ...editForm } : u
            ));

            setSelectedUser(null);
        } catch (error) {
            console.error("Failed to update user", error);
            alert("Failed to update user. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = () => {
        setShowDeleteConfirm(true);
    };

    const confirmDelete = async () => {
        if (!selectedUser) return;

        setIsSaving(true);
        try {
            await api.users.delete(selectedUser.uid || selectedUser._id);
            setUsers(prev => prev.filter(u => (u.uid || u._id) !== (selectedUser.uid || selectedUser._id)));
            setSelectedUser(null);
            setShowDeleteConfirm(false);
        } catch (error) {
            console.error("Failed to delete user", error);
            alert("Failed to delete user. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    const filteredUsers = users.filter(u =>
        (u.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
        (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );

    const downloadCSV = () => {
        const headers = ["Name", "Email", "Phone", "School", "Year", "Subscribed", "Joined"];
        const rows = filteredUsers.map(u => [
            u.name || "N/A",
            u.email || "N/A",
            u.phoneNumber ? `'${u.phoneNumber}` : "N/A", // Quote to prevent Excel auto-formatting
            u.schoolName || "N/A",
            u.year || "N/A",
            u.isSubscribed ? "Yes" : "No",
            u.createdAt ? new Date(u.createdAt).toLocaleDateString() : "N/A"
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "medico_users_export.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const approveUpgrade = async () => {
        if (!selectedUser || !selectedUser.requestedYear) return;
        setIsSaving(true);
        try {
            // Update year to requestedYear and remove requestedYear field
            await api.users.update(selectedUser.uid || selectedUser._id, {
                academicYear: selectedUser.requestedYear,
                requestedYear: null
            });
            // Update local state - set both year and academicYear for compatibility
            setUsers(prev => prev.map(u => (u.uid || u._id) === (selectedUser.uid || selectedUser._id) ? { ...u, year: selectedUser.requestedYear, academicYear: selectedUser.requestedYear, requestedYear: undefined } : u));
            setSelectedUser(null);
            alert("Upgrade Approved Successfully");
        } catch (e) {
            console.error(e);
            alert("Failed to approve upgrade");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <div className="flex flex-col gap-1">
                    <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
                    {/* TABS */}
                    <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit">
                        <button
                            onClick={() => setActiveTab('all')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'all' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            All Users
                        </button>
                        <button
                            onClick={() => setActiveTab('requests')}
                            className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'requests' ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Upgrade Requests
                            {users.some(u => u.requestedYear) && activeTab !== 'requests' && (
                                <span className="ml-2 w-2 h-2 bg-amber-500 rounded-full inline-block animate-pulse"></span>
                            )}
                        </button>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative mr-2">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 w-48 text-sm"
                        />
                    </div>
                    <button
                        onClick={() => { fetchUsers(); }}
                        className="p-2 text-gray-400 hover:text-brand-blue hover:bg-blue-50 rounded-lg transition-all"
                        title="Refresh List"
                    >
                        <RotateCw size={20} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={downloadCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 transition-colors shadow-sm text-sm"
                    >
                        <Download size={16} /> Export CSV
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">User</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Year</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Status</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm">Joined</th>
                                <th className="px-6 py-4 font-semibold text-gray-600 text-sm text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {loading ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">Loading users...</td></tr>
                            ) : error ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-red-500 font-bold">{error}</td></tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr><td colSpan={5} className="px-6 py-10 text-center text-gray-500">No users found.</td></tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.uid || user._id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => handleEditClick(user)}>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-50 text-brand-blue flex items-center justify-center font-bold text-sm uppercase shrink-0">
                                                    {(user.name || user.email || 'U').charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-bold text-gray-900">{user.name || 'Anonymous'}</p>
                                                        {user.isSubscribed && <Crown size={14} className="text-yellow-500 fill-yellow-500" />}
                                                    </div>
                                                    <p className="text-gray-500 text-xs">{user.email}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-1 bg-gray-100 rounded-lg text-xs font-bold text-gray-600">
                                                {user.year || 'Not Set'}
                                            </span>
                                            {user.requestedYear && (
                                                <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                                                    <AlertTriangle size={10} />
                                                    Req: {user.requestedYear}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${user.isSubscribed ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600'
                                                }`}>
                                                {user.isSubscribed ? 'PRO MEMBER' : 'FREE TIER'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 font-medium">
                                            {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="text-gray-300 group-hover:text-brand-blue transition-colors p-2 hover:bg-blue-50 rounded-lg">
                                                <FilePenLine size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* EDIT USER MODAL */}
            {
                selectedUser && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-[2rem] w-full max-w-lg shadow-2xl overflow-hidden animate-pop-in relative">
                            <button
                                onClick={() => setSelectedUser(null)}
                                className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors z-10"
                            >
                                <X size={24} className="text-gray-400" />
                            </button>

                            {/* Header */}
                            <div className="px-8 pt-8 pb-4">
                                <h2 className="text-2xl font-bold text-brand-dark">Edit User Details</h2>
                                <p className="text-gray-500 text-sm mt-1">Manage subscription and profile information.</p>
                            </div>

                            {/* Body */}
                            <div className="px-8 py-4 space-y-6">
                                {/* User Identity View */}
                                {selectedUser.requestedYear && (
                                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="bg-amber-100 p-2 rounded-lg text-amber-600">
                                                <AlertTriangle size={24} />
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-amber-900">Upgrade Requested</h4>
                                                <p className="text-xs text-amber-700">User wants to move to <span className="font-bold">{selectedUser.requestedYear}</span></p>
                                            </div>
                                        </div>
                                        <button
                                            onClick={approveUpgrade}
                                            className="bg-amber-600 text-white px-4 py-2 rounded-lg font-bold text-sm hover:bg-amber-700 shadow-lg shadow-amber-600/20"
                                        >
                                            Approve
                                        </button>
                                    </div>
                                )}

                                <div className="flex items-center gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-50">
                                    <div className="w-14 h-14 rounded-full bg-brand-blue text-white flex items-center justify-center font-bold text-xl uppercase shadow-lg shadow-blue-200">
                                        {(selectedUser.name || selectedUser.email).charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">{selectedUser.name || 'Anonymous User'}</h3>
                                        <p className="text-sm text-gray-500">{selectedUser.email}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Phone size={12} className="text-gray-400" />
                                            <span className="text-sm text-gray-600">{selectedUser.phoneNumber || 'No Data'}</span>
                                        </div>
                                        <p className="text-xs text-brand-blue mt-1 font-medium">{selectedUser.schoolName || 'School Not Set'}</p>
                                    </div>
                                </div>

                                {/* Form Controls */}
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700">Academic Year</label>
                                        <div className="relative">
                                            <select
                                                value={editForm.year}
                                                onChange={(e) => setEditForm({ ...editForm, year: e.target.value })}
                                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue transition-all font-medium text-gray-700 appearance-none"
                                            >
                                                <option value="">Select Year...</option>
                                                {[2, 3, 4].map(y => (
                                                    <option key={y} value={`Year ${y}`}>Year {y}</option>
                                                ))}
                                            </select>
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-400">Restricted to Year 2, 3, and 4.</p>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="block text-sm font-bold text-gray-700">Plan Type</label>
                                        <div
                                            onClick={() => setEditForm({ ...editForm, isSubscribed: !editForm.isSubscribed })}
                                            className={`cursor-pointer w-full px-4 py-3 border rounded-xl flex items-center justify-between transition-all ${editForm.isSubscribed
                                                ? 'bg-brand-dark border-brand-dark shadow-md'
                                                : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                {editForm.isSubscribed ? (
                                                    <div className="p-1.5 bg-brand-yellow rounded-lg text-brand-dark"><Crown size={18} /></div>
                                                ) : (
                                                    <div className="p-1.5 bg-gray-200 rounded-lg text-gray-500"><User size={18} /></div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className={`font-bold text-sm ${editForm.isSubscribed ? 'text-white' : 'text-gray-700'}`}>
                                                        {editForm.isSubscribed ? 'Pro Member' : 'Free Tier'}
                                                    </span>
                                                    <span className={`text-xs ${editForm.isSubscribed ? 'text-gray-400' : 'text-gray-400'}`}>
                                                        {editForm.isSubscribed ? 'Full access to all resources' : 'Limited access'}
                                                    </span>
                                                </div>
                                            </div>
                                            {editForm.isSubscribed && <Check size={18} className="text-brand-yellow" />}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer */}
                            <div className="px-8 pb-8 pt-4 flex flex-col gap-3">
                                <button
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="w-full py-3.5 bg-brand-blue text-white font-bold rounded-xl hover:bg-blue-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-blue/30 active:scale-95"
                                >
                                    {isSaving ? <span className="animate-spin w-5 h-5 border-2 border-white/30 border-t-white rounded-full"></span> : 'Save Changes'}
                                </button>

                                <div className="flex justify-between items-center pt-2">
                                    <button
                                        onClick={handleDeleteClick}
                                        className="px-4 py-2 font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors text-sm flex items-center gap-2"
                                    >
                                        <Shield size={14} /> Delete User
                                    </button>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="px-4 py-2 font-bold text-gray-400 hover:text-gray-600 transition-colors text-sm"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* DELETE CONFIRMATION MODAL */}
            {
                showDeleteConfirm && createPortal(
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center animate-pop-in">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Delete User?</h2>
                            <p className="text-gray-500 mb-8">
                                Are you sure you want to delete <b>{selectedUser?.name}</b>? This action effectively resets their account and cannot be undone.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmDelete}
                                    disabled={isSaving}
                                    className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Yes, Delete User"}
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirm(false)}
                                    disabled={isSaving}
                                    className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }
        </div >
    );
};


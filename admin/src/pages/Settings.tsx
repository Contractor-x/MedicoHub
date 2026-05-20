
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Save, Lock, Globe, Bell, Shield, User, AlertTriangle, Video, BookOpen, Send, Tag, Camera } from 'lucide-react';

export const SettingsPage = () => {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('general');
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // General Settings State
    const [config, setConfig] = useState({
        maintenanceMode: false,
        allowSignups: true,
        announcement: '',
        mcampLive: false,
        mcampEnrollment: true,
        academicYears: ['Year 2', 'Year 3', 'Year 4'],
        proDiscountEnabled: true,
        proDiscountPercentage: 10
    });

    const [newYearInput, setNewYearInput] = useState('');

    const addYear = () => {
        if (newYearInput.trim() && !config.academicYears.includes(newYearInput.trim())) {
            setConfig({
                ...config,
                academicYears: [...config.academicYears, newYearInput.trim()]
            });
            setNewYearInput('');
        }
    };

    const removeYear = (year: string) => {
        setConfig({
            ...config,
            academicYears: config.academicYears.filter(y => y !== year)
        });
    };

    // Notification State
    const [notifData, setNotifData] = useState({
        title: '',
        message: '',
        target: 'all',
        type: 'info'
    });

    // Security Settings State
    const [passwordData, setPasswordData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [displayName, setDisplayName] = useState(user?.displayName || '');
    const [profilePhotoUrl, setProfilePhotoUrl] = useState(user?.photoURL || '');
    const [photoPreview, setPhotoPreview] = useState(user?.photoURL || '');
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [photoError, setPhotoError] = useState<string | null>(null);
    const [isPhotoProcessing, setIsPhotoProcessing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const previewRef = useRef<string | null>(null);

    const updatePreviewUrl = (url: string) => {
        if (previewRef.current && previewRef.current.startsWith('blob:') && previewRef.current !== url) {
            URL.revokeObjectURL(previewRef.current);
        }
        previewRef.current = url;
        setPhotoPreview(url);
    };

    useEffect(() => {
        loadSettings();
    }, []);

    useEffect(() => {
        setDisplayName(user?.displayName || '');
        setProfilePhotoUrl(user?.photoURL || '');
        updatePreviewUrl(user?.photoURL || '');
    }, [user?.displayName, user?.photoURL]);

    useEffect(() => {
        return () => {
            if (previewRef.current && previewRef.current.startsWith('blob:')) {
                URL.revokeObjectURL(previewRef.current);
            }
        };
    }, []);

    const loadSettings = async () => {
        try {
            const data = await api.settings.get();
            setConfig(prev => ({ ...prev, ...data }));
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    const withTimeout = (promise: Promise<any>, ms = 10000) => {
        return Promise.race([
            promise,
            new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), ms))
        ]);
    };

    const clampPercentage = (value: number) => {
        if (Number.isNaN(value)) return 0;
        return Math.min(100, Math.max(0, value));
    };

    const handleSaveGeneral = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            const sanitizedConfig = {
                ...config,
                proDiscountPercentage: clampPercentage(Number(config.proDiscountPercentage))
            };
            await withTimeout(api.settings.update(sanitizedConfig));
            setConfig(sanitizedConfig);
            setMessage({ type: 'success', text: 'System settings updated successfully.' });
        } catch (error: any) {
            console.error("Save Error:", error);
            setMessage({ type: 'error', text: `Failed to update settings: ${error.message}` });
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handleSendNotification = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!notifData.title || !notifData.message) return;
        setIsLoading(true);
        try {
            await withTimeout(api.notifications.broadcast(notifData));
            setMessage({ type: 'success', text: `Notification sent to ${notifData.target === 'all' ? 'all users' : notifData.target}.` });
            setNotifData({ title: '', message: '', target: 'all', type: 'info' });
        } catch (error: any) {
            console.error("Send Notif Error:", error);
            setMessage({ type: 'error', text: `Failed to send notification: ${error.message}` });
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    const handlePhotoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setPhotoError('Please upload an image smaller than 5MB.');
            event.target.value = '';
            return;
        }

        setPhotoError(null);
        setSelectedFile(file);
        const objectUrl = URL.createObjectURL(file);
        updatePreviewUrl(objectUrl);
        event.target.value = '';
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        if (!user) {
            setIsLoading(false);
            return;
        }
        try {
            let finalPhotoUrl = profilePhotoUrl;

            if (selectedFile) {
                setPhotoError(null);
                setIsPhotoProcessing(true);
                try {
                    const uploadedUrl = await api.files.upload(selectedFile);
                    finalPhotoUrl = uploadedUrl;
                    setProfilePhotoUrl(uploadedUrl);
                    updatePreviewUrl(uploadedUrl);
                    setSelectedFile(null);
                } catch (uploadError: any) {
                    console.error("[Photo Upload] Failed:", uploadError);
                    const errMsg = uploadError?.message || 'Failed to upload profile photo.';
                    setPhotoError(errMsg);
                    setMessage({ type: 'error', text: errMsg });
                    setIsLoading(false);
                    setIsPhotoProcessing(false);
                    return;
                }
                setIsPhotoProcessing(false);
            }

            const payload: { displayName?: string; photoURL?: string } = {};

            if (displayName.trim() && displayName !== user.displayName) {
                payload.displayName = displayName.trim();
            }

            if (finalPhotoUrl && finalPhotoUrl !== user.photoURL) {
                payload.photoURL = finalPhotoUrl;
            }

            if (Object.keys(payload).length > 0) {
                await api.auth.updateProfile(payload);
            }
            await refreshUser();
            if (passwordData.newPassword) {
                if (passwordData.newPassword !== passwordData.confirmPassword) {
                    throw new Error("Passwords do not match");
                }
                await api.auth.updatePassword(passwordData.newPassword);
            }
            setMessage({ type: 'success', text: 'Profile updated successfully.' });
            setPasswordData({ newPassword: '', confirmPassword: '' });
        } catch (error: any) {
            console.error(error);
            if (error.code === 'auth/requires-recent-login') {
                setMessage({ type: 'error', text: 'Security check: Please Log Out and Log Back In to update your password.' });
            } else {
                setMessage({ type: 'error', text: error.message || 'Failed to update profile.' });
            }
        } finally {
            setIsLoading(false);
            setTimeout(() => setMessage(null), 3000);
        }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-fade-in pb-10">
            <div>
                <h1 className="text-3xl font-bold text-gray-800">Settings</h1>
                <p className="text-gray-500 mt-1">Manage global system configurations, notifications, and your account.</p>
            </div>

            {/* TABS */}
            <div className="flex gap-4 border-b border-gray-100 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('general')}
                    className={`pb-4 px-2 font-bold transition-colors relative whitespace-nowrap ${activeTab === 'general' ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <div className="flex items-center gap-2"><Globe size={18} /> General</div>
                    {activeTab === 'general' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('notifications')}
                    className={`pb-4 px-2 font-bold transition-colors relative whitespace-nowrap ${activeTab === 'notifications' ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <div className="flex items-center gap-2"><Bell size={18} /> Notifications</div>
                    {activeTab === 'notifications' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full" />}
                </button>
                <button
                    onClick={() => setActiveTab('security')}
                    className={`pb-4 px-2 font-bold transition-colors relative whitespace-nowrap ${activeTab === 'security' ? 'text-brand-blue' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    <div className="flex items-center gap-2"><Shield size={18} /> Security & Account</div>
                    {activeTab === 'security' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-brand-blue rounded-t-full" />}
                </button>
            </div>

            {/* NOTIFICATIONS */}
            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'} animate-pop-in`}>
                    {message.type === 'success' ? <div className="w-2 h-2 rounded-full bg-green-500" /> : <AlertTriangle size={18} />}
                    <span className="font-medium">{message.text}</span>
                </div>
            )}

            {/* GENERAL TAB */}
            {activeTab === 'general' && (
                <form onSubmit={handleSaveGeneral} className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 space-y-8 animate-fade-in">
                    {/* SYSTEM SETTINGS */}
                    <div className="space-y-4">
                        <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">System Configuration</h3>

                        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="space-y-1">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Lock className="text-brand-blue" /> Maintenance Mode</h3>
                                <p className="text-sm text-gray-500 max-w-md">Only admins can access the platform when enabled.</p>
                            </div>
                            <button type="button" onClick={() => setConfig({ ...config, maintenanceMode: !config.maintenanceMode })} className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.maintenanceMode ? 'bg-brand-blue' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.maintenanceMode ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>

                        <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="space-y-1">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><User className="text-brand-blue" /> Allow Registration</h3>
                                <p className="text-sm text-gray-500 max-w-md">Enable or disable new user signups.</p>
                            </div>
                            <button type="button" onClick={() => setConfig({ ...config, allowSignups: !config.allowSignups })} className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.allowSignups ? 'bg-brand-blue' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.allowSignups ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* MCAMP SETTINGS */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">MCAMP Features</h3>

                        <div className="flex items-start justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="space-y-1">
                                <h3 className="font-bold text-brand-dark flex items-center gap-2"><Video className="text-brand-blue" /> MCAMP Live Indicator</h3>
                                <p className="text-sm text-gray-500 max-w-md">Show the global "LIVE" badge/icon across the dashboard to alert users.</p>
                            </div>
                            <button type="button" onClick={() => setConfig({ ...config, mcampLive: !config.mcampLive })} className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.mcampLive ? 'bg-red-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.mcampLive ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>

                        <div className="flex items-start justify-between p-4 bg-blue-50/50 rounded-xl border border-blue-100">
                            <div className="space-y-1">
                                <h3 className="font-bold text-brand-dark flex items-center gap-2"><BookOpen className="text-brand-blue" /> Allow MCAMP Enrollment</h3>
                                <p className="text-sm text-gray-500 max-w-md">If disabled, the "Enroll Now" button will be hidden/disabled in the app.</p>
                            </div>
                            <button type="button" onClick={() => setConfig({ ...config, mcampEnrollment: !config.mcampEnrollment })} className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.mcampEnrollment ? 'bg-brand-blue' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.mcampEnrollment ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* STORE DISCOUNT SETTINGS */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Store Discount (Pro Users)</h3>

                        <div className="flex items-start justify-between p-4 bg-orange-50/50 rounded-xl border border-orange-100">
                            <div className="space-y-1">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Tag size={18} className="text-orange-500" /> Enable Pro Discount</h3>
                                <p className="text-sm text-gray-500 max-w-md">Automatically apply a discount for all Pro (subscribed) users at checkout.</p>
                            </div>
                            <button type="button" onClick={() => setConfig({ ...config, proDiscountEnabled: !config.proDiscountEnabled })} className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${config.proDiscountEnabled ? 'bg-orange-500' : 'bg-gray-300'}`}>
                                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-sm transition-transform duration-300 ${config.proDiscountEnabled ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>

                        {config.proDiscountEnabled && (
                            <div className="bg-orange-50/30 p-4 rounded-xl border border-orange-100 animate-slide-down">
                                <div className="flex items-center gap-4">
                                    <div className="flex-1 space-y-1">
                                        <label className="text-sm font-bold text-gray-700">Discount Percentage (%)</label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            value={config.proDiscountPercentage}
                                            onChange={(e) => {
                                                const next = clampPercentage(Number(e.target.value));
                                                setConfig({ ...config, proDiscountPercentage: next });
                                            }}
                                            className="w-full px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-orange-500"
                                            placeholder="e.g. 10"
                                        />
                                    </div>
                                    <div className="text-2xl font-bold text-orange-600 pt-6">
                                        {config.proDiscountPercentage}%
                                    </div>
                                </div>
                                <p className="text-xs text-gray-400 mt-2 italic">Note: This will be combined with any coupon codes the user provides.</p>
                            </div>
                        )}
                    </div>



                    {/* ACADEMIC YEARS SETTINGS */}
                    <div className="space-y-4 pt-4 border-t border-gray-100">
                        <h3 className="font-bold text-gray-400 uppercase text-xs tracking-wider">Academic Years Management</h3>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 space-y-4">
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={newYearInput}
                                    onChange={(e) => setNewYearInput(e.target.value)}
                                    placeholder="Add custom year (e.g., Year 5)"
                                    className="flex-1 px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:border-brand-blue"
                                    onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addYear())}
                                />
                                <button
                                    type="button"
                                    onClick={addYear}
                                    className="bg-brand-dark text-white px-4 py-2 rounded-lg font-bold hover:bg-black transition-colors"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {config.academicYears && config.academicYears.map((year, idx) => (
                                    <div key={idx} className="bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-2">
                                        {year}
                                        <button
                                            type="button"
                                            onClick={() => removeYear(year)}
                                            className="text-gray-400 hover:text-red-500"
                                        >
                                            <AlertTriangle size={14} className="rotate-180" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <p className="text-xs text-gray-400">These options will appear in the Onboarding flow.</p>
                        </div>
                    </div>

                    {/* ANNOUNCEMENT */}
                    <div className="space-y-2 pt-4 border-t border-gray-100">
                        <label className="text-sm font-bold text-gray-700 flex items-center gap-2"><Bell size={16} /> Global Announcement Banner</label>
                        <textarea
                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl h-24 resize-none transition-all focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/10"
                            placeholder="Enter a message to display at the top of the user dashboard..."
                            value={config.announcement}
                            onChange={e => setConfig({ ...config, announcement: e.target.value })}
                        />
                        <p className="text-xs text-gray-400">Leave empty to disable the banner.</p>
                    </div>

                    <div className="pt-4 border-t border-gray-100 flex justify-end">
                        <button type="submit" disabled={isLoading} className="bg-brand-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/30 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed">
                            {isLoading ? 'Saving...' : <><Save size={18} /> Save Changes</>}
                        </button>
                    </div>
                </form >
            )}

            {/* NOTIFICATIONS TAB */}
            {
                activeTab === 'notifications' && (
                    <form onSubmit={handleSendNotification} className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 space-y-8 animate-fade-in">
                        <div className="space-y-1 border-b border-gray-100 pb-4">
                            <h3 className="font-bold text-gray-800 text-lg">Broadcast Notification</h3>
                            <p className="text-sm text-gray-500">Send a message to all user dashboards.</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Target Audience</label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                    value={notifData.target}
                                    onChange={e => setNotifData({ ...notifData, target: e.target.value })}
                                >
                                    <option value="all">All Users</option>
                                    <option value="Year 1">100L / Year 1</option>
                                    <option value="Year 2">200L / Year 2</option>
                                    <option value="Year 3">300L / Year 3</option>
                                    <option value="Year 4">400L / Year 4</option>
                                    <option value="Year 5">500L / Year 5</option>
                                    <option value="Year 6">600L / Year 6</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Notification Title</label>
                                <input
                                    required
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold"
                                    placeholder="e.g. New Course Available!"
                                    value={notifData.title}
                                    onChange={e => setNotifData({ ...notifData, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Type</label>
                                <select
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                    value={notifData.type}
                                    onChange={e => setNotifData({ ...notifData, type: e.target.value })}
                                >
                                    <option value="info">Information (Blue)</option>
                                    <option value="success">Success (Green)</option>
                                    <option value="warning">Warning (Yellow)</option>
                                    <option value="error">Urgent (Red)</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-700">Message Content</label>
                            <textarea
                                required
                                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl h-32 resize-none"
                                placeholder="Type your message here..."
                                value={notifData.message}
                                onChange={e => setNotifData({ ...notifData, message: e.target.value })}
                            />
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button type="submit" disabled={isLoading} className="bg-brand-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/30 flex items-center gap-2">
                                {isLoading ? 'Sending...' : <><Send size={18} /> Send Broadcast</>}
                            </button>
                        </div>
                    </form>
                )
            }

            {/* SECURITY TAB */}
            {
                activeTab === 'security' && (
                    <form onSubmit={handleUpdateProfile} className="bg-white rounded-[1.5rem] p-8 shadow-sm border border-gray-100 space-y-8 animate-fade-in">
                        <div className="space-y-6">
                            <div className="space-y-4 border-b border-gray-100 pb-6">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-700 uppercase tracking-wide">
                                    <Camera size={16} />
                                    Profile Photo
                                </div>
                                <div className="flex items-center gap-6 flex-wrap">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePhotoChange}
                                    />
                                    <div
                                        className="relative rounded-full overflow-hidden w-20 h-20 border-4 border-gray-100 shadow-lg cursor-pointer group"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        {photoPreview ? (
                                            <img
                                                src={photoPreview}
                                                alt="Admin"
                                                className="w-full h-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-full h-full bg-brand-yellow text-brand-dark flex items-center justify-center text-2xl font-black">
                                                {(user?.displayName || user?.email || 'A').charAt(0)}
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Camera size={22} className="text-white" />
                                        </div>
                                    </div>
                                    <div className="text-sm space-y-1">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="text-brand-blue font-bold text-xs uppercase tracking-wide hover:text-brand-dark transition-colors"
                                        >
                                            {isPhotoProcessing ? 'Processing...' : 'Upload Photo'}
                                        </button>
                                        <p className={`${photoError ? 'text-red-500' : 'text-gray-400'}`}>
                                            {photoError || 'PNG, JPG or GIF. Max 5MB.'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Display Name</label>
                                <input
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                    value={displayName}
                                    onChange={e => setDisplayName(e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-bold text-gray-700">Email Address</label>
                                <input disabled className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-500 cursor-not-allowed" value={user?.email || ''} />
                                <p className="text-xs text-gray-400 flex items-center gap-1"><Lock size={12} /> Email cannot be changed here.</p>
                            </div>

                            <div className="pt-6 border-t border-gray-100 space-y-6">
                                <h3 className="font-bold text-gray-800 flex items-center gap-2"><Lock size={18} /> Change Password</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">New Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                            placeholder="Min. 6 characters"
                                            value={passwordData.newPassword}
                                            onChange={e => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Confirm Password</label>
                                        <input
                                            type="password"
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl"
                                            placeholder="Repeat password"
                                            value={passwordData.confirmPassword}
                                            onChange={e => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-gray-100 flex justify-end">
                            <button
                                type="submit"
                                disabled={isLoading || isPhotoProcessing}
                                className={`px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg ${isLoading || isPhotoProcessing
                                    ? 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
                                    : 'bg-gray-800 text-white hover:bg-black shadow-gray-400/20'
                                    }`}
                            >
                                {isLoading ? 'Updating...' : isPhotoProcessing ? 'Processing...' : <><Save size={18} /> Update Profile</>}
                            </button>
                        </div>
                    </form>
                )
            }
        </div >
    );
};

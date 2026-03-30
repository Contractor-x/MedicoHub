import * as React from 'react';
import { User, Notification } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import {
    AlertCircle, AlertTriangle, BookOpen, Building2, Calendar, Camera, Check, ChevronDown, ChevronRight, Edit2, GraduationCap, Lock, LogOut, Mail, MapPin, Phone, Plus, Save, Trash2, User as UserIcon, X, Zap, Star
} from 'lucide-react';
import { api } from '../services/api';
import { StatusModal, ModalType } from '../components/StatusModal';
import { useAuth } from '../context/AuthContext';

interface ProfileProps {
    user: User;
    onUpdate: (data: Partial<User>) => void;
    onLogout: () => void;
    onDeleteAccount?: () => void;
    notifications?: Notification[];
    onMarkAllRead?: () => void;
    onClearNotification?: (id: string) => void;
    onClearAll?: () => void;
}

const NIGERIAN_MEDICAL_SCHOOLS = [
    "University of Lagos (UNILAG)",
    "University of Ibadan (UI)",
    "Obafemi Awolowo University (OAU)",
    "Ahmadu Bello University (ABU)",
    "University of Nigeria, Nsukka (UNN)",
    "University of Benin (UNIBEN)",
    "Lagos State University (LASU)",
    "University of Ilorin (UNILORIN)",
    "Nnamdi Azikiwe University (UNIZIK)",
    "University of Port Harcourt (UNIPORT)",
    "University of Calabar (UNICAL)",
    "University of Jos (UNIJOS)",
    "Bayero University Kano (BUK)",
    "Usman Danfodio University, Sokoto (UDUS)",
    "University of Maiduguri (UNIMAID)",
    "Ladoke Akintola University of Technology (LAUTECH)",
    "Olabisi Onabanjo University (OOU)",
    "Ambrose Alli University (AAU)",
    "Abia State University (ABSU)",
    "Delta State University (DELSU)",
    "Ebonyi State University (EBSU)",
    "Niger Delta University (NDU)",
    "Benue State University (BSU)",
    "Imo State University (IMSU)",
    "Enugu State University of Science and Technology (ESUT)",
    "Kaduna State University (KASU)",
    "Kogi State University (KSU)",
    "Kwara State University (KWASU)",
    "Ekiti State University (EKSU)",
    "Osun State University (UNIOSUN)",
    "Babcock University",
    "Igbinedion University",
    "Madonna University",
    "Bowen University",
    "Afe Babalola University (ABUAD)",
    "Bingham University",
    "Nile University of Nigeria",
    "Gregory University, Uturu",
    "PAMO University of Medical Sciences",
    "Eko University of Medicine and Health Sciences",
    "University of Abuja",
    "Gombe State University",
    "Rivers State University",
    "Chukwuemeka Odumegwu Ojukwu University"
];

const PREDEFINED_COURSES = [
    'Gross Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology',
    'Microbiology', 'Immunology', 'Internal Medicine', 'General Surgery', 'Pediatrics',
    'Obstetrics & Gynecology', 'Psychiatry', 'Neurology', 'Cardiology', 'Dermatology',
    'Orthopedics', 'Ophthalmology', 'ENT', 'Radiology', 'Anesthesiology',
    'Public Health', 'Embryology', 'Histology', 'Genetics', 'Neuroscience',
    'Clinical Skills', 'Medical Ethics', 'Hematology', 'Oncology'
];

export const Profile: React.FC<ProfileProps> = ({
    user,
    onUpdate,
    onLogout,
    notifications,
    onMarkAllRead,
    onDeleteAccount,
    onClearNotification,
    onClearAll
}) => {
    const { resetPassword } = useAuth();
    const [isResetting, setIsResetting] = React.useState(false);
    // Initialize state, parsing the single 'name' string if specific fields don't exist yet
    const [formData, setFormData] = React.useState({
        firstName: user.firstName || (user.name ? user.name.split(' ')[0] : '') || '',
        surname: user.surname || (user.name ? user.name.split(' ').slice(1).join(' ') : '') || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        schoolName: user.schoolName || '',
        year: user.year,
        weakness: user.weakness || [],
        currentCourses: user.currentCourses || [],
    });

    const [courseInput, setCourseInput] = React.useState('');
    const [isCourseDropdownOpen, setIsCourseDropdownOpen] = React.useState(false);
    const courseDropdownRef = React.useRef<HTMLDivElement>(null);

    // School Dropdown
    const [isSchoolDropdownOpen, setIsSchoolDropdownOpen] = React.useState(false);
    const schoolDropdownRef = React.useRef<HTMLDivElement>(null);

    const [verificationPendingMsg, setVerificationPendingMsg] = React.useState<string | null>(null);

    const [modalConfig, setModalConfig] = React.useState<{ isOpen: boolean; title: string; message: string; type: ModalType }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'success'
    });

    const [isSaved, setIsSaved] = React.useState(false);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const [years, setYears] = React.useState(['Year 2', 'Year 3', 'Year 4']);

    React.useEffect(() => {
        const fetchYears = async () => {
            try {
                const data = await api.settings.get();
                if (data && data.academicYears && Array.isArray(data.academicYears)) {
                    setYears(data.academicYears);
                }
            } catch (error) {
                console.error("Failed to fetch academic years from MongoDB:", error);
            }
        };
        fetchYears();
    }, []);
    const subjects = ['Anatomy', 'Physiology', 'Biochemistry', 'Pathology', 'Pharmacology', 'Cardiology'];

    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (courseDropdownRef.current && !courseDropdownRef.current.contains(event.target as Node)) {
                setIsCourseDropdownOpen(false);
            }
            if (schoolDropdownRef.current && !schoolDropdownRef.current.contains(event.target as Node)) {
                setIsSchoolDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        // Construct the full name for backward compatibility with other components
        const fullName = `${formData.firstName} ${formData.surname} `.trim();

        // Logic to split update if year is changed
        const updates: any = { ...formData, name: fullName };
        const isYearChanged = formData.year !== user.year;

        if (isYearChanged) {
            // Do NOT update 'year' directly
            delete updates.year;
            // Add 'requestedYear'
            updates.requestedYear = formData.year;
        }

        onUpdate(updates);

        if (isYearChanged) {
            setModalConfig({
                isOpen: true,
                title: 'Request Sent',
                message: `Upgrade request to ${formData.year} sent to Admin for approval.`,
                type: 'info'
            });
        }

        // Check for Year Upgrade/Change
        if (formData.year !== user.year) {
            // Send Alert to Admin via MongoDB API
            try {
                // If we have an admin specifically, we can target them, or just broadcast to 'admin' category
                // Our new API has broadcast which takes target.
                api.notifications.broadcast({
                    title: 'User Profile Upgrade Request',
                    message: `${fullName} (${user.email}) requested to change their year from ${user.year || 'None'} to ${formData.year}.`,
                    type: 'alert',
                    category: 'system',
                    target: 'admin',
                    userId: user.uid || user.id,
                    icon: 'AlertTriangle'
                } as any);
            } catch (error) {
                console.error("Failed to send admin alert to MongoDB:", error);
            }
        }

        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000);
    };

    const toggleWeakness = (subject: string) => {
        setFormData(prev => ({
            ...prev,
            weakness: prev.weakness.includes(subject)
                ? prev.weakness.filter(w => w !== subject)
                : [...prev.weakness, subject]
        }));
    };

    const addCourse = (courseName: string) => {
        const trimmedName = courseName.trim();
        if (trimmedName && !formData.currentCourses.includes(trimmedName)) {
            setFormData(prev => ({
                ...prev,
                currentCourses: [...prev.currentCourses, trimmedName]
            }));
            setCourseInput('');
            setIsCourseDropdownOpen(false);
        }
    };

    const removeCourse = (courseToRemove: string) => {
        setFormData(prev => ({
            ...prev,
            currentCourses: prev.currentCourses.filter(c => c !== courseToRemove)
        }));
    };

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (e.g. > 2MB warn user)
            if (file.size > 5 * 1024 * 1024) {
                setModalConfig({
                    isOpen: true,
                    title: 'File Too Large',
                    message: 'Please select an image under 5MB.',
                    type: 'error'
                });
                return;
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    // Resize to manageable dimensions (e.g., 400x400 max)
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx?.drawImage(img, 0, 0, width, height);

                    // Compress to JPEG 0.7 quality
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.7);

                    onUpdate({ profileImage: dataUrl });
                };
                img.src = e.target?.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    const handleYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedYear = e.target.value;
        if (selectedYear !== user.year) {
            setVerificationPendingMsg("Pending verification, a verification email will be sent to you.");
        } else {
            setVerificationPendingMsg(null);
        }
        setFormData({ ...formData, year: selectedYear });
    };

    // Filter courses
    const filteredCourses = PREDEFINED_COURSES.filter(
        c => c.toLowerCase().includes(courseInput.toLowerCase()) &&
            !formData.currentCourses.includes(c)
    );

    // Check if input matches exactly any existing course (case insensitive) to avoid duplicate manual entry options
    const exactMatch = filteredCourses.some(c => c.toLowerCase() === courseInput.trim().toLowerCase());
    const showManualOption = courseInput.trim().length > 0 && !exactMatch;

    // Schools Filter
    const filteredSchools = NIGERIAN_MEDICAL_SCHOOLS.filter(
        s => s.toLowerCase().includes(formData.schoolName.toLowerCase())
    );

    const handlePasswordReset = async () => {
        setIsResetting(true);
        try {
            await resetPassword(user.email);
            setModalConfig({
                isOpen: true,
                title: 'Reset Link Sent',
                message: `We've sent a password reset link to ${user.email}. Please check your inbox.`,
                type: 'success'
            });
        } catch (error: any) {
            setModalConfig({
                isOpen: true,
                title: 'Error',
                message: error.message || 'Failed to send reset link.',
                type: 'error'
            });
        } finally {
            setIsResetting(false);
        }
    };

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
            <StatusModal
                isOpen={modalConfig.isOpen}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onClose={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
            />
            <div className="max-w-4xl mx-auto animate-fade-in-up">


                <div className="mb-8">
                    <h1 className="text-3xl font-extrabold text-brand-dark">My Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your personal details and academic progress.</p>
                </div>

                <form onSubmit={handleSave} className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-8 space-y-8">
                    {/* Profile Image Section */}
                    <div className="flex flex-col items-center sm:items-start border-b border-gray-50 pb-8">
                        <label className="block text-sm font-bold text-gray-700 mb-4">Profile Photo</label>
                        <div className="flex items-center gap-6">
                            <input
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                            <div
                                className="relative group cursor-pointer"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                {user.profileImage ? (
                                    <img
                                        src={user.profileImage}
                                        alt="Profile"
                                        className="w-24 h-24 rounded-full object-cover border-4 border-gray-50 shadow-lg"
                                    />
                                ) : (
                                    <div className="w-24 h-24 rounded-full bg-brand-yellow text-brand-dark flex items-center justify-center text-3xl font-extrabold shadow-lg overflow-hidden">
                                        {user.name.charAt(0)}
                                    </div>
                                )}

                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Camera className="text-white" />
                                </div>
                            </div>
                            <div>
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="text-sm font-bold text-brand-blue hover:text-brand-dark transition-colors"
                                >
                                    Change Photo
                                </button>
                                <p className="text-xs text-gray-400 mt-1">Accepts JPG, PNG or GIF</p>
                            </div>
                        </div>
                    </div>

                    {/* MCAMP ID DISPLAY */}
                    {(user.mcamp?.isEnrolled || !!user.mcampId) && (
                        <div className="pt-6 border-t border-gray-50">
                            <h3 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                                <Zap size={20} className="text-brand-yellow" fill="currentColor" />
                                MCAMP Enrollment
                            </h3>
                            <div className="bg-gradient-to-br from-brand-dark to-blue-900 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Your Unique ID</p>
                                        <h4 className="text-3xl font-black text-brand-yellow font-mono tracking-tighter">MC-{user.mcamp?.uniqueId || user.mcampId}</h4>
                                        <div className="flex items-center gap-2 mt-3">
                                            <span className="px-2 py-0.5 bg-green-500/20 text-green-400 rounded text-[10px] font-extrabold uppercase tracking-wide border border-green-500/30">Active Member</span>
                                            <span className="text-xs text-gray-400 font-bold">Cohort: {user.mcamp?.cohortId || 'Not Set'}</span>
                                        </div>
                                    </div>
                                    <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                                        <Star size={32} className="text-brand-yellow" fill="currentColor" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Personal Information */}
                    <div>
                        <h3 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                            <UserIcon size={20} className="text-gray-400" />
                            Personal Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={formData.firstName}
                                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    placeholder="e.g. John"
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Surname</label>
                                <input
                                    type="text"
                                    value={formData.surname}
                                    onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
                                    placeholder="e.g. Doe"
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        placeholder="john@example.com"
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="tel"
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="+234..."
                                        className="w-full pl-12 pr-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Academic Information */}
                    <div className="pt-6 border-t border-gray-50">
                        <h3 className="text-lg font-bold text-brand-dark mb-4 flex items-center gap-2">
                            <BookOpen size={20} className="text-gray-400" />
                            Academic Details
                        </h3>

                        <div className="space-y-6">
                            <div ref={schoolDropdownRef}>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Medical School</label>
                                <div className="relative">
                                    <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                    <input
                                        type="text"
                                        value={formData.schoolName}
                                        onChange={(e) => {
                                            setFormData({ ...formData, schoolName: e.target.value });
                                            setIsSchoolDropdownOpen(true);
                                        }}
                                        onFocus={() => setIsSchoolDropdownOpen(true)}
                                        placeholder="Search or type your school..."
                                        className="w-full pl-12 pr-10 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setIsSchoolDropdownOpen(!isSchoolDropdownOpen)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
                                    >
                                        <ChevronDown size={20} />
                                    </button>

                                    {/* School Dropdown */}
                                    {isSchoolDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 max-h-60 overflow-y-auto animate-fade-in-up">
                                            {filteredSchools.map((school) => (
                                                <button
                                                    key={school}
                                                    type="button"
                                                    onClick={() => {
                                                        setFormData({ ...formData, schoolName: school });
                                                        setIsSchoolDropdownOpen(false);
                                                    }}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-50 last:border-0 block"
                                                >
                                                    {school}
                                                </button>
                                            ))}
                                            {filteredSchools.length === 0 && (
                                                <div className="px-4 py-3 text-gray-400 text-sm italic">
                                                    No matches. You can continue typing to add manually.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Current Academic Year</label>
                                <select
                                    value={formData.year}
                                    onChange={handleYearChange}
                                    className="w-full px-4 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                                >
                                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                                </select>
                                {verificationPendingMsg && (
                                    <div className="mt-3 flex items-start gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg text-sm font-medium animate-fade-in-up">
                                        <AlertCircle size={16} className="mt-0.5 shrink-0" />
                                        {verificationPendingMsg}
                                    </div>
                                )}
                            </div>

                            {/* Current Courses */}
                            <div ref={courseDropdownRef}>
                                <label className="block text-sm font-bold text-gray-700 mb-2">Current Courses Enrolled</label>
                                <div className="relative">
                                    <div className="flex gap-2 mb-3">
                                        <div className="relative flex-grow">
                                            <input
                                                type="text"
                                                value={courseInput}
                                                onChange={(e) => {
                                                    setCourseInput(e.target.value);
                                                    setIsCourseDropdownOpen(true);
                                                }}
                                                onFocus={() => setIsCourseDropdownOpen(true)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        e.preventDefault();
                                                        addCourse(courseInput);
                                                    }
                                                }}
                                                placeholder="Search or add a course (e.g. Gross Anatomy)"
                                                className="w-full pl-4 pr-10 py-3 bg-gray-50 border-transparent rounded-xl focus:bg-white focus:ring-2 focus:ring-brand-blue/20 transition-all font-medium"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setIsCourseDropdownOpen(!isCourseDropdownOpen)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-brand-dark"
                                            >
                                                <ChevronDown size={20} />
                                            </button>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => addCourse(courseInput)}
                                            className="bg-brand-dark text-white px-4 rounded-xl hover:bg-black transition-colors"
                                        >
                                            <Plus size={20} />
                                        </button>
                                    </div>

                                    {/* Dropdown Menu */}
                                    {isCourseDropdownOpen && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-xl border border-gray-100 z-20 max-h-60 overflow-y-auto animate-fade-in-up">
                                            {filteredCourses.map(course => (
                                                <button
                                                    key={course}
                                                    type="button"
                                                    onClick={() => addCourse(course)}
                                                    className="w-full text-left px-4 py-3 hover:bg-gray-50 font-medium text-gray-700 border-b border-gray-50 last:border-0 flex justify-between items-center group"
                                                >
                                                    {course}
                                                    <Plus size={16} className="text-gray-300 group-hover:text-brand-blue" />
                                                </button>
                                            ))}

                                            {showManualOption && (
                                                <button
                                                    type="button"
                                                    onClick={() => addCourse(courseInput)}
                                                    className="w-full text-left px-4 py-3 hover:bg-blue-50 font-medium text-brand-blue border-t border-gray-100 flex items-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    Add "{courseInput}" manually
                                                </button>
                                            )}

                                            {filteredCourses.length === 0 && !showManualOption && (
                                                <div className="px-4 py-3 text-gray-400 text-sm italic">
                                                    No courses found. Type to add manually.
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {formData.currentCourses.map((course, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-blue-50 text-brand-blue px-3 py-1.5 rounded-lg font-bold text-sm">
                                            {course}
                                            <button
                                                type="button"
                                                onClick={() => removeCourse(course)}
                                                className="hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    ))}
                                    {formData.currentCourses.length === 0 && (
                                        <p className="text-sm text-gray-400 italic">No courses added yet.</p>
                                    )}
                                </div>
                            </div>

                            {/* Weaknesses / Focus Areas */}
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-4">Focus Areas (Weaknesses)</label>
                                <div className="flex flex-wrap gap-2">
                                    {subjects.map(subject => (
                                        <button
                                            key={subject}
                                            type="button"
                                            onClick={() => toggleWeakness(subject)}
                                            className={`px-4 py-2 rounded-full text-sm font-bold transition-all border ${formData.weakness.includes(subject)
                                                ? 'bg-red-50 text-red-600 border-red-100'
                                                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
                                                }`}
                                        >
                                            {subject}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Bar */}
                    <div className="pt-6 border-t border-gray-50 flex items-center justify-end gap-4 sticky bottom-0 bg-white/95 backdrop-blur py-4">
                        {isSaved && <span className="text-green-600 text-sm font-bold flex items-center gap-1 animate-fade-in-up"><Check size={16} /> Saved Successfully</span>}
                        <div className="flex items-center gap-4">

                            <button
                                type="submit"
                                className="bg-brand-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-all flex items-center gap-2 shadow-lg shadow-brand-dark/20"
                            >
                                <Save size={18} />
                                Save Changes
                            </button>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-gray-50">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gray-50 p-6 rounded-2xl border border-gray-100 mb-8">
                            <div>
                                <h4 className="font-bold text-brand-dark">Account Security</h4>
                                <p className="text-sm text-gray-500">Need to update your password? We can send you a secure reset link.</p>
                            </div>
                            <button
                                type="button"
                                disabled={isResetting}
                                onClick={handlePasswordReset}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-brand-dark font-bold rounded-xl hover:bg-gray-100 transition-all flex items-center gap-2"
                            >
                                <Lock size={16} />
                                {isResetting ? 'Sending...' : 'Reset Password'}
                            </button>
                        </div>

                        <button
                            type="button"
                            onClick={onLogout}
                            className="text-red-500 font-bold text-sm flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                        >
                            <LogOut size={18} />
                            Log Out from all devices
                        </button>
                    </div>

                </form>
            </div>
        </DashboardLayout>
    );
};
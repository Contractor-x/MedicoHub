
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, Plus, FileText, Video, CheckCircle, X, Trash2, Upload, Database, HelpCircle, AlertCircle, Image as ImageIcon } from 'lucide-react';
import { api } from '../services/api';

const DEMO_RESOURCES = [
    { title: 'Cardiology: Valve Disorders', type: 'Video', subject: 'Cardiology', tags: ['Cardiology', 'Year 2'], isPro: true, isMcampExclusive: false, url: 'https://www.youtube.com/watch?v=dummy1', isYoutube: true },
    { title: 'Krebs Cycle Mnemonics', type: 'PDF', subject: 'Biochemistry', tags: ['Biochemistry', 'Year 1'], isPro: false, isMcampExclusive: false, url: 'https://example.com/dummy.pdf', isYoutube: false },
    {
        title: 'Comprehensive Anatomy Quiz',
        type: 'Quiz',
        subject: 'Anatomy',
        tags: ['Anatomy', 'Year 1'],
        isPro: true,
        isMcampExclusive: false,
        url: '#',
        isYoutube: false,
        quizData: [
            { id: 'q1', type: 'single', text: 'Which nerve innervates the diaphragm?', options: ['Phrenic', 'Vagus', 'Sciatic', 'Median'], correctIndex: 0 },
            { id: 'q2', type: 'multiple', text: 'Select all bones in the upper limb.', options: ['Femur', 'Humerus', 'Radius', 'Tibia'], correctIndices: [1, 2] },
            { id: 'q3', type: 'text', text: 'Name the main artery produced by the left ventricle.', options: [], correctText: 'Aorta' }
        ]
    }
];

const INITIAL_FORM = {
    title: '',
    type: 'Video',
    subject: '',
    tags: '',
    isPro: false,
    isMcamp: false,
    url: '',
    thumbnailUrl: '',
    embedCode: '',
    videoSource: 'url', // 'url' | 'file' | 'embed'
    year: ''
};

interface Question {
    id: string;
    type: 'single' | 'multiple' | 'text' | 'multi-text';
    text: string;
    imageUrl?: string;
    options: string[];
    correctIndex: number;      // For 'single'
    correctIndices: number[];  // For 'multiple'
    correctText: string;       // For 'text' (Fill in the blank)
    correctTexts?: string[];   // For 'multi-text'
}

export const ResourcesPage = () => {
    const [resources, setResources] = useState<any[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [file, setFile] = useState<File | null>(null);
    const [editingId, setEditingId] = useState<string | null>(null);

    const [formData, setFormData] = useState(INITIAL_FORM);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [uploadingQId, setUploadingQId] = useState<string | null>(null);
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [academicYears, setAcademicYears] = useState<string[]>(['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5', 'Year 6']);

    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('All');
    const [filterAccess, setFilterAccess] = useState('All');

    const filteredResources = resources.filter(res => {
        const matchesSearch = (res.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (res.subject || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchesType = filterType === 'All' || res.type === filterType;

        let matchesAccess = true;
        if (filterAccess === 'Pro') matchesAccess = res.isPro === true;
        else if (filterAccess === 'Free') matchesAccess = !res.isPro && !res.isMcampExclusive;
        else if (filterAccess === 'MCAMP') matchesAccess = res.isMcampExclusive === true;

        return matchesSearch && matchesType && matchesAccess;
    });

    useEffect(() => {
        fetchResources();
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const settings = await api.settings.get();
            if (settings.academicYears && Array.isArray(settings.academicYears)) {
                setAcademicYears(settings.academicYears);
            }
        } catch (error) {
            console.error("Failed to load settings", error);
        }
    };

    const [error, setError] = useState<string | null>(null);

    const fetchResources = async () => {
        try {
            setError(null);
            const data = await api.resources.getAll();
            const list = Array.isArray(data) ? data : ((data as any).data || []);
            setResources(list);
        } catch (error: any) {
            console.error("Failed to fetch resources", error);
            setError(`Failed to load resources: ${error.message || 'Unknown error'}`);
        }
    };

    const handleEdit = (res: any) => {
        const tags = Array.isArray(res.tags) ? res.tags.join(', ') : (res.tags || '');
        setFormData({
            title: res.title || '',
            type: res.type || 'Video',
            subject: res.subject || '',
            tags: tags,
            isPro: res.isPro || false,
            isMcamp: res.isMcampExclusive || false,
            url: res.url || '',
            thumbnailUrl: res.thumbnailUrl || '',
            embedCode: res.embedCode || '',
            videoSource: res.embedCode ? 'embed' : (res.url ? 'url' : 'file'),
            year: res.year || ''
        });

        let loadedQuestions: Question[] = [];
        if (res.type === 'Quiz' && res.quizData && Array.isArray(res.quizData)) {
            // Map legacy props if needed
            loadedQuestions = res.quizData.map((q: any) => ({
                id: q.id || Date.now().toString() + Math.random(),
                type: q.type || 'single',
                text: q.text || '',
                imageUrl: q.imageUrl || '',
                options: q.options || ['', '', '', ''],
                correctIndex: q.correctIndex || 0,
                correctIndices: q.correctIndices || [],
                correctText: q.correctText || '',
                correctTexts: q.correctTexts || []
            }));
        }
        setQuestions(loadedQuestions);

        setEditingId(res.id || res._id);
        setIsModalOpen(true);
        fetchSettings(); // Refresh settings when opening edit modal
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingId(null);
        setFormData(INITIAL_FORM);
        setFile(null);
        setQuestions([]);
    };

    // Quiz Builder Helpers
    const addQuestion = () => {
        setQuestions(prev => [...prev, {
            id: Date.now().toString(),
            type: 'single',
            text: '',
            imageUrl: '',
            options: ['', '', '', ''],
            correctIndex: 0,
            correctIndices: [],
            correctText: '',
            correctTexts: []
        }]);
    };

    const updateQuestion = (id: string, field: keyof Question, value: any) => {
        setQuestions(prev => prev.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const updateOption = (qId: string, optIdx: number, value: string) => {
        setQuestions(prev => prev.map(q => {
            if (q.id === qId) {
                const newOpts = [...q.options];
                newOpts[optIdx] = value;
                return { ...q, options: newOpts };
            }
            return q;
        }));
    };

    const removeQuestion = (id: string) => {
        setQuestions(prev => prev.filter(q => q.id !== id));
    };

    // Image Upload per question
    const handleQuestionImageUpload = async (qId: string, file: File) => {
        if (!file) return;
        setUploadingQId(qId);
        try {
            const url = await api.files.upload(file);
            updateQuestion(qId, 'imageUrl', url);
        } catch (e) {
            console.error("Failed to upload question image", e);
            alert("Image upload failed");
        } finally {
            setUploadingQId(null);
        }
    };

    const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            try {
                const url = await api.files.upload(file);
                setFormData(prev => ({ ...prev, thumbnailUrl: url }));
            } catch (error) {
                console.error("Error uploading thumbnail:", error);
                alert("Failed to upload thumbnail");
            }
        }
    };

    const [showLimitModal, setShowLimitModal] = useState(false);
    const [limitError, setLimitError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        if (formData.type === 'Quiz') {
            if (questions.length === 0) {
                alert("Please add at least one question to the quiz.");
                return;
            }
            for (const q of questions) {
                if (!q.text.trim()) { alert("All questions must have text."); return; }
                if (q.type !== 'text' && q.type !== 'multi-text' && q.options.some(o => !o.trim())) { alert("All options must be filled."); return; }
                if (q.type === 'text' && !q.correctText.trim()) { alert("Short Answer questions must have a correct answer."); return; }
                if (q.type === 'multi-text' && (!q.correctTexts || q.correctTexts.length === 0 || q.correctTexts.some(t => !t.trim()))) { alert("Multiple Fill in Blank questions must have at least one valid answer."); return; }
                if (q.type === 'multiple' && q.correctIndices.length === 0) { alert("Select at least one correct option for multiple choice."); return; }
            }
        } else {
            if (!editingId && !file && !formData.url) {
                alert("Please provide a URL or upload a file.");
                return;
            }
        }

        setIsLoading(true);
        try {
            let downloadUrl = formData.url;

            if (file) {
                downloadUrl = await api.files.upload(file);
            }

            const payload: any = {
                title: formData.title,
                type: formData.type,
                subject: formData.subject,
                tags: [...(formData.tags ? String(formData.tags).split(',').map(t => t.trim()).filter(Boolean) : []), formData.year, (formData.isMcamp ? 'MCAMP' : '')].filter(Boolean),
                year: formData.year,
                isPro: formData.isPro,
                isMcampExclusive: formData.isMcamp,
                url: formData.videoSource === 'embed' ? '' : (downloadUrl || (formData.type === 'Quiz' ? 'internal://quiz' : '')),
                embedCode: formData.videoSource === 'embed' ? formData.embedCode : '',
                thumbnailUrl: formData.thumbnailUrl,
                courseId: 'general',
                moduleId: 'general',
                isYoutube: (downloadUrl || formData.url || '').includes('youtube') || (downloadUrl || formData.url || '').includes('youtu.be')
            };

            if (payload.isMcampExclusive && !payload.year) {
                alert("A Target Year MUST be selected for MCAMP resources to be visible to students.");
                setIsLoading(false);
                return;
            }

            if (formData.type === 'Quiz') {
                payload.quizData = questions;
            }

            if (editingId) {
                await api.resources.update(editingId, payload);
            } else {
                await api.resources.create(payload);
            }

            await fetchResources();
            handleCloseModal();
            alert("Resource saved successfully!");
        } catch (error: any) {
            console.error("Failed to save resource", error);

            // Extract detailed error messages from the backend response
            const msg = error.details ? error.details.join('\n') : (error.message || "Unknown error");

            if (msg.includes("too large") || msg.includes("25MB")) {
                setLimitError(msg);
                setShowLimitModal(true);
            } else {
                alert(`Failed to save:\n${msg}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleDelete = (id: string) => {
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setIsLoading(true);
        try {
            await api.resources.delete(deleteId);
            await fetchResources();
            setDeleteId(null);
        } catch (error) {
            console.error("Failed to delete", error);
            alert("Failed to delete resource");
        } finally {
            setIsLoading(false);
        }
    };

    const handleSeedDefaults = async () => {
        if (!window.confirm("Load default demo resources?")) return;
        setIsLoading(true);
        try {
            for (const d of DEMO_RESOURCES) {
                await api.resources.create({ ...d, courseId: 'general', moduleId: 'general' });
            }
            await fetchResources();
            alert("Default resources loaded successfully!");
        } catch (e) {
            console.error(e);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Learning Content</h1>
                    <p className="text-gray-500 text-sm mt-1">Manage library resources, quizzes, and videos.</p>
                </div>

                <div className="flex flex-col xl:flex-row gap-4 xl:items-center">
                    <button onClick={handleSeedDefaults} className="flex items-center justify-center gap-2 bg-white text-gray-600 border border-gray-200 px-5 py-2.5 rounded-xl font-bold hover:bg-gray-50 transition-all shadow-sm active:scale-95">
                        <Database size={20} /> <span className="hidden xl:inline">Defaults</span>
                    </button>

                    {/* FILTERS */}
                    <div className="flex gap-2">
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-gray-600 focus:outline-none focus:border-brand-blue cursor-pointer"
                        >
                            <option value="All">All Types</option>
                            <option value="Video">Video</option>
                            <option value="PDF">PDF</option>
                            <option value="Quiz">Quiz</option>
                            <option value="Article">Article</option>
                        </select>
                        <select
                            value={filterAccess}
                            onChange={e => setFilterAccess(e.target.value)}
                            className="bg-white border border-gray-200 px-4 py-2.5 rounded-xl font-bold text-gray-600 focus:outline-none focus:border-brand-blue cursor-pointer"
                        >
                            <option value="All">All Access</option>
                            <option value="Free">Free</option>
                            <option value="Pro">Pro Only</option>
                            <option value="MCAMP">MCAMP</option>
                        </select>
                    </div>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="text"
                            placeholder="Search..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 focus:border-brand-blue w-full sm:w-64 bg-white shadow-sm transition-all"
                        />
                    </div>
                    <button onClick={() => {
                        setEditingId(null);
                        setFormData(INITIAL_FORM);
                        setQuestions([]);
                        setIsModalOpen(true);
                        fetchSettings(); // Refresh settings when opening add modal
                    }} className="flex items-center justify-center gap-2 bg-brand-blue text-white px-5 py-2.5 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/30 active:scale-95">
                        <Plus size={20} /> <span className="whitespace-nowrap">Add Resource</span>
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[1.5rem] shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                <th className="px-8 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Resource</th>
                                <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Type</th>
                                <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Target Audience</th>
                                <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider">Access</th>
                                <th className="px-6 py-5 font-bold text-gray-500 text-xs uppercase tracking-wider text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {error && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-10 text-center">
                                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-100 flex items-center justify-center gap-2">
                                            <AlertCircle size={20} />
                                            <span className="font-bold">{error}</span>
                                        </div>
                                    </td>
                                </tr>
                            )}
                            {!error && filteredResources.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-8 py-10 text-center text-gray-400">
                                        No resources found. Try a different search.
                                    </td>
                                </tr>
                            )}
                            {filteredResources.map((res) => (
                                <tr key={res._id || res.id} className="hover:bg-blue-50/50 transition-colors group">
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${res.type === 'Video' ? 'bg-red-100 text-red-600' : res.type === 'Quiz' ? 'bg-purple-100 text-purple-600' : 'bg-brand-blue/10 text-brand-blue'}`}>
                                                {res.type === 'Video' ? <Video size={20} /> : res.type === 'Quiz' ? <HelpCircle size={20} /> : <FileText size={20} />}
                                            </div>
                                            <div>
                                                <span className="font-bold text-brand-dark group-hover:text-brand-blue transition-colors block">{res.title}</span>
                                                <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mt-0.5">{res.subject}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5"><span className={`px-3 py-1 rounded-lg text-xs font-bold ${res.type === 'Quiz' ? 'bg-purple-50 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>{res.type}</span></td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-2 flex-wrap max-w-[200px]">
                                            {res.tags?.map((tag: string) => <span key={tag} className="px-2 py-1 border border-gray-200 text-gray-500 rounded-md text-[10px] font-bold uppercase">{tag}</span>)}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex gap-2">
                                            {res.isPro && <span className="px-2 py-1 bg-brand-dark text-brand-yellow rounded-md text-[10px] font-bold uppercase tracking-wide">Pro Only</span>}
                                            {res.isMcampExclusive && <span className="px-2 py-1 bg-purple-600 text-white rounded-md text-[10px] font-bold uppercase tracking-wide">MCAMP</span>}
                                            {!res.isPro && !res.isMcampExclusive && <span className="px-2 py-1 bg-green-100 text-green-700 rounded-md text-[10px] font-bold uppercase">Free</span>}
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-right">
                                        <div className="flex justify-end gap-3">
                                            <button onClick={() => handleEdit(res)} className="text-gray-400 hover:text-brand-blue transition-colors font-medium text-sm">Edit</button>
                                            <button onClick={() => handleDelete(res._id || res.id)} className="text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL */}
            {isModalOpen && createPortal(
                <div className="fixed inset-0 z-[9999] overflow-y-auto bg-brand-dark/50 backdrop-blur-sm animate-fade-in">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-2xl w-full shadow-2xl relative my-8 animate-pop-in">
                            <button onClick={handleCloseModal} className="absolute top-6 right-6 p-2 hover:bg-gray-100 rounded-full transition-colors"><X size={24} className="text-gray-400" /></button>
                            <div className="mb-6">
                                <h2 className="text-2xl font-bold text-brand-dark">{editingId ? 'Edit Resource' : 'Add New Content'}</h2>
                                <p className="text-gray-500 text-sm mt-1">Configure your learning material.</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Title</label>
                                        <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue transition-all font-medium" placeholder="e.g. Intro to Anatomy" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Type</label>
                                        <select className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue" value={formData.type} onChange={e => { setFormData({ ...formData, type: e.target.value }); if (e.target.value === 'Quiz' && questions.length === 0) addQuestion(); }}>
                                            <option value="Video">Video Lesson</option>
                                            <option value="PDF">PDF Document</option>
                                            <option value="Quiz">Quiz Builder</option>
                                            <option value="Article">Article</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Subject</label>
                                        <input required className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl" placeholder="e.g. Cardiology" value={formData.subject} onChange={e => setFormData({ ...formData, subject: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-gray-700">Target Year</label>
                                        <select
                                            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue"
                                            value={formData.year}
                                            onChange={e => setFormData({ ...formData, year: e.target.value })}
                                        >
                                            <option value="">Select Year...</option>
                                            {academicYears.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {formData.type === 'Quiz' ? (
                                    <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-200">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="font-bold text-brand-dark flex items-center gap-2"><HelpCircle size={18} /> Quiz Questions</h3>
                                            <span className="text-xs text-gray-500 font-bold uppercase">{questions.length} Questions</span>
                                        </div>

                                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                            {questions.map((q, qIndex) => (
                                                <div key={q.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 group relative">
                                                    <button type="button" onClick={() => removeQuestion(q.id)} className="absolute top-2 right-2 text-gray-300 hover:text-red-500 transition-colors p-1"><Trash2 size={16} /></button>

                                                    {/* Question Type & Image */}
                                                    <div className="flex gap-4 mb-3">
                                                        <select
                                                            className="px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-bold uppercase"
                                                            value={q.type}
                                                            onChange={e => updateQuestion(q.id, 'type', e.target.value)}
                                                        >
                                                            <option value="single">Single Choice</option>
                                                            <option value="multiple">Multiple Choice</option>
                                                            <option value="text">Fill in Blank</option>
                                                            <option value="multi-text">Multiple Fill in Blank</option>
                                                        </select>

                                                        <label className={`cursor-pointer transition-colors ${uploadingQId === q.id ? 'text-brand-blue cursor-wait' : 'text-gray-400 hover:text-brand-blue'}`}>
                                                            <input disabled={uploadingQId === q.id} type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                                if (e.target.files?.[0]) handleQuestionImageUpload(q.id, e.target.files[0]);
                                                            }} />
                                                            {uploadingQId === q.id ? (
                                                                <div className="w-5 h-5 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div>
                                                            ) : (
                                                                <ImageIcon size={20} />
                                                            )}
                                                        </label>
                                                    </div>

                                                    {q.imageUrl && (
                                                        <div className="mb-3 relative group/img inline-block">
                                                            <img src={q.imageUrl} alt="Question" className="h-24 rounded-lg border border-gray-200 object-cover" />
                                                            <button type="button" onClick={() => updateQuestion(q.id, 'imageUrl', '')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover/img:opacity-100 transition-opacity"><X size={12} /></button>
                                                        </div>
                                                    )}

                                                    <div className="mb-3 pr-8">
                                                        <input value={q.text} onChange={(e) => updateQuestion(q.id, 'text', e.target.value)} className="w-full px-3 py-2 bg-gray-50 rounded-lg border-transparent focus:bg-white focus:border-brand-blue border focus:ring-2 focus:ring-brand-blue/10 transition-all font-bold placeholder:font-normal" placeholder={`Question ${qIndex + 1}`} />
                                                    </div>

                                                    {/* Answer Section */}
                                                    {q.type === 'text' ? (
                                                        <div>
                                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Correct Answer</label>
                                                            <input
                                                                value={q.correctText}
                                                                onChange={(e) => updateQuestion(q.id, 'correctText', e.target.value)}
                                                                className="w-full px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium"
                                                                placeholder="Enter the correct answer..."
                                                            />
                                                        </div>
                                                    ) : q.type === 'multi-text' ? (
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Correct Answers (ordered)</label>
                                                            {(q.correctTexts || []).map((ans, aIdx) => (
                                                                <div key={aIdx} className="flex gap-2">
                                                                    <input
                                                                        value={ans}
                                                                        onChange={(e) => {
                                                                            const newTexts = [...(q.correctTexts || [])];
                                                                            newTexts[aIdx] = e.target.value;
                                                                            updateQuestion(q.id, 'correctTexts', newTexts);
                                                                        }}
                                                                        className="flex-1 px-3 py-2 bg-green-50 border border-green-200 rounded-lg text-green-800 font-medium"
                                                                        placeholder={`Answer ${aIdx + 1}`}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            const newTexts = (q.correctTexts || []).filter((_, idx) => idx !== aIdx);
                                                                            updateQuestion(q.id, 'correctTexts', newTexts);
                                                                        }}
                                                                        className="text-gray-300 hover:text-red-500"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                onClick={() => updateQuestion(q.id, 'correctTexts', [...(q.correctTexts || []), ''])}
                                                                className="text-xs flex items-center gap-1 text-green-600 font-bold px-2 py-1 hover:bg-green-50 rounded w-fit"
                                                            >
                                                                <Plus size={12} /> Add Answer
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1 block">Options</label>
                                                            {q.options.map((opt, oIdx) => (
                                                                <div key={oIdx} className="flex items-center gap-2 group/opt">
                                                                    {q.type === 'single' ? (
                                                                        <input
                                                                            type="radio"
                                                                            name={`correct-${q.id}`}
                                                                            checked={q.correctIndex === oIdx}
                                                                            onChange={() => updateQuestion(q.id, 'correctIndex', oIdx)}
                                                                            className="accent-brand-blue w-4 h-4 cursor-pointer"
                                                                        />
                                                                    ) : (
                                                                        <input
                                                                            type="checkbox"
                                                                            checked={q.correctIndices.includes(oIdx)}
                                                                            onChange={() => {
                                                                                const newIndices = q.correctIndices.includes(oIdx)
                                                                                    ? q.correctIndices.filter(i => i !== oIdx)
                                                                                    : [...q.correctIndices, oIdx];
                                                                                updateQuestion(q.id, 'correctIndices', newIndices);
                                                                            }}
                                                                            className="accent-brand-blue w-4 h-4 cursor-pointer"
                                                                        />
                                                                    )}
                                                                    <input
                                                                        value={opt}
                                                                        onChange={(e) => updateOption(q.id, oIdx, e.target.value)}
                                                                        className={`w-full px-3 py-1.5 rounded-lg border text-sm ${(q.type === 'single' && q.correctIndex === oIdx) || (q.type === 'multiple' && q.correctIndices.includes(oIdx))
                                                                            ? 'bg-green-50 border-green-200 text-green-700 font-medium'
                                                                            : 'bg-gray-50 border-gray-100'
                                                                            }`}
                                                                        placeholder={`Option ${oIdx + 1}`}
                                                                    />
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => {
                                                                            if (q.options.length <= 1) return;
                                                                            const newOpts = q.options.filter((_, idx) => idx !== oIdx);

                                                                            let newCorrectIndex = q.correctIndex;
                                                                            if (oIdx < q.correctIndex) newCorrectIndex = Math.max(0, q.correctIndex - 1);
                                                                            else if (oIdx === q.correctIndex) newCorrectIndex = 0;

                                                                            const newCorrectIndices = q.correctIndices
                                                                                .filter(i => i !== oIdx)
                                                                                .map(i => i > oIdx ? i - 1 : i);

                                                                            setQuestions(prev => prev.map(qs => qs.id === q.id ? { ...qs, options: newOpts, correctIndex: newCorrectIndex, correctIndices: newCorrectIndices } : qs));
                                                                        }}
                                                                        className="text-gray-300 hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-opacity p-1"
                                                                    >
                                                                        <X size={14} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    setQuestions(prev => prev.map(qs => qs.id === q.id ? { ...qs, options: [...qs.options, ''] } : qs));
                                                                }}
                                                                className="text-xs flex items-center gap-1 text-brand-blue font-bold px-2 py-1 mt-1 hover:bg-blue-50 rounded w-fit"
                                                            >
                                                                <Plus size={12} /> Add Option
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                            <button type="button" onClick={addQuestion} className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-bold hover:border-brand-blue hover:text-brand-blue hover:bg-blue-50/50 transition-all flex items-center justify-center gap-2">
                                                <Plus size={18} /> Add New Question
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* THUMBNAIL SECTION */}
                                        <div className="space-y-2 p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <label className="text-sm font-bold text-gray-700 block">Thumbnail Image URL</label>
                                            <div className="flex gap-4 items-center">
                                                <input
                                                    className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl font-mono text-xs"
                                                    placeholder="https://example.com/image.jpg"
                                                    value={formData.thumbnailUrl}
                                                    onChange={e => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                                                />
                                                {/* Show preview if URL exists */}
                                                {formData.thumbnailUrl ? (
                                                    <img src={formData.thumbnailUrl} alt="Preview" className="w-16 h-10 object-cover rounded-lg bg-gray-200 shrink-0 border border-gray-200" />
                                                ) : null}

                                                <label className="cursor-pointer bg-white border border-gray-200 hover:border-brand-blue text-gray-500 hover:text-brand-blue px-3 py-2 rounded-xl flex items-center justify-center transition-all h-[42px] w-[42px] shrink-0 transform active:scale-95" title="Upload Thumbnail">
                                                    {isLoading ? <div className="w-4 h-4 border-2 border-brand-blue border-t-transparent rounded-full animate-spin"></div> : <Upload size={18} />}
                                                    <input type="file" className="hidden" accept="image/*" onChange={handleThumbnailUpload} disabled={isLoading} />
                                                </label>
                                            </div>
                                            <p className="text-xs text-gray-400">Paste an image link or upload a file.</p>
                                        </div>

                                        {/* CONTENT SOURCE SELECTOR */}
                                        <div className="space-y-4">
                                            <label className="text-sm font-bold text-gray-700">Content Source</label>
                                            <div className="flex gap-2 bg-gray-100 p-1 rounded-xl w-fit">
                                                {['url', 'file', 'embed'].map(type => (
                                                    <button
                                                        key={type}
                                                        type="button"
                                                        onClick={() => setFormData({ ...formData, videoSource: type as any })}
                                                        className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all ${formData.videoSource === type ? 'bg-white text-brand-blue shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                                                    >
                                                        {type === 'url' ? 'Link URL' : type === 'file' ? 'Upload File' : 'Embed Code'}
                                                    </button>
                                                ))}
                                            </div>

                                            {formData.videoSource === 'file' && (
                                                <div className="space-y-2 animate-fade-in">
                                                    <label className="text-sm font-bold text-gray-700">Upload File</label>
                                                    <div className="flex items-center gap-4">
                                                        <label className="flex-1 cursor-pointer">
                                                            <div className={`w-full px-4 py-4 bg-gray-50 border-2 border-dashed rounded-xl flex items-center justify-center gap-2 transition-colors ${file ? 'border-brand-blue bg-blue-50/30' : 'border-gray-200 hover:bg-gray-100'}`}>
                                                                <Upload size={20} className={file ? 'text-brand-blue' : 'text-gray-400'} />
                                                                <span className={`font-medium text-sm ${file ? 'text-brand-blue' : 'text-gray-500'}`}>{file ? file.name : (editingId && formData.url ? 'Change File' : `Click to select ${formData.type === 'PDF' ? 'PDF' : formData.type === 'Video' ? 'Video' : 'File'}`)}</span>
                                                            </div>
                                                            <input type="file" className="hidden" accept={formData.type === 'PDF' ? 'application/pdf' : formData.type === 'Video' ? 'video/*' : '*/*'} onChange={e => setFile(e.target.files?.[0] || null)} />
                                                        </label>
                                                        {file && <button type="button" onClick={() => setFile(null)} className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-100 transition-colors"><Trash2 size={20} /></button>}
                                                    </div>
                                                </div>
                                            )}

                                            {formData.videoSource === 'url' && (
                                                <div className="space-y-2 animate-fade-in">
                                                    <label className="text-sm font-bold text-gray-700">External URL (YouTube, PDF link, etc)</label>
                                                    <input required={!file && !editingId && !formData.embedCode} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-sm text-brand-blue" placeholder="https://" value={formData.url} onChange={e => setFormData({ ...formData, url: e.target.value })} />
                                                </div>
                                            )}

                                            {formData.videoSource === 'embed' && (
                                                <div className="space-y-2 animate-fade-in">
                                                    <label className="text-sm font-bold text-gray-700">Embed Code (Google Drive, Vimeo, etc)</label>
                                                    <textarea
                                                        required
                                                        rows={4}
                                                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-mono text-xs text-brand-dark focus:outline-none focus:border-brand-blue"
                                                        placeholder="<iframe src='...'></iframe>"
                                                        value={formData.embedCode}
                                                        onChange={e => setFormData({ ...formData, embedCode: e.target.value })}
                                                    />
                                                    <p className="text-xs text-gray-400">Paste the full iframe code provided by the hosting service.</p>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}

                                <div className="flex gap-6 pt-2">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${formData.isPro ? 'bg-brand-dark border-brand-dark' : 'border-gray-300 group-hover:border-brand-dark'}`}>{formData.isPro && <CheckCircle size={14} className="text-brand-yellow" />}</div>
                                        <input type="checkbox" className="hidden" checked={formData.isPro} onChange={e => setFormData({ ...formData, isPro: e.target.checked })} />
                                        <span className="font-bold text-gray-700">Pro Exclusive</span>
                                    </label>
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors ${formData.isMcamp ? 'bg-purple-600 border-purple-600' : 'border-gray-300 group-hover:border-purple-600'}`}>{formData.isMcamp && <CheckCircle size={14} className="text-white" />}</div>
                                        <input type="checkbox" className="hidden" checked={formData.isMcamp} onChange={e => setFormData({ ...formData, isMcamp: e.target.checked })} />
                                        <span className="font-bold text-gray-700">MCAMP Only</span>
                                    </label>
                                </div>
                                <button type="submit" disabled={isLoading} className="w-full bg-brand-blue text-white py-4 rounded-xl font-bold text-lg hover:bg-blue-600 transition-all shadow-xl shadow-brand-blue/30 mt-4 active:scale-95 flex items-center justify-center gap-2">
                                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (editingId ? 'Save Changes' : 'Publish Resource')}
                                </button>
                            </form>
                        </div>
                    </div >
                </div >,
                document.body
            )
            }

            {/* DELETE CONFIRMATION MODAL */}
            {
                deleteId && createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center animate-pop-in">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">Delete Resource?</h2>
                            <p className="text-gray-500 mb-8">
                                Are you sure you want to delete this resource? This action cannot be undone.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    onClick={confirmDelete}
                                    disabled={isLoading}
                                    className="w-full py-3.5 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-colors shadow-lg shadow-red-600/20 flex items-center justify-center gap-2"
                                >
                                    {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Yes, Delete It"}
                                </button>
                                <button
                                    onClick={() => setDeleteId(null)}
                                    disabled={isLoading}
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

            {/* FILE LIMIT MODAL */}
            {
                showLimitModal && createPortal(
                    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl relative text-center animate-pop-in">
                            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle size={32} />
                            </div>
                            <h2 className="text-2xl font-extrabold text-gray-900 mb-2">File Too Large</h2>
                            <p className="text-gray-500 mb-4 text-sm">
                                {limitError || "The file exceeds the upload limit of 25MB."}
                            </p>
                            <p className="text-gray-500 mb-8 text-sm">
                                We recommend using <a href="https://www.ilovepdf.com/compress_pdf" target="_blank" rel="noopener noreferrer" className="text-brand-blue font-bold hover:underline">iLovePDF</a> to compress your file before uploading.
                            </p>

                            <div className="flex flex-col gap-3">
                                <a
                                    href="https://www.ilovepdf.com/compress_pdf"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-3.5 bg-brand-blue text-white rounded-xl font-bold hover:bg-blue-600 transition-colors shadow-lg shadow-brand-blue/20 flex items-center justify-center gap-2"
                                >
                                    Go to iLovePDF
                                </a>
                                <button
                                    onClick={() => setShowLimitModal(false)}
                                    className="w-full py-3.5 bg-gray-100 text-gray-700 rounded-xl font-bold hover:bg-gray-200 transition-colors"
                                >
                                    Close
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

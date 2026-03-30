import * as React from 'react';
import { User, Resource, Notification, ResourceProgress } from '../types';
import { DashboardLayout } from '../components/DashboardLayout';
import { AIChatOverlay } from '../components/AIChatOverlay';
import { ActivityTracker } from '../components/ActivityTracker'; // V3 Update
import { api } from '../services/api'; // V3 Update
import {
    FileText, PlayCircle, HelpCircle, BookOpen,
    Zap, GraduationCap, ArrowLeft, Bot, Lock, Star, Download,
    Video, X, CheckCircle, AlertCircle, RefreshCw,
    ZoomIn, ZoomOut
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppRoute } from '../types';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

/**
 * LEARNING PAGE:
 * This is where students watch medical videos, read PDFs, and take quizzes.
 * It also tracks their progress (how much they've watched or read).
 */

// Configure worker for React-PDF
pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';


const getThumbnailStyle = (index: number) => {
    const styles = [
        { bg: 'bg-orange-100', text: 'text-orange-600', icon: FileText },
        { bg: 'bg-blue-100', text: 'text-blue-600', icon: HelpCircle },
        { bg: 'bg-purple-100', text: 'text-purple-600', icon: BookOpen },
        { bg: 'bg-green-100', text: 'text-green-600', icon: Zap },
        { bg: 'bg-pink-100', text: 'text-pink-600', icon: GraduationCap },
    ];
    return styles[index % styles.length];
};

interface LearningProps {
    user: User;
    onLogout: () => void;
    notifications: Notification[];
    onMarkAllRead: () => void;
    onClearNotification: (id: string) => void;
    onClearAll: () => void;
    onDeleteAccount: () => void;
}

const getYouTubeId = (url: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
};

/**
 * The main component for Study Mode.
 */
export const Learning: React.FC<LearningProps> = ({
    user,
    onLogout,
    notifications,
    onMarkAllRead,
    onClearNotification,
    onClearAll,
    onDeleteAccount
}) => {
    const navigate = useNavigate();
    const { resourceId } = useParams<{ resourceId?: string }>();

    const [resources, setResources] = React.useState<Resource[]>([]);
    const [activeResource, setActiveResource] = React.useState<Resource | null>(null);
    const [isAiChatOpen, setIsAiChatOpen] = React.useState(false);
    const [showUpgradeModal, setShowUpgradeModal] = React.useState(false);
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isLoading, setIsLoading] = React.useState(true);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [userProgress, setUserProgress] = React.useState<Record<string, ResourceProgress>>({});

    // PDF State
    const [numPages, setNumPages] = React.useState<number | null>(null);
    const [pageNumber, setPageNumber] = React.useState(1);
    const [isLoadingPdf, setIsLoadingPdf] = React.useState(false);
    const [pdfError, setPdfError] = React.useState<string | null>(null);
    const [pdfZoom, setPdfZoom] = React.useState(1.0);
    const [windowWidth, setWindowWidth] = React.useState(window.innerWidth);

    React.useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [viewedPages, setViewedPages] = React.useState<Set<number>>(new Set());
    const [watchedSeconds, setWatchedSeconds] = React.useState<Set<number>>(new Set());
    const [pageTimeSpent, setPageTimeSpent] = React.useState(0);
    const [pageWordCount, setPageWordCount] = React.useState(0);

    const videoTimerRef = React.useRef<any>(null);
    const ytPlayerRef = React.useRef<any>(null);

    // Reset tracking state when resource changes
    React.useEffect(() => {
        setIsPlaying(false);
        setQuizState({ started: false, currentQuestion: 0, score: 0, finished: false, answers: {}, reviewMode: false });
        setNumPages(null);
        setPageNumber(1);
        setPdfZoom(1.0);

        // Initialize from existing progress if available
        const existing = activeResource ? userProgress[activeResource.id] : null;
        if (existing?.metadata?.viewedPages) {
            setViewedPages(new Set(existing.metadata.viewedPages));
        } else {
            setViewedPages(new Set([1]));
        }

        if (existing?.metadata?.watchedSeconds) {
            setWatchedSeconds(new Set(existing.metadata.watchedSeconds));
        } else {
            setWatchedSeconds(new Set());
        }

        if (videoTimerRef.current) clearInterval(videoTimerRef.current);
        ytPlayerRef.current = null; // Reset player ref
        setPageTimeSpent(0);
        setPageWordCount(0);
    }, [activeResource?.id]);

    // Fetch User Progress
    // We check our database to see which resources this student has already started.
    React.useEffect(() => {
        const fetchProgress = async () => {
            if (user.uid) {
                try {
                    const progressArr = await api.analytics.getUserProgress(user.uid);
                    const progressMap = progressArr.reduce((acc, curr) => ({ ...acc, [curr.resourceId]: curr }), {});
                    setUserProgress(progressMap);
                } catch (err) {
                    console.error("Failed to fetch progress:", err);
                }
            }
        };
        fetchProgress();
    }, [user.uid]);

    // Update PDF Progress (with Reading Time Factor)
    React.useEffect(() => {
        if (activeResource?.type === 'PDF' && numPages) {
            // Logic: 2.5 words per second (150 WPM)
            // Min 3 seconds per page (for images/titles)
            const requiredTime = Math.max(3, Math.ceil(pageWordCount / 2.5));

            if (pageTimeSpent >= requiredTime) {
                setViewedPages(prev => {
                    if (prev.has(pageNumber)) return prev;
                    const next = new Set(prev);
                    next.add(pageNumber);

                    const progress = Math.round((next.size / numPages) * 100);
                    const currentProgress = userProgress[activeResource.id]?.progress || 0;

                    if (progress > currentProgress) {
                        const progressData: Partial<ResourceProgress> = {
                            progress,
                            type: 'PDF',
                            completed: progress >= 90,
                            metadata: {
                                viewedPages: Array.from(next) as number[],
                                totalPages: numPages
                            }
                        };
                        api.analytics.updateResourceProgress(user.uid, activeResource.id, progressData);
                        setUserProgress(prev => ({
                            ...prev,
                            [activeResource.id]: { ...(prev[activeResource.id] || {}), ...progressData } as ResourceProgress
                        }));
                    }

                    return next;
                });
            }
        }
    }, [pageNumber, numPages, activeResource?.id, pageTimeSpent, pageWordCount]);

    // PDF Reading Timer
    React.useEffect(() => {
        let interval: any;
        if (activeResource?.type === 'PDF' && !isLoadingPdf) {
            interval = setInterval(() => {
                setPageTimeSpent(prev => prev + 1);
            }, 1000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [pageNumber, activeResource?.id, isLoadingPdf]);

    // YouTube Player Initialization
    React.useEffect(() => {
        if (activeResource?.type === 'Video' && activeResource.isYoutube && isPlaying) {
            let playerInitialized = false;
            const initPlayer = () => {
                if (!playerInitialized && (window as any).YT && (window as any).YT.Player) {
                    ytPlayerRef.current = new (window as any).YT.Player('yt-player', {
                        events: {
                            'onReady': () => { playerInitialized = true; }
                        }
                    });
                }
            };

            if ((window as any).YT && (window as any).YT.Player) {
                initPlayer();
            } else {
                (window as any).onYouTubeIframeAPIReady = initPlayer;
            }
        }
    }, [activeResource?.id, isPlaying]);

    // Update Video Progress
    React.useEffect(() => {
        if (activeResource?.type === 'Video' && isPlaying) {
            const interval = setInterval(() => {
                let currentTime: number | null = null;
                let duration: number | null = null;

                if (activeResource.isYoutube) {
                    if (ytPlayerRef.current && ytPlayerRef.current.getCurrentTime) {
                        try {
                            currentTime = Math.floor(ytPlayerRef.current.getCurrentTime());
                            duration = Math.floor(ytPlayerRef.current.getDuration());
                        } catch (e) { }
                    }
                } else {
                    const video = document.querySelector('video');
                    if (video) {
                        currentTime = Math.floor(video.currentTime);
                        duration = Math.floor(video.duration);
                    }
                }

                if (currentTime !== null && duration && duration > 0) {
                    setWatchedSeconds(prev => {
                        if (prev.has(currentTime!)) return prev;
                        const next = new Set(prev);
                        next.add(currentTime!);

                        const progress = Math.round((next.size / duration!) * 100);
                        const currentProgress = userProgress[activeResource!.id]?.progress || 0;

                        if (progress > currentProgress) {
                            const progressData: Partial<ResourceProgress> = {
                                progress: Math.min(progress, 100),
                                type: 'Video',
                                completed: progress >= 90,
                                metadata: {
                                    watchedSeconds: Array.from(next) as number[],
                                    totalDuration: duration!
                                }
                            };
                            api.analytics.updateResourceProgress(user.uid, activeResource!.id, progressData);
                            setUserProgress(prev => ({
                                ...prev,
                                [activeResource!.id]: { ...(prev[activeResource!.id] || {}), ...progressData } as ResourceProgress
                            }));
                        }
                        return next;
                    });
                }
            }, 1000);
            return () => clearInterval(interval);
        }
    }, [isPlaying, activeResource?.id]);

    // YouTube API Initialization
    React.useEffect(() => {
        if (!(window as any).YT) {
            const tag = document.createElement('script');
            tag.src = "https://www.youtube.com/iframe_api";
            const firstScriptTag = document.getElementsByTagName('script')[0];
            firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        }
    }, []);
    React.useEffect(() => {
        if (!activeResource || activeResource.type !== 'PDF') return;

        let isCancelled = false;
        setPdfError(null);

        const renderPage = async () => {
            setIsLoadingPdf(true);
            try {
                // Determine URL - use sample for localhost if it's the specific sample file to avoid cross-origin logic if slightly different
                const url = activeResource.url;

                // Load Document
                const loadingTask = pdfjs.getDocument(url);
                const pdf = await loadingTask.promise;

                if (isCancelled) return;
                setNumPages(pdf.numPages);

                // Fetch Page
                const page = await pdf.getPage(pageNumber);

                // Word Count Calculation
                const textContent = await page.getTextContent();
                const words = textContent.items.map((item: any) => item.str).join(' ').split(/\s+/).filter(w => w.trim().length > 0);
                setPageWordCount(words.length);

                if (isCancelled) return;

                // Prepare Canvas
                const canvas = document.getElementById('pdf-render') as HTMLCanvasElement;
                if (!canvas) {
                    throw new Error("Canvas element not found");
                }

                const context = canvas.getContext('2d');
                if (!context) {
                    throw new Error("Canvas context could not be acquired");
                }

                // Calculate Scale (High-DPI optimized)
                const dpr = window.devicePixelRatio || 1;
                const containerWidth = canvas.parentElement?.clientWidth || 800;
                const unscaledViewport = page.getViewport({ scale: 1 });

                // baseScale is what we need to fit the container width
                const padding = windowWidth < 768 ? 0 : 40;
                const baseScale = (containerWidth - padding) / unscaledViewport.width;

                // renderScale accounts for screen density (Retina/Mobile) and manual zoom
                // We use a minimum of 2.0 multiplier relative to baseScale to ensure sharpness
                const renderScale = baseScale * pdfZoom * Math.max(dpr, 2);

                const viewport = page.getViewport({ scale: renderScale });

                // Backing store size (High resolution)
                canvas.width = Math.floor(viewport.width);
                canvas.height = Math.floor(viewport.height);

                // Display size (CSS pixels)
                const displayScale = baseScale * pdfZoom;
                canvas.style.width = Math.floor(unscaledViewport.width * displayScale) + 'px';
                canvas.style.height = Math.floor(unscaledViewport.height * displayScale) + 'px';

                // Render
                const renderContext = {
                    canvasContext: context,
                    viewport: viewport
                };

                await page.render(renderContext).promise;
            } catch (error: any) {
                console.error("PDF Render Error:", error);
                if (!isCancelled) {
                    setPdfError(error.message || "Failed to render PDF page");
                }
            } finally {
                if (!isCancelled) setIsLoadingPdf(false);
            }
        };

        renderPage();

        return () => {
            isCancelled = true;
        };
    }, [activeResource, pageNumber, pdfZoom, windowWidth]);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    // PDF Keyboard Navigation
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (activeResource?.type !== 'PDF' || !numPages) return;

            if (e.key === 'ArrowLeft') {
                setPageNumber(prev => Math.max(prev - 1, 1));
            } else if (e.key === 'ArrowRight') {
                setPageNumber(prev => Math.min(prev + 1, numPages));
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeResource, numPages]);


    // Quiz State
    const [quizState, setQuizState] = React.useState({
        started: false,
        currentQuestion: 0,
        score: 0,
        finished: false,
        reviewMode: false,
        answers: {} as Record<number, any>
    });

    const handleQuizAnswer = (value: any) => {
        if (!activeResource?.quizData) return;
        const q = activeResource.quizData[quizState.currentQuestion];

        if (q.type === 'multiple') {
            const current = (quizState.answers[quizState.currentQuestion] as number[]) || [];
            const newAns = current.includes(value)
                ? current.filter(i => i !== value)
                : [...current, value];
            setQuizState(prev => ({ ...prev, answers: { ...prev.answers, [prev.currentQuestion]: newAns } }));
        } else {
            setQuizState(prev => ({ ...prev, answers: { ...prev.answers, [prev.currentQuestion]: value } }));
        }
    };

    const handleQuizNext = () => {
        if (!activeResource?.quizData) return;

        if (quizState.currentQuestion < activeResource.quizData.length - 1) {
            setQuizState(prev => ({ ...prev, currentQuestion: prev.currentQuestion + 1 }));
        } else {
            // Finish
            let score = 0;
            activeResource.quizData.forEach((q: any, idx: number) => {
                const ans = quizState.answers[idx];
                if (q.type === 'single' || !q.type) { // Default to single
                    if (Number(ans) === Number(q.correctIndex)) score++;
                } else if (q.type === 'multiple') {
                    const correct = (q.correctIndices || []).slice().sort().join(',');
                    const user = (ans || []).slice().sort().join(',');
                    if (correct === user && user.length > 0) score++;
                } else if (q.type === 'text') {
                    if (ans?.toString().trim().toLowerCase() === q.correctText?.toString().trim().toLowerCase()) score++;
                } else if (q.type === 'multi-text') {
                    const cArr = (q.correctTexts || []).map((s: string) => s.trim().toLowerCase());
                    const uArr = (ans || []).map((s: string) => s.trim().toLowerCase());
                    if (cArr.length > 0 && cArr.length === uArr.length && cArr.every((v: string, i: number) => v === uArr[i])) score++;
                }
            });
            setQuizState(prev => ({ ...prev, finished: true, score }));

            // Update Quiz Progress
            const total = activeResource.quizData.length;
            const percentage = (score / total) * 100;
            const mastered = percentage >= 80;

            const progressData: Partial<ResourceProgress> = {
                progress: mastered ? 100 : percentage,
                type: 'Quiz',
                completed: mastered,
                metadata: {
                    quizScore: score,
                    quizTotal: total
                }
            };
            api.analytics.updateResourceProgress(user.uid, activeResource.id, progressData);
            setUserProgress(prev => ({
                ...prev,
                [activeResource.id]: { ...(prev[activeResource.id] || {}), ...progressData } as ResourceProgress
            }));
        }
    };

    const handleQuizPrev = () => {
        if (quizState.currentQuestion > 0) {
            setQuizState(prev => ({ ...prev, currentQuestion: prev.currentQuestion - 1 }));
        }
    };

    // V3 Update: Fetch Resources from Backend
    React.useEffect(() => {
        const fetchResources = async () => {
            try {
                setIsLoading(true);
                const data = await api.resources.getAll();
                if (data && Array.isArray(data)) {
                    setResources(data);
                } else {
                    setResources([]);
                }
            } catch (err) {
                console.error("Failed to fetch resources:", err);
                setResources([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchResources();
    }, [user.uid]); // Refetch if user changes

    // Handle URL parameter for direct resource access
    React.useEffect(() => {
        if (resourceId && resources.length > 0) {
            const res = resources.find(r => r.id === resourceId);
            if (res) {
                // V3 Update: Check new isMcampExclusive flag or fallback ID convention
                const isMcampResource = (res as any).isMcampExclusive || res.id.startsWith('m');
                let isAccessible = true;

                if (isMcampResource) {
                    isAccessible = !!user.mcamp?.isEnrolled;
                } else if (res.isPro) {
                    isAccessible = user.isSubscribed;
                }

                if (!isAccessible) {
                    setShowUpgradeModal(true);
                } else {
                    setActiveResource(res);
                }
            }
        } else if (!resourceId) {
            setActiveResource(null);
        }
    }, [resourceId, resources, user.isSubscribed]);

    const toggleAiChat = () => setIsAiChatOpen(!isAiChatOpen);

    const handleResourceClick = (res: Resource) => {
        navigate(`${AppRoute.LEARNING}/${res.id}`);
    };

    const filteredResources = resources.filter(res => {
        // Exclude only MCAMP-specific Quizzes from general library view (stays on MCAMP dashboard)
        if (res.isMcampExclusive && res.type === 'Quiz') return false;

        const matchesSearch = res.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            res.subject.toLowerCase().includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        // Backend already filters by year, but we double-check here for safety
        // We need a robust way to compare Year 2 vs 200L
        const normalizeLevel = (val: string) => {
            const raw = (val || '').toLowerCase();
            if (raw.includes('100') || raw.includes('year 1')) return 100;
            if (raw.includes('200') || raw.includes('year 2')) return 200;
            if (raw.includes('300') || raw.includes('year 3')) return 300;
            if (raw.includes('400') || raw.includes('year 4')) return 400;
            if (raw.includes('500') || raw.includes('year 5')) return 500;
            if (raw.includes('600') || raw.includes('year 6')) return 600;
            if (raw.includes('preclinical')) return 200;
            if (raw.includes('clinical')) return 400;
            return 0; // General
        };

        if (res.year && user.year) {
            const userLevel = normalizeLevel(user.year);
            const resLevel = normalizeLevel(res.year);

            // If resource level is higher than user level, hide it (unless it's general)
            if (resLevel > 0 && userLevel > 0 && resLevel > userLevel) return false;
        }

        return true;
    });

    const handleDownload = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!activeResource || !activeResource.canDownload) return;

        // Simulate download
        const link = document.createElement('a');
        link.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent('Resource content for: ' + activeResource.title);
        link.download = `${activeResource.title.replace(/\s+/g, '_')}_MedicoHub.${activeResource.type.toLowerCase()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <DashboardLayout
            user={user}
            onLogout={onLogout}
            onSearch={setSearchQuery}
            showSearch={true}
            notifications={notifications}
            onMarkAllRead={onMarkAllRead}
            onClearNotification={onClearNotification}
            onClearAll={onClearAll}
            onDeleteAccount={onDeleteAccount}
        >

            {/* Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-sm animate-pop-in">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-brand-yellow/20 text-brand-yellow rounded-full flex items-center justify-center mx-auto mb-6">
                            <Star size={32} fill="currentColor" />
                        </div>
                        <h3 className="text-2xl font-bold text-brand-dark mb-2">Pro Resource</h3>
                        <p className="text-gray-500 mb-8">This content is exclusive to Pro members. Upgrade to access our full library.</p>
                        <button
                            onClick={() => navigate(AppRoute.PRICING)}
                            className="w-full bg-brand-blue text-white py-3.5 rounded-xl font-bold mb-3 hover:bg-blue-600 transition-colors shadow-lg shadow-brand-blue/30"
                        >
                            Upgrade to Pro
                        </button>
                        <button
                            onClick={() => {
                                setShowUpgradeModal(false);
                                navigate(AppRoute.LEARNING);
                            }}
                            className="text-gray-400 font-bold text-sm hover:text-gray-600"
                        >
                            Maybe Later
                        </button>
                    </div>
                </div>
            )}

            {activeResource ? (
                // STUDY MODE
                <ActivityTracker resourceId={activeResource.id} resourceType={activeResource.type}>
                    <div className="max-w-5xl mx-auto animate-fade-in-up">
                        {(() => {
                            const isMcampResource = (activeResource as any).isMcampExclusive || activeResource.id.startsWith('m');
                            const isDownloadable = activeResource.canDownload === true;
                            const canUseAi = activeResource.type !== 'Quiz' && activeResource.type !== 'Video';

                            return (
                                <>
                                    <button
                                        onClick={() => {
                                            navigate(isMcampResource ? AppRoute.MCAMP_DASHBOARD : AppRoute.LEARNING);
                                            setIsAiChatOpen(false);
                                        }}
                                        className="flex items-center gap-2 text-gray-500 hover:text-brand-dark mb-6 transition-colors font-bold"
                                    >
                                        <ArrowLeft size={20} />
                                        {isMcampResource ? 'Back to MCAMP Dashboard' : 'Back to Library'}
                                    </button>

                                    <div className="bg-white rounded-[2rem] shadow-lg border border-gray-100 overflow-hidden min-h-[600px] relative">
                                        {/* Content Viewer Header */}
                                        <div className="h-full flex flex-col">
                                            <div className="p-8 border-b border-gray-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                <div className="flex-1">
                                                    <div className="flex flex-wrap items-center gap-2 mb-2">
                                                        <span className="px-3 py-1 bg-brand-light text-brand-blue rounded-lg text-xs font-bold uppercase tracking-wide">
                                                            {activeResource.type}
                                                        </span>
                                                        <span className="text-gray-400 text-sm font-bold">
                                                            {activeResource.subject}
                                                        </span>
                                                        {activeResource.isPro && !isMcampResource && (
                                                            <span className="flex items-center gap-1 text-[10px] font-bold bg-brand-dark text-brand-yellow px-2 py-1 rounded uppercase tracking-wider">
                                                                <Star size={10} fill="currentColor" /> Pro
                                                            </span>
                                                        )}
                                                    </div>
                                                    <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark leading-tight">{activeResource.title}</h1>
                                                </div>

                                                <div className="flex items-center gap-2">
                                                    {isDownloadable && (
                                                        <button
                                                            onClick={handleDownload}
                                                            className="flex items-center gap-2 bg-brand-dark text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-black transition-all shadow-lg active:scale-95 whitespace-nowrap"
                                                        >
                                                            <Download size={18} />
                                                            Download {activeResource.type}
                                                        </button>
                                                    )}
                                                    {canUseAi && (
                                                        <button
                                                            onClick={toggleAiChat}
                                                            className={`p-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 font-bold text-sm ${isAiChatOpen ? 'bg-brand-blue text-white' : 'bg-white border border-gray-100 text-gray-600 hover:bg-gray-50'}`}
                                                        >
                                                            <Bot size={20} />
                                                            <span className="hidden sm:inline">Ask AI</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Viewer Body: This changes depending on if it's a Video, PDF, or Quiz */}
                                            <div className="flex-1 bg-gray-50 p-4 sm:p-8 flex items-center justify-center">
                                                {/* VIDEO VIEWER */}
                                                {activeResource.type === 'Video' ? (
                                                    <div className="w-full max-w-4xl aspect-video bg-black rounded-3xl flex items-center justify-center text-white shadow-2xl overflow-hidden relative group">
                                                        {/* Protection Overlays */}
                                                        {/* Top Bar Blocker: Blocks Title, Profile, Share, Watch Later */}
                                                        <div className="absolute top-0 left-0 right-0 h-24 z-50 pointer-events-auto touch-none" onContextMenu={e => e.preventDefault()}></div>
                                                        {/* Bottom Right Blocker: Blocks 'Watch on YouTube' logo if possible (careful not to block Fullscreen) */}
                                                        <div className="absolute bottom-0 right-12 w-24 h-12 z-50 pointer-events-auto touch-none" onContextMenu={e => e.preventDefault()}></div>

                                                        {activeResource.embedCode ? (
                                                            <div
                                                                className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full border-0"
                                                                dangerouslySetInnerHTML={{
                                                                    __html: activeResource.embedCode.replace('<iframe', '<iframe allowfullscreen="true" allow="fullscreen" sandbox="allow-forms allow-scripts allow-pointer-lock allow-same-origin allow-top-navigation allow-presentation"')
                                                                }}
                                                            />
                                                        ) : isPlaying ? (
                                                            (() => {
                                                                // Robust YouTube detection: check flag OR URL content
                                                                const isYouTubeVideo = activeResource.isYoutube ||
                                                                    (activeResource.url || '').includes('youtube') ||
                                                                    (activeResource.url || '').includes('youtu.be');

                                                                return isYouTubeVideo ? (
                                                                    <iframe
                                                                        id="yt-player"
                                                                        width="100%"
                                                                        height="100%"
                                                                        src={`https://www.youtube.com/embed/${getYouTubeId(activeResource.url || '')}?autoplay=1&modestbranding=1&rel=0&iv_load_policy=3&controls=1&disablekb=0&showinfo=0&enablejsapi=1&origin=${window.location.origin}`}
                                                                        title={activeResource.title}
                                                                        frameBorder="0"
                                                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                                                        allowFullScreen={true}
                                                                        className="absolute inset-0 w-full h-full"
                                                                    ></iframe>
                                                                ) : (
                                                                    <video
                                                                        controls
                                                                        autoPlay
                                                                        className="w-full h-full"
                                                                        src={activeResource.url}
                                                                    >
                                                                        Your browser does not support the video tag.
                                                                    </video>
                                                                );
                                                            })()
                                                        ) : (
                                                            <>
                                                                {activeResource.thumbnailUrl && (
                                                                    <img
                                                                        src={activeResource.thumbnailUrl}
                                                                        className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity group-hover:opacity-40"
                                                                        alt="Video Preview"
                                                                    />
                                                                )}
                                                                <div className="relative z-10 flex flex-col items-center gap-4">
                                                                    <button onClick={() => setIsPlaying(true)} className="transform transition-transform duration-300 hover:scale-110">
                                                                        <PlayCircle size={80} className="opacity-80 hover:opacity-100 text-brand-blue" />
                                                                    </button>
                                                                    {!((activeResource.url || '').includes('youtube') || (activeResource.url || '').includes('youtu.be')) && (
                                                                        <p className="bg-black/50 backdrop-blur px-4 py-2 rounded-full text-xs font-bold tracking-widest uppercase border border-white/20">
                                                                            {activeResource.embedCode ? 'External Stream' : 'Secure Internal Stream'}
                                                                        </p>
                                                                    )}
                                                                </div>

                                                                {((activeResource.url || '').includes('youtube') || (activeResource.url || '').includes('youtu.be')) && (
                                                                    <div className="absolute bottom-4 right-4 bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase shadow-lg flex items-center gap-1.5">
                                                                        <Video size={12} /> YouTube View
                                                                    </div>
                                                                )}
                                                                {!((activeResource.url || '').includes('youtube') || (activeResource.url || '').includes('youtu.be')) && (
                                                                    <div className="absolute bottom-4 right-4 bg-brand-blue text-white px-3 py-1.5 rounded-lg text-[10px] font-extrabold uppercase shadow-lg flex items-center gap-1.5">
                                                                        <Star size={12} fill="currentColor" /> {activeResource.embedCode ? 'Embedded Content' : 'Admin Uploaded'}
                                                                    </div>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                ) : activeResource.type === 'PDF' ? (
                                                    /* PDF VIEWER */
                                                    /* PDF VIEWER */
                                                    // Custom Canvas PDF Viewer
                                                    <div className="w-[calc(100%+2rem)] -mx-4 md:mx-0 md:w-full min-h-[80vh] bg-gray-100 rounded-none md:rounded-3xl overflow-hidden shadow-xl relative border-y md:border border-gray-200 flex flex-col items-center justify-center group select-none">

                                                        {/* Header / Toolbar */}
                                                        <div className="absolute top-0 left-0 right-0 bg-white/90 backdrop-blur-md p-3 flex items-center justify-between z-20 shadow-sm border-b border-gray-200">
                                                            <div className="flex items-center gap-3">
                                                                <span className="text-gray-800 font-bold text-sm truncate max-w-[200px]">{activeResource.title}</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <div className="bg-brand-blue/10 text-brand-blue px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border border-brand-blue/20">
                                                                    <Lock size={10} /> Secure View
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Canvas Render Area */}
                                                        <div
                                                            className="flex-1 w-full flex items-center justify-center p-0 md:p-8 overflow-auto custom-scrollbar relative bg-gray-50"
                                                            onContextMenu={(e) => e.preventDefault()}
                                                        >
                                                            <canvas
                                                                id="pdf-render"
                                                                className="shadow-2xl rounded-lg bg-white border border-gray-100"
                                                                style={{ imageRendering: 'auto' }}
                                                            ></canvas>

                                                            {/* Loading Indicator */}
                                                            <div id="pdf-loader" className={`absolute inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-10 transition-opacity duration-300 ${isLoadingPdf ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-blue mb-4"></div>
                                                                <span className="text-brand-blue text-xs font-bold uppercase tracking-widest">Loading Page...</span>
                                                            </div>

                                                            {/* Error Message */}
                                                            {pdfError && (
                                                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/95 z-20 p-8 text-center">
                                                                    <div className="bg-red-500/10 p-4 rounded-full mb-4">
                                                                        <AlertCircle size={32} className="text-red-500" />
                                                                    </div>
                                                                    <h3 className="text-gray-800 font-bold text-lg mb-2">Failed to Load PDF</h3>
                                                                    <p className="text-gray-500 text-sm max-w-sm mb-4">{pdfError}</p>
                                                                    <button
                                                                        onClick={() => window.location.reload()}
                                                                        className="px-6 py-3 bg-brand-blue text-white rounded-xl text-sm font-bold shadow-lg hover:bg-blue-600 transition-all active:scale-95 flex items-center gap-2"
                                                                    >
                                                                        <RefreshCw size={16} /> Refresh Page
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Navigation Controls (Floating) */}
                                                        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-200 shadow-xl z-30 transition-transform duration-300 hover:scale-105">
                                                            <div className="flex items-center gap-0.5 border-r border-gray-100 pr-2 mr-1">
                                                                <button
                                                                    onClick={() => setPdfZoom(prev => Math.max(prev - 0.25, 0.5))}
                                                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-all active:scale-95"
                                                                    title="Zoom Out"
                                                                >
                                                                    <ZoomOut size={16} />
                                                                </button>
                                                                <span className="text-[10px] font-bold text-gray-500 w-10 text-center">{Math.round(pdfZoom * 100)}%</span>
                                                                <button
                                                                    onClick={() => setPdfZoom(prev => Math.min(prev + 0.25, 3.0))}
                                                                    className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 transition-all active:scale-95"
                                                                    title="Zoom In"
                                                                >
                                                                    <ZoomIn size={16} />
                                                                </button>
                                                            </div>

                                                            <button
                                                                id="prev-page"
                                                                onClick={() => {
                                                                    if (pageNumber <= 1) return;
                                                                    setPageNumber(prev => prev - 1);
                                                                }}
                                                                disabled={pageNumber <= 1 || isLoadingPdf}
                                                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30 transition-all active:scale-95"
                                                            >
                                                                <ArrowLeft size={16} />
                                                            </button>

                                                            <span className="text-gray-800 font-mono font-bold text-[10px] min-w-[50px] text-center">
                                                                {pageNumber} <span className="text-gray-300">/</span> {numPages || '--'}
                                                            </span>

                                                            <button
                                                                id="next-page"
                                                                onClick={() => {
                                                                    if (pageNumber >= numPages) return;
                                                                    setPageNumber(prev => prev + 1);
                                                                }}
                                                                disabled={pageNumber >= numPages || isLoadingPdf}
                                                                className="p-1.5 hover:bg-gray-100 rounded-full text-gray-600 disabled:opacity-30 transition-all active:scale-95"
                                                            >
                                                                <ArrowLeft size={16} className="rotate-180" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                ) : activeResource.type === 'Article' ? (
                                                    /* ARTICLE VIEWER */
                                                    <div className="w-full h-[80vh] bg-white rounded-3xl overflow-hidden shadow-xl border border-gray-100 flex flex-col">
                                                        <div className="bg-gray-50 border-b border-gray-100 px-4 py-2 flex justify-between items-center">
                                                            <span className="text-xs font-bold text-gray-500 uppercase">External Article</span>
                                                            <a href={activeResource.url} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-brand-blue hover:underline">
                                                                Open in New Tab
                                                            </a>
                                                        </div>
                                                        <iframe
                                                            src={activeResource.url}
                                                            className="w-full flex-grow bg-white"
                                                            title="Article Viewer"
                                                            sandbox="allow-scripts allow-same-origin allow-forms"
                                                        />
                                                    </div>
                                                ) : activeResource.type === 'Quiz' && activeResource.quizData ? (
                                                    /* QUIZ PLAYER */
                                                    <div className="w-full max-w-3xl bg-white rounded-3xl shadow-xl border border-gray-100 p-8 min-h-[400px] flex flex-col">
                                                        {!quizState.started ? (
                                                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                                <div className="w-24 h-24 bg-purple-50 rounded-full flex items-center justify-center mb-6">
                                                                    <HelpCircle size={48} className="text-purple-600" />
                                                                </div>
                                                                <h2 className="text-3xl font-bold text-gray-800 mb-2">{activeResource.title}</h2>
                                                                <p className="text-gray-500 mb-8 max-w-md">
                                                                    Test your knowledge with {activeResource.quizData.length} questions.
                                                                </p>
                                                                <button
                                                                    onClick={() => setQuizState({ ...quizState, started: true })}
                                                                    className="bg-purple-600 text-white px-10 py-4 rounded-xl font-bold text-lg hover:bg-purple-700 transition-all shadow-lg shadow-purple-600/20 active:scale-95"
                                                                >
                                                                    Start Quiz
                                                                </button>
                                                            </div>
                                                        ) : !quizState.finished ? (
                                                            <div className="flex-1 flex flex-col">
                                                                <div className="flex justify-between items-center mb-6">
                                                                    <span className="text-xs font-bold text-purple-600 uppercase tracking-wider">Question {quizState.currentQuestion + 1} of {activeResource.quizData.length}</span>
                                                                    <div className="h-2 w-32 bg-gray-100 rounded-full overflow-hidden">
                                                                        <div
                                                                            className="h-full bg-purple-600 transition-all duration-500 ease-out"
                                                                            style={{ width: `${((quizState.currentQuestion + 1) / activeResource.quizData.length) * 100}%` }}
                                                                        ></div>
                                                                    </div>
                                                                </div>

                                                                {activeResource.quizData[quizState.currentQuestion].imageUrl && (
                                                                    <div className="mb-6 rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex justify-center">
                                                                        <img src={activeResource.quizData[quizState.currentQuestion].imageUrl} className="max-h-64 object-contain" alt="Question content" />
                                                                    </div>
                                                                )}

                                                                <h3 className="text-2xl font-bold text-gray-800 mb-8 leading-snug">
                                                                    {activeResource.quizData[quizState.currentQuestion].text}
                                                                </h3>

                                                                <div className="space-y-4 mb-8">
                                                                    {(() => {
                                                                        const q = activeResource.quizData[quizState.currentQuestion];
                                                                        if (q.type === 'text') {
                                                                            return (
                                                                                <textarea
                                                                                    className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all font-medium"
                                                                                    rows={4}
                                                                                    placeholder="Type your answer here..."
                                                                                    value={quizState.answers[quizState.currentQuestion] || ''}
                                                                                    onChange={e => handleQuizAnswer(e.target.value)}
                                                                                />
                                                                            );
                                                                        } else if (q.type === 'multi-text') {
                                                                            return (
                                                                                <div className="space-y-3">
                                                                                    {(q.correctTexts || []).map((_: any, i: number) => (
                                                                                        <input
                                                                                            key={i}
                                                                                            className="w-full p-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:border-brand-blue focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-blue/10 transition-all font-medium"
                                                                                            placeholder={`Answer for blank ${i + 1}...`}
                                                                                            value={(quizState.answers[quizState.currentQuestion] || [])[i] || ''}
                                                                                            onChange={e => {
                                                                                                const currentArr = (quizState.answers[quizState.currentQuestion] || []);
                                                                                                const newArr = [...currentArr];
                                                                                                newArr[i] = e.target.value;
                                                                                                handleQuizAnswer(newArr);
                                                                                            }}
                                                                                        />
                                                                                    ))}
                                                                                </div>
                                                                            )
                                                                        }
                                                                        return q.options.map((opt: string, idx: number) => {
                                                                            const isSelected = q.type === 'multiple'
                                                                                ? (quizState.answers[quizState.currentQuestion] || []).includes(idx)
                                                                                : quizState.answers[quizState.currentQuestion] === idx;
                                                                            return (
                                                                                <button
                                                                                    key={idx}
                                                                                    onClick={() => handleQuizAnswer(idx)}
                                                                                    className={`w-full p-4 rounded-xl text-left font-medium transition-all border-2 flex items-center gap-3 ${isSelected
                                                                                        ? 'border-purple-600 bg-purple-50 text-purple-800'
                                                                                        : 'border-gray-100 hover:border-purple-200 hover:bg-gray-50 text-gray-600'
                                                                                        }`}
                                                                                >
                                                                                    <div className={`w-6 h-6 flex items-center justify-center rounded-${q.type === 'multiple' ? 'md' : 'full'} border transition-colors ${isSelected ? 'bg-purple-600 border-purple-600 text-white' : 'border-gray-300'}`}>
                                                                                        {isSelected ? <CheckCircle size={14} /> : <span className="text-[10px] font-bold text-gray-400">{String.fromCharCode(65 + idx)}</span>}
                                                                                    </div>
                                                                                    {opt}
                                                                                </button>
                                                                            );
                                                                        });
                                                                    })()}
                                                                </div>

                                                                <div className="mt-auto flex justify-between">
                                                                    <button
                                                                        onClick={handleQuizPrev}
                                                                        disabled={quizState.currentQuestion === 0}
                                                                        className="px-6 py-3 text-gray-400 font-bold hover:text-brand-dark disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                                                    >
                                                                        Previous
                                                                    </button>
                                                                    <button
                                                                        onClick={handleQuizNext}
                                                                        className="bg-brand-dark text-white px-8 py-3 rounded-xl font-bold hover:bg-black transition-colors"
                                                                    >
                                                                        {quizState.currentQuestion === activeResource.quizData.length - 1 ? 'Finish Quiz' : 'Next Question'}
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        ) : quizState.reviewMode ? (
                                                            <div className="flex-1 flex flex-col h-full max-h-[600px]">
                                                                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                                                                    <h2 className="text-2xl font-bold text-gray-800">Review Results</h2>
                                                                    <button onClick={() => setQuizState({ ...quizState, reviewMode: false })} className="text-sm font-bold text-brand-blue hover:underline">Back to Score</button>
                                                                </div>
                                                                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                                                                    {activeResource.quizData.map((q: any, idx: number) => {
                                                                        const ans = quizState.answers[idx];
                                                                        let isCorrect = false;
                                                                        if (q.type === 'single' || !q.type) isCorrect = Number(ans) === Number(q.correctIndex);
                                                                        else if (q.type === 'multiple') {
                                                                            const c = (q.correctIndices || []).slice().sort().join(',');
                                                                            const u = (ans || []).slice().sort().join(',');
                                                                            isCorrect = c === u && u.length > 0;
                                                                            isCorrect = c === u && u.length > 0;
                                                                        } else if (q.type === 'text') {
                                                                            isCorrect = ans?.toString().trim().toLowerCase() === q.correctText?.toString().trim().toLowerCase();
                                                                        } else if (q.type === 'multi-text') {
                                                                            const cArr = (q.correctTexts || []).map((s: string) => s.trim().toLowerCase());
                                                                            const uArr = (ans || []).map((s: string) => s.trim().toLowerCase());
                                                                            isCorrect = cArr.length > 0 && cArr.length === uArr.length && cArr.every((v: string, i: number) => v === uArr[i]);
                                                                        }

                                                                        return (
                                                                            <div key={idx} className={`p-5 rounded-2xl border-2 ${isCorrect ? 'border-green-100 bg-green-50/50' : 'border-red-100 bg-red-50/50'}`}>
                                                                                <div className="flex gap-4">
                                                                                    <div className={`font-bold mt-0.5 ${isCorrect ? 'text-green-600' : 'text-red-500'}`}>
                                                                                        {isCorrect ? <CheckCircle size={20} /> : <X size={20} />}
                                                                                    </div>
                                                                                    <div className="flex-1 min-w-0">
                                                                                        <p className="font-bold text-gray-800 mb-2 text-sm">{idx + 1}. {q.text}</p>
                                                                                        {q.imageUrl && <img src={q.imageUrl} className="h-24 rounded-lg mb-3 object-contain border bg-white" />}

                                                                                        <div className="space-y-1 text-xs">
                                                                                            <div className="flex gap-2">
                                                                                                <span className="font-bold text-gray-500 w-24 shrink-0">Your Answer:</span>
                                                                                                <span className={`font-medium ${isCorrect ? 'text-green-700' : 'text-red-600'}`}>
                                                                                                    {q.type === 'text' ? (ans || 'No Answer') : q.type === 'multiple' ? (ans?.map((i: number) => q.options[i]).join(', ') || 'None') : (q.options[ans] || 'None')}
                                                                                                </span>
                                                                                            </div>
                                                                                            {!isCorrect && (
                                                                                                <div className="flex gap-2">
                                                                                                    <span className="font-bold text-gray-500 w-24 shrink-0">Correct Answer:</span>
                                                                                                    <span className="font-bold text-brand-dark">
                                                                                                        {q.type === 'text' ? q.correctText : q.type === 'multi-text' ? (q.correctTexts || []).join(', ') : q.type === 'multiple' ? (q.correctIndices?.map((i: number) => q.options[i]).join(', ')) : q.options[q.correctIndex]}
                                                                                                    </span>
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                                <button
                                                                    onClick={() => setQuizState({ ...quizState, started: false, currentQuestion: 0, score: 0, finished: false, answers: {}, reviewMode: false })}
                                                                    className="mt-6 w-full py-4 rounded-xl bg-brand-dark text-white font-bold hover:bg-black flex-shrink-0"
                                                                >
                                                                    Retry Quiz
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <div className="flex-1 flex flex-col items-center justify-center text-center">
                                                                <div className="w-24 h-24 bg-green-50 rounded-full flex items-center justify-center mb-6">
                                                                    <CheckCircle size={48} className="text-green-600" />
                                                                </div>
                                                                <h2 className="text-4xl font-extrabold text-gray-800 mb-2">
                                                                    {Math.round((quizState.score / activeResource.quizData.length) * 100)}%
                                                                </h2>
                                                                <p className="text-gray-500 mb-8 font-medium">
                                                                    You scored {quizState.score} out of {activeResource.quizData.length} correct!
                                                                </p>
                                                                <div className="flex gap-4">
                                                                    <button
                                                                        onClick={() => setQuizState({ ...quizState, reviewMode: true })}
                                                                        className="bg-purple-100 text-purple-700 px-6 py-3 rounded-xl font-bold hover:bg-purple-200 transition-colors"
                                                                    >
                                                                        Review Answers
                                                                    </button>
                                                                    <button
                                                                        onClick={() => navigate('/learning')}
                                                                        className="bg-brand-blue text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors"
                                                                    >
                                                                        Back to Library
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    /* DEFAULT / FALLBACK */
                                                    <div className="w-full max-w-4xl aspect-[4/3] bg-gradient-to-br from-brand-blue/5 to-purple-50 rounded-3xl flex items-center justify-center relative overflow-hidden group border border-brand-blue/10">
                                                        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#2563EB_1px,transparent_1px)] [background-size:16px_16px]"></div>
                                                        <div className="relative z-10 flex flex-col items-center gap-6 p-8 text-center">
                                                            <div className="w-24 h-24 bg-white rounded-3xl shadow-xl flex items-center justify-center text-brand-blue mb-2 rotate-3 group-hover:rotate-6 transition-transform">
                                                                {activeResource.type === 'Quiz' ? <CheckCircle size={48} /> : <FileText size={48} />}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-2xl font-bold text-brand-dark mb-2">{activeResource.title}</h3>
                                                                <p className="text-gray-500 max-w-md mx-auto">
                                                                    This resource type ({activeResource.type}) is best viewed in its native format.
                                                                </p>
                                                            </div>
                                                            <a
                                                                href={activeResource.url}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="bg-brand-blue text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/20"
                                                            >
                                                                {activeResource.type === 'Quiz' ? 'Start Quiz' : 'Open Resource'}
                                                            </a>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Floating AI Button (Mobile) */}

                                        {/* AI Chat Overlay */}
                                        {isAiChatOpen && canUseAi && (
                                            <AIChatOverlay user={user} resource={activeResource} onClose={() => setIsAiChatOpen(false)} />
                                        )}
                                    </div >
                                </>
                            );
                        })()}
                    </div>
                </ActivityTracker>
            ) : (
                // LIBRARY MODE
                <div className="max-w-7xl mx-auto space-y-8 animate-fade-in-up">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                        <div>
                            <h1 className="text-3xl font-extrabold text-brand-dark">Learning Library</h1>
                            <p className="text-gray-500 mt-1">Access all your study materials in one place.</p>
                        </div>
                        <div className="flex gap-2">
                            <span className="px-4 py-2 bg-white rounded-xl text-xs font-bold text-gray-500 border border-gray-100">
                                {filteredResources.length} Resources
                            </span>
                        </div>
                    </div>

                    {isLoading ? (
                        <div className="flex justify-center py-20">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue"></div>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {filteredResources.length > 0 ? filteredResources.map((res, idx) => {
                                const style = getThumbnailStyle(idx);
                                const Icon = style.icon;
                                // V3 Update: Check new isMcampExclusive flag or fallback ID convention
                                const isMcampResource = (res as any).isMcampExclusive || res.id.startsWith('m');
                                let isLocked = false;
                                if (res.isPro && isMcampResource) {
                                    isLocked = false;
                                } else if (res.isPro) {
                                    isLocked = !user.isSubscribed;
                                } else if (isMcampResource) {
                                    isLocked = !user.mcamp?.isEnrolled;
                                }

                                return (
                                    <div
                                        key={res.id}
                                        onClick={() => handleResourceClick(res)}
                                        className={`bg-white rounded-[2rem] p-4 shadow-sm border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer group flex flex-col h-full relative overflow-hidden`}
                                    >
                                        {/* Thumbnail Area */}
                                        <div className={`aspect-video rounded-2xl mb-4 overflow-hidden relative ${res.type !== 'Video' ? style.bg : ''} ${isLocked ? 'opacity-60' : ''}`}>
                                            {res.type === 'Video' ? (
                                                <>
                                                    {res.thumbnailUrl ? (
                                                        <img
                                                            src={res.thumbnailUrl}
                                                            alt={res.title}
                                                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                        />
                                                    ) : (
                                                        <div className={`w-full h-full ${style.bg} group-hover:scale-105 transition-transform duration-500 flex items-center justify-center opacity-80`}>
                                                            <Video size={48} className={style.text} />
                                                        </div>
                                                    )}
                                                    {!isLocked && (
                                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center group-hover:bg-black/10 transition-colors">
                                                            <div className="w-10 h-10 bg-white/90 backdrop-blur rounded-full flex items-center justify-center text-brand-dark shadow-lg">
                                                                <PlayCircle size={20} fill="currentColor" className="text-brand-dark" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </>
                                            ) : (
                                                <div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
                                                    <div className={`w-12 h-12 rounded-2xl ${style.bg} brightness-95 flex items-center justify-center ${style.text} mb-2`}>
                                                        <Icon size={24} />
                                                    </div>
                                                </div>
                                            )}

                                            {/* Type Badge */}
                                            <div className="absolute top-3 left-3 px-2 py-1 bg-white/90 backdrop-blur rounded-lg text-[10px] font-bold uppercase tracking-wide text-brand-dark shadow-sm">
                                                {res.type}
                                            </div>
                                            {res.isPro && !isMcampResource && (
                                                <div className="absolute top-3 right-3 px-2 py-1 bg-brand-dark rounded-lg text-[10px] font-bold uppercase tracking-wide text-brand-yellow shadow-sm flex items-center gap-1">
                                                    <Star size={8} fill="currentColor" /> Pro
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Area */}
                                        <div className={`flex-1 flex flex-col ${isLocked ? 'opacity-60' : ''}`}>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">
                                                {res.year ? <span className="text-brand-blue">{res.year} • </span> : ''}{res.subject}
                                            </p>
                                            <h3 className="font-bold text-brand-dark leading-tight mb-3 line-clamp-2">{res.title}</h3>

                                            <div className="mt-auto pt-3 border-t border-gray-50 flex justify-between items-center">
                                                <span className="text-xs text-gray-400 font-medium">{res.dateAdded}</span>
                                                {!isLocked && (
                                                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full rounded-full transition-all duration-500 ${(userProgress[res.id]?.progress || 0) >= 100 ? 'bg-green-500' : 'bg-brand-blue'}`}
                                                            style={{ width: `${userProgress[res.id]?.progress || 0}%` }}
                                                        ></div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Locked Overlay */}
                                        {isLocked && (
                                            <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] flex items-center justify-center z-10 transition-colors hover:bg-white/20">
                                                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg text-brand-dark">
                                                    <Lock size={20} />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            }) : (
                                <div className="col-span-full py-16 text-center">
                                    <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <FileText size={40} className="text-gray-300" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900 mb-1">No matches found</h3>
                                    <p className="text-gray-500">Try searching for a different topic or keyword.</p>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )
            }

            {/* AI Chat Overlay */}
            {isAiChatOpen && activeResource && (
                <AIChatOverlay
                    key={activeResource.id}
                    user={user}
                    resource={activeResource}
                    onClose={() => setIsAiChatOpen(false)}
                    currentPage={pageNumber}
                />
            )}
        </DashboardLayout >
    );
};
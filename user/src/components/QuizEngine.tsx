import * as React from 'react';
import { QuizSession, User } from '../types';
import {
    Brain, Timer, Check, ChevronLeft, ChevronRight, HelpCircle, X,
    Trophy, Clock, BookOpen, Shield, AlertCircle, ArrowRight, CheckCircle,
    Edit, CheckCircle2
} from 'lucide-react';

export const QuizEngine: React.FC<{
    session: QuizSession;
    onFinish: (answers: Record<string, any>) => void;
    onCancel: () => void;
}> = ({ session, onFinish, onCancel }) => {
    const quizKey = `mcamp_quiz_${session.id}`;

    // Initialize state from localStorage or defaults
    const [currentIdx, setCurrentIdx] = React.useState(() => {
        const saved = localStorage.getItem(`${quizKey}_idx`);
        return saved ? parseInt(saved) : 0;
    });

    const [answers, setAnswers] = React.useState<Record<string, any>>(() => {
        const saved = localStorage.getItem(`${quizKey}_answers`);
        return saved ? JSON.parse(saved) : {};
    });

    const [startTime] = React.useState(() => {
        const saved = localStorage.getItem(`${quizKey}_start`);
        const now = Date.now();
        if (saved) return parseInt(saved);
        localStorage.setItem(`${quizKey}_start`, now.toString());
        return now;
    });

    const [timeLeft, setTimeLeft] = React.useState(() => {
        const totalSecs = session.durationMinutes * 60;
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        return Math.max(0, totalSecs - elapsed);
    });

    const [showConfirmSubmit, setShowConfirmSubmit] = React.useState(false);

    // Persistence Effect
    React.useEffect(() => {
        localStorage.setItem(`${quizKey}_idx`, currentIdx.toString());
        localStorage.setItem(`${quizKey}_answers`, JSON.stringify(answers));
    }, [currentIdx, answers, quizKey]);

    // Precise Timer Effect
    React.useEffect(() => {
        if (timeLeft <= 0) {
            handleFinalSubmit(answers);
            return;
        }

        const timer = setInterval(() => {
            const totalSecs = session.durationMinutes * 60;
            const elapsed = Math.floor((Date.now() - startTime) / 1000);
            const remaining = Math.max(0, totalSecs - elapsed);

            setTimeLeft(remaining);

            if (remaining <= 0) {
                clearInterval(timer);
                handleFinalSubmit(answers);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [startTime, session.durationMinutes, answers]);

    const handleFinalSubmit = (finalAnswers: Record<string, any>) => {
        localStorage.removeItem(`${quizKey}_idx`);
        localStorage.removeItem(`${quizKey}_answers`);
        localStorage.removeItem(`${quizKey}_start`);
        onFinish(finalAnswers);
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    const currentQuestion = session.questions[currentIdx];

    const handleAnswerChange = (val: any) => {
        setAnswers(prev => ({ ...prev, [currentQuestion.id]: val }));
    };

    const isAnswered = (id: string) => {
        const val = answers[id];
        if (val === undefined || val === null) return false;
        if (Array.isArray(val)) return val.some(v => v !== undefined && v !== '');
        return val !== '';
    };

    return (
        <div className="fixed inset-0 z-[100] bg-white flex flex-col overflow-hidden animate-fade-in font-sans">
            {/* Exam Header */}
            <header className="bg-brand-dark text-white px-4 md:px-8 py-3 md:py-6 flex justify-between items-center shrink-0 shadow-2xl relative z-10">
                <div className="flex items-center gap-3 md:gap-5 overflow-hidden">
                    <div className="bg-brand-blue/20 p-2 md:p-3 rounded-2xl border border-brand-blue/30 shrink-0">
                        <Brain size={20} className="md:w-6 md:h-6 text-brand-blue" />
                    </div>
                    <div className="truncate">
                        <h2 className="font-extrabold text-sm md:text-xl truncate leading-tight">{session.title}</h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-tighter">Cohort Progress</span>
                            <div className="w-20 md:w-32 h-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-brand-blue transition-all duration-500"
                                    style={{ width: `${((currentIdx + 1) / session.questions.length) * 100}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 md:gap-8">
                    <div className={`flex items-center gap-2 md:gap-3 px-4 md:px-6 py-2 md:py-3 rounded-2xl md:rounded-[1.2rem] font-mono font-black text-base md:text-2xl transition-colors ${timeLeft < 60 ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30' : 'bg-white/5 text-brand-yellow border border-white/10'}`}>
                        <Timer size={20} className="md:w-6 md:h-6" />
                        {formatTime(timeLeft)}
                    </div>
                    <button
                        onClick={() => setShowConfirmSubmit(true)}
                        className="bg-brand-blue hover:bg-blue-600 text-white px-5 md:px-8 py-2 md:py-3.5 rounded-xl md:rounded-[1.2rem] font-black text-xs md:text-sm transition-all shadow-xl shadow-brand-blue/20 shrink-0 hover:-translate-y-0.5"
                    >
                        End Session
                    </button>
                </div>
            </header>

            <div className="flex flex-1 overflow-hidden bg-gray-50/30">
                {/* Navigation Sidebar (Desktop Only) */}
                <aside className="hidden lg:flex w-80 bg-white border-r border-gray-100 flex-col p-8 overflow-y-auto">
                    <div className="mb-8">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">Question Matrix</h3>
                        <p className="text-xs text-gray-400 font-medium">Select a tile to jump directly to a challenge.</p>
                    </div>

                    <div className="grid grid-cols-4 gap-4">
                        {session.questions.map((q, i) => (
                            <button
                                key={q.id}
                                onClick={() => setCurrentIdx(i)}
                                className={`w-full aspect-square rounded-2xl font-black text-sm transition-all flex items-center justify-center border-2 ${currentIdx === i
                                    ? 'bg-brand-dark text-white border-brand-dark shadow-xl scale-110 relative z-10'
                                    : isAnswered(q.id)
                                        ? 'bg-brand-blue/5 border-brand-blue/20 text-brand-blue hover:bg-brand-blue/10'
                                        : 'bg-white border-gray-100 text-gray-300 hover:border-gray-200'
                                    }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>

                    <div className="mt-auto pt-8 border-t border-gray-50 space-y-4">
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                            <div className="w-4 h-4 bg-brand-dark rounded-lg shadow-sm"></div> Active
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                            <div className="w-4 h-4 bg-brand-blue/20 border-2 border-brand-blue/20 rounded-lg"></div> Attempted
                        </div>
                        <div className="flex items-center gap-3 text-xs font-bold text-gray-500">
                            <div className="w-4 h-4 bg-white border-2 border-gray-100 rounded-lg"></div> Remaining
                        </div>
                    </div>
                </aside>

                {/* Question Area */}
                <main className="flex-1 overflow-y-auto p-4 md:p-16 lg:p-24 relative">
                    <div className="max-w-3xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <span className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest leading-none">Phase {currentIdx + 1}</span>
                                <span className="text-gray-300 font-bold">/</span>
                                <span className="text-gray-400 text-xs font-bold">{session.questions.length} Concepts</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-lg">
                                <HelpCircle size={14} className="text-gray-400" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{currentQuestion.type || 'SBO'} Mode</span>
                            </div>
                        </div>

                        <div className="animate-fade-in-up">
                            <h1 className="text-2xl md:text-4xl font-black text-brand-dark leading-[1.3] mb-8 md:mb-12">
                                {currentQuestion.prompt}
                            </h1>

                            {currentQuestion.imageUrl && (
                                <div className="mb-8 md:mb-12 rounded-[2rem] overflow-hidden border-4 border-white shadow-2xl relative group">
                                    <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors"></div>
                                    <img src={currentQuestion.imageUrl} alt="Clinical Reference" className="w-full h-auto object-cover max-h-[400px]" />
                                </div>
                            )}

                            <div className="space-y-4 md:space-y-5">
                                {(currentQuestion.type === 'SBO' || !currentQuestion.type) && currentQuestion.options?.map((opt, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handleAnswerChange(i)}
                                        className={`w-full text-left p-5 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all flex items-center gap-5 md:gap-6 group relative overflow-hidden ${answers[currentQuestion.id] === i
                                            ? 'border-brand-blue bg-blue-50/30'
                                            : 'border-white bg-white hover:border-gray-200 shadow-sm hover:shadow-md'
                                            }`}
                                    >
                                        <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl border-2 flex items-center justify-center font-black text-sm md:text-xl shrink-0 transition-all ${answers[currentQuestion.id] === i
                                            ? 'bg-brand-blue border-brand-blue text-white rotate-6 shadow-lg shadow-brand-blue/30'
                                            : 'border-gray-100 text-gray-400 group-hover:border-brand-blue/30 group-hover:text-brand-blue group-hover:-rotate-3'
                                            }`}>
                                            {String.fromCharCode(65 + i)}
                                        </div>
                                        <span className={`text-base md:text-xl font-bold transition-colors ${answers[currentQuestion.id] === i ? 'text-brand-dark' : 'text-gray-600'}`}>{opt}</span>
                                        {answers[currentQuestion.id] === i && (
                                            <div className="absolute right-6 opacity-20">
                                                <CheckCircle2 size={48} className="text-brand-blue" />
                                            </div>
                                        )}
                                    </button>
                                ))}

                                {currentQuestion.type === 'MCQ' && currentQuestion.options?.map((opt, i) => {
                                    const currentAnswers = (answers[currentQuestion.id] as number[]) || [];
                                    const isChecked = currentAnswers.includes(i);
                                    const toggle = () => {
                                        const next = isChecked ? currentAnswers.filter(a => a !== i) : [...currentAnswers, i];
                                        handleAnswerChange(next);
                                    };
                                    return (
                                        <button
                                            key={i}
                                            onClick={toggle}
                                            className={`w-full text-left p-5 md:p-7 rounded-[1.5rem] md:rounded-[2rem] border-2 transition-all flex items-center gap-5 md:gap-6 group ${isChecked
                                                ? 'border-brand-blue bg-blue-50/30'
                                                : 'border-white bg-white hover:border-gray-200 shadow-sm hover:shadow-md'
                                                }`}
                                        >
                                            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl border-2 flex items-center justify-center shrink-0 transition-all ${isChecked
                                                ? 'bg-brand-blue border-brand-blue text-white shadow-lg'
                                                : 'border-gray-100 group-hover:border-brand-blue/30'
                                                }`}>
                                                {isChecked ? <Check size={24} strokeWidth={4} /> : <div className="w-2 h-2 rounded-full bg-gray-100"></div>}
                                            </div>
                                            <span className={`text-base md:text-xl font-bold ${isChecked ? 'text-brand-dark' : 'text-gray-600'}`}>{opt}</span>
                                        </button>
                                    );
                                })}

                                {(currentQuestion.type === 'FIB' || currentQuestion.type === 'FILL_GAP' || currentQuestion.type === 'IMAGE_ID') && (
                                    <div className="relative group">
                                        <div className="absolute left-6 top-1/2 -translate-y-1/2 pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                                            <Edit size={24} className="text-brand-blue" />
                                        </div>
                                        <input
                                            type="text"
                                            placeholder="Standard medical nomenclature expected..."
                                            value={answers[currentQuestion.id] || ''}
                                            onChange={(e) => handleAnswerChange(e.target.value)}
                                            className="w-full pl-16 pr-8 py-6 md:py-8 bg-white border-2 border-white shadow-sm focus:shadow-xl focus:border-brand-blue outline-none transition-all rounded-[1.5rem] md:rounded-[2rem] font-black text-brand-dark text-lg md:text-2xl placeholder:text-gray-300 placeholder:font-bold"
                                        />
                                    </div>
                                )}

                                {currentQuestion.type === 'MFIB' && (
                                    <div className="space-y-4">
                                        {(Array.isArray(currentQuestion.correctAnswer) ? currentQuestion.correctAnswer : []).map((_: any, i: number) => (
                                            <div key={i} className="relative group">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-black text-brand-blue/40 uppercase tracking-tighter">Gap #{i + 1}</span>
                                                <input
                                                    type="text"
                                                    placeholder="Missing term..."
                                                    value={(answers[currentQuestion.id] || [])[i] || ''}
                                                    onChange={(e) => {
                                                        const current = Array.isArray(answers[currentQuestion.id]) ? [...answers[currentQuestion.id]] : [];
                                                        const next = [...current];
                                                        next[i] = e.target.value;
                                                        handleAnswerChange(next);
                                                    }}
                                                    className="w-full pl-24 pr-8 py-6 bg-white border-2 border-white shadow-sm focus:shadow-xl focus:border-brand-blue outline-none transition-all rounded-2xl md:rounded-[1.5rem] font-black text-brand-dark text-lg md:text-xl"
                                                />
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {currentQuestion.type === 'ESSAY' && (
                                    <div className="relative">
                                        <textarea
                                            placeholder="Provide your structured clinical reasoning here..."
                                            value={answers[currentQuestion.id] || ''}
                                            onChange={(e) => handleAnswerChange(e.target.value)}
                                            className="w-full p-8 bg-white border-2 border-white shadow-sm focus:shadow-xl focus:border-brand-blue outline-none transition-all rounded-[2rem] font-bold text-brand-dark min-h-[250px] md:min-h-[350px] resize-none text-lg md:text-xl leading-relaxed"
                                        />
                                        <div className="absolute bottom-6 right-8 text-[10px] font-black text-gray-300 uppercase tracking-widest">Essay Submission Mode</div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Navigation Footer */}
                        <div className="flex justify-between items-center py-12 md:py-20 gap-6">
                            <button
                                disabled={currentIdx === 0}
                                onClick={() => setCurrentIdx(currentIdx - 1)}
                                className="flex items-center gap-2 md:gap-3 px-6 md:px-10 py-4 rounded-2xl font-black text-gray-400 hover:text-brand-dark disabled:opacity-0 transition-all hover:bg-white active:scale-95 shadow-sm"
                            >
                                <ChevronLeft size={20} className="md:w-6 md:h-6" /> Back
                            </button>

                            <button
                                onClick={() => {
                                    if (currentIdx === session.questions.length - 1) {
                                        setShowConfirmSubmit(true);
                                    } else {
                                        setCurrentIdx(currentIdx + 1);
                                    }
                                }}
                                className={`flex items-center gap-3 md:gap-4 px-8 md:px-16 py-5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black text-white transition-all shadow-2xl active:scale-95 text-base md:text-xl ${currentIdx === session.questions.length - 1
                                    ? 'bg-green-600 hover:bg-green-700 shadow-green-600/30'
                                    : 'bg-brand-dark hover:bg-black shadow-brand-dark/30'
                                    }`}
                            >
                                {currentIdx === session.questions.length - 1 ? 'End Assessment' : 'Continue'}
                                {currentIdx !== session.questions.length - 1 && <ChevronRight size={20} className="md:w-6 md:h-6" />}
                            </button>
                        </div>
                    </div>
                </main>
            </div>

            {/* Verification Modal */}
            {showConfirmSubmit && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-brand-dark/40 backdrop-blur-md animate-fade-in">
                    <div className="bg-white rounded-[3rem] p-10 md:p-14 max-w-lg w-full text-center shadow-[0_35px_60px_-15px_rgba(0,0,0,0.3)] relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-2 bg-brand-blue"></div>
                        <button
                            onClick={() => setShowConfirmSubmit(false)}
                            className="absolute top-8 right-8 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={28} />
                        </button>

                        <div className="w-20 h-20 md:w-24 md:h-24 bg-blue-50 text-brand-blue rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner shadow-blue-100">
                            <Shield size={40} className="md:w-12 md:h-12" />
                        </div>

                        <h3 className="text-2xl md:text-4xl font-black text-brand-dark mb-4">Confirm Submission?</h3>
                        <p className="text-sm md:text-lg text-gray-500 mb-10 leading-relaxed font-medium">
                            You've answered <span className="text-brand-blue font-black underline decoration-4 underline-offset-4">{Object.values(answers).filter(v => !!v).length} of {session.questions.length}</span> challenges. Are you ready to submit your assessment for official grading?
                        </p>

                        <div className="flex flex-col gap-4">
                            <button
                                onClick={() => handleFinalSubmit(answers)}
                                className="w-full bg-brand-blue text-white py-5 md:py-6 rounded-[1.5rem] md:rounded-[2rem] font-black text-lg md:text-2xl hover:bg-blue-600 transition-all shadow-xl shadow-brand-blue/30 active:scale-95"
                            >
                                Submit Official Attempt
                            </button>
                            <button
                                onClick={() => setShowConfirmSubmit(false)}
                                className="w-full bg-gray-50 text-gray-500 py-4 md:py-5 rounded-2xl font-black hover:bg-gray-100 transition-all text-sm md:text-base grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                            >
                                Continue Working
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export const QuizIntro: React.FC<{
    session: QuizSession;
    onStart: () => void;
    onClose: () => void;
    user: User;
}> = ({ session, onStart, onClose, user }) => {

    const hasAttempted = !!user.quizAttempts?.[session.id];
    const attempt = user.quizAttempts?.[session.id];

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-dark/50 backdrop-blur-sm animate-pop-in">
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-8 md:p-12 max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative scrollbar-hide">
                <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-brand-blue/5 rounded-full -translate-y-12 translate-x-12"></div>

                <button onClick={onClose} className="absolute top-6 sm:top-8 right-6 sm:top-8 text-gray-400 hover:text-gray-600 transition-colors z-20">
                    <X size={24} />
                </button>

                <div className="relative z-10">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-4 mb-6 sm:mb-8">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-brand-yellow/20 text-brand-yellow rounded-2xl flex items-center justify-center shrink-0 shadow-sm">
                            <Trophy size={28} className="sm:w-8 sm:h-8" />
                        </div>
                        <div>
                            <h2 className="text-xl sm:text-3xl font-extrabold text-brand-dark leading-tight">{session.title}</h2>
                            <p className="text-gray-400 font-bold uppercase tracking-wider text-[10px] sm:text-xs mt-1">Week {session.weekNumber} Mastery Challenge</p>
                        </div>
                    </div>

                    {hasAttempted ? (
                        <div className={`border rounded-3xl p-6 sm:p-8 text-center mb-6 sm:mb-8 animate-fade-in ${attempt!.status === 'completed'
                            ? 'bg-green-50 border-green-100'
                            : 'bg-blue-50 border-blue-100'
                            }`}>
                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${attempt!.status === 'completed' ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-brand-blue'
                                }`}>
                                {attempt!.status === 'completed' ? <Trophy size={20} className="sm:w-6 sm:h-6" /> : <CheckCircle size={20} className="sm:w-6 sm:h-6" />}
                            </div>

                            <h3 className="text-lg sm:text-xl font-bold text-brand-dark mb-2">
                                {attempt!.status === 'completed' ? 'Quiz Graded!' : 'Attempt Submitted'}
                            </h3>

                            <p className="text-xs sm:text-sm text-gray-500 mb-6">
                                {attempt!.status === 'completed'
                                    ? `Great effort! Your results are ready.`
                                    : `You submitted this quiz on ${new Date(attempt!.submittedAt).toLocaleDateString()}. Results are currently being processed.`
                                }
                            </p>

                            <div className={`inline-flex items-center gap-2 bg-white px-4 py-3 rounded-xl shadow-sm border ${attempt!.status === 'completed' ? 'border-green-100' : 'border-blue-50'
                                }`}>
                                {attempt!.status === 'completed' ? (
                                    <>
                                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Final Score</span>
                                        <div className="h-4 w-px bg-gray-200"></div>
                                        <span className="text-xl font-extrabold text-green-600">{attempt!.score}%</span>
                                    </>
                                ) : (
                                    <>
                                        <Clock size={14} className="text-brand-blue" />
                                        <span className="text-[10px] sm:text-xs font-bold text-brand-blue">Grading in progress</span>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <p className="text-sm sm:text-lg text-gray-600 mb-6 sm:mb-10 leading-relaxed">
                                {session.description}
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-8 sm:mb-12">
                                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-xl">
                                    <div className="mt-0.5 sm:mt-1 bg-brand-blue/10 text-brand-blue p-2 rounded-lg"><Clock size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                                    <div>
                                        <p className="font-bold text-brand-dark text-xs sm:text-sm">Duration</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">{session.durationMinutes} Minutes</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-xl">
                                    <div className="mt-0.5 sm:mt-1 bg-brand-blue/10 text-brand-blue p-2 rounded-lg"><BookOpen size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                                    <div>
                                        <p className="font-bold text-brand-dark text-xs sm:text-sm">Questions</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">{session.questions.length} Items</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-xl">
                                    <div className="mt-0.5 sm:mt-1 bg-brand-blue/10 text-brand-blue p-2 rounded-lg"><Shield size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                                    <div>
                                        <p className="font-bold text-brand-dark text-xs sm:text-sm">One Attempt</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">Cannot be restarted.</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 sm:gap-4 p-3 sm:p-0 bg-gray-50 sm:bg-transparent rounded-xl">
                                    <div className="mt-0.5 sm:mt-1 bg-brand-blue/10 text-brand-blue p-2 rounded-lg"><Brain size={16} className="sm:w-[18px] sm:h-[18px]" /></div>
                                    <div>
                                        <p className="font-bold text-brand-dark text-xs sm:text-sm">Blind Results</p>
                                        <p className="text-[10px] sm:text-xs text-gray-500">Scores hidden until graded.</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3 mb-8 sm:mb-10">
                                <AlertCircle size={16} className="text-amber-500 mt-0.5 shrink-0 sm:w-[18px] sm:h-[18px]" />
                                <p className="text-[10px] sm:text-xs font-medium text-amber-700 leading-relaxed">
                                    <strong>Warning:</strong> Stable internet required. Timer continues if tab is closed.
                                </p>
                            </div>

                            <button
                                onClick={onStart}
                                className="w-full bg-brand-dark text-white py-4 sm:py-5 rounded-xl sm:rounded-[1.5rem] font-extrabold text-lg sm:text-xl hover:bg-black transition-all shadow-xl shadow-brand-dark/30 hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                            >
                                Begin Challenge <ArrowRight size={20} className="sm:w-6 sm:h-6" />
                            </button>
                        </>
                    )}

                    {!hasAttempted && (
                        <button onClick={onClose} className="w-full mt-4 text-gray-400 font-bold text-[10px] sm:text-sm hover:text-gray-600 transition-colors">
                            Maybe Later
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

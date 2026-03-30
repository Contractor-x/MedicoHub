import * as React from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight, Star, Users, CheckCircle2, PlayCircle, BookOpen,
    Brain, Trophy, ChevronDown, ChevronUp, Shield, Smartphone,
    Zap, BarChart, Search, ShoppingBag, Layout, Clock, Target,
    HelpCircle, GraduationCap
} from 'lucide-react';
import { Player } from '@lottiefiles/react-lottie-player';
import { AppRoute } from '../types';

const FaqItem: React.FC<{ question: string; answer: string }> = ({ question, answer }) => {
    const [isOpen, setIsOpen] = React.useState(false);

    return (
        <div className="border-b border-gray-100 last:border-0">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full py-6 flex justify-between items-center text-left hover:text-brand-blue transition-colors focus:outline-none"
            >
                <span className="text-lg font-bold text-brand-dark">{question}</span>
                {isOpen ? <ChevronUp className="text-brand-blue" /> : <ChevronDown className="text-gray-400" />}
            </button>
            <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96 opacity-100 mb-6' : 'max-h-0 opacity-0'}`}
            >
                <p className="text-gray-500 leading-relaxed pr-8">
                    {answer}
                </p>
            </div>
        </div>
    );
};

export const LandingPage: React.FC = () => {
    return (
        <div className="overflow-hidden bg-white">
            {/* Decorative Scribbles */}
            <div className="absolute top-32 left-10 w-24 h-24 text-brand-yellow animate-float opacity-80 pointer-events-none hidden lg:block">
                <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="currentColor" d="M44.7,-76.4C58.9,-69.2,71.8,-59.1,79.6,-46.3C87.4,-33.5,90.1,-18,87.9,-3.8C85.7,10.5,78.6,23.5,70,35.4C61.4,47.3,51.3,58.1,39.3,66.5C27.2,74.9,13.3,80.9,-0.6,81.9C-14.5,82.9,-29.4,78.9,-41.9,70.8C-54.4,62.7,-64.5,50.6,-71.4,37.3C-78.3,24,-82,9.5,-80.1,-4.2C-78.2,-17.9,-70.7,-30.8,-60.7,-41C-50.7,-51.2,-38.2,-58.7,-25.6,-66.6C-13,-74.5,-0.3,-82.8,13.5,-85.2C27.3,-87.6,41.1,-84,44.7,-76.4Z" transform="translate(100 100)" />
                </svg>
            </div>

            <div className="relative pt-32 pb-20 lg:pt-40 lg:pb-32 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">

                {/* Hero Section */}
                <div className="grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
                    <div className="text-center lg:text-left z-10">
                        <div className="inline-flex items-center gap-2 bg-blue-50 text-brand-blue px-4 py-2 rounded-full text-sm font-bold mb-8 animate-pop-in">
                            <span className="flex h-2 w-2 rounded-full bg-brand-blue"></span>
                            The #1 Platform for Medical Students
                        </div>

                        <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-brand-dark mb-6 leading-tight">
                            Build the Discipline of a <br />
                            <span className="marker-highlight text-brand-dark">Distinction Candidate.</span>
                        </h1>

                        <p className="text-xl text-gray-500 mb-10 max-w-lg mx-auto lg:mx-0 font-medium leading-relaxed">
                            The elite academic ecosystem for serious medical students seeking structure, mentorship, and proven systems for excellence.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <Link
                                to={AppRoute.MCAMP}
                                className="bg-brand-blue text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-blue-600 transition-all shadow-xl shadow-brand-blue/30 hover:-translate-y-1 flex items-center justify-center gap-2"
                            >
                                Apply for MCAMP
                            </Link>
                            <Link
                                to={AppRoute.LEARNING}
                                className="bg-white text-brand-dark border-2 border-gray-100 px-8 py-4 rounded-full font-bold text-lg hover:border-brand-blue hover:text-brand-blue transition-all flex items-center justify-center gap-2"
                            >
                                Explore The Academy
                            </Link>
                        </div>

                        <div className="mt-12 flex items-center justify-center lg:justify-start gap-4">
                            <div className="flex -space-x-3">
                                {[1, 2, 3, 4].map(i => (
                                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gray-200 overflow-hidden">
                                        <img src={`https://picsum.photos/100/100?random=${i}`} alt="User" className="w-full h-full object-cover" />
                                    </div>
                                ))}
                            </div>
                            <div>
                                <p className="font-bold text-brand-dark">Trusted by distinction-oriented medical students.</p>
                                <div className="flex text-yellow-400 text-sm">
                                    ★★★★★
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Hero Visual */}
                    <div className="relative z-0 lg:ml-10 animate-float">
                        <div className="relative rounded-[2.5rem] overflow-hidden bg-brand-blue/5 border-4 border-white shadow-2xl">
                            <img src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80" alt="Student" className="w-full h-auto object-cover" />

                            {/* Floating Cards */}
                            <div className="absolute bottom-8 left-8 bg-white p-4 rounded-2xl shadow-xl flex items-center gap-4 max-w-xs animate-bounce-slow">
                                <div className="bg-green-100 p-3 rounded-full text-green-600">
                                    <CheckCircle2 size={24} />
                                </div>
                                <div>
                                    <p className="font-bold text-gray-900">Quiz Completed</p>
                                    <p className="text-xs text-gray-500">You scored 98% in Anatomy!</p>
                                </div>
                            </div>

                            <div className="absolute top-12 right-8 bg-brand-yellow text-brand-dark px-6 py-3 rounded-xl font-bold transform rotate-6 shadow-lg border-2 border-brand-dark">
                                Top 1% Tutors
                            </div>
                        </div>
                    </div>
                </div>

                {/* Why Medico Hub? Section */}
                <div className="mt-32">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-5xl font-extrabold text-brand-dark mb-4">Why Medico Hub?</h2>
                        <p className="text-gray-500 text-lg">Everything you need to secure your status in the elite academic bracket.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {/* Card 1 */}
                        <div className="bg-brand-light rounded-[2rem] p-8 hover:bg-blue-50 transition-colors group">
                            <div className="w-16 h-16 mb-6 bg-white rounded-2xl flex items-center justify-center text-brand-blue shadow-sm group-hover:scale-110 transition-transform">
                                <Users size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-brand-dark mb-3">Structured Mentorship</h3>
                            <p className="text-gray-600 leading-relaxed">Move beyond random study. Gain access to expert guidance, 1:1 sessions, and a system others can follow.</p>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-brand-light rounded-[2rem] p-8 hover:bg-purple-50 transition-colors group">
                            <div className="w-16 h-16 mb-6 bg-white rounded-2xl flex items-center justify-center text-brand-purple shadow-sm group-hover:scale-110 transition-transform">
                                <BookOpen size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-brand-dark mb-3">Curated Academic Resources</h3>
                            <p className="text-gray-600 leading-relaxed">A centralized library of high-yield notes, clinical case studies, and premium tools like Atlas 3D and Ninja Nerd.</p>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-brand-light rounded-[2rem] p-8 hover:bg-yellow-50 transition-colors group">
                            <div className="w-16 h-16 mb-6 bg-white rounded-2xl flex items-center justify-center text-brand-yellow shadow-sm group-hover:scale-110 transition-transform">
                                <Target size={32} />
                            </div>
                            <h3 className="text-2xl font-bold text-brand-dark mb-3">Accountability Framework</h3>
                            <p className="text-gray-600 leading-relaxed">Daily tasks and weekly milestones designed to build consistent habits and ensure you never fall behind.</p>
                        </div>
                    </div>
                </div>

                {/* The 90-Day Challenge Block (Dark Section) */}
                <div className="mt-32">
                    <div className="relative bg-brand-dark rounded-[3rem] p-12 lg:p-20 overflow-hidden text-center lg:text-left">
                        <div className="absolute top-0 right-0 w-[50%] h-full bg-gradient-to-l from-brand-yellow/20 to-transparent blur-3xl"></div>

                        <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-brand-yellow text-brand-dark px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider mb-6">
                                    Flagship Program
                                </div>
                                <h2 className="text-4xl lg:text-6xl font-extrabold text-white mb-6 leading-tight">
                                    The 90-Day <br /><span className="text-brand-yellow">Distinction</span> Cohort.
                                </h2>
                                <p className="text-gray-300 text-lg mb-8 leading-relaxed max-w-lg mx-auto lg:mx-0">
                                    MCAMP is an intensive mentorship and accountability program designed to help you master Anatomy, Physiology, and Biochemistry in just 3 months. Limited to 20 slots.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                                    <Link to={AppRoute.MCAMP} className="bg-brand-yellow text-brand-dark px-8 py-4 rounded-full font-bold text-lg hover:bg-white transition-all shadow-xl shadow-brand-yellow/20 flex items-center justify-center gap-2">
                                        Join the Next Cohort <ArrowRight size={20} />
                                    </Link>
                                </div>
                            </div>

                            {/* Visual */}
                            <div className="relative mx-auto lg:mx-0">
                                <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/20 transform rotate-2">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="w-12 h-12 rounded-full bg-brand-blue flex items-center justify-center text-white font-bold">
                                            <Trophy size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-white font-bold text-lg">Goal: Distinction</h4>
                                            <p className="text-gray-400 text-sm">20 Slots Only</p>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="h-2 bg-white/10 rounded-full w-full overflow-hidden">
                                            <div className="h-full bg-brand-yellow w-3/4"></div>
                                        </div>
                                        <div className="flex justify-between text-xs text-gray-400">
                                            <span>Spots Filled</span>
                                            <span className="text-white font-bold">15/20</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Features Grid (Platform Features) */}
                <div className="mt-24 border-y border-gray-100 py-20 bg-gray-50/50 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center mb-16">
                            <span className="text-brand-blue font-bold uppercase tracking-wider text-sm">The Academy Ecosystem</span>
                            <h3 className="text-2xl font-bold text-brand-dark mt-2">Powerful systems built for modern medical students.</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-y-12 gap-x-8">
                            {[
                                { icon: Target, title: "Exam Strategies", desc: "Master MCQs, Viva Voce, & OSCE techniques." },
                                { icon: Layout, title: "Study Blueprints", desc: "Custom schedules aligned with your academic goals." },
                                { icon: HelpCircle, title: "Question Bank", desc: "1,000+ curated questions for exam confidence." },
                                { icon: BookOpen, title: "E-Library", desc: "Access to premium textbooks and Ackland Anatomy." },
                                { icon: Users, title: "Community Pods", desc: "Cohort-based groups for peer support and projects." },
                                { icon: BarChart, title: "Progress Trackers", desc: "Monitor growth with comprehensive review tools." },
                            ].map((feature, i) => (
                                <div key={i} className="flex flex-col items-center text-center group">
                                    <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 mb-4 group-hover:text-brand-blue group-hover:scale-110 transition-all">
                                        <feature.icon size={20} />
                                    </div>
                                    <h4 className="font-bold text-brand-dark mb-1">{feature.title}</h4>
                                    <p className="text-xs text-gray-500 max-w-[180px]">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* "Study Smart" Section */}
                <div className="mt-32">
                    <div className="grid lg:grid-cols-2 gap-16 items-center">
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-extrabold text-brand-dark mb-6 leading-tight">
                                Don't just study. <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-purple">Build a System.</span>
                            </h2>
                            <p className="text-xl text-gray-500 mb-10 leading-relaxed">
                                The distinction between an average student and a top performer isn't intelligence—it's structure. Medico Hub provides the framework to demystify complex concepts and retain them.
                            </p>

                            <div className="space-y-8">
                                {[
                                    { title: "Active Recall & Retention", desc: "Proven methods to ensure you recall, revise, and revisit high-yield areas.", icon: Zap },
                                    { title: "Mental & Emotional Support", desc: "A community focused on mental health and spiritual grounding through our monthly prayer chain.", icon: Brain },
                                    { title: "Distinction Roadmap", desc: "A clear path from 200L Preclinical struggles to distinction-level success.", icon: GraduationCap },
                                ].map((benefit, i) => (
                                    <div key={i} className="flex gap-4">
                                        <div className="mt-1 bg-blue-50 p-2 rounded-lg text-brand-blue h-fit">
                                            <benefit.icon size={24} />
                                        </div>
                                        <div className="flex-1">
                                            <h4 className="text-xl font-bold text-brand-dark mb-1">{benefit.title}</h4>
                                            <p className="text-gray-500">{benefit.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Visual Benefits Card */}
                        <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-br from-brand-blue/20 to-brand-purple/20 rounded-[3rem] transform rotate-3 blur-sm"></div>
                            <div className="bg-white rounded-[3rem] p-8 lg:p-12 shadow-2xl relative border border-gray-100">
                                <div className="space-y-6">
                                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">A+</div>
                                        <div className="flex-1">
                                            <div className="h-2 w-24 bg-gray-200 rounded-full mb-2"></div>
                                            <div className="h-2 w-16 bg-gray-200 rounded-full"></div>
                                        </div>
                                        <div className="text-green-600 font-bold text-sm">+15%</div>
                                    </div>
                                    <div className="p-6 bg-brand-dark rounded-2xl text-white mt-8 text-center">
                                        <div className="text-4xl font-extrabold mb-1">98%</div>
                                        <div className="text-sm text-gray-400">Pass Rate for Distinction Track Users</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* CTA Section */}
                <div className="mt-32 bg-brand-light rounded-[3rem] p-12 text-center relative overflow-hidden">
                    <div className="relative z-10 max-w-2xl mx-auto">
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-dark mb-4">Ready to excel in medicine?</h2>
                        <p className="text-gray-500 text-lg mb-8">Join the top 1% of medical students who understand the art of studying smart.</p>
                        <Link to={AppRoute.ONBOARDING} className="inline-block bg-brand-blue text-white px-10 py-4 rounded-full font-bold text-lg shadow-xl shadow-brand-blue/30 hover:-translate-y-1 transition-all">
                            Start Your Journey
                        </Link>
                    </div>
                </div>

                {/* FAQ Section */}
                <div className="mt-32 max-w-3xl mx-auto">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-dark mb-4">Frequently Asked Questions</h2>
                        <p className="text-gray-500">Got questions? We've got answers.</p>
                    </div>

                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm">
                        <FaqItem
                            question="What is the difference between The Academy and MCAMP?"
                            answer="The Academy is our year-round learning platform. MCAMP is a specific 3-month intensive mentorship cohort with strict accountability."
                        />
                        <FaqItem
                            question="Does the Academy have Free and Pro plans?"
                            answer="Yes! We offer a Free plan that gives you access to the store, limited AI queries, and basic anatomy notes. Our Pro subscription (₦6,000/month or ₦4,800/month yearly) unlocks unlimited AI mentor access, our full medical library, advanced performance tracking, and exclusive discounts on store items."
                        />
                        <FaqItem
                            question="Who is Medico Hub for?"
                            answer="Serious pre-clinical and clinical students who are academically ambitious and seeking structure."
                        />
                        <FaqItem
                            question="Do I need to be in the mentorship program to use the Store?"
                            answer="No, the Medico Hub Store is open to all students for purchasing textbooks, equipment, and essentials."
                        />
                        <FaqItem
                            question="How does the accountability system work?"
                            answer="We use daily tasks, weekly meetings, and progress reports to ensure you meet your study milestones."
                        />
                    </div>
                </div>

            </div>
        </div>
    );
};

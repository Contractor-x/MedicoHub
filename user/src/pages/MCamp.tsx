import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Trophy, Target, BookOpen, Users, Gift, Zap, Clock,
    CheckCircle, Shield, Sparkles, Brain, Lock
} from 'lucide-react';
import { AppRoute, User } from '../types';
import { useSettings } from '../context/SettingsContext';

interface MCampProps {
    user: User | null;
    onLogout: () => void;
}

export const MCamp: React.FC<MCampProps> = ({ user, onLogout }) => {
    const navigate = useNavigate();
    const { mcampEnrollment } = useSettings();

    const handleEnrollAction = () => {
        if (user) {
            onLogout();
        }
        navigate(AppRoute.SIGNUP);
    };

    return (
        <div className="bg-white min-h-screen">

            {/* Hero Section */}
            <div className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-4 sm:px-6 lg:px-8 bg-brand-dark overflow-hidden">
                {/* Abstract Background */}
                <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-brand-blue/20 to-transparent opacity-50"></div>
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-brand-yellow/10 rounded-full blur-3xl"></div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-brand-yellow px-4 py-2 rounded-full text-sm font-bold mb-8 animate-pop-in">
                        <Sparkles size={16} fill="currentColor" />
                        Exclusive for 200L and 300L Preclinical Students
                    </div>

                    <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white mb-8 leading-tight">
                        Become the <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-orange-400">Distinction Student</span><br className="hidden md:block" /> in 90 Days.
                    </h1>

                    <p className="text-xl text-gray-400 mb-10 max-w-2xl mx-auto font-medium leading-relaxed">
                        The ultimate intensive program designed to help you master Anatomy, Physiology, and Biochemistry.
                        <span className="text-white block mt-2">Limited to 20 Paid Slots only.</span>
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            disabled={!mcampEnrollment}
                            onClick={handleEnrollAction}
                            className={`px-10 py-4 rounded-full font-extrabold text-lg transition-all shadow-xl flex items-center justify-center gap-2 ${mcampEnrollment ? 'bg-brand-yellow text-brand-dark hover:bg-white shadow-brand-yellow/20 hover:-translate-y-1' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                        >
                            {mcampEnrollment ? <>Secure Your Spot <Target size={20} /></> : <>Enrollment Closed <Lock size={20} /></>}
                        </button>
                    </div>

                    <p className="mt-6 text-sm text-gray-500 flex items-center justify-center gap-2">
                        <Clock size={14} /> Enrollment closes soon
                    </p>
                </div>
            </div>

            {/* Curriculum & Features Grid */}
            <div className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <span className="text-brand-blue font-bold uppercase tracking-wider text-sm">Curriculum & Features</span>
                    <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-dark mt-2">More Than Just Tuition.</h2>
                    <p className="text-gray-500 mt-4 text-lg">A complete ecosystem to guarantee your success.</p>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Exam Mastery */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform">
                            <Brain size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-4">Exam Mastery</h3>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> Strategies for Anatomy, Physiology & Biochemistry.</li>
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> Conquer MCQs, Theory, Viva Voce & OSCE techniques.</li>
                        </ul>
                    </div>

                    {/* Strategic Planning */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="w-14 h-14 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 mb-6 group-hover:scale-110 transition-transform">
                            <Target size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-4">Strategic Planning</h3>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> "Distinction Medic Blueprint" Roadmap.</li>
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> Custom Study Schedules & Productivity Plans.</li>
                        </ul>
                    </div>

                    {/* Mentorship */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="w-14 h-14 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-600 mb-6 group-hover:scale-110 transition-transform">
                            <Users size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-4">Mentorship & Habits</h3>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> 1-on-1 & Group Expert Guidance.</li>
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> Accountability Framework for consistency.</li>
                        </ul>
                    </div>

                    {/* Resources */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 mb-6 group-hover:scale-110 transition-transform">
                            <BookOpen size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-4">Academic Resources</h3>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> High-Yield Points & Clinical Cases.</li>
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> 1,000+ Question Bank Access.</li>
                        </ul>
                    </div>

                    {/* Spiritual */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="w-14 h-14 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 mb-6 group-hover:scale-110 transition-transform">
                            <Shield size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-4">Holistic Growth</h3>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> Monthly Prayer Chain.</li>
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> Stay spiritually grounded in your journey.</li>
                        </ul>
                    </div>

                    {/* Tracking */}
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all group">
                        <div className="w-14 h-14 bg-cyan-50 rounded-2xl flex items-center justify-center text-brand-cyan mb-6 group-hover:scale-110 transition-transform">
                            <Zap size={28} />
                        </div>
                        <h3 className="text-xl font-bold text-brand-dark mb-4">Progress Tracking</h3>
                        <ul className="space-y-3 text-gray-600">
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> Comprehensive growth monitors.</li>
                            <li className="flex items-start gap-2"><CheckCircle size={18} className="text-green-500 mt-1 shrink-0" /> Weekly challenges & Giveaways.</li>
                        </ul>
                    </div>
                </div>
            </div>

            {/* Exclusive Bonuses & Rewards Section */}
            <div className="bg-gray-50 py-24 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-brand-blue via-purple-500 to-brand-yellow"></div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl lg:text-4xl font-extrabold text-brand-dark mb-4">Exclusive Rewards & Bonuses</h2>
                        <p className="text-gray-500">We reward action and excellence.</p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 items-center">
                        {/* Bonuses */}
                        <div className="bg-brand-dark text-white rounded-[2.5rem] p-10 relative overflow-hidden">
                            <div className="absolute top-0 right-0 bg-brand-yellow text-brand-dark text-xs font-bold px-4 py-2 rounded-bl-2xl">
                                PROGRAM BONUSES
                            </div>
                            <div className="relative z-10">
                                <Gift size={48} className="text-brand-yellow mb-6" />
                                <h3 className="text-2xl font-bold mb-6">Premium Tool Suite</h3>
                                <ul className="space-y-4">
                                    {['Atlas 3D Access', 'Ninja Nerd Notes', 'Ackland Anatomy', 'Osmosis 2023'].map((item) => (
                                        <li key={item} className="flex items-center gap-3 font-medium text-lg">
                                            <div className="bg-white/20 p-1 rounded-full text-brand-yellow"><CheckCircle size={18} /></div>
                                            {item}
                                        </li>
                                    ))}
                                </ul>
                                <p className="mt-8 text-sm text-gray-400 border-t border-white/10 pt-4">
                                    * Plus access to a Medical Encyclopedia for all participants.
                                </p>
                            </div>
                        </div>

                        {/* Rewards */}
                        <div className="bg-white rounded-[2.5rem] p-10 border-2 border-brand-yellow/50 relative">
                            <div className="absolute top-0 right-0 bg-brand-yellow/20 text-brand-dark text-xs font-bold px-4 py-2 rounded-bl-2xl rounded-tr-[2.3rem]">
                                PERFORMANCE REWARDS
                            </div>

                            <Trophy size={48} className="text-brand-yellow mb-6" />
                            <h3 className="text-2xl font-bold text-brand-dark mb-6">Earn Your Fee Back</h3>

                            <div className="space-y-6">
                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-yellow-100 text-yellow-700 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">1st</div>
                                    <div>
                                        <h4 className="font-bold text-lg text-brand-dark">Top Student</h4>
                                        <p className="text-gray-500 text-sm">Gets a 100% refund of the program fee.</p>
                                    </div>
                                </div>

                                <div className="flex gap-4">
                                    <div className="w-12 h-12 bg-gray-100 text-gray-700 rounded-xl flex items-center justify-center font-bold text-lg shrink-0">Top 5</div>
                                    <div>
                                        <h4 className="font-bold text-lg text-brand-dark">Merit Scholarship</h4>
                                        <p className="text-gray-500 text-sm">Top 5 students receive a 30-day post-program scholarship.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CTA Bottom */}
            <div className="py-20 px-4 text-center">
                <div className="max-w-3xl mx-auto bg-brand-blue rounded-[3rem] p-12 shadow-2xl shadow-brand-blue/30 text-white relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-3xl lg:text-4xl font-extrabold mb-6">Don't settle for average.</h2>
                        <p className="text-blue-100 text-lg mb-8">
                            Join the top 1% of medical students who understand the art of studying smart.
                            <br /><strong>Only 20 slots available.</strong>
                        </p>
                        <button
                            disabled={!mcampEnrollment}
                            onClick={handleEnrollAction}
                            className={`inline-block px-10 py-4 rounded-full font-bold text-lg transition-all ${mcampEnrollment ? 'bg-white text-brand-blue hover:bg-brand-yellow hover:text-brand-dark' : 'bg-gray-400 text-gray-200 cursor-not-allowed'}`}
                        >
                            {mcampEnrollment ? 'Enroll in MCAMP Now' : 'Enrollment Closed'}
                        </button>
                    </div>
                </div>
            </div>

        </div>
    );
};
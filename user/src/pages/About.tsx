import * as React from 'react';
import { Heart, Globe, Lightbulb } from 'lucide-react';

export const About: React.FC = () => {
    return (
        <div className="bg-white min-h-screen pt-32 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Mission Header */}
                <div className="text-center max-w-4xl mx-auto mb-20">
                    <h1 className="text-5xl lg:text-7xl font-extrabold text-brand-dark mb-8 tracking-tight">
                        We're building the future of <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-blue to-brand-cyan">medical education.</span>
                    </h1>
                    <p className="text-xl text-gray-500 leading-relaxed">
                        Medico Hub was born from a simple frustration: medical resources were scattered, outdated, and expensive.
                        We set out to create a unified ecosystem where every student has access to world-class tools.
                    </p>
                </div>

                {/* Values Grid */}
                <div className="grid md:grid-cols-3 gap-8 mb-32">
                    {[
                        { icon: Heart, title: "Student First", text: "Every feature we build starts with the question: 'Does this help a student sleep better?'" },
                        { icon: Lightbulb, title: "Innovation Driven", text: "We leverage the latest AI to turn hours of reading into minutes of understanding." },
                        { icon: Globe, title: "Accessible to All", text: "Quality education shouldn't be gated by geography or finances." }
                    ].map((v, i) => (
                        <div key={i} className="bg-gray-50 p-8 rounded-[2rem] border border-gray-100 hover:-translate-y-2 transition-transform duration-300">
                            <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center text-brand-blue mb-6">
                                <v.icon size={24} />
                            </div>
                            <h3 className="text-xl font-bold text-brand-dark mb-3">{v.title}</h3>
                            <p className="text-gray-500">{v.text}</p>
                        </div>
                    ))}
                </div>

                {/* Founder Section */}
                <div className="bg-brand-dark rounded-[3rem] p-12 lg:p-20 text-center relative overflow-hidden">
                    {/* Background scribbles */}
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <svg width="100%" height="100%">
                            <pattern id="pattern-circles" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                                <circle cx="2" cy="2" r="1" className="text-white" fill="currentColor" />
                            </pattern>
                            <rect x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)" />
                        </svg>
                    </div>

                    <h2 className="text-4xl font-extrabold text-white mb-12 relative z-10">Meet the Founder</h2>
                    <div className="flex justify-center relative z-10">
                        <div className="group max-w-sm">
                            <div className="aspect-square rounded-3xl overflow-hidden mb-6 border-4 border-white/10 group-hover:border-brand-yellow transition-colors shadow-2xl relative bg-white/5">
                                <img
                                    src="/founder.jpg"
                                    alt="Favour Ukpong U."
                                    className="w-full h-full object-cover transition-all duration-500 transform group-hover:scale-105"
                                />
                            </div>
                            <h4 className="text-white font-bold text-2xl mb-1">Favour Ukpong U.</h4>
                            <p className="text-brand-blue font-bold text-sm tracking-widest uppercase mb-4">Medical Student & EdTech Innovator</p>
                            <p className="text-gray-400 leading-relaxed text-sm max-w-xs mx-auto">
                                On a mission to simplify medical education and empower the next generation of African doctors.
                            </p>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};


import { useState } from 'react';
import { Sidebar } from './Sidebar';
import { Outlet } from 'react-router-dom';
import { Menu } from 'lucide-react';

export const Layout = () => {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="min-h-screen bg-brand-light font-sans">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="md:ml-64 p-4 md:p-8 min-h-screen transition-all duration-300">
                <header className="flex justify-between items-center mb-6 md:mb-10 sticky top-0 bg-brand-light/90 backdrop-blur z-40 py-4 -mx-4 md:-mx-8 px-4 md:px-8 border-b border-gray-200/50">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => setIsSidebarOpen(true)}
                            className="md:hidden p-2 text-gray-500 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-gray-200"
                        >
                            <Menu size={24} />
                        </button>

                        <div>
                            <h2 className="text-2xl md:text-3xl font-extrabold text-brand-dark tracking-tight leading-none">Dashboard</h2>
                            <p className="text-gray-500 font-medium mt-1 text-xs md:text-sm">Welcome back, Admin</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-3 bg-white p-1.5 pr-4 rounded-full border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer">
                            <div className="w-8 h-8 md:w-10 md:h-10 bg-brand-dark text-brand-yellow rounded-full flex items-center justify-center font-bold text-sm md:text-lg">
                                A
                            </div>
                            <span className="font-bold text-brand-dark text-xs md:text-sm hidden sm:block">Admin User</span>
                        </div>
                    </div>
                </header>
                <div className="animate-fade-in-up">
                    <Outlet />
                </div>
            </main>
        </div>
    );
};

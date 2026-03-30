
/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['"Plus Jakarta Sans"', 'sans-serif'],
            },
            colors: {
                brand: {
                    blue: '#0066FF',
                    dark: '#0F172A',
                    light: '#F1F5F9',
                    yellow: '#FFDE00',
                    purple: '#8B5CF6',
                    cyan: '#06B6D4'
                },
                // Keep existing admin colors for backward compatibility if needed, 
                // but we will shift to brand colors.
                admin: {
                    bg: '#F1F5F9', // Match brand-light
                    sidebar: '#0F172A', // Match brand-dark
                    active: '#1E293B',
                    text: '#e5e7eb'
                }
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'pop-in': 'popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
                'fade-in-up': 'fadeInUp 0.5s ease-out forwards',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' },
                },
                popIn: {
                    '0%': { opacity: '0', transform: 'scale(0.9)' },
                    '100%': { opacity: '1', transform: 'scale(1)' },
                },
                fadeInUp: {
                    '0%': { opacity: '0', transform: 'translateY(10px)' },
                    '100%': { opacity: '1', transform: 'translateY(0)' },
                }
            }
        },
    },
    plugins: [],
}

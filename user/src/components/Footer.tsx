
import * as React from 'react';
import { Link } from 'react-router-dom';
import { Stethoscope, Instagram } from 'lucide-react';
import { AppRoute } from '../types';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-dark text-white pt-20 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-8 mb-16">
          
          {/* Brand Column */}
          <div className="col-span-2">
            <Link to={AppRoute.HOME} className="flex items-center gap-2 mb-6 group">
              <div className="bg-brand-blue p-1.5 rounded-lg text-white">
                <Stethoscope size={20} strokeWidth={2.5} />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-white">
                Medico<span className="text-brand-blue">Hub</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed mb-6 max-w-sm">
                Empowering the next generation of medical professionals with intelligent tools, curated resources, and essential gear.
            </p>
            <div className="flex gap-4 text-gray-400">
               <a 
                href="https://wa.me/2347088262583" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white transition-colors" 
                title="WhatsApp"
               >
                  <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                     <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
               </a>
               <a 
                href="https://www.instagram.com/_medicohub" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-white transition-colors" 
                title="Instagram"
               >
                <Instagram size={20} />
               </a>
            </div>
          </div>

          {/* Links Columns */}
          <div>
            <h4 className="font-bold text-sm mb-6 text-gray-400 uppercase tracking-wider">Product</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link to={AppRoute.STORE} className="hover:text-brand-yellow transition-colors">Store</Link></li>
              <li><Link to={AppRoute.PRICING} className="hover:text-brand-yellow transition-colors">Pricing</Link></li>
              <li><Link to={AppRoute.DASHBOARD} className="hover:text-brand-yellow transition-colors">Dashboard</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-6 text-gray-400 uppercase tracking-wider">Resources</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><a href="https://whatsapp.com/channel/0029VbAE0gLGehEMAmTuMj0D" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow transition-colors">Community</a></li>
              <li><a href="https://wa.me/2347088262583" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-sm mb-6 text-gray-400 uppercase tracking-wider">Company</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link to={AppRoute.ABOUT} className="hover:text-brand-yellow transition-colors">About Us</Link></li>
              <li><Link to={AppRoute.LEGAL} className="hover:text-brand-yellow transition-colors">Legal</Link></li>
              <li><a href="https://linktr.ee/medicohub" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow transition-colors">Contact</a></li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">© {new Date().getFullYear()} Medico Hub. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-gray-500">
                <Link to={AppRoute.PRIVACY} className="hover:text-white transition-colors">Privacy Policy</Link>
                <Link to={AppRoute.TERMS} className="hover:text-white transition-colors">Terms of Service</Link>
            </div>
        </div>
      </div>
    </footer>
  );
};
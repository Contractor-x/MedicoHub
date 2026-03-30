import * as React from 'react';
import { ShieldCheck, FileText, Scale, Landmark } from 'lucide-react';

export const Legal: React.FC = () => {
  return (
    <div className="bg-white min-h-screen pt-32 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-brand-blue px-4 py-2 rounded-full text-sm font-bold mb-6">
            <ShieldCheck size={18} />
            Transparency & Compliance
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-brand-dark mb-6 tracking-tight">
            Legal <span className="text-brand-blue">Compliance</span>
          </h1>
          <p className="text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Medico Hub is a fully registered and compliant academic and retail institution, operating within the legal framework of the Federal Republic of Nigeria.
          </p>
        </div>

        {/* CAC Certificate Section */}
        <div className="bg-brand-light rounded-[3rem] p-8 md:p-12 mb-16 border border-gray-100 shadow-sm relative overflow-hidden group">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-brand-blue/5 rounded-full blur-3xl group-hover:bg-brand-blue/10 transition-colors"></div>
          
          <div className="flex flex-col md:flex-row gap-10 items-center">
            <div className="flex-1">
              <div className="w-12 h-12 bg-white rounded-xl shadow-md flex items-center justify-center text-brand-blue mb-6">
                <Landmark size={24} />
              </div>
              <h2 className="text-2xl font-bold text-brand-dark mb-4">Corporate Affairs Commission (CAC)</h2>
              <p className="text-gray-600 mb-6 leading-relaxed">
                We are officially incorporated as a legal entity authorized to provide educational support services and retail medical essentials. Our registration ensures that we adhere to strict professional and business ethics.
              </p>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">RC Number: [Pending Verification]</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-brand-blue"></div>
                  <span className="text-sm font-bold text-gray-700 uppercase tracking-wide">Status: Active & Compliant</span>
                </div>
              </div>
            </div>

            {/* Placeholder Image for CAC Certificate */}
            <div className="w-full md:w-72 aspect-[1/1.41] bg-white rounded-2xl shadow-2xl border-4 border-white overflow-hidden relative group/cert">
              <div className="absolute inset-0 bg-gray-50 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-gray-200 m-2 rounded-lg">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-300 mb-4">
                  <FileText size={32} />
                </div>
                <p className="text-gray-400 font-bold text-sm">CAC Certificate Image Placeholder</p>
                <p className="text-[10px] text-gray-400 mt-2 uppercase tracking-widest">Awaiting Admin Upload</p>
              </div>
              <div className="absolute inset-0 bg-brand-dark/0 group-hover/cert:bg-brand-dark/5 transition-colors"></div>
            </div>
          </div>
        </div>

        {/* Legal Cards Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-20">
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-brand-blue mb-6 group-hover:scale-110 transition-transform">
              <Scale size={24} />
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-3">Regulatory Compliance</h3>
            <p className="text-gray-500 leading-relaxed text-sm">
              We operate in full compliance with data protection laws (NDPR) and trade regulations. Our medical academic materials are curated by licensed professionals to ensure academic integrity.
            </p>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-brand-purple mb-6 group-hover:scale-110 transition-transform">
              <ShieldCheck size={24} />
            </div>
            <h3 className="text-xl font-bold text-brand-dark mb-3">Professional Ethics</h3>
            <p className="text-gray-500 leading-relaxed text-sm">
              While we are an educational platform, we maintain the highest ethical standards of the medical profession, ensuring no intellectual property of third parties or examination bodies is infringed upon.
            </p>
          </div>
        </div>

        {/* Contact Info Footer */}
        <div className="text-center bg-brand-dark rounded-[2.5rem] p-12 text-white shadow-xl">
          <h3 className="text-2xl font-bold mb-4">Need Legal Information?</h3>
          <p className="text-gray-400 mb-8 max-w-md mx-auto">
            For further inquiries regarding our legal status, documentation, or partnerships, please contact our administrative legal desk.
          </p>
          <a 
            href="https://wa.me/2347088262583" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block bg-brand-blue text-white px-10 py-4 rounded-full font-bold hover:bg-blue-600 transition-all shadow-lg shadow-brand-blue/30"
          >
            Contact Administration
          </a>
        </div>
      </div>
    </div>
  );
};
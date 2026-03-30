import * as React from 'react';

export const TermsOfService: React.FC = () => {
  return (
    <div className="bg-white min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-brand-dark mb-8">Terms of Service</h1>
        
        <div className="prose prose-blue max-w-none text-gray-600">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">Agreement to Terms</h2>
          <p>By accessing or using our services (including The Academy, MCAMP, and The Store), you agree to be bound by these Terms of Service. If you do not agree to these terms, you may not access or use the services.</p>
          
          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">Intellectual Property Rights</h2>
          <p>Unless otherwise indicated, the Site and Services are our proprietary property. All source code, databases, study guides, the "Distinction Medic Blueprint," video tutorials, and the "Medico Hub" logo are owned or controlled by us. You are granted a limited license to access and use the Site for your personal, non-commercial academic use only. Redistribution of our proprietary notes, question banks, or recorded lectures is strictly prohibited.</p>

          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">User Representations</h2>
          <p>By using the Site, you represent and warrant that:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>All registration information you submit (including your student status and level) is true, accurate, current, and complete.</li>
            <li>You will maintain the accuracy of such information and promptly update such registration information as necessary.</li>
            <li>You are a medical student or academic partner utilizing the platform for educational purposes.</li>
            <li>You will not share your unique login credentials with non-registered individuals.</li>
          </ul>

          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">Prohibited Activities</h2>
          <p>You may not access or use the Site for any purpose other than that for which we make the Site available. The Site may not be used in connection with any commercial endeavors except those that are specifically endorsed or approved by us. Specifically, you agree not to:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li>Systematically retrieve data, potential exam questions, or other content from the Site to create a collection, compilation, database, or directory without written permission from us.</li>
            <li>Sell or transfer your MCAMP profile or cohort slot to another individual.</li>
          </ul>

          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">Disclaimer</h2>
          <p>The site is provided on an as-is and as-available basis. While our programs are designed to foster "Distinction-Level" success, individual academic results depend on the student's personal discipline and adherence to the provided systems. We do not warrant that the results obtained from the use of the service will be accurate or reliable outside of our prescribed academic frameworks.</p>
        </div>
      </div>
    </div>
  );
};
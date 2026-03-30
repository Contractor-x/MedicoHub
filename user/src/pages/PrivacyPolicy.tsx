import * as React from 'react';

export const PrivacyPolicy: React.FC = () => {
  return (
    <div className="bg-white min-h-screen pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold text-brand-dark mb-8">Privacy Policy</h1>
        
        <div className="prose prose-blue max-w-none text-gray-600">
          <p className="mb-4">Last updated: {new Date().toLocaleDateString()}</p>
          
          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">Introduction</h2>
          <p>Welcome to Medico Hub. We function as an elite academic institution and retail platform for medical students. We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you as to how we look after your personal data when you visit our website, apply for our mentorship programs (MCAMP), or purchase from our Store.</p>
          
          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">Data We Collect</h2>
          <p>We may collect, use, store and transfer different kinds of personal data about you which we have grouped together follows:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>Identity Data:</strong> includes first name, last name, unique student registration number, and university/level of study (e.g., 200L Preclinical).</li>
            <li><strong>Contact Data:</strong> includes email address, phone number, and delivery address for Store orders.</li>
            <li><strong>Financial Data:</strong> includes payment card details and transaction history for MCAMP tuition or Store purchases.</li>
            <li><strong>Academic Profile Data:</strong> includes your mentorship cohort history, quiz performance, accountability reports, and interests within our curriculum.</li>
          </ul>

          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">How We Use Your Data</h2>
          <p>We will only use your personal data when the law allows us to. Most commonly, we will use your personal data in the following circumstances:</p>
          <ul className="list-disc pl-5 mb-4 space-y-2">
            <li><strong>To Perform Our Contract:</strong> To register you as a new student or customer, process your MCAMP application, and deliver academic resources.</li>
            <li><strong>For Legitimate Interests:</strong> To manage our relationship with you, including notifying you of changes to our terms, asking you to leave a review, or tracking your academic progress to ensure distinction-level outcomes.</li>
            <li><strong>To Comply with Obligation:</strong> Where we need to comply with a legal or regulatory obligation.</li>
          </ul>

          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">Data Security</h2>
          <p>We have put in place appropriate security measures to prevent your personal data from being accidentally lost, used, or accessed in an unauthorized way. As Medico Hub operates as a closed academic system for registered cohorts, we enforce strict access controls to ensure only authorized students access proprietary resources.</p>

          <h2 className="text-2xl font-bold text-brand-dark mt-8 mb-4">Contact Us</h2>
          <p>If you have any questions about this privacy policy or our privacy practices, please contact our administrative team via the Contact page or our official support channels.</p>
        </div>
      </div>
    </div>
  );
};
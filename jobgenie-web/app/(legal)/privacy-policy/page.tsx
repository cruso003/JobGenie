// app/(legal)/privacy-policy/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy - JobGenie',
  description: 'JobGenie privacy policy and data handling practices',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'April 16, 2025';

  return (
    <div className="container max-w-4xl py-12 px-4 md:px-6 lg:py-16">
      <div className="space-y-8">
        <div>
          <Link 
            href="/" 
            className="inline-flex items-center text-sm text-primary hover:underline"
          >
            &larr; Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Privacy Policy</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Last Updated: {lastUpdated}</p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <h2>Introduction</h2>
          <p>
            At JobGenie, we take your privacy seriously. This Privacy Policy explains how we collect, use, share, and protect your personal information when you use our website, mobile application, and services (collectively, the &quot;Services&quot;).
          </p>
          <p>
            By using JobGenie, you agree to the collection and use of information in accordance with this policy. We will not use or share your information with anyone except as described in this Privacy Policy.
          </p>

          <h2>Information We Collect</h2>
          <h3>Information You Provide to Us</h3>
          <p>We collect information you provide directly to us when you:</p>
          <ul>
            <li>Create or modify your account (name, email address, password)</li>
            <li>Complete your profile (skills, experience, education, job preferences)</li>
            <li>Upload documents (resumes, cover letters)</li>
            <li>Participate in mock interviews (text responses, video recordings)</li>
            <li>Save job listings and track applications</li>
            <li>Communicate with us via email, chat, or other means</li>
          </ul>

          <h3>Information We Collect Automatically</h3>
          <p>When you use our Services, we automatically collect certain information, including:</p>
          <ul>
            <li>Usage Data: How you interact with our Services, including the features you use, pages you visit, and actions you take</li>
            <li>Device Information: Device type, operating system, unique device identifiers, and mobile network information</li>
            <li>Log Data: IP address, browser type, access times, pages viewed, and system activity</li>
            <li>Location Information: General location based on IP address or more precise location if you grant us permission</li>
          </ul>

          <h2>How We Use Your Information</h2>
          <p>We use the information we collect to:</p>
          <ul>
            <li>Provide, maintain, and improve our Services</li>
            <li>Personalize your experience and deliver tailored content and job recommendations</li>
            <li>Generate AI-powered resumes, cover letters, and interview feedback</li>
            <li>Analyze how users interact with our Services to enhance and optimize the user experience</li>
            <li>Communicate with you about updates, features, offers, and support</li>
            <li>Detect, investigate, and prevent fraudulent transactions, unauthorized access, and other illicit activities</li>
            <li>Comply with legal obligations and enforce our terms of service</li>
          </ul>

          <h2>Use of AI and Machine Learning</h2>
          <p>
            JobGenie uses artificial intelligence and machine learning technologies, specifically utilizing the Gemini API, to provide personalized job recommendations, generate tailored resumes and cover letters, and deliver interview feedback. To support these features:
          </p>
          <ul>
            <li>We process your profile information, skills, and experience to generate career insights</li>
            <li>Content you create (such as interview responses) may be analyzed to provide feedback</li>
            <li>We may use anonymized data for improving our AI models and algorithms</li>
          </ul>
          <p>
            You maintain control over your AI-generated content. We do not use your personal information to train AI models without your consent.
          </p>

          <h2>Data Sharing and Disclosure</h2>
          <p>We may share your personal information with:</p>
          <h3>Service Providers</h3>
          <p>
            We engage trusted third-party companies and individuals to facilitate our Services, provide services on our behalf, or assist in analyzing how our Services are used. These third parties have access to your personal information only to perform these tasks on our behalf and are obligated not to disclose or use it for any other purpose.
          </p>

          <h3>Analytics Partners</h3>
          <p>
            We use analytics services such as Google Analytics to help understand how users engage with the Services. These tools collect information sent by your device or our Services, including the web pages you visit and other information that assists us in improving the Services.
          </p>

          <h3>Legal Requirements</h3>
          <p>
            We may disclose your information if required to do so by law or in response to valid requests by public authorities (e.g., a court or government agency).
          </p>

          <h3>Business Transfers</h3>
          <p>
            If JobGenie is involved in a merger, acquisition, or asset sale, your personal information may be transferred as part of that transaction. We will notify you before your information is transferred and becomes subject to a different privacy policy.
          </p>

          <h2>Data Security</h2>
          <p>
            We implement appropriate technical and organizational security measures to protect the security of your personal information. However, please be aware that no method of transmission over the Internet or method of electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>

          <h2>Your Data Protection Rights</h2>
          <p>Depending on your location, you may have the following rights regarding your personal information:</p>
          <ul>
            <li><strong>Access:</strong> You can request copies of your personal information.</li>
            <li><strong>Rectification:</strong> You can ask us to correct inaccurate information or complete incomplete information.</li>
            <li><strong>Deletion:</strong> You can ask us to delete your personal information in certain circumstances.</li>
            <li><strong>Restriction:</strong> You can ask us to restrict the processing of your information in certain circumstances.</li>
            <li><strong>Data Portability:</strong> You can ask us to transfer your information to another organization or directly to you.</li>
            <li><strong>Objection:</strong> You can object to our processing of your personal information.</li>
          </ul>
          <p>
            To exercise any of these rights, please contact us using the details provided in the &quot;Contact Us&quot; section.
          </p>

          <h2>International Data Transfers</h2>
          <p>
            Your information may be transferred to and processed in countries other than the country you reside in, where data protection laws may differ. When we transfer your personal information to other countries, we take appropriate safeguards to ensure your information receives adequate protection.
          </p>

          <h2>Children&apos;s Privacy</h2>
          <p>
            Our Services are not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If you are a parent or guardian and believe your child has provided us with personal information, please contact us, and we will take steps to delete such information.
          </p>

          <h2>Changes to This Privacy Policy</h2>
          <p>
            We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the &quot;Last Updated&quot; date at the top. You are advised to review this Privacy Policy periodically for any changes.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this Privacy Policy or our data practices, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> privacy@jobgenie.com<br />
            <strong>Address:</strong> JobGenie Inc., 123 AI Avenue, San Francisco, CA 94105
          </p>
        </div>

        <div className="border-t pt-8">
          <Link 
            href="/terms-of-service" 
            className="text-primary hover:underline"
          >
            View our Terms of Service
          </Link>
        </div>
      </div>
    </div>
  );
}

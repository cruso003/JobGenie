// app/(legal)/terms-of-service/page.tsx
import { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service - JobGenie',
  description: 'JobGenie terms of service and user agreement',
};

export default function TermsOfServicePage() {
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
          <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Terms of Service</h1>
          <p className="mt-2 text-gray-500 dark:text-gray-400">Last Updated: {lastUpdated}</p>
        </div>

        <div className="prose dark:prose-invert max-w-none">
          <h2>Agreement to Terms</h2>
          <p>
            These Terms of Service (&ldquo;Terms&rdquo;) govern your access to and use of the JobGenie website, mobile application, and services (collectively, the &ldquo;Services&rdquo;), operated by JobGenie Inc. (&ldquo;we,&rdquo; &ldquo;us,&rdquo; or &ldquo;our&rdquo;).
          </p>
          <p>
            By accessing or using our Services, you agree to be bound by these Terms. If you disagree with any part of the Terms, you may not access the Services.
          </p>

          <h2>Account Registration</h2>
          <p>
            To use certain features of our Services, you may need to create an account. You must provide accurate, current, and complete information during the registration process and keep your account information up-to-date.
          </p>
          <p>
            You are responsible for safeguarding your password and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account or any other breach of security.
          </p>

          <h2>Subscription and Billing</h2>
          <h3>Free and Premium Services</h3>
          <p>
            JobGenie offers both free and premium subscription-based Services. Free Services provide limited access to features, while premium subscriptions offer enhanced functionality.
          </p>
          
          <h3>Subscription Terms</h3>
          <p>
            Premium subscriptions may be offered on a monthly or annual basis. Unless otherwise specified during the purchase process, subscriptions automatically renew at the end of each billing period.
          </p>
          
          <h3>Cancellation and Refunds</h3>
          <p>
            You may cancel your subscription at any time through your account settings. Upon cancellation, you will continue to have access to premium features until the end of your current billing period. We do not provide refunds for partial subscription periods.
          </p>
          
          <h3>Price Changes</h3>
          <p>
            We reserve the right to adjust pricing for our Services. Any price changes will be communicated to you in advance and will apply to billing periods following the notice period.
          </p>

          <h2>User Content</h2>
          <p>
            Our Services allow you to create, upload, store, and share content, including resumes, cover letters, and interview responses (&ldquo;User Content&rdquo;). You retain all rights to your User Content.
          </p>
          <p>
            By submitting User Content to our Services, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, adapt, publish, and display such content solely for the purpose of providing and improving our Services.
          </p>
          <p>
            You represent and warrant that:
          </p>
          <ul>
            <li>You own or have the necessary rights to your User Content and have the right to grant the license described above</li>
            <li>Your User Content does not violate the privacy rights, publicity rights, copyrights, contract rights, or any other rights of any person or entity</li>
          </ul>

          <h2>Acceptable Use</h2>
          <p>
            You agree not to use our Services to:
          </p>
          <ul>
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others</li>
            <li>Upload or transmit viruses, malware, or other malicious code</li>
            <li>Interfere with or disrupt the integrity or performance of our Services</li>
            <li>Harass, abuse, or harm another person or entity</li>
            <li>Attempt to gain unauthorized access to our Services or related systems</li>
            <li>Collect or store personal data about other users without their consent</li>
            <li>Impersonate any person or entity or misrepresent your affiliation with a person or entity</li>
          </ul>

          <h2>Intellectual Property</h2>
          <p>
            Our Services and their contents, features, and functionality are owned by JobGenie Inc. and are protected by copyright, trademark, and other intellectual property laws. Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.
          </p>

          <h2>AI-Generated Content</h2>
          <p>
            JobGenie uses artificial intelligence to generate content based on your inputs, including resumes, cover letters, and interview feedback. While we strive to provide accurate and helpful content, we do not guarantee the accuracy, completeness, or quality of AI-generated content.
          </p>
          <p>
            You are responsible for reviewing and editing AI-generated content before using it for professional purposes. We are not liable for any consequences resulting from your use of AI-generated content.
          </p>

          <h2>Third-Party Services</h2>
          <p>
            Our Services may contain links to third-party websites or services that are not owned or controlled by JobGenie. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party websites or services.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            To the maximum extent permitted by law, JobGenie and its affiliates, officers, employees, agents, partners, and licensors will not be liable for any indirect, incidental, special, consequential, or punitive damages, including lost profits, data loss, personal injury, or property damage, whether based on warranty, contract, tort, or any other legal theory, regardless of whether we have been informed of the possibility of such damage.
          </p>

          <h2>Disclaimer of Warranties</h2>
          <p>
            Our Services are provided &ldquo;as is&rdquo; and &ldquo;as available&rdquo; without warranties of any kind, either express or implied, including but not limited to, implied warranties of merchantability, fitness for a particular purpose, or non-infringement.
          </p>
          <p>
            We do not guarantee that our Services will be uninterrupted, timely, secure, or error-free, or that results obtained from the use of our Services will be accurate or reliable.
          </p>

          <h2>Indemnification</h2>
          <p>
            You agree to indemnify, defend, and hold harmless JobGenie and its affiliates, officers, employees, agents, partners, and licensors from and against any claims, liabilities, damages, losses, and expenses, including reasonable attorneys&apos; fees, arising from or related to your use of our Services or your breach of these Terms.
          </p>

          <h2>Termination</h2>
          <p>
            We may terminate or suspend your account and access to our Services immediately, without prior notice or liability, for any reason, including if you breach these Terms.
          </p>
          <p>
            Upon termination, your right to use our Services will immediately cease. If you wish to terminate your account, you may simply discontinue using our Services and delete your account through the account settings.
          </p>

          <h2>Changes to These Terms</h2>
          <p>
            We reserve the right to modify or replace these Terms at any time. We will provide reasonable notice of any significant changes by posting the new Terms on this page and updating the &ldquo;Last Updated&rdquo; date.
          </p>
          <p>
            By continuing to access or use our Services after any revisions become effective, you agree to be bound by the revised Terms. If you do not agree to the new Terms, you are no longer authorized to use our Services.
          </p>

          <h2>Governing Law</h2>
          <p>
            These Terms shall be governed by and construed in accordance with the laws of the State of California, without regard to its conflict of law provisions.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about these Terms, please contact us at:
          </p>
          <p>
            <strong>Email:</strong> terms@jobgenie.com<br />
            <strong>Address:</strong> JobGenie Inc., 123 AI Avenue, San Francisco, CA 94105
          </p>
        </div>

        <div className="border-t pt-8">
          <Link 
            href="/privacy-policy" 
            className="text-primary hover:underline"
          >
            View our Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  );
}

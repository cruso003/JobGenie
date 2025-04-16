// components/ui/footer.tsx
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 py-8">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="font-semibold text-lg mb-4">JobGenie</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Your AI-powered career assistant that helps you find and land your dream job.
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Features</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/jobs" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  Job Search
                </Link>
              </li>
              <li>
                <Link href="/resume" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  Resume Builder
                </Link>
              </li>
              <li>
                <Link href="/interview" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  Mock Interviews
                </Link>
              </li>
              <li>
                <Link href="/skills" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  Skill Development
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/contact" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/terms-of-service" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy-policy" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/cookie-policy" className="text-sm text-gray-600 hover:text-primary dark:text-gray-400 dark:hover:text-primary">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800 mt-8 pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
          <p>© {new Date().getFullYear()} JobGenie Inc. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}

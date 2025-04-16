// app/(legal)/layout.tsx
export default function LegalLayout({
    children,
  }: {
    children: React.ReactNode;
  }) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white dark:from-gray-950 dark:to-gray-900">
        {children}
        
        <footer className="border-t border-gray-200 dark:border-gray-800 py-8 mt-12">
          <div className="container text-center text-sm text-gray-500 dark:text-gray-400">
            <p>© {new Date().getFullYear()} JobGenie Inc. All rights reserved.</p>
          </div>
        </footer>
      </div>
    );
  }
  
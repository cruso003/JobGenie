// app/page.tsx
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Briefcase, 
  FileText, 
  Video, 
  TrendingUp, 
  Zap, 
  Award, 
  CheckCircle 
} from "lucide-react";
import LottieBackground from "@/components/ui/LottieBackground";
import Footer from "@/components/ui/footer";

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Animated background */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-indigo-950" />
        <LottieBackground />
      </div>

      {/* Navigation */}
      <header className="relative z-10 border-b border-gray-200 dark:border-gray-800">
        <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link className="flex items-center justify-center" href="/">
            <div className="flex items-center">
              <div className="mr-2 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">JobGenie</h1>
            </div>
          </Link>
          <nav className="hidden space-x-8 md:flex">
            <Link
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              href="#features"
            >
              Features
            </Link>
            <Link
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              href="#how-it-works"
            >
              How It Works
            </Link>
            <Link
              className="text-sm font-medium text-gray-700 hover:text-indigo-600 dark:text-gray-300 dark:hover:text-indigo-400"
              href="#testimonials"
            >
              Testimonials
            </Link>
          </nav>
          <div>
            <Link href="/login">
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 md:pt-24 lg:pt-32">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl text-center">
              <h1 className="mb-6 text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
                Your AI-Powered <span className="text-indigo-600 dark:text-indigo-400">Career Assistant</span>
              </h1>
              <p className="mx-auto mb-10 max-w-2xl text-xl text-gray-600 dark:text-gray-300">
                JobGenie helps you find your dream job, build an impressive resume, and ace your interviews with the power of AI.
              </p>
              <div className="mt-8">
                <Link href="/login">
                  <Button size="lg" className="bg-indigo-600 px-8 py-6 text-lg hover:bg-indigo-700">
                    Start Your Journey
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-24">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="mx-auto grid max-w-4xl grid-cols-1 gap-8 md:grid-cols-3">
                <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
                  <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">93%</span>
                  <span className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                    of users report finding better job matches
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
                  <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">2.5x</span>
                  <span className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                    faster resume creation with AI assistance
                  </span>
                </div>
                <div className="flex flex-col items-center rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
                  <span className="text-4xl font-bold text-indigo-600 dark:text-indigo-400">78%</span>
                  <span className="mt-2 text-center text-sm text-gray-600 dark:text-gray-300">
                    improved interview confidence after practice
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                Everything You Need for Your Job Search
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
                JobGenie combines AI and industry expertise to help you at every stage of your career journey.
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Feature 1 */}
              <div className="rounded-xl bg-white p-8 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Briefcase className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  Personalized Job Matching
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Our AI analyzes your skills and experience to find the perfect job matches, with detailed compatibility scores.
                </p>
              </div>

              {/* Feature 2 */}
              <div className="rounded-xl bg-white p-8 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <FileText className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  AI Resume Builder
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Create professional, ATS-optimized resumes in minutes. Tailor your resume to specific job descriptions automatically.
                </p>
              </div>

              {/* Feature 3 */}
              <div className="rounded-xl bg-white p-8 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Video className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  Mock Interview Practice
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Practice with AI-powered mock interviews for your specific industry and role. Get personalized feedback to improve.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="rounded-xl bg-white p-8 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <TrendingUp className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  Skill Development
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Identify skill gaps and get personalized learning recommendations to make you more competitive in the job market.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="rounded-xl bg-white p-8 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <CheckCircle className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  Application Tracking
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Keep track of all your job applications in one place. Never miss an application deadline or follow-up again.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="rounded-xl bg-white p-8 shadow-md transition-transform hover:-translate-y-1 dark:bg-gray-800">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/30">
                  <Award className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  Career Coaching
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Get personalized career advice and strategies based on your goals, experience, and industry trends.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works Section */}
        <section id="how-it-works" className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                How JobGenie Works
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
                A simple process to transform your job search experience
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <span className="text-xl font-bold">1</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  Create Your Profile
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Tell us about your skills, experience, and job preferences to help our AI understand your career goals.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <span className="text-xl font-bold">2</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  Explore Opportunities
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Browse AI-recommended job matches, create tailored resumes, and prepare for interviews.
                </p>
              </div>

              <div className="text-center">
                <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-indigo-600 text-white">
                  <span className="text-xl font-bold">3</span>
                </div>
                <h3 className="mb-3 text-xl font-bold text-gray-900 dark:text-white">
                  Land Your Dream Job
                </h3>
                <p className="text-gray-600 dark:text-gray-300">
                  Apply with confidence, track your progress, and continue improving with AI feedback.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section id="testimonials" className="py-20 bg-gray-50 dark:bg-gray-900/50">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
                What Our Users Say
              </h2>
              <p className="mt-4 text-xl text-gray-600 dark:text-gray-300">
                Real stories from people who found success with JobGenie
              </p>
            </div>

            <div className="mt-16 grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {/* Testimonial 1 */}
              <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
                <div className="mb-4 flex items-center">
                  <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-indigo-100">
                    <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-white">
                      <span className="text-lg font-medium">MJ</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Michael Johnson</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Software Developer</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  &quot;JobGenie helped me completely transform my resume. The AI suggestions were spot-on, and I landed interviews at top tech companies within two weeks.&quot;
                </p>
              </div>

              {/* Testimonial 2 */}
              <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
                <div className="mb-4 flex items-center">
                  <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-indigo-100">
                    <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-white">
                      <span className="text-lg font-medium">SR</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">Sarah Rodriguez</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Marketing Specialist</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  &quot;The mock interview feature was a game-changer. I felt so much more confident in my real interviews, and it showed. I got my dream job at a major brand!&quot;
                </p>
              </div>

              {/* Testimonial 3 */}
              <div className="rounded-xl bg-white p-6 shadow-md dark:bg-gray-800">
                <div className="mb-4 flex items-center">
                  <div className="mr-4 h-12 w-12 overflow-hidden rounded-full bg-indigo-100">
                    <div className="flex h-full w-full items-center justify-center bg-indigo-600 text-white">
                      <span className="text-lg font-medium">JP</span>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 dark:text-white">James Parker</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-300">Career Changer</p>
                  </div>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  &quot;As someone transitioning careers, JobGenie was invaluable. It helped me identify transferable skills and find opportunities I wouldn&apos;t have discovered otherwise.&quot;
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-4xl rounded-2xl bg-indigo-600 py-16 px-6 text-center shadow-xl sm:px-12">
              <h2 className="mb-6 text-3xl font-bold text-white sm:text-4xl">
                Ready to Transform Your Job Search?
              </h2>
              <p className="mx-auto mb-12 max-w-2xl text-xl text-indigo-100">
                Join thousands of professionals who have already found success with JobGenie&apos;s AI-powered career tools.
              </p>
              <Link href="/login">
                <Button size="lg" className="bg-white px-8 py-6 text-lg font-bold text-indigo-600 hover:bg-indigo-50">
                  Get Started For Free
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
}

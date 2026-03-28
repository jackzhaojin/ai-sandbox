import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/ui/Button';

export default async function HomePage() {
  const session = await auth();

  if (session) {
    redirect('/chat');
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-sm">
              C
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Claude Chat</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">Sign in</Button>
            </Link>
            <Link href="/register">
              <Button variant="primary" size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="mx-auto max-w-3xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 text-white font-bold text-3xl shadow-lg">
              C
            </div>
          </div>
          <h1 className="mb-4 text-5xl font-bold tracking-tight text-gray-900">
            Chat with Claude
          </h1>
          <p className="mb-8 text-xl text-gray-600">
            A modern conversational AI application powered by Claude. Ask questions,
            get help, and have natural conversations.
          </p>
          <div className="flex justify-center gap-4">
            <Link href="/register">
              <Button variant="primary" size="lg" className="px-8">
                Start chatting
              </Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg" className="px-8">
                Sign in
              </Button>
            </Link>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-3">
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Fast & Responsive</h3>
              <p className="text-sm text-gray-600">
                Real-time streaming responses for a smooth conversational experience
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Secure & Private</h3>
              <p className="text-sm text-gray-600">
                Your conversations are protected with industry-standard security
              </p>
            </div>
            <div className="rounded-lg border border-gray-200 bg-white p-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">Smart Conversations</h3>
              <p className="text-sm text-gray-600">
                Powered by Claude AI for intelligent and helpful responses
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-200 bg-white px-6 py-4">
        <div className="mx-auto max-w-6xl text-center text-sm text-gray-500">
          Built with Next.js, TypeScript, and Claude AI
        </div>
      </footer>
    </div>
  );
}

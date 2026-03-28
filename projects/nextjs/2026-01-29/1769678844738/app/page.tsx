import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { redirect } from 'next/navigation'

export default async function Home() {
  // Redirect to dashboard if already logged in
  const session = await getSession()
  if (session?.user) {
    redirect('/dashboard')
  }

  return (
    <main className="min-h-screen bg-black p-8 flex items-center justify-center">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-6xl font-bold mb-4 uppercase text-green-500 font-mono">
          RETRO ANALYTICS
        </h1>
        <p className="text-2xl mb-8 text-green-400 font-mono">
          SYSTEM INITIALIZED
        </p>
        <div className="border-2 border-green-500 p-8 bg-black shadow-[0_0_20px_rgba(0,255,0,0.3)] mb-8">
          <p className="font-mono text-green-400 text-left mb-4">
            &gt; Database: CONNECTED
            <br />
            &gt; Authentication: READY
            <br />
            &gt; Status: AWAITING USER LOGIN
          </p>
        </div>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/login"
            className="border-2 border-green-500 bg-black text-green-500 px-8 py-4 font-mono uppercase hover:bg-green-500 hover:text-black transition-colors text-xl"
          >
            LOGIN
          </Link>
          <Link
            href="/auth/register"
            className="border-2 border-green-500 bg-black text-green-500 px-8 py-4 font-mono uppercase hover:bg-green-500 hover:text-black transition-colors text-xl"
          >
            REGISTER
          </Link>
        </div>
      </div>
    </main>
  );
}
